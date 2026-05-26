import { Router } from 'express';
import {
    getDashboardStats,
    listUsers,
    getFullClientProfile,
    listAllRequests,
    getRequestById,
    escalateRequest,
    executeWithdrawal,
    getAccountStatement,
    listAllAccounts,
    listAllTransactions,
    findAccountByNumber,
    getAccountDetail
} from './admin.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { isStaff, hasRole } from '../../middlewares/validate-roles.js';
import { auditLogger } from '../../middlewares/audit-logger.js';
import { validateIdempotency } from '../../middlewares/idempotency.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Operaciones administrativas de control global (Ventanilla, Gestiones, Auditoría, Cuentas)
 */

router.use(validateJWT);
router.use(isStaff);
router.use(auditLogger);

/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Obtener estadísticas consolidadas del dashboard administrativo
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas consolidadas recuperadas.
 */
router.get('/dashboard/stats', getDashboardStats);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Listar todos los clientes del sistema bancario
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Arreglo de usuarios registrados.
 */
router.get('/users', listUsers);

/**
 * @swagger
 * /api/admin/users/{id}/full-profile:
 *   get:
 *     summary: Obtener perfil consolidado del cliente (incluye cuentas, tarjetas y movimientos)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID o DPI del cliente
 *     responses:
 *       200:
 *         description: Perfil completo del cliente.
 *       404:
 *         description: Cliente no encontrado.
 */
router.get('/users/:id/full-profile', getFullClientProfile);

/**
 * @swagger
 * /api/admin/requests:
 *   get:
 *     summary: Listar todas las gestiones y solicitudes en línea del sistema
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Listado de gestiones del sistema.
 */
router.get('/requests', hasRole('Admin_Gestiones', 'Soporte_Remoto', 'Soporte_Presencial'), listAllRequests);

/**
 * @swagger
 * /api/admin/requests/{id}:
 *   get:
 *     summary: Obtener el detalle específico de una gestión por su ID o DPI
 *     tags: [Admin]
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
 *         description: Detalle de la gestión obtenido.
 *       404:
 *         description: Gestión no encontrada.
 */
router.get('/requests/:id', hasRole('Admin_Gestiones', 'Soporte_Remoto', 'Soporte_Presencial'), getRequestById);

/**
 * @swagger
 * /api/admin/requests/{id}/escalate:
 *   patch:
 *     summary: Escalar prioridad o estado de una gestión (Soporte Remoto)
 *     tags: [Admin]
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
 *               motivo:
 *                 type: string
 *                 example: "Se requiere validación de gerencia"
 *     responses:
 *       200:
 *         description: Gestión escalada correctamente.
 */
router.patch('/requests/:id/escalate', hasRole('Soporte_Remoto'), escalateRequest);

/**
 * @swagger
 * /api/admin/accounts:
 *   get:
 *     summary: Listado global de todas las cuentas bancarias registradas
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista global de cuentas obtenida.
 */
router.get('/accounts', listAllAccounts);

/**
 * @swagger
 * /api/admin/accounts/by-number/{numeroCuenta}:
 *   get:
 *     summary: Buscar cuenta bancaria por su número de cuenta
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: numeroCuenta
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cuenta encontrada.
 *       404:
 *         description: Cuenta no encontrada.
 */
router.get('/accounts/by-number/:numeroCuenta', findAccountByNumber);

/**
 * @swagger
 * /api/admin/accounts/{id}/detail:
 *   get:
 *     summary: Obtener el detalle consolidado de una cuenta por su ID o DPI
 *     tags: [Admin]
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
 *         description: Detalle de cuenta recuperado.
 *       404:
 *         description: Cuenta no encontrada.
 */
router.get('/accounts/:id/detail', getAccountDetail);

/**
 * @swagger
 * /api/admin/transactions:
 *   get:
 *     summary: Listado global de todas las transacciones históricas registradas
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Listado global de transacciones recuperado.
 */
router.get('/transactions', listAllTransactions);

/**
 * @swagger
 * /api/admin/transactions/withdrawal:
 *   post:
 *     summary: Registrar un retiro de efectivo en ventanilla (Cajero)
 *     tags: [Admin]
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
 *     responses:
 *       200:
 *         description: Retiro realizado exitosamente.
 */
router.post('/transactions/withdrawal', hasRole('Cajero'), validateIdempotency, executeWithdrawal);

/**
 * @swagger
 * /api/admin/accounts/{id}/statement:
 *   get:
 *     summary: Generar estado de cuenta bancario
 *     tags: [Admin]
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
 *         description: Estado de cuenta generado.
 */
router.get('/accounts/:id/statement', hasRole('Cajero', 'Admin_Gestiones'), getAccountStatement);

export default router;
