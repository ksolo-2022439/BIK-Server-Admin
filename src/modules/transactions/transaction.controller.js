import mongoose from 'mongoose';
import Transaction from './transaction.model.js';
import Account from '../accounts/account.model.js';

/**
 * Ejecuta una transferencia interna entre cuentas de Banco Informático Kinal utilizando transacciones atómicas.
 * Verifica fondos disponibles, límites diarios y actualiza los saldos de forma segura.
 */
export const executeInternalTransfer = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { cuentaOrigenId, cuentaDestinoId, monto, descripcion } = req.body;

        const cuentaOrigen = await Account.findById(cuentaOrigenId).session(session);
        const cuentaDestino = await Account.findById(cuentaDestinoId).session(session);

        if (!cuentaOrigen || !cuentaDestino) {
            throw new Error('Cuenta de origen o destino no encontrada.');
        }

        if (cuentaOrigen.estado !== 'Activa' || cuentaDestino.estado !== 'Activa') {
            throw new Error('Ambas cuentas deben estar activas para realizar la transferencia.');
        }

        if (cuentaOrigen.saldo < monto) {
            throw new Error('Fondos insuficientes.');
        }

        if (monto > cuentaOrigen.limiteTransferenciaDiario) {
            throw new Error('El monto supera el límite de transferencia diario.');
        }

        cuentaOrigen.saldo -= monto;
        cuentaDestino.saldo += monto;

        await cuentaOrigen.save({ session });
        await cuentaDestino.save({ session });

        const transaction = new Transaction({
            cuentaOrigenId,
            cuentaDestinoId,
            monto,
            tipo: 'Transferencia_Local',
            descripcion,
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
 * Ejecuta una transferencia ACH hacia un banco externo utilizando transacciones atómicas.
 * Requiere los datos específicos de compensación automatizada de Guatemala.
 */
export const executeACHTransfer = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { cuentaOrigenId, monto, descripcion, achDetails } = req.body;

        const cuentaOrigen = await Account.findById(cuentaOrigenId).session(session);

        if (!cuentaOrigen || cuentaOrigen.estado !== 'Activa') {
            throw new Error('Cuenta de origen no válida o inactiva.');
        }

        if (cuentaOrigen.saldo < monto) {
            throw new Error('Fondos insuficientes.');
        }

        cuentaOrigen.saldo -= monto;
        await cuentaOrigen.save({ session });

        const transaction = new Transaction({
            cuentaOrigenId,
            cuentaDestinoId: null,
            monto,
            tipo: 'Transferencia_ACH',
            descripcion,
            achDetails,
            estado: 'En_Proceso'
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
 * Procesa un depósito en efectivo realizado por un administrador en ventanilla.
 * Incrementa el saldo de la cuenta destino sin requerir una cuenta de origen.
 */
export const executeCashDeposit = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { cuentaDestinoId, monto, descripcion } = req.body;
        const referenciaCajero = req.user.uid;

        const cuentaDestino = await Account.findById(cuentaDestinoId).session(session);

        if (!cuentaDestino || cuentaDestino.estado !== 'Activa') {
            throw new Error('Cuenta de destino no válida o inactiva.');
        }

        cuentaDestino.saldo += monto;
        await cuentaDestino.save({ session });

        const transaction = new Transaction({
            cuentaOrigenId: null,
            cuentaDestinoId,
            monto,
            tipo: 'Deposito_Efectivo',
            descripcion,
            estado: 'Completada',
            referenciaCajero
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