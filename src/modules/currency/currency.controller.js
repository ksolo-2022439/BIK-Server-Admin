import mongoose from 'mongoose';
import Currency from './currency.model.js';
import Account from '../accounts/account.model.js';
import Transaction from '../transactions/transaction.model.js';

/**
 * Obtiene las tasas de cambio actuales activas en el banco.
 */
export const getExchangeRates = async (req, res) => {
    try {
        const rates = await Currency.find();
        res.status(200).json({ status: 'success', data: rates });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Ejecuta un cambio de divisas entre dos cuentas (GTQ y USD) del mismo usuario.
 * Verifica saldos, aplica la tasa de venta actual y registra la transacción atómica.
 */
export const exchangeCurrency = async (req, res) => {
    // TODO (PRODUCCION): Reintegrar mongoose.startSession() y session.startTransaction() cuando se despliegue en un Replica Set de MongoDB Atlas.
    // const session = await mongoose.startSession();
    // session.startTransaction();

    try {
        const { cuentaOrigenId, cuentaDestinoId, montoOrigen, tasaAplicada } = req.body;
        
        const cuentaOrigen = await Account.findByAnyId(cuentaOrigenId);
        const cuentaDestino = await Account.findByAnyId(cuentaDestinoId);

        if (!cuentaOrigen || !cuentaDestino || cuentaOrigen.usuarioId.toString() !== cuentaDestino.usuarioId.toString()) {
            throw new Error('Cuentas inválidas o no pertenecen al mismo titular.');
        }

        if (cuentaOrigen.saldo < montoOrigen) {
            throw new Error('Fondos insuficientes para la negociación de divisas.');
        }

        // Determinar dirección de la transacción según la moneda de la cuenta origen
        let montoDestino;
        let descripcion;
        if (cuentaOrigen.moneda === 'GTQ' && cuentaDestino.moneda === 'USD') {
             // GTQ -> USD (Usando tasaVenta)
             montoDestino = montoOrigen / tasaAplicada;
             descripcion = `Negociación de divisas. Compra de USD. Tasa: ${tasaAplicada}`;
        } else if (cuentaOrigen.moneda === 'USD' && cuentaDestino.moneda === 'GTQ') {
             // USD -> GTQ (Usando tasaCompra)
             montoDestino = montoOrigen * tasaAplicada;
             descripcion = `Negociación de divisas. Venta de USD. Tasa: ${tasaAplicada}`;
        } else {
             throw new Error('Solo se permite negociación entre cuentas de diferente moneda (GTQ a USD o viceversa).');
        }

        cuentaOrigen.saldo -= montoOrigen;
        cuentaDestino.saldo += montoDestino;

        await cuentaOrigen.save();
        await cuentaDestino.save();

        const transaction = new Transaction({
            cuentaOrigenId: cuentaOrigen._id,
            cuentaDestinoId: cuentaDestino._id,
            monto: montoOrigen,
            tipo: 'Transferencia_Local',
            descripcion: descripcion,
            estado: 'Completada'
        });

        await transaction.save();
        // await session.commitTransaction();

        res.status(200).json({ status: 'success', data: transaction });
    } catch (error) {
        // await session.abortTransaction();
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * Redime un código de remesa internacional y acredita los fondos a la cuenta destino.
 */
export const redeemRemittance = async (req, res) => {
    // TODO (PRODUCCION): Reintegrar mongoose.startSession() y session.startTransaction()
    // const session = await mongoose.startSession();
    // session.startTransaction();

    try {
        const { cuentaDestinoId, codigoRemesa, montoAcreditado, remitente } = req.body;

        const cuentaDestino = await Account.findByAnyId(cuentaDestinoId);

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

        cuentaDestino.saldo += monto;
        await cuentaDestino.save();

        const transaction = new Transaction({
            cuentaOrigenId: null,
            cuentaDestinoId: cuentaDestino._id,
            monto: monto,
            tipo: 'Remesa',
            descripcion: `Remesa recibida de ${remitente}. Código: ${codigoRemesa}`,
            estado: 'Completada'
        });

        await transaction.save();
        // await session.commitTransaction();

        res.status(200).json({ status: 'success', data: transaction });
    } catch (error) {
        // await session.abortTransaction();
        res.status(400).json({ status: 'error', message: error.message });
    }
};