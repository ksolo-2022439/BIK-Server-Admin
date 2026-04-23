import mongoose from 'mongoose';
import Account from '../accounts/account.model.js';
import Transaction from '../transactions/transaction.model.js';

/**
 * Procesa un pago instantáneo transfiriendo fondos entre cuentas mediante un hash de QR.
 * Valida la existencia y el estado activo de ambas cuentas antes de procesar el movimiento.
 */
export const processQrPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { cuentaOrigenId, cuentaDestinoId, monto } = req.body;
        
        const cuentaOrigen = await Account.findById(cuentaOrigenId).session(session);
        const cuentaDestino = await Account.findById(cuentaDestinoId).session(session);

        if (!cuentaOrigen || !cuentaDestino) {
            throw new Error('Cuenta de origen o destino no encontrada.');
        }

        if (cuentaOrigen.estado !== 'Activa' || cuentaDestino.estado !== 'Activa') {
            throw new Error('Ambas cuentas deben estar activas.');
        }

        if (cuentaOrigen.saldo < monto) {
            throw new Error('Fondos insuficientes.');
        }

        cuentaOrigen.saldo -= monto;
        cuentaDestino.saldo += monto;

        await cuentaOrigen.save({ session });
        await cuentaDestino.save({ session });

        const transaction = new Transaction({
            cuentaOrigenId,
            cuentaDestinoId,
            monto,
            tipo: 'Pago_QR',
            descripcion: 'Pago mediante código QR',
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