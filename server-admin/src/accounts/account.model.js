'use strict';

import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema({
    numberAccount: {
        type: String,
        unique: true,
        default: () => Math.floor(1000000000 + Math.random() * 9000000000).toString()
    },
    dpi: {
        type: String,
        required: true,
        unique: true,
        maxLength: [13, 'El DPI debe tener máximo 13 caracteres'],
        minLength: [13, 'El DPI debe tener mínimo 13 caracteres']
    },
    typeAccount: {
        type: String,
        enum: ['Monetaria', 'Ahorro', 'NULL'],
        required: true,
        default: 'NULL'
    },
    earningsM: {
        type: Number,
        required: true
    },
    balance: {
        type: Number,
        default: 0
    },
    nameAccount: {
        type: String,
        required: true,
        trim: true,
        maxLength: [100, 'El nombre del contacto no puede exceder los 100 caracteres'],
        minLength: [2, 'El nombre del contacto debe tener al menos 2 caracteres']
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/.+\@.+\..+/, 'Por favor ingrese un correo electrónico válido']
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/^\+?[1-9]\d{1,14}$/, 'Por favor ingrese un número de teléfono válido']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    creaAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Account', accountSchema);