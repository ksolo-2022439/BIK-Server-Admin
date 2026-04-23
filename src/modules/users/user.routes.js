import { Router } from 'express';
import { createUser, getUserByDpi, updateUser, updateUserStatus } from './user.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { isAdmin } from '../../middlewares/validate-roles.js';

const router = Router();

// Rutas Públicas (El registro inicial no requiere token, se genera antes de que C# valide contraseñas)
router.post('/register', createUser);

// Todas las rutas debajo de esta línea requieren un JWT válido de C#
router.use(validateJWT); 

router.get('/:dpi', getUserByDpi);
router.put('/:id/update', updateUser);

// Rutas Exclusivas de Administración
router.patch('/:id/status', isAdmin, updateUserStatus);

export default router;