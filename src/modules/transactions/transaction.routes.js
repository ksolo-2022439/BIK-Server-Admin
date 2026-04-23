import { Router } from 'express';
import { executeInternalTransfer, executeACHTransfer, executeCashDeposit } from './transaction.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { isAdmin } from '../../middlewares/validate-roles.js';

const router = Router();

router.use(validateJWT);
router.use(auditLogger);

router.post('/transfer', executeInternalTransfer);
router.post('/ach', executeACHTransfer);
router.post('/deposit', isAdmin, executeCashDeposit);

export default router;