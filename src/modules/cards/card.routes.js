import { Router } from 'express';
import { requestCard, toggleCardFreeze } from './card.controller.js';
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

export default router;