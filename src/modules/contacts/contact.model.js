import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    alias: { type: String, required: true },
    tipoDestinatario: { 
        type: String, 
        enum: ['BIK', 'ACH', 'Internacional'], 
        required: true 
    },
    banco: { type: String, required: true },
    numeroCuenta: { type: String, required: true },
    tipoCuenta: { type: String, enum: ['Monetaria', 'Ahorro'], required: true },
    datosInternacionales: {
        swiftBic: { type: String },
        abaRouting: { type: String },
        direccionBanco: { type: String },
        direccionBeneficiario: { type: String },
        tipoBeneficiario: { type: String, enum: ['Individual', 'Empresa'] }
    }
}, {
    timestamps: true
});

export default mongoose.model('Contact', contactSchema);