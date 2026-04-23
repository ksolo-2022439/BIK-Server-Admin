import jwt from 'jsonwebtoken';

export const validateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'No hay token en la petición. Acceso denegado.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        
        next();
    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Token no válido o ha expirado.'
        });
    }
};