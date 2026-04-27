import { Router } from 'express';
import { getExchangeRates, exchangeCurrency, redeemRemittance } from './currency.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { auditLogger } from '../../middlewares/audit-logger.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Divisas
 *     description: Gestión de tasas de cambio y remesas internacionales
 */

router.use(validateJWT);
router.use(auditLogger);

/**
 * @swagger
 * /api/currency/rates:
 *   get:
 *     summary: Obtener tasas de cambio actuales
 *     tags: [Divisas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tasas de cambio obtenida.
 */
router.get('/rates', getExchangeRates);

/**
 * @swagger
 * /api/currency/exchange:
 *   post:
 *     summary: Negociar divisas entre cuentas propias
 *     tags: [Divisas]
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
 *                 example: "64b8c0d1e2f3a4b5c6d7e8f9"
 *               cuentaDestinoId:
 *                 type: string
 *                 example: "64b8c0d1e2f3a4b5c6d7e8fa"
 *               montoOrigen:
 *                 type: number
 *                 example: 500
 *               tasaAplicada:
 *                 type: number
 *                 example: 7.85
 *     responses:
 *       200:
 *         description: Negociación de divisas completada.
 *       400:
 *         description: Fondos insuficientes o cuentas inválidas.
 */
router.post('/exchange', exchangeCurrency);

/**
 * @swagger
 * /api/currency/remittance/redeem:
 *   post:
 *     summary: Redimir remesa internacional
 *     tags: [Divisas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cuentaDestinoId:
 *                 type: string
 *                 example: "64b8c0d1e2f3a4b5c6d7e8f9"
 *               codigoRemesa:
 *                 type: string
 *                 example: "MTCN-12345678"
 *               montoAcreditado:
 *                 type: number
 *                 example: 1500
 *               remitente:
 *                 type: string
 *                 example: "Juan Perez"
 *     responses:
 *       200:
 *         description: Remesa redimida y acreditada.
 *       400:
 *         description: Cuenta destino inválida.
 */
router.post('/remittance/redeem', redeemRemittance);

export default router;