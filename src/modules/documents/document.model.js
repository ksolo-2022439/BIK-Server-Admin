import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    nombreDocumento: { type: String, required: true },
    estado: { type: String, enum: ['Pendiente', 'Firmado'], default: 'Pendiente' },
    urlDocumento: { type: String },
    fechaFirma: { type: Date }
});

export default mongoose.model('Document', documentSchema);