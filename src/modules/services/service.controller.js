import mongoose from 'mongoose';
import Decimal from 'decimal.js';
import Account from '../accounts/account.model.js';
import Transaction from '../transactions/transaction.model.js';
import User from '../users/user.model.js';

/**
 * Ejecuta el pago de un servicio externo debitando de la cuenta del usuario.
 * Registra la operación como una transacción de tipo Pago_Servicio.
 * Usa transacciones MongoDB para atomicidad (SEC-001).
 * Usa findByAnyId (BE-041).
 */
export const payService = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { cuentaOrigenId, monto, servicio, descripcion } = req.body;

        // FIN-028: Validación de monto
        if (!monto || typeof monto !== 'number' || monto <= 0) {
            throw new Error('El monto debe ser un número positivo válido.');
        }

        const cuentaOrigen = await Account.findByAnyId(cuentaOrigenId).session(session);

        if (!cuentaOrigen || cuentaOrigen.estado !== 'Activa') {
            throw new Error('Cuenta de origen no válida o inactiva.');
        }

        // SEC-008: Verificar propiedad
        const user = await User.findByAnyId(req.user.uid).session(session);
        if (!user || cuentaOrigen.usuarioId.toString() !== user._id.toString()) {
            throw new Error('No tienes permiso para operar con esta cuenta.');
        }

        if (cuentaOrigen.saldo < monto) {
            throw new Error('Fondos insuficientes para pagar el servicio.');
        }

        cuentaOrigen.saldo = Number(new Decimal(cuentaOrigen.saldo).sub(monto).toFixed(2));
        await cuentaOrigen.save({ session });

        const transaction = new Transaction({
            cuentaOrigenId: cuentaOrigen._id,
            cuentaDestinoId: null,
            monto,
            tipo: 'Pago_Servicio',
            descripcion: `Pago de ${servicio} - ${descripcion}`,
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