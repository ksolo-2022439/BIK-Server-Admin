import mongoose from 'mongoose';
import Decimal from 'decimal.js';
import Account from '../accounts/account.model.js';
import Transaction from '../transactions/transaction.model.js';
import User from '../users/user.model.js';
import Currency from '../currency/currency.model.js';

/**
 * Procesa un pago instantáneo transfiriendo fondos entre cuentas mediante un hash de QR.
 * Valida la existencia y el estado activo de ambas cuentas antes de procesar el movimiento.
 * Usa transacciones MongoDB para garantizar atomicidad (SEC-001).
 * Usa findByAnyId en vez de findById (BE-042).
 */
export const processQrPayment = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { cuentaOrigenId, cuentaDestinoId, monto } = req.body;

        // FIN-028: Validación de monto
        if (!monto || typeof monto !== 'number' || monto <= 0) {
            throw new Error('El monto debe ser un número positivo válido.');
        }
        
        const cuentaOrigen = await Account.findByAnyId(cuentaOrigenId).session(session);
        const cuentaDestino = await Account.findByAnyId(cuentaDestinoId).session(session);

        if (!cuentaOrigen || !cuentaDestino) {
            throw new Error('Cuenta de origen o destino no encontrada.');
        }

        // SEC-008: Verificar propiedad de la cuenta origen
        const user = await User.findByAnyId(req.user.uid).session(session);
        if (!user || cuentaOrigen.usuarioId.toString() !== user._id.toString()) {
            throw new Error('No tienes permiso para operar con esta cuenta.');
        }

        if (cuentaOrigen._id.toString() === cuentaDestino._id.toString()) {
            throw new Error('No puedes transferir a la misma cuenta.');
        }

        if (cuentaOrigen.estado !== 'Activa' || cuentaDestino.estado !== 'Activa') {
            throw new Error('Ambas cuentas deben estar activas.');
        }

        let montoDebitar = monto;
        let montoAcreditar = monto;
        let tasaCambioUsada = null;
        let descripcionFinal = 'Pago mediante código QR';

        if (cuentaOrigen.moneda !== cuentaDestino.moneda) {
            const rate = await Currency.findOne({ monedaBase: 'USD', monedaDestino: 'GTQ' }).session(session);
            if (!rate) throw new Error('No hay tasa de cambio disponible.');

            const decMonto = new Decimal(monto);
            const decTasaVenta = new Decimal(rate.tasaVenta);
            const decTasaCompra = new Decimal(rate.tasaCompra);

            if (cuentaOrigen.moneda === 'GTQ' && cuentaDestino.moneda === 'USD') {
                // El cobrador desea recibir USD (cuentaDestino en USD). Debemos debitar GTQ.
                montoDebitar = Number(decMonto.mul(decTasaVenta).toFixed(2));
                montoAcreditar = monto;
                tasaCambioUsada = rate.tasaVenta;
                descripcionFinal = `Pago mediante código QR [$${monto.toFixed(2)} cobrados como Q${montoDebitar.toFixed(2)} @ TC ${rate.tasaVenta}]`;
            } else if (cuentaOrigen.moneda === 'USD' && cuentaDestino.moneda === 'GTQ') {
                // El cobrador desea recibir GTQ (cuentaDestino en GTQ). Debemos debitar USD.
                montoDebitar = Number(decMonto.div(decTasaCompra).toFixed(2));
                montoAcreditar = monto;
                tasaCambioUsada = rate.tasaCompra;
                descripcionFinal = `Pago mediante código QR [Q${monto.toFixed(2)} cobrados como $${montoDebitar.toFixed(2)} @ TC ${rate.tasaCompra}]`;
            }
        }

        if (cuentaOrigen.saldo < montoDebitar) {
            throw new Error('Fondos insuficientes.');
        }

        cuentaOrigen.saldo = Number(new Decimal(cuentaOrigen.saldo).sub(montoDebitar).toFixed(2));
        cuentaDestino.saldo = Number(new Decimal(cuentaDestino.saldo).add(montoAcreditar).toFixed(2));

        await cuentaOrigen.save({ session });
        await cuentaDestino.save({ session });

        const transaction = new Transaction({
            cuentaOrigenId: cuentaOrigen._id,
            cuentaDestinoId: cuentaDestino._id,
            monto: montoDebitar,
            montoAcreditado: montoAcreditar,
            tasaCambio: tasaCambioUsada || 1,
            tipo: 'Pago_QR',
            descripcion: descripcionFinal,
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