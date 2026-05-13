import { Router } from 'express';
import { 
    executeInternalTransfer, 
    executeACHTransfer, 
    executeCashDeposit, 
    executeMobileTransfer, 
    executeInternationalTransfer,
    getPersonalFinances,
    getUserTransactions 
} from './transaction.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { isAdmin, hasRole } from '../../middlewares/validate-roles.js';
import { auditLogger } from '../../middlewares/audit-logger.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Transacciones
 *     description: Operaciones de transferencia, depósitos y analítica
 */

router.use(validateJWT);
router.use(auditLogger);

/**
 * @swagger
 * /api/transactions/transfer:
 *   post:
 *     summary: Transferencia interna BIK
 *     tags: [Transacciones]
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
 *               descripcion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transferencia exitosa.
 */
router.post('/transfer', executeInternalTransfer);

/**
 * @swagger
 * /api/transactions/ach:
 *   post:
 *     summary: Transferencia ACH a otros bancos
 *     tags: [Transacciones]
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
 *               descripcion:
 *                 type: string
 *               achDetails:
 *                 type: object
 *                 properties:
 *                   bancoDestino:
 *                     type: string
 *                   titularDestino:
 *                     type: string
 *                   cuentaDestinoExterna:
 *                     type: string
 *     responses:
 *       200:
 *         description: Transferencia ACH en proceso.
 */
router.post('/ach', executeACHTransfer);

/**
 * @swagger
 * /api/transactions/mobile:
 *   post:
 *     summary: Transferencia móvil mediante número telefónico
 *     tags: [Transacciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               monto:
 *                 type: number
 *               telefonoDestino:
 *                 type: string
 *               descripcion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transferencia móvil exitosa.
 */
router.post('/mobile', executeMobileTransfer);

/**
 * @swagger
 * /api/transactions/international:
 *   post:
 *     summary: Transferencia internacional (SWIFT)
 *     tags: [Transacciones]
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
 *               swift:
 *                 type: string
 *               iban:
 *                 type: string
 *               beneficiario:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transferencia internacional procesada.
 */
router.post('/international', executeInternationalTransfer);

/**
 * @swagger
 * /api/transactions/deposit:
 *   post:
 *     summary: Depósito en efectivo (Admin)
 *     tags: [Transacciones]
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
 *               monto:
 *                 type: number
 *               descripcion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Depósito exitoso.
 */
router.post('/deposit', hasRole('Cajero'), executeCashDeposit);

/**
 * @swagger
 * /api/transactions/analytics:
 *   get:
 *     summary: Analítica de finanzas personales
 *     tags: [Transacciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos agrupados por tipo de transacción.
 */
router.get('/analytics', getPersonalFinances);
router.get('/history', getUserTransactions);

export default router;