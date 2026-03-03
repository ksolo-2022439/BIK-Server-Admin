import { Router } from 'express';
import { login, register, me } from './auth.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

router.post('/login', login);

router.post('/register', register);

router.get('/me', validateJWT, me);

export default router;