import { Router } from 'express';
import { createContact, getUserContacts, updateContact, deleteContact } from './contact.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Contactos
 *     description: Administración de cuentas de terceros y favoritos guardados
 */

router.use(validateJWT);

/**
 * @swagger
 * /api/contacts:
 *   post:
 *     summary: Crear o guardar un nuevo contacto de terceros
 *     tags: [Contactos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Carlos Gómez"
 *               numeroCuenta:
 *                 type: string
 *                 example: "1029384756"
 *               alias:
 *                 type: string
 *                 example: "Carlos - Ahorro"
 *     responses:
 *       201:
 *         description: Contacto guardado con éxito.
 */
router.post('/', createContact);

/**
 * @swagger
 * /api/contacts:
 *   get:
 *     summary: Obtener todos los contactos guardados por el usuario autenticado
 *     tags: [Contactos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Listado de contactos obtenido.
 */
router.get('/', getUserContacts);

/**
 * @swagger
 * /api/contacts/{id}:
 *   put:
 *     summary: Actualizar la información (alias) de un contacto guardado
 *     tags: [Contactos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del contacto a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               alias:
 *                 type: string
 *                 example: "Carlos - Principal"
 *     responses:
 *       200:
 *         description: Contacto actualizado correctamente.
 */
router.put('/:id', updateContact);

/**
 * @swagger
 * /api/contacts/{id}:
 *   delete:
 *     summary: Eliminar un contacto guardado
 *     tags: [Contactos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del contacto a eliminar
 *     responses:
 *       200:
 *         description: Contacto eliminado exitosamente.
 */
router.delete('/:id', deleteContact);

export default router;