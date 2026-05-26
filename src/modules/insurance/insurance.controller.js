import mongoose from 'mongoose';
import Decimal from 'decimal.js';
import Insurance from './insurance.model.js';
import Account from '../accounts/account.model.js';
import Transaction from '../transactions/transaction.model.js';
import User from '../users/user.model.js';

/**
 * Registra una nueva póliza de seguro vinculada a una cuenta del cliente.
 * Establece el monto de deducción mensual automático para el servicio de protección.
 */
export const enrollInsurance = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { cuentaId, primaMensual, tipo } = req.body;

        // BE-045: Resolver uid a ObjectId correctamente
        const user = await User.findByAnyId(req.user.uid).session(session);
        if (!user) {
            throw new Error('Usuario no encontrado.');
        }

        const cuenta = await Account.findByAnyId(cuentaId).session(session);
        if (!cuenta) {
            throw new Error('La cuenta seleccionada no existe.');
        }

        if (cuenta.estado !== 'Activa') {
            throw new Error(`La cuenta seleccionada está ${cuenta.estado}. Debe estar 'Activa' para contratar seguros.`);
        }

        const premium = Number(primaMensual);
        if (isNaN(premium) || premium <= 0) {
            throw new Error('La prima mensual debe ser un número positivo.');
        }

        if (cuenta.saldo < premium) {
            throw new Error(`Saldo insuficiente. Saldo: Q${cuenta.saldo.toFixed(2)}, Prima: Q${premium.toFixed(2)}.`);
        }

        cuenta.saldo = Number(new Decimal(cuenta.saldo).sub(premium).toFixed(2));
        await cuenta.save({ session });

        const transaction = new Transaction({
            cuentaOrigenId: cuenta._id,
            cuentaDestinoId: null,
            monto: premium,
            tipo: 'Pago_Servicio',
            descripcion: `Cargo de primera cuota mensual de Seguro de ${tipo}`,
            estado: 'Completada'
        });
        await transaction.save({ session });

        const newInsurance = new Insurance({
            usuarioId: user._id,
            cuentaId: cuenta._id,
            tipo,
            primaMensual: premium,
            estado: 'Activo'
        });
        await newInsurance.save({ session });
        await session.commitTransaction();

        res.status(201).json({ status: 'success', data: newInsurance });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ status: 'error', message: error.message });
    } finally {
        session.endSession();
    }
};

/**
 * Actualiza el estado de una póliza de seguro (ej. cancelación).
 */
export const updateInsurance = async (req, res) => {
    try {
        const { id } = req.params;
        // SEC-016: Whitelist de campos permitidos
        const allowedFields = ['estado'];
        const updateData = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        const updated = await Insurance.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({ status: 'error', message: 'Póliza no encontrada.' });
        }
        res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Obtiene las pólizas de seguro del usuario autenticado.
 */
export const getUserInsurances = async (req, res) => {
    try {
        // BE-045: Resolver uid a ObjectId correctamente
        const user = await User.findByAnyId(req.user.uid);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
        }
        const insurances = await Insurance.find({ usuarioId: user._id });
        res.status(200).json({ status: 'success', data: insurances });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};