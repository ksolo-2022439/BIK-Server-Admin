import { Router } from 'express';
import { payService } from './service.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

router.use(validateJWT);
router.post('/pay', payService);

export default router;