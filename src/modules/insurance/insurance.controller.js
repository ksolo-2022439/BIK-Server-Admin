import Insurance from './insurance.model.js';

/**
 * Registra una nueva póliza de seguro vinculada a una cuenta del cliente.
 * Establece el monto de deducción mensual automático para el servicio de protección.
 */
export const enrollInsurance = async (req, res) => {
    try {
        const newInsurance = new Insurance(req.body);
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