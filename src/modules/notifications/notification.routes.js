import { Router } from 'express';
import { getUserNotifications, markAsRead } from './notification.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Notificaciones
 *     description: Sistema de alertas y avisos para el usuario
 */

router.use(validateJWT);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Obtener historial de notificaciones del usuario
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de notificaciones obtenida.
 */
router.get('/', getUserNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Marcar notificación como leída
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notificación actualizada.
 */
router.patch('/:id/read', markAsRead);

export default router;