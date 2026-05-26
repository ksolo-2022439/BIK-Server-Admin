import User from './user.model.js';
import axios from 'axios';

/**
 * Registra un nuevo cliente bancario en el sistema e inicia su aprovisionamiento de credenciales de acceso.
 * 
 * @param {Object} req - Solicitud HTTP con los datos demográficos y de seguridad del nuevo cliente.
 * @param {Object} res - Respuesta HTTP.
 */
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

/**
 * Recupera el perfil básico de un usuario utilizando su número de DPI.
 * 
 * @param {Object} req - Solicitud HTTP.
 * @param {Object} res - Respuesta HTTP.
 */
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

/**
 * Obtiene el perfil de un usuario utilizando su ID de MongoDB u ofuscado.
 * 
 * @param {Object} req - Solicitud HTTP.
 * @param {Object} res - Respuesta HTTP.
 */
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

/**
 * Actualiza la información demográfica permitida de un cliente.
 * 
 * @param {Object} req - Solicitud HTTP con la información a actualizar.
 * @param {Object} res - Respuesta HTTP.
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        // SEC-015: Whitelist explícita de campos permitidos
        const allowedFields = ['nombres', 'apellidos', 'direccion', 'telefono', 'email', 'ingresosMensuales',
            'fotoDpiAdelanteUrl', 'fotoDpiAtrasUrl', 'fotoRostroUrl', 'fechaNacimiento'];
        const updateData = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        
        if (!updatedUser) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
        }

        res.status(200).json({ status: 'success', data: updatedUser });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Modifica el estado administrativo de un usuario (Activo, Suspendido, etc.).
 * 
 * @param {Object} req - Solicitud HTTP.
 * @param {Object} res - Respuesta HTTP.
 */
export const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        // BE-044: Validar que estado sea un valor válido del enum
        const validStates = ['Activo', 'Suspendido', 'En Verificacion'];
        if (!estado || !validStates.includes(estado)) {
            return res.status(400).json({ status: 'error', message: `Estado inválido. Valores permitidos: ${validStates.join(', ')}` });
        }

        const updatedUser = await User.findByIdAndUpdate(id, { estado }, { new: true });
        
        // BE-044: Verificar si el usuario existe
        if (!updatedUser) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
        }

        res.status(200).json({ status: 'success', data: updatedUser });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Cambia la contraseña activa del usuario mediante el puente de microservicios de seguridad.
 * 
 * @param {Object} req - Solicitud HTTP.
 * @param {Object} res - Respuesta HTTP.
 */
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