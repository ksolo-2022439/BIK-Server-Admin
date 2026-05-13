import mongoose from 'mongoose';
import Account from '../accounts/account.model.js';
import Transaction from '../transactions/transaction.model.js';

/**
 * Ejecuta el pago de un servicio externo debitando de la cuenta del usuario.
 * Registra la operación como una transacción de tipo Pago_Servicio.
 */
export const payService = async (req, res) => {
    try {
        const { cuentaOrigenId, monto, servicio, descripcion } = req.body;
        const cuentaOrigen = await Account.findById(cuentaOrigenId);

        if (!cuentaOrigen || cuentaOrigen.estado !== 'Activa') {
            throw new Error('Cuenta de origen no válida o inactiva.');
        }

        if (cuentaOrigen.saldo < monto) {
            throw new Error('Fondos insuficientes para pagar el servicio.');
        }

        cuentaOrigen.saldo -= monto;
        await cuentaOrigen.save();

        const transaction = new Transaction({
            cuentaOrigenId,
            cuentaDestinoId: null,
            monto,
            tipo: 'Pago_Servicio',
            descripcion: `Pago de ${servicio} - ${descripcion}`,
            estado: 'Completada'
        });

        await transaction.save();
        
        res.status(200).json({ status: 'success', data: transaction });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};