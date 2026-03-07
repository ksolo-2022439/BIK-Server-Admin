import { Router } from 'express';
import { login, register, me } from './auth.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRoles } from '../../middlewares/validate-roles.js';

const router = Router();

router.post('/login', login);

router.post('/register', [validateJWT, hasRoles('ADMIN_ROLE')], register);

router.get('/me', validateJWT, me);

export default router;