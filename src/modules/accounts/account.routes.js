import { Router } from 'express';
import { createAccount, getUserAccounts, updateAccountStatus, updateTransferLimit } from './account.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { isAdmin } from '../../middlewares/validate-roles.js';

const router = Router();

router.use(validateJWT);

router.post('/', isAdmin, createAccount);
router.get('/user/:usuarioId', getUserAccounts);
router.patch('/:id/limits', updateTransferLimit);
router.patch('/:id/status', isAdmin, updateAccountStatus);

export default router;