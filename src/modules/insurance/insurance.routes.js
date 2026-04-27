import { Router } from 'express';
import { enrollInsurance } from './insurance.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { auditLogger } from '../../middlewares/audit-logger.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Seguros
 *     description: Contratación y administración de pólizas de seguros
 */

router.use(validateJWT);
router.use(auditLogger);

/**
 * @swagger
 * /api/insurance/enroll:
 *   post:
 *     summary: Contratar una nueva póliza de seguro
 *     tags: [Seguros]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuarioId:
 *                 type: string
 *                 example: "64a7b9c9d8e1f2a3b4c5d6e7"
 *               cuentaId:
 *                 type: string
 *                 example: "64b8c0d1e2f3a4b5c6d7e8f9"
 *               tipo:
 *                 type: string
 *                 example: "Vida"
 *               primaMensual:
 *                 type: number
 *                 example: 50
 *     responses:
 *       201:
 *         description: Póliza de seguro contratada exitosamente.
 */
router.post('/enroll', enrollInsurance);

export default router;