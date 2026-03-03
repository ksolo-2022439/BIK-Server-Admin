import { Router } from 'express';
import {
    createDeposit,
    getDepositsByAccount,
    getDepositById
} from './deposit.controller.js';
import {
    validateCreateDeposit,
    validateGetDepositById,
    validateGetAccountDeposits
} from '../../middlewares/deposits-validators.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

// Rutas POST - Crear nuevo depósito
router.post(
    '/',
    validateJWT,
    validateCreateDeposit,
    createDeposit
);

// Rutas GET - Consultas
router.get(
    '/history/:accountId',
    validateJWT,
    validateGetAccountDeposits,
    getDepositsByAccount
);

router.get(
    '/:id',
    validateJWT,
    validateGetDepositById,
    getDepositById
);

export default router;