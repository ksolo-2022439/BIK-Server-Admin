'use strict';

import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
    nameService: {
        type: String,
        required: true,
        trim: true,
        enum: ['Pago de servicios','Pago de seguros'],
        default: 'Pago de servicios'
    },
    typeService: {
        type: String,
        required: true,
        trim: true,
        enum: ['Luz','Agua','Gas','Teléfono','Internet','Seguro de vida','Seguro de salud'],
        default: 'Luz'
    },
    numberAccountPay: {
        type: String,
        required: [true, 'La referencia o número de cuenta es obligatoria'],
        trim: true
    },
    methodPayment: {
        type: String,
        required: true,
        trim: true,
        enum: ['Tarjeta de crédito','Tarjeta de débito','Bancaria','Pago en efectivo'],
        default: 'Pago en efectivo'
    },
    amounth: {
        type: Number,
        required: true,
        min: [0, 'El precio del servicio no puede ser menor a 0']
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'CANCELED'],
        default: 'COMPLETED'
    },
    datePayment: {
        type: Date,
        required: true,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Service', serviceSchema);