import { Router } from 'express';
import { getUserNotifications, markAsRead } from './notification.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

router.use(validateJWT);
router.get('/', getUserNotifications);
router.patch('/:id/read', markAsRead);

export default router;