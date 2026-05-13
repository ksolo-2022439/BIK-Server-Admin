import AuditLog from '../modules/audit/audit.model.js';

/**
 * Intercepta las peticiones de modificación de datos realizadas por perfiles administrativos.
 * Extrae la carga útil, excluye información de autenticación sensible y registra
 * asíncronamente el evento en la colección de auditoría sin bloquear la respuesta del servidor.
 */
export const auditLogger = async (req, res, next) => {
    next();

    if (req.user && req.user.rol !== 'Cliente') {
        const metodosAuditables = ['POST', 'PUT', 'PATCH', 'DELETE'];
        
        if (metodosAuditables.includes(req.method)) {
            try {
                const payload = { ...req.body };
                if (payload.password) delete payload.password;
                if (payload.cvv) delete payload.cvv;

                const log = new AuditLog({
                    adminId: req.user.uid,
                    accion: req.method,
                    endpoint: req.originalUrl,
                    payload,
                    direccionIp: req.ip || req.connection.remoteAddress
                });

                await log.save();
            } catch (error) {
                console.error('Error en el registro de auditoría:', error.message);
            }
        }
    }
};