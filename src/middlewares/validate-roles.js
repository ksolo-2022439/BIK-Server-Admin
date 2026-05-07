/**
 * Lista de roles con privilegios administrativos en el sistema BIK.
 * Utilizada para verificar si un usuario tiene acceso al panel de administración.
 */
const ADMIN_ROLES = ['Administrador', 'Admin_Gestiones', 'Soporte_Remoto', 'Soporte_Presencial', 'Cajero'];

/**
 * Middleware de verificación granular de roles.
 * Recibe un array de roles permitidos y valida que el usuario autenticado posea uno de ellos.
 * El rol 'Administrador' actúa como super-admin y tiene acceso a TODAS las operaciones.
 *
 * @param  {...string} allowedRoles - Roles que pueden acceder al recurso.
 * @returns {Function} Middleware de Express.
 *
 * @example
 * router.get('/admin-only', hasRole('Administrador', 'Admin_Gestiones'), controller);
 */
export const hasRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(500).json({
                status: 'error',
                message: 'Se intentó verificar el rol sin validar el token primero.'
            });
        }

        // Administrador es super-admin, tiene acceso a todo
        if (req.user.rol === 'Administrador') {
            return next();
        }

        if (!allowedRoles.includes(req.user.rol)) {
            return res.status(403).json({
                status: 'error',
                message: 'Acceso denegado. No tienes los permisos necesarios para esta operación.'
            });
        }

        next();
    };
};

/**
 * Middleware legacy para compatibilidad con rutas existentes.
 * Verifica que el usuario tenga cualquier rol administrativo.
 */
export const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(500).json({
            status: 'error',
            message: 'Se intentó verificar el rol sin validar el token primero.'
        });
    }

    if (!ADMIN_ROLES.includes(req.user.rol)) {
        return res.status(403).json({
            status: 'error',
            message: 'Acceso denegado. Se requieren privilegios de Administrador.'
        });
    }

    next();
};

/**
 * Verifica que el usuario NO sea un cliente regular.
 * Usado como guard general para el panel administrativo.
 */
export const isStaff = (req, res, next) => {
    if (!req.user) {
        return res.status(500).json({
            status: 'error',
            message: 'Se intentó verificar el rol sin validar el token primero.'
        });
    }

    if (req.user.rol === 'Cliente') {
        return res.status(403).json({
            status: 'error',
            message: 'Acceso denegado. Esta área es exclusiva para personal del banco.'
        });
    }

    next();
};