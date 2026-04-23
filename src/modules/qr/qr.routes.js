import { Router } from 'express';
import { processQrPayment } from './qr.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

router.use(validateJWT);
router.use(auditLogger);

router.post('/pay', processQrPayment);

export default router;