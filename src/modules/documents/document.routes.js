import { Router } from 'express';
import { signDocument, getMyDocuments } from './document.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { auditLogger } from '../../middlewares/audit-logger.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Documentos
 *     description: Gestión y firma de contratos y documentos legales
 */

router.use(validateJWT);
router.use(auditLogger);

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Listar documentos del usuario autenticado
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de documentos obtenida exitosamente.
 */
router.get('/', getMyDocuments);

/**
 * @swagger
 * /api/documents/{id}/sign:
 *   patch:
 *     summary: Firmar electrónicamente un documento
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del documento a firmar
 *     responses:
 *       200:
 *         description: Documento firmado exitosamente.
 */
router.patch('/:id/sign', signDocument);

export default router;