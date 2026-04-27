import { Router } from 'express';
import { createRequest, getUserRequests, updateRequestStatus } from './request.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { isAdmin } from '../../middlewares/validate-roles.js';
import { auditLogger } from '../../middlewares/audit-logger.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Gestiones
 *     description: Administración de solicitudes y requerimientos en línea
 */

router.use(validateJWT);
router.use(auditLogger);

/**
 * @swagger
 * /api/requests:
 *   post:
 *     summary: Crear una nueva solicitud en línea
 *     tags: [Gestiones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipoGestion:
 *                 type: string
 *                 example: "Chequera"
 *               descripcion:
 *                 type: string
 *                 example: "Solicitud de chequera de 50 hojas"
 *     responses:
 *       201:
 *         description: Solicitud creada exitosamente.
 */
router.post('/', createRequest);

/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: Obtener todas las solicitudes del usuario
 *     tags: [Gestiones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial de gestiones obtenido.
 */
router.get('/', getUserRequests);

/**
 * @swagger
 * /api/requests/{id}/status:
 *   patch:
 *     summary: Actualizar estado de una solicitud (Admin)
 *     tags: [Gestiones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado:
 *                 type: string
 *                 example: "Aprobada"
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente.
 */
router.patch('/:id/status', isAdmin, updateRequestStatus);

export default router;