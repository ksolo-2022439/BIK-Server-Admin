import { Router } from 'express';
import { requestCard, toggleCardFreeze } from './card.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

router.use(validateJWT);
router.post('/request', requestCard);
router.patch('/:id/freeze', toggleCardFreeze);

export default router;