import mongoose from 'mongoose';
import Decimal from 'decimal.js';
import axios from 'axios';
import Currency from './currency.model.js';
import Account from '../accounts/account.model.js';
import Transaction from '../transactions/transaction.model.js';
import User from '../users/user.model.js';

/**
 * Obtiene las tasas de cambio actuales activas en el banco.
 */
export const getExchangeRates = async (req, res) => {
    try {
        const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <TipoCambioDia xmlns="http://www.banguat.gob.gt/variables/ws/" />
  </soap:Body>
</soap:Envelope>`;

        try {
            const banguatRes = await axios.post(
                'https://www.banguat.gob.gt/variables/ws/TipoCambio.asmx',
                soapEnvelope,
                {
                    headers: {
                        'Content-Type': 'text/xml; charset=utf-8',
                        'SOAPAction': 'http://www.banguat.gob.gt/variables/ws/TipoCambioDia'
                    },
                    timeout: 4000
                }
            );

            const xmlData = banguatRes.data;
            const compraMatch = xmlData.match(/<compra>([\d.]+)<\/compra>/);
            const ventaMatch = xmlData.match(/<venta>([\d.]+)<\/venta>/);

            if (compraMatch && ventaMatch) {
                const tasaCompra = parseFloat(compraMatch[1]);
                const tasaVenta = parseFloat(ventaMatch[1]);

                // Actualizamos o creamos la tasa de cambio en la base de datos
                await Currency.findOneAndUpdate(
                    { monedaDestino: 'GTQ' },
                    { 
                        monedaBase: 'USD',
                        monedaDestino: 'GTQ',
                        tasaCompra, 
                        tasaVenta, 
                        fechaActualizacion: new Date() 
                    },
                    { upsert: true, new: true }
                );
            }
        } catch (err) {
            console.warn('Advertencia: No se pudo conectar a la API de Banguat (Server-Admin). Usando respaldo de BD:', err.message);
        }

        const rates = await Currency.find();
        res.status(200).json({ status: 'success', data: rates });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Ejecuta un cambio de divisas entre dos cuentas (GTQ y USD) del mismo usuario.
 * FIN-034: Obtiene la tasa siempre del servidor, no del cliente.
 * SEC-001: Usa transacciones MongoDB.
 */
export const exchangeCurrency = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { cuentaOrigenId, cuentaDestinoId, montoOrigen } = req.body;

        if (!montoOrigen || typeof montoOrigen !== 'number' || montoOrigen <= 0) {
            throw new Error('El monto debe ser un número positivo válido.');
        }
        
        const cuentaOrigen = await Account.findByAnyId(cuentaOrigenId).session(session);
        const cuentaDestino = await Account.findByAnyId(cuentaDestinoId).session(session);

        if (!cuentaOrigen || !cuentaDestino || cuentaOrigen.usuarioId.toString() !== cuentaDestino.usuarioId.toString()) {
            throw new Error('Cuentas inválidas o no pertenecen al mismo titular.');
        }

        // SEC-008: Verificar propiedad
        const user = await User.findByAnyId(req.user.uid).session(session);
        if (!user || cuentaOrigen.usuarioId.toString() !== user._id.toString()) {
            throw new Error('No tienes permiso para operar con estas cuentas.');
        }

        if (cuentaOrigen.saldo < montoOrigen) {
            throw new Error('Fondos insuficientes para la negociación de divisas.');
        }

        // FIN-034: Obtener tasa SIEMPRE del servidor
        const rate = await Currency.findOne({ monedaBase: 'USD', monedaDestino: 'GTQ' }).session(session);
        if (!rate) throw new Error('No hay tasa de cambio disponible.');

        let montoDestino;
        let descripcion;
        let tasaAplicada;

        const decMontoOrigen = new Decimal(montoOrigen);
        const decTasaCompra = new Decimal(rate.tasaCompra);
        const decTasaVenta = new Decimal(rate.tasaVenta);

        if (cuentaOrigen.moneda === 'GTQ' && cuentaDestino.moneda === 'USD') {
             tasaAplicada = rate.tasaVenta;
             montoDestino = Number(decMontoOrigen.div(decTasaVenta).toFixed(2));
             descripcion = `Negociación de divisas. Compra de USD. Tasa: ${tasaAplicada}`;
         } else if (cuentaOrigen.moneda === 'USD' && cuentaDestino.moneda === 'GTQ') {
             tasaAplicada = rate.tasaCompra;
             montoDestino = Number(decMontoOrigen.mul(decTasaCompra).toFixed(2));
             descripcion = `Negociación de divisas. Venta de USD. Tasa: ${tasaAplicada}`;
         } else {
             throw new Error('Solo se permite negociación entre cuentas de diferente moneda (GTQ a USD o viceversa).');
         }

        cuentaOrigen.saldo = Number(new Decimal(cuentaOrigen.saldo).sub(decMontoOrigen).toFixed(2));
        cuentaDestino.saldo = Number(new Decimal(cuentaDestino.saldo).add(montoDestino).toFixed(2));

        await cuentaOrigen.save({ session });
        await cuentaDestino.save({ session });

        const transaction = new Transaction({
            cuentaOrigenId: cuentaOrigen._id,
            cuentaDestinoId: cuentaDestino._id,
            monto: montoOrigen,
            tipo: 'Transferencia_Local',
            descripcion: descripcion,
            estado: 'Completada'
        });

        await transaction.save({ session });
        await session.commitTransaction();

        res.status(200).json({ status: 'success', data: transaction, tasaAplicada });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ status: 'error', message: error.message });
    } finally {
        session.endSession();
    }
};

/**
 * Redime un código de remesa internacional y acredita los fondos a la cuenta destino.
 * SEC-001: Usa transacciones MongoDB.
 */
export const redeemRemittance = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { cuentaDestinoId, codigoRemesa, montoAcreditado, remitente } = req.body;

        if (!codigoRemesa || typeof codigoRemesa !== 'string' || codigoRemesa.trim().length < 6) {
            throw new Error('El código de remesa debe tener al menos 6 caracteres.');
        }

        const cuentaDestino = await Account.findByAnyId(cuentaDestinoId).session(session);

        if (!cuentaDestino) {
            throw new Error(`La cuenta de destino (${cuentaDestinoId}) no existe.`);
        }

        if (cuentaDestino.estado !== 'Activa') {
            throw new Error(`La cuenta de destino está en estado '${cuentaDestino.estado}'. Debe estar 'Activa' para recibir remesas.`);
        }

        const monto = Number(montoAcreditado);
        if (isNaN(monto) || monto <= 0) {
            throw new Error('El monto de la remesa debe ser un número positivo válido.');
        }

        cuentaDestino.saldo = Number(new Decimal(cuentaDestino.saldo).add(monto).toFixed(2));
        await cuentaDestino.save({ session });

        const transaction = new Transaction({
            cuentaOrigenId: null,
            cuentaDestinoId: cuentaDestino._id,
            monto: monto,
            tipo: 'Remesa',
            descripcion: `Remesa recibida de ${remitente}. Código: ${codigoRemesa}`,
            estado: 'Completada'
        });

        await transaction.save({ session });
        await session.commitTransaction();

        res.status(200).json({ status: 'success', data: transaction });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ status: 'error', message: error.message });
    } finally {
        session.endSession();
    }
};