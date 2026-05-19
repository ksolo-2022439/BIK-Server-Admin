import Insurance from './insurance.model.js';
import Account from '../accounts/account.model.js';
import Transaction from '../transactions/transaction.model.js';

/**
 * Registra una nueva póliza de seguro vinculada a una cuenta del cliente.
 * Establece el monto de deducción mensual automático para el servicio de protección.
 */
export const enrollInsurance = async (req, res) => {
    try {
        const { cuentaId, primaMensual, tipo, usuarioId } = req.body;

        const cuenta = await Account.findByAnyId(cuentaId);
        if (!cuenta) {
            return res.status(404).json({ status: 'error', message: 'La cuenta seleccionada no existe.' });
        }

        if (cuenta.estado !== 'Activa') {
            return res.status(400).json({ status: 'error', message: `La cuenta seleccionada está ${cuenta.estado}. Debe estar 'Activa' para contratar seguros.` });
        }

        const premium = Number(primaMensual);
        if (cuenta.saldo < premium) {
            return res.status(400).json({ status: 'error', message: `Saldo insuficiente. Esta cuenta posee un saldo de Q${cuenta.saldo.toFixed(2)}, pero la prima del seguro requiere Q${premium.toFixed(2)}.` });
        }

        // Deducción automática del primer mes de prima
        cuenta.saldo -= premium;
        await cuenta.save();

        // Registro de la transacción de cargo de seguro
        const transaction = new Transaction({
            cuentaOrigenId: cuenta._id,
            cuentaDestinoId: null,
            monto: premium,
            tipo: 'Pago_Servicio',
            descripcion: `Cargo de primera cuota mensual de Seguro de ${tipo}`,
            estado: 'Completada'
        });
        await transaction.save();

        const newInsurance = new Insurance({
            usuarioId,
            cuentaId: cuenta._id,
            tipo,
            primaMensual: premium,
            estado: 'Activo'
        });
        await newInsurance.save();

        res.status(201).json({ status: 'success', data: newInsurance });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Actualiza el estado de una póliza de seguro (ej. cancelación).
 */
export const updateInsurance = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Insurance.findByIdAndUpdate(id, req.body, { new: true });
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
        const insurances = await Insurance.find({ usuarioId: req.user.uid });
        res.status(200).json({ status: 'success', data: insurances });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};