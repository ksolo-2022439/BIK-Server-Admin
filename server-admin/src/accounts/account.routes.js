import { Router } from 'express';
import { getAccounts, getAccountById, createAccount, updateAccount, changeAccountStatus } from './account.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

import {
        validateCreateAccount, 
        validateUpdateAccount,
        validateGetAccountById,
        validateAccountStatusChange
    } from "../../middlewares/accounts-validators.js";

const router = Router();

//GET
router.get('/', validateJWT, getAccounts);
router.get('/:id', validateGetAccountById, validateJWT, getAccountById);

//POST
router.post('/:id', validateCreateAccount, validateJWT, createAccount);  

//PUT 
router.put('/:id', validateUpdateAccount, validateJWT, updateAccount);
router.put('/:id/activate', validateAccountStatusChange, validateJWT, changeAccountStatus);
router.put('/:id/desactivate', validateAccountStatusChange, validateJWT, changeAccountStatus);

export default router;
