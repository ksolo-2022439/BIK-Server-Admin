import User from '../users/user.model.js';
import { encrypt, verifyPassword } from '../utils/encrypt.js';
import { generateJWT } from '../utils/jwt.js';

export const register = async (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'El nombre de usuario ya está en uso' });
        }

        const hashedPassword = await encrypt(password);
        const user = new User({ username, password: hashedPassword, role });
        await user.save();

        res.status(201).json({ success: true, message: 'Usuario registrado exitosamente', user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al registrar usuario', error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username });
        if (!user || !user.status) {
            return res.status(400).json({ success: false, message: 'Credenciales inválidas o cuenta inactiva' });
        }

        const validPassword = await verifyPassword(user.password, password);
        if (!validPassword) {
            return res.status(400).json({ success: false, message: 'Credenciales inválidas' });
        }

        const token = await generateJWT(user.id, user.username, user.role);

        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            userDetails: {
                uid: user.id,
                username: user.username,
                role: user.role,
                token
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error en el inicio de sesión', error: error.message });
    }
};

export const me = async (req, res) => {
    try {
        res.status(200).json({ success: true, user: req.user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener datos del usuario', error: error.message });
    }
};