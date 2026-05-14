import mongoose from 'mongoose';
import crypto from 'crypto';

const transactionSchema = new mongoose.Schema({
    publicId: { type: String, unique: true, default: () => crypto.randomUUID() },
    cuentaOrigenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }, // Nulo si es depósito en efectivo
    cuentaDestinoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }, // Nulo si es ACH o Internacional
    monto: { type: Number, required: true },
    tipo: { 
        type: String, 
        enum: [
            'Transferencia_Local', 
            'Transferencia_ACH', 
            'Transferencia_Internacional',
            'Transferencia_Movil',
            'Deposito_Efectivo', 
            'Retiro', 
            'Pago_Servicio', 
            'Remesa', 
            'Pago_QR', 
            'Reversion'
        ], 
        required: true 
    },
    descripcion: { type: String, maxlength: 200 }, // Opcional
    
    // ACH NACIONAL
    achDetails: {
        bancoDestino: { type: String }, // Nombre o código del banco
        titularDestino: { type: String },
        cuentaDestinoExterna: { type: String },
        tipoCuentaDestino: { type: String, enum: ['Monetaria', 'Ahorro', ''] }
    },

    internationalDetails: {
        swiftBic: { type: String }, // Código SWIFT/BIC
        abaRouting: { type: String }, // Routing Number para USA
        bancoDestino: { type: String }, // Nombre del banco extranjero
        direccionBanco: { type: String }, // Ciudad, Estado, País
        cuentaIban: { type: String }, // Número de cuenta o IBAN
        tipoBeneficiario: { type: String, enum: ['Individual', 'Empresa', ''] },
        nombreBeneficiario: { type: String }, // Nombre completo
        direccionBeneficiario: { type: String }, // Calle, Ciudad, País
        motivoTransferencia: { type: String },
        comisionAplicada: { type: Number, default: 0 } // Costo del envío SWIFT
    },

    estado: { 
        type: String, 
        enum: ['Completada', 'Reversada', 'Fallida', 'En_Proceso'], 
        default: 'Completada' 
    },
    referenciaCajero: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Si la operó un admin en agencia
}, {
    timestamps: true
});

export default mongoose.model('Transaction', transactionSchema);