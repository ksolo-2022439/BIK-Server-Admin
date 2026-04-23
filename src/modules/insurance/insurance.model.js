import mongoose from 'mongoose';

const insuranceSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cuentaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    tipo: { type: String, enum: ['Vida', 'Fraude', 'Vehicular', 'Salud'], required: true },
    primaMensual: { type: Number, required: true },
    estado: { type: String, enum: ['Activo', 'Cancelado'], default: 'Activo' },
    fechaContratacion: { type: Date, default: Date.now }
});

export default mongoose.model('Insurance', insuranceSchema);