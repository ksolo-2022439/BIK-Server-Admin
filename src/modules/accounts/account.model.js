import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
    numeroCuenta: { type: String, required: true, unique: true },
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tipo: { type: String, enum: ['Monetaria', 'Ahorro'], required: true },
    moneda: { type: String, enum: ['GTQ', 'USD'], default: 'GTQ' },
    saldo: { type: Number, default: 0, min: 0 }, // Saldo real
    limiteTransferenciaDiario: { type: Number, default: 5000 },
    isFavorite: { type: Boolean, default: false },
    estado: { 
        type: String, 
        enum: ['Activa', 'Bloqueada', 'Cancelada'], 
        default: 'Activa' 
    }
}, {
    timestamps: true
});

export default mongoose.model('Account', accountSchema);