export const hasRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(500).json({ success: false, message: 'Se requiere validar el JWT antes de verificar el rol' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `Acceso denegado. Se requiere uno de estos roles: ${roles.join(', ')}` 
            });
        }

        next();
    };
};