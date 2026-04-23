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
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { cuentaOrigenId, cuentaDestinoId, montoOrigen, tasaAplicada } = req.body;
        
        const cuentaOrigen = await Account.findById(cuentaOrigenId).session(session);
        const cuentaDestino = await Account.findById(cuentaDestinoId).session(session);

        if (!cuentaOrigen || !cuentaDestino || cuentaOrigen.usuarioId.toString() !== cuentaDestino.usuarioId.toString()) {
            throw new Error('Cuentas inválidas o no pertenecen al mismo titular.');
        }

        if (cuentaOrigen.saldo < montoOrigen) {
            throw new Error('Fondos insuficientes para la negociación de divisas.');
        }

        const montoDestino = montoOrigen / tasaAplicada; // GTQ a USD

        cuentaOrigen.saldo -= montoOrigen;
        cuentaDestino.saldo += montoDestino;

        await cuentaOrigen.save({ session });
        await cuentaDestino.save({ session });

        const transaction = new Transaction({
            cuentaOrigenId,
            cuentaDestinoId,
            monto: montoOrigen,
            tipo: 'Transferencia_Local',
            descripcion: `Negociación de divisas. Tasa: ${tasaAplicada}`,
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

/**
 * Redime un código de remesa internacional y acredita los fondos a la cuenta destino.
 */
export const redeemRemittance = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { cuentaDestinoId, codigoRemesa, montoAcreditado, remitente } = req.body;

        const cuentaDestino = await Account.findById(cuentaDestinoId).session(session);

        if (!cuentaDestino || cuentaDestino.estado !== 'Activa') {
            throw new Error('Cuenta de destino no válida o inactiva.');
        }

        cuentaDestino.saldo += montoAcreditado;
        await cuentaDestino.save({ session });

        const transaction = new Transaction({
            cuentaOrigenId: null,
            cuentaDestinoId,
            monto: montoAcreditado,
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