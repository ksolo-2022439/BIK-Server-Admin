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

const router = Router();

/**
 * Todas las rutas administrativas requieren autenticación y rol de staff.
 * El middleware isStaff bloquea a cualquier usuario con rol 'Cliente'.
 */
router.use(validateJWT);
router.use(isStaff);
router.use(auditLogger);

// ═══════════════════════════════════════════
// DASHBOARD — Todos los roles administrativos
// ═══════════════════════════════════════════
router.get('/dashboard/stats', getDashboardStats);

// ═══════════════════════════════════════════
// USUARIOS — Gestión de clientes
// ═══════════════════════════════════════════
router.get('/users', listUsers);
router.get('/users/:id/full-profile', getFullClientProfile);

// ═══════════════════════════════════════════
// GESTIONES (Requests) — Según rol
// ═══════════════════════════════════════════
router.get('/requests', hasRole('Admin_Gestiones', 'Soporte_Remoto', 'Soporte_Presencial'), listAllRequests);
router.get('/requests/:id', hasRole('Admin_Gestiones', 'Soporte_Remoto', 'Soporte_Presencial'), getRequestById);
router.patch('/requests/:id/escalate', hasRole('Soporte_Remoto'), escalateRequest);

// ═══════════════════════════════════════════
// CUENTAS — Listado global y detalle
// ═══════════════════════════════════════════
router.get('/accounts', listAllAccounts);
router.get('/accounts/by-number/:numeroCuenta', findAccountByNumber);
router.get('/accounts/:id/detail', getAccountDetail);

// ═══════════════════════════════════════════
// TRANSACCIONES — Historial global y operaciones de ventanilla
// ═══════════════════════════════════════════
router.get('/transactions', listAllTransactions);
router.post('/transactions/withdrawal', hasRole('Cajero'), executeWithdrawal);

// ═══════════════════════════════════════════
// ESTADOS DE CUENTA — Generación
// ═══════════════════════════════════════════
router.get('/accounts/:id/statement', hasRole('Cajero', 'Admin_Gestiones'), getAccountStatement);

export default router;
