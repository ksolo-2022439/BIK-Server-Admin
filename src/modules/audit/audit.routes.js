import { Router } from 'express';
import { getAuditLogs } from './audit.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { isAdmin } from '../../middlewares/validate-roles.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Auditoría
 *     description: Registro histórico de operaciones administrativas
 */

router.use(validateJWT);

/**
 * @swagger
 * /api/audit/logs:
 *   get:
 *     summary: Obtener registros de auditoría
 *     tags: [Auditoría]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial de operaciones obtenido exitosamente.
 *       403:
 *         description: Acceso denegado (Solo Administradores).
 */
router.get('/logs', isAdmin, getAuditLogs);

export default router;