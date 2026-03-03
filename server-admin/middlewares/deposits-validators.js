import { body, param } from 'express-validator';
import { checkValidators } from './check-validators.js';
export const validateCreateDeposit = [
    body('accountId')
        .notEmpty().withMessage('La cuenta de destino es obligatoria')
        .isMongoId().withMessage('El ID de la cuenta no es válido'),

    body('amount')
        .notEmpty().withMessage('El monto del depósito es obligatorio')
        .isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0.00'),

    body('description')
        .optional()
        .isLength({ max: 200 }).withMessage('La descripción no puede exceder los 200 caracteres'),
    
    body('originSource')
        .optional()
        .isString().withMessage('El origen debe ser un texto'),

    checkValidators
];

export const validateGetAccountDeposits = [
    param('accountId')
        .notEmpty().withMessage('El ID de la cuenta es obligatorio')
        .isMongoId().withMessage('El ID de la cuenta no es válido'),
    
    checkValidators
];

export const validateGetDepositById = [
    param('id')
        .isMongoId().withMessage('El ID del depósito no es válido'),
    
    checkValidators
];