import { Router } from 'express';
import { createAccount, getUserAccounts, updateAccountStatus, updateTransferLimit } from './account.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { isAdmin } from '../../middlewares/validate-roles.js';
import { auditLogger } from '../../middlewares/audit-logger.js';

const router = Router();

/**
 * Define las rutas para la gestión de cuentas.
 * El middleware auditLogger se coloca después de validateJWT para registrar
 * las acciones realizadas por los administradores.
 */
router.use(validateJWT);
router.use(auditLogger); 

router.post('/', isAdmin, createAccount);
router.get('/user/:usuarioId', getUserAccounts);
router.patch('/:id/limits', updateTransferLimit);
router.patch('/:id/status', isAdmin, updateAccountStatus);

export default router;