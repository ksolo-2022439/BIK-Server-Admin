import AuditLog from './audit.model.js';

/**
 * Recupera el registro histórico de operaciones administrativas del sistema.
 * Aplica una función de población para incluir los datos demográficos del administrador
 * y limita la consulta a los últimos 100 eventos ordenados de forma descendente.
 */
export const getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find()
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json({ status: 'success', data: logs });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};