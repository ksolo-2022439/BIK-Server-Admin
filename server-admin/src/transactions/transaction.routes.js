import { Router } from 'express';
import {
    makeTransfer,
    payService,
    getTransactionHistory,
    getTransactionById
} from './transaction.controller.js';
import {
    validateTransfer,
    validateServicePayment,
    validateTransactionId,
    validateGetHistory
} from '../../middlewares/transactions-validators.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

import { createAchOut, createAchIn } from "./transaction.controller.js";
import { achOutValidator, achInValidator } from "../../middlewares/transactions-validators.js";

const router = Router();

// Rutas POST - Operaciones Monetarias
router.post(
    '/transfer',
    validateJWT,
    validateTransfer,
    makeTransfer
);

router.post(
    '/pay-service',
    validateJWT,
    validateServicePayment,
    payService
);

router.post("/ach/out", validateJWT, achOutValidator, createAchOut);
router.post("/ach/in", validateJWT, achInValidator, createAchIn);

// Rutas GET - Consultas
router.get(
    '/history/:accountId',
    validateJWT,
    validateGetHistory,
    getTransactionHistory
);

router.get(
    '/:id',
    validateJWT,
    validateTransactionId,
    getTransactionById
);

export default router;