import { body, param } from 'express-validator';
import { checkValidators } from './check-validators.js';

export const validateTransfer = [
    body('sourceAccountId')
        .notEmpty().withMessage('La cuenta de origen es obligatoria')
        .isMongoId().withMessage('El ID de la cuenta de origen no es válido'),
    
    body('destinationAccountId')
        .notEmpty().withMessage('La cuenta de destino es obligatoria')
        .isMongoId().withMessage('El ID de la cuenta de destino no es válido'),
    
    body('amount')
        .notEmpty().withMessage('El monto es obligatorio')
        .isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0.00')
        .custom((value) => {
            if (value > 2000) {
                throw new Error('El monto máximo por transferencia es de Q2000.00');
            }
            return true;
        }),

    body('description')
        .optional()
        .isLength({ max: 100 }).withMessage('La descripción no puede exceder los 100 caracteres'),

    body().custom((value, { req }) => {
        if (req.body.sourceAccountId === req.body.destinationAccountId) {
            throw new Error('No puedes transferir dinero a la misma cuenta');
        }
        return true;
    }),

    checkValidators
];

export const validateServicePayment = [
    body('sourceAccountId')
        .notEmpty().withMessage('La cuenta de origen es obligatoria')
        .isMongoId().withMessage('El ID de la cuenta de origen no es válido'),

    body('amount')
        .notEmpty().withMessage('El monto es obligatorio')
        .isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0.00'),

    body('typeService')
        .notEmpty().withMessage('El tipo de servicio es obligatorio')
        .isIn(['Luz', 'Agua', 'Gas', 'Teléfono', 'Internet', 'Seguro de vida', 'Seguro de salud'])
        .withMessage('Tipo de servicio no válido'),

    body('nameService')
        .optional()
        .isIn(['Pago de servicios', 'Pago de seguros'])
        .withMessage('Nombre del servicio inválido'),

    body('numberAccountPay')
        .notEmpty().withMessage('El número de referencia/contador es obligatorio'),

    body('methodPayment')
        .optional()
        .isIn(['Tarjeta de crédito', 'Tarjeta de débito', 'Bancaria', 'Pago en efectivo'])
        .withMessage('Método de pago no válido'),

    checkValidators
];

export const validateGetHistory = [
    param('accountId')
        .notEmpty().withMessage('El ID de la cuenta es obligatorio')
        .isMongoId().withMessage('El ID de la cuenta no es válido'),
    
    checkValidators
];

export const validateTransactionId = [
    param('id')
        .isMongoId().withMessage('El ID de la transacción no es válido'),
    
    checkValidators
];