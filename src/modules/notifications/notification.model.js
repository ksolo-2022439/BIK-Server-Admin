import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mensaje: { type: String, required: true },
    leido: { type: Boolean, default: false },
    fecha: { type: Date, default: Date.now }
});

export default mongoose.model('Notification', notificationSchema);