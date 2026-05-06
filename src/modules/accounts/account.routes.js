import { Router } from 'express';
import { createAccount, getUserAccounts, updateAccountStatus, updateTransferLimit, toggleFavoriteAccount } from './account.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { isAdmin } from '../../middlewares/validate-roles.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Cuentas
 *     description: Gestión de productos financieros del cliente
 */

router.use(validateJWT);

/**
 * @swagger
 * /api/accounts:
 *   post:
 *     summary: Apertura de nueva cuenta
 *     tags: [Cuentas]
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
 *               tipo:
 *                 type: string
 *                 example: "Monetaria"
 *               moneda:
 *                 type: string
 *                 example: "GTQ"
 *     responses:
 *       201:
 *         description: Cuenta creada exitosamente.
 *       500:
 *         description: Error interno del servidor.
 */
router.post('/', isAdmin, createAccount);

/**
 * @swagger
 * /api/accounts/user/{usuarioId}:
 *   get:
 *     summary: Listar cuentas de un usuario
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de cuentas obtenida.
 */
router.get('/user/:usuarioId', getUserAccounts);

/**
 * @swagger
 * /api/accounts/{id}/limits:
 *   patch:
 *     summary: Actualizar límite de transferencias
 *     tags: [Cuentas]
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
 *               limiteTransferenciaDiario:
 *                 type: number
 *                 example: 10000
 *     responses:
 *       200:
 *         description: Límite actualizado.
 */
router.patch('/:id/limits', updateTransferLimit);

/**
 * @swagger
 * /api/accounts/{id}/status:
 *   patch:
 *     summary: Modificar estado de la cuenta
 *     tags: [Cuentas]
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
 *                 example: "Cancelada"
 *     responses:
 *       200:
 *         description: Estado actualizado.
 *       400:
 *         description: No se puede cancelar cuenta con fondos.
 */
router.patch('/:id/status', isAdmin, updateAccountStatus);

/**
 * @swagger
 * /api/accounts/{id}/favorite:
 *   patch:
 *     summary: Alternar estado favorito de una cuenta
 *     tags: [Cuentas]
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
 *         description: Estado favorito actualizado.
 */
router.patch('/:id/favorite', toggleFavoriteAccount);

export default router;