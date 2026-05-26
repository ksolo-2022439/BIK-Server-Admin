import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * Esquema de base de datos para registrar todo el historial transaccional de BIK.
 * Soporta transacciones locales, ACH nacional, transferencias internacionales (SWIFT/ABA),
 * depósitos en ventanilla, retiros, pagos de servicios, cobros QR y reversiones.
 */
const transactionSchema = new mongoose.Schema({
    publicId: { 
        type: String, 
        unique: true, 
        default: () => crypto.randomUUID() 
    },
    cuentaOrigenId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Account' 
    },
    cuentaDestinoId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Account' 
    },
    monto: { 
        type: Number, 
        required: true 
    },
    montoAcreditado: {
        type: Number
    },
    tasaCambio: {
        type: Number
    },
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
    descripcion: { 
        type: String, 
        maxlength: 200 
    },
    
    achDetails: {
        bancoDestino: { type: String },
        titularDestino: { type: String },
        cuentaDestinoExterna: { type: String },
        tipoCuentaDestino: { type: String, enum: ['Monetaria', 'Ahorro', ''] }
    },

    internationalDetails: {
        swiftBic: { type: String },
        abaRouting: { type: String },
        bancoDestino: { type: String },
        direccionBanco: { type: String },
        cuentaIban: { type: String },
        tipoBeneficiario: { type: String, enum: ['Individual', 'Empresa', ''] },
        nombreBeneficiario: { type: String },
        direccionBeneficiario: { type: String },
        motivoTransferencia: { type: String },
        comisionAplicada: { type: Number, default: 0 }
    },

    estado: { 
        type: String, 
        enum: ['Completada', 'Reversada', 'Fallida', 'En_Proceso'], 
        default: 'Completada' 
    },
    referenciaCajero: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }
}, {
    timestamps: true
});
// DB-038: Índices para consultas frecuentes
transactionSchema.index({ cuentaOrigenId: 1, createdAt: -1 });
transactionSchema.index({ cuentaDestinoId: 1, createdAt: -1 });
transactionSchema.index({ cuentaOrigenId: 1, estado: 1, createdAt: -1 });
transactionSchema.index({ tipo: 1, createdAt: -1 });

export default mongoose.model('Transaction', transactionSchema);