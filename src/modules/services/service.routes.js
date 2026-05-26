import { Router } from 'express';
import { payService } from './service.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { validateIdempotency } from '../../middlewares/idempotency.js';

const router = Router();

router.use(validateJWT);

/**
 * @swagger
 * /api/services/pay:
 *   post:
 *     summary: Pagar un servicio externo
 *     tags: [Servicios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cuentaOrigenId:
 *                 type: string
 *               monto:
 *                 type: number
 *               servicio:
 *                 type: string
 *               descripcion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pago de servicio completado.
 */
router.post('/pay', validateIdempotency, payService);

export default router;