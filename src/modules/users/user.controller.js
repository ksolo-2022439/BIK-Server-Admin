import User from './user.model.js';
import axios from 'axios';

export const createUser = async (req, res) => {
    try {
        const { dpi, email, telefono, password, ...userData } = req.body;

        const existingUser = await User.findOne({ $or: [{ dpi }, { email }, { telefono }] });
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: 'El DPI, Correo Electrónico o Teléfono ya están registrados.'
            });
        }

        const newUser = new User({ dpi, email, telefono, ...userData });
        await newUser.save();

        await axios.post(process.env.AUTH_SERVICE_URL + '/api/auth/register-credentials', {
            userId: newUser._id.toString(),
            dpi,
            email,
            telefono,
            password,
            rol: newUser.rol
        });

        res.status(201).json({
            status: 'success',
            message: 'Usuario creado exitosamente. Perfil en verificación.',
            data: newUser
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Obtener información de un usuario por su DPI (Útil para transferencias y creación de cuentas)
export const getUserByDpi = async (req, res) => {
    try {
        const user = await User.findOne({ dpi: req.params.dpi });
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
        }
        res.status(200).json({ status: 'success', data: user });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Obtener información de un usuario por su ID de MongoDB (Útil para el flujo post-login)
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByAnyId(id);
        
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
        }
        res.status(200).json({ status: 'success', data: user });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Actualizar información demográfica
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Evitamos que se modifiquen campos críticos por esta ruta
        const { estado, rol, dpi, ...updateData } = req.body; 

        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });
        
        if (!updatedUser) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
        }

        res.status(200).json({ status: 'success', data: updatedUser });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Cambiar estado del usuario (Operación de Administrador)
export const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const updatedUser = await User.findByIdAndUpdate(id, { estado }, { new: true });
        
        res.status(200).json({ status: 'success', data: updatedUser });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Cambiar contraseña (Llamada al Auth-Service)
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.uid;

        const authResponse = await axios.put(process.env.AUTH_SERVICE_URL + '/api/auth/change-password', {
            userId,
            currentPassword,
            newPassword
        });

        res.status(200).json(authResponse.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || error.message;
        res.status(status).json({ status: 'error', message });
    }
};