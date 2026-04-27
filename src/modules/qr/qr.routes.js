import { Router } from 'express';
import { processQrPayment } from './qr.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Pago QR
 *     description: Procesamiento de pagos instantáneos mediante códigos QR
 */

router.use(validateJWT);

/**
 * @swagger
 * /api/qr/pay:
 *   post:
 *     summary: Procesar pago mediante QR
 *     tags: [Pago QR]
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
 *               cuentaDestinoId:
 *                 type: string
 *               monto:
 *                 type: number
 *     responses:
 *       200:
 *         description: Pago QR procesado exitosamente.
 */
router.post('/pay', processQrPayment);

export default router;