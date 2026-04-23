import { Router } from 'express';
import { getExchangeRates, exchangeCurrency, redeemRemittance } from './currency.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { auditLogger } from '../../middlewares/audit-logger.js';

const router = Router();

router.use(validateJWT);
router.use(auditLogger);

router.get('/rates', getExchangeRates);
router.post('/exchange', exchangeCurrency);
router.post('/remittance/redeem', redeemRemittance);

export default router;