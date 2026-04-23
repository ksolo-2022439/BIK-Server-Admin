import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    cuentaOrigenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }, // Nulo si es depósito en efectivo
    cuentaDestinoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }, // Nulo si es ACH externo
    monto: { type: Number, required: true },
    tipo: { 
        type: String, 
        enum: ['Transferencia_Local', 'Transferencia_ACH', 'Deposito_Efectivo', 'Retiro', 'Pago_Servicio', 'Remesa', 'Pago_QR', 'Reversion'], 
        required: true 
    },
    descripcion: { type: String, maxlength: 200 }, // Opcional
    
    // CAMPOS PARA ACH (Solo requeridos si tipo === 'Transferencia_ACH')
    achDetails: {
        bancoDestino: { type: String }, // Ej. '001', '014', '041'
        titularDestino: { type: String },
        cuentaDestinoExterna: { type: String },
        tipoCuentaDestino: { type: String, enum: ['Monetaria', 'Ahorro'] }
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