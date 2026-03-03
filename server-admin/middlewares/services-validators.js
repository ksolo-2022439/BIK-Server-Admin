import { body, param } from 'express-validator';
import { checkValidators } from "./check-validators.js";

export const validateCreateService = [
    body('nameService')
        .notEmpty()
        .withMessage('El nombre del servicio es obligatorio')
        .isIn(['Pago de servicios', 'Pago de seguros'])
        .withMessage('El nombre del servicio debe ser: Pago de servicios o Pago de seguros'),
    body('typeService')
        .notEmpty()
        .withMessage('El tipo de servicio es obligatorio')
        .isIn(['Luz', 'Agua', 'Gas', 'Teléfono', 'Internet', 'Seguro de vida', 'Seguro de salud'])
        .withMessage('Tipo de servicio no válido'),
    body('numberAccountPay')
        .trim()
        .notEmpty()
        .withMessage('La referencia o número de cuenta del servicio es obligatoria'),
    body('methodPayment')
        .notEmpty()
        .isIn(['Tarjeta de crédito', 'Tarjeta de débito', 'Bancaria', 'Pago en efectivo'])
        .withMessage('Método de pago no válido'),
    body('amounth')
        .isFloat({ min: 0 })
        .withMessage('El monto del servicio no puede ser menor a 0'),
    body('status')
        .optional()
        .isIn(['PENDING', 'COMPLETED', 'CANCELED'])
        .withMessage('El estado debe ser PENDING, COMPLETED o CANCELED'),
    checkValidators
];

export const validateGetServiceById = [
    param('id')
        .notEmpty()
        .withMessage('El ID de búsqueda debe ser un ID de MongoDB, el status o la fecha (YYYY-MM-DD)'),
    checkValidators
];

export const validateUpdateService = [
    body('numberAccountPay')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('El número de cuenta no puede estar vacío'),
    body('amounth')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('El monto no puede ser menor a 0'),
    checkValidators
];

export const validateServiceStatusChange = [
    param('id')
    .notEmpty()
    .withMessage('ID obligatorio'),
    param('status')
        .notEmpty()
        .withMessage('El status es obligatorio en la URL')
        .isIn(['PENDING', 'COMPLETED', 'CANCELED', 'pending', 'completed', 'canceled'])
        .withMessage('Status no válido'),
    checkValidators
];