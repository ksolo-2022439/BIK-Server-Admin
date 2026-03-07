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
import { hasRoles } from '../../middlewares/validate-roles.js';

const router = Router();

router.use(validateJWT);
router.use(hasRoles('ADMIN_ROLE'));

router.post('/', validateCreateDeposit, createDeposit);

router.get('/history/:accountId', validateGetAccountDeposits, getDepositsByAccount);
router.get('/:id', validateGetDepositById, getDepositById);

export default router;