import jwt from 'jsonwebtoken';
import User from '../src/users/user.model.js';

export const validateJWT = async (req, res, next) => {
    try {
        let token = req.header('Authorization');
        
        if (!token) {
            return res.status(401).json({ success: false, message: 'No hay token en la petición' });
        }

        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length);
        }

        const { uid } = jwt.verify(token, process.env.SECRET_KEY || 'SecretKeyBIK2026_Backup');

        const user = await User.findById(uid);
        
        if (!user || !user.status) {
            return res.status(401).json({ success: false, message: 'Token no válido - Usuario inactivo o inexistente' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token expirado o no válido', error: error.message });
    }
};