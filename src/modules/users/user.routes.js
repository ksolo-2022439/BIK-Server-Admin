import { Router } from 'express';
import { createUser, getUserByDpi, updateUser, updateUserStatus } from './user.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { isAdmin } from '../../middlewares/validate-roles.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Usuarios
 *     description: Gestión de clientes y perfiles administrativos
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Registrar un nuevo cliente
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombres:
 *                 type: string
 *               apellidos:
 *                 type: string
 *               dpi:
 *                 type: string
 *               fechaNacimiento:
 *                 type: string
 *                 format: date
 *               direccion:
 *                 type: object
 *                 properties:
 *                   departamento:
 *                     type: string
 *                   municipio:
 *                     type: string
 *                   zona:
 *                     type: string
 *                   detalle:
 *                     type: string
 *               telefono:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 description: "Se enviará al Auth-Service, no se guarda en Mongo"
 *               ingresosMensuales:
 *                 type: number
 *               fotoDpiAdelanteUrl:
 *                 type: string
 *               fotoDpiAtrasUrl:
 *                 type: string
 *               fotoRostroUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente.
 *       400:
 *         description: El DPI, Teléfono o Correo ya están registrados.
 */
router.post('/register', createUser);

router.use(validateJWT);

/**
 * @swagger
 * /api/users/{dpi}:
 *   get:
 *     summary: Obtener usuario por DPI
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dpi
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del usuario.
 *       404:
 *         description: Usuario no encontrado.
 */
router.get('/:dpi', getUserByDpi);

/**
 * @swagger
 * /api/users/{id}/update:
 *   put:
 *     summary: Actualizar datos demográficos del usuario
 *     tags: [Usuarios]
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
 *               direccion:
 *                 type: string
 *               telefono:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado.
 */
router.put('/:id/update', updateUser);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: Cambiar estado del usuario (Admin)
 *     tags: [Usuarios]
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
 *                 example: "Activo"
 *     responses:
 *       200:
 *         description: Estado actualizado.
 */
router.patch('/:id/status', isAdmin, updateUserStatus);

export default router;