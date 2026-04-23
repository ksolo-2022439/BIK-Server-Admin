import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
    numeroTarjeta: { type: String, required: true, unique: true },
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cuentaVinculadaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }, // Opcional para tarjetas de crédito
    tipo: { type: String, enum: ['Credito', 'Debito Digital', 'Debito Fisica'], required: true },
    limiteCredito: { type: Number, default: 0 }, // Solo aplica a crédito
    saldoUtilizado: { type: Number, default: 0 }, // Para crédito
    fechaCorte: { type: Number }, // (1-31)
    fechaPago: { type: Number }, // (1-31)
    cvv: { type: String, required: true },
    fechaExpiracion: { type: String, required: true }, // Formato MM/YY
    configuraciones: {
        bloqueada: { type: Boolean, default: false },
        comprasInternacionales: { type: Boolean, default: true }
    }
}, {
    timestamps: true
});

export default mongoose.model('Card', cardSchema);