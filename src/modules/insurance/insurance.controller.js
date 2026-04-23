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