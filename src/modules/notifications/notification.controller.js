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
 * Actualiza el estado de una notificación específica para marcarla como visualizada.
 * SEC-020: Verifica propiedad antes de marcar como leída.
 */
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        
        if (!notification) {
            return res.status(404).json({ status: 'error', message: 'Notificación no encontrada.' });
        }

        // SEC-020: Verificar propiedad
        const user = await User.findByAnyId(req.user.uid);
        if (!user || notification.usuarioId.toString() !== user._id.toString()) {
            return res.status(403).json({ status: 'error', message: 'No tienes permiso para modificar esta notificación.' });
        }

        notification.leido = true;
        await notification.save();
        
        res.status(200).json({ status: 'success', message: 'Notificación leída.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};