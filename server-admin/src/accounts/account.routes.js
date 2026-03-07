import { Router } from 'express';
import { getAccounts, getAccountById, createAccount, updateAccount, changeAccountStatus } from './account.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRoles } from '../../middlewares/validate-roles.js';

import {
        validateCreateAccount, 
        validateUpdateAccount,
        validateGetAccountById,
        validateAccountStatusChange
    } from "../../middlewares/accounts-validators.js";

const router = Router();

router.use(validateJWT);
router.use(hasRoles('ADMIN_ROLE'));

router.get('/', getAccounts);
router.get('/:id', validateGetAccountById, getAccountById);

router.post('/:id', validateCreateAccount, createAccount);  

router.put('/:id', validateUpdateAccount, updateAccount);
router.put('/:id/activate', validateAccountStatusChange, changeAccountStatus);
router.put('/:id/desactivate', validateAccountStatusChange, changeAccountStatus);

export default router;
