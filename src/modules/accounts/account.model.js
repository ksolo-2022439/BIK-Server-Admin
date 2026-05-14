import mongoose from 'mongoose';
import crypto from 'crypto';

const accountSchema = new mongoose.Schema({
    publicId: { type: String, unique: true, default: () => crypto.randomUUID() },
    numeroCuenta: { type: String, required: true, unique: true },
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tipo: { type: String, enum: ['Monetaria', 'Ahorro'], required: true },
    moneda: { type: String, enum: ['GTQ', 'USD'], default: 'GTQ' },
    saldo: { type: Number, default: 0, min: 0 }, // Saldo real
    limiteTransferenciaDiario: { type: Number, default: 5000 },
    isFavorite: { type: Boolean, default: false },
    estado: { 
        type: String, 
        enum: ['Activa', 'Bloqueada', 'Cancelada', 'Congelada'], 
        default: 'Activa' 
    }
}, {
    timestamps: true
});

accountSchema.statics.findByAnyId = async function(id) {
    if (!id) return null;
    const query = { $or: [{ publicId: id }] };
    if (mongoose.Types.ObjectId.isValid(id)) {
        query.$or.push({ _id: id });
    }
    return this.findOne(query);
};

export default mongoose.model('Account', accountSchema);