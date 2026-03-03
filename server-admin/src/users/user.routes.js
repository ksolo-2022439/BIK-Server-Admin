import { Router } from 'express';
import { check } from 'express-validator';
import { getUsers, getUserById, updateUser, deleteUser } from './user.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRoles } from '../../middlewares/validate-roles.js';
import { checkValidators } from '../../middlewares/check-validators.js';
const router = Router();

router.use(validateJWT);
router.use(hasRoles('ADMIN_ROLE'));

router.get('/', getUsers);

router.get('/:id', [
    check('id', 'No es un ID válido de Mongo').isMongoId(),
    checkValidators
], getUserById);

router.put('/:id', [
    check('id', 'No es un ID válido de Mongo').isMongoId(),
    checkValidators
], updateUser);

router.delete('/:id', [
    check('id', 'No es un ID válido de Mongo').isMongoId(),
    checkValidators
], deleteUser);

export default router;