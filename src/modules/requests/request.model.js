import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tipoGestion: {
        type: String,
        enum: ['Chequera', 'Reposicion_Tarjeta', 'Carta_Referencia', 'Actualizacion_Datos'],
        required: true
    },
    descripcion: { type: String, required: true },
    estado: {
        type: String,
        enum: ['Pendiente', 'En_Proceso', 'Completada', 'Rechazada'],
        default: 'Pendiente'
    },
    fechaSolicitud: { type: Date, default: Date.now },
    fechaResolucion: { type: Date }
});

export default mongoose.model('Request', requestSchema);