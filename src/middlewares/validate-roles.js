export const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(500).json({
            status: 'error',
            message: 'Se intentó verificar el rol sin validar el token primero.'
        });
    }

    if (req.user.rol !== 'Administrador') {
        return res.status(403).json({
            status: 'error',
            message: 'Acceso denegado. Se requieren privilegios de Administrador.'
        });
    }

    next();
};