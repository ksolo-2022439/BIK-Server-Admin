import { body, param } from 'express-validator';
import { checkValidators } from "./check-validators.js"

export const validateCreateAccount = [
    body('dpi')
        .isLength({ min: 13, max: 13 })
        .withMessage('El DPI debe tener exactamente 13 caracteres'),
    body('typeAccount')
        .isIn(['Monetaria', 'Ahorro', 'NULL'])
        .withMessage('El tipo de cuenta debe ser Monetaria, Ahorro o NULL'),
    body('earningsM')
        .isFloat({ gt: 100 })
        .withMessage('Los ingresos mensuales deben ser mayores a 100'),
    body('nameAccount')
        .trim()
        .notEmpty()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre del contacto debe tener entre 2 y 100 caracteres'),
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Por favor ingrese un correo electrónico válido'),
    body('phoneNumber')
        .matches(/^\+?[1-9]\d{1,14}$/)
        .withMessage('Por favor ingrese un número de teléfono válido'),
    checkValidators
];

export const validateAccountStatusChange = [
    param('id')
        .notEmpty()
        .withMessage('El ID de la cuenta debe ser un ID de MongoDB válido, el numero de cuenta o el dpi'),
    checkValidators
];

export const validateUpdateAccount = [
    body('email')
        .trim()
        .isEmail()
        .normalizeEmail()
        .withMessage('Por favor ingrese un correo electrónico válido'),
    body('phoneNumber')
        .matches(/^\+?[1-9]\d{1,14}$/)
        .withMessage('Por favor ingrese un número de teléfono válido'),
    checkValidators
];

export const validateGetAccountById = [
    param('id')
        .notEmpty()
        .withMessage('El ID de la cuenta debe ser un ID de MongoDB válido, el numero de cuenta o el dpi'),
    checkValidators
];