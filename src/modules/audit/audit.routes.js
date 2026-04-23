import { Router } from 'express';
import { getAuditLogs } from './audit.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { isAdmin } from '../../middlewares/validate-roles.js';

const router = Router();

router.use(validateJWT);
router.get('/logs', isAdmin, getAuditLogs);

export default router;