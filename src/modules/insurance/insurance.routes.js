import { Router } from 'express';
import { enrollInsurance } from './insurance.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { auditLogger } from '../../middlewares/audit-logger.js';

const router = Router();

router.use(validateJWT);
router.use(auditLogger);

router.post('/enroll', enrollInsurance);

export default router;