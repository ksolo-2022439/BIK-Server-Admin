import { Router } from 'express';
import { requestCard, toggleCardFreeze, getUserCards, updateCardConfig } from './card.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Tarjetas
 *     description: Gestión de tarjetas de crédito y débito
 */

router.use(validateJWT);

/**
 * @swagger
 * /api/cards/request:
 *   post:
 *     summary: Solicitar nueva tarjeta
 *     tags: [Tarjetas]
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
 *               cuentaVinculadaId:
 *                 type: string
 *                 example: "64b8c0d1e2f3a4b5c6d7e8f9"
 *               tipo:
 *                 type: string
 *                 example: "Debito Digital"
 *               limiteCredito:
 *                 type: number
 *                 example: 0
 *     responses:
 *       201:
 *         description: Tarjeta generada exitosamente.
 *       404:
 *         description: Cuenta vinculada no encontrada.
 */
router.post('/request', requestCard);

/**
 * @swagger
 * /api/cards/{id}/freeze:
 *   patch:
 *     summary: Alternar estado de bloqueo de tarjeta
 *     tags: [Tarjetas]
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
 *         description: Estado de bloqueo actualizado.
 *       404:
 *         description: Tarjeta no encontrada.
 */
router.patch('/:id/freeze', toggleCardFreeze);

/**
 * @swagger
 * /api/cards/{id}:
 *   patch:
 *     summary: Actualizar la configuración o límites de una tarjeta (congelar, límites diarios, etc.)
 *     tags: [Tarjetas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la tarjeta a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limiteDiario:
 *                 type: number
 *                 example: 2000
 *     responses:
 *       200:
 *         description: Configuración de la tarjeta actualizada con éxito.
 */
router.patch('/:id', updateCardConfig);

/**
 * @swagger
 * /api/cards/user/{usuarioId}:
 *   get:
 *     summary: Listar todas las tarjetas asociadas a un usuario específico
 *     tags: [Tarjetas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID o DPI del usuario
 *     responses:
 *       200:
 *         description: Lista de tarjetas recuperada con éxito.
 *       404:
 *         description: Usuario no encontrado.
 */
router.get('/user/:usuarioId', getUserCards);

export default router;