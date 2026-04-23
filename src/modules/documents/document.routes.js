import { Router } from 'express';
import { signDocument, getMyDocuments } from './document.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { auditLogger } from '../../middlewares/audit-logger.js';

const router = Router();

router.use(validateJWT);
router.use(auditLogger);

router.get('/', getMyDocuments);
router.patch('/:id/sign', signDocument);

export default router;