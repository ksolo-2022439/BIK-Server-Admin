import mongoose from 'mongoose';
import crypto from 'crypto';

const requestSchema = new mongoose.Schema({
    publicId: { type: String, unique: true, default: () => crypto.randomUUID() },
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cuentaVinculadaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    tipoGestion: {
        type: String,
        required: true
    },
    descripcion: { type: String, required: true },
    estado: {
        type: String,
        enum: ['Pendiente', 'En_Proceso', 'Aprobada', 'Completada', 'Rechazada'],
        default: 'Pendiente'
    },
    prioridad: {
        type: String,
        enum: ['Normal', 'Alta', 'Urgente'],
        default: 'Normal'
    },
    notas: [{
        autor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        texto: { type: String },
        fecha: { type: Date, default: Date.now }
    }],
    fechaSolicitud: { type: Date, default: Date.now },
    fechaResolucion: { type: Date },
    montoSolicitado: { type: Number }
});

export default mongoose.model('Request', requestSchema);