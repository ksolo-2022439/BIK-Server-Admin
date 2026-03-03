import jwt from 'jsonwebtoken';

export const generateJWT = (uid, username, role) => {
    return new Promise((resolve, reject) => {
        const payload = { uid, username, role };
        
        // clave secreta que debe estar en .env
        // Agregar SECRET_KEY=TuClaveSuperSecretaBIK en .env
        jwt.sign(
            payload,
            process.env.SECRET_KEY || 'SecretKeyBIK2026_Backup',
            { expiresIn: '4h' }, // token expira en 4 horas
            (err, token) => {
                if (err) {
                    console.error('Error al generar el JWT:', err);
                    reject('No se pudo generar el token');
                } else {
                    resolve(token);
                }
            }
        );
    });
};