import Notification from './notification.model.js';
import User from '../users/user.model.js';

/**
 * Recupera el historial de alertas y avisos asociados al perfil del usuario autenticado.
 */
export const getUserNotifications = async (req, res) => {
    try {
        const user = await User.findByAnyId(req.user.uid);
        if (!user) throw new Error('Usuario no encontrado.');

        const notifications = await Notification.find({ usuarioId: user._id }).sort({ fecha: -1 });
        res.status(200).json({ status: 'success', data: notifications });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Actualiza el estado de una notificación específica para marcarla como visualizada por el cliente.
 */
export const markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { leido: true });
        res.status(200).json({ status: 'success', message: 'Notificación leída.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};