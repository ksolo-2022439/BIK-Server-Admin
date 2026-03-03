'use strict';

import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    // Cuenta que ORDENA el pago (siempre obligatoria)
    sourceAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, 'La cuenta de origen es obligatoria']
    },
    // Cuenta que RECIBE (Obligatoria SOLO si es transferencia entre cuentas)
    destinationAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        validate: {
            validator: function(value) {
                // Si el tipo es TRANSFERENCIA, este campo es obligatorio
                if (this.transactionType === 'TRANSFERENCIA') {
                    return value != null;
                }
                return true;
            },
            message: 'La cuenta de destino es obligatoria para transferencias'
        }
    },
    // Referencia al SERVICIO (Obligatoria SOLO si es pago de servicio)
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        validate: {
            validator: function(value) {
                // Si el tipo es PAGO_SERVICIO, este campo es obligatorio
                if (this.transactionType === 'PAGO_SERVICIO') {
                    return value != null;
                }
                return true;
            },
            message: 'El ID del servicio es obligatorio para pagos de servicios'
        }
    },
    amount: {
        type: Number,
        required: [true, 'El monto es obligatorio'],
        min: [0.01, 'El monto debe ser mayor a 0']
    },
    transactionType: {
        type: String,
        required: true,
        enum: ['TRANSFERENCIA', 'PAGO_SERVICIO'],
        default: 'TRANSFERENCIA'
    },
    description: {
        type: String,
        maxLength: [100, 'La descripción no puede exceder los 100 caracteres']
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['COMPLETED', 'FAILED', 'REVERSED'],
        default: 'COMPLETED'
    }
}, {
    versionKey: false,
    timestamps: true
});

// Índices para búsquedas rápidas
transactionSchema.index({ sourceAccount: 1, date: -1 });
transactionSchema.index({ serviceId: 1 });

export default mongoose.model('Transaction', transactionSchema);