import { Router } from 'express';
import {
    executeInternalTransfer,
    executeACHTransfer,
    executeCashDeposit,
    executeMobileTransfer,
    executeInternationalTransfer,
    getPersonalFinances
} from './transaction.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { isAdmin } from '../../middlewares/validate-roles.js';

const router = Router();

router.use(validateJWT);
router.use(auditLogger);

router.post('/transfer', executeInternalTransfer);
router.post('/ach', executeACHTransfer);
router.post('/mobile', executeMobileTransfer);
router.post('/international', executeInternationalTransfer);
router.post('/deposit', isAdmin, executeCashDeposit);
router.get('/analytics', getPersonalFinances);

export default router;