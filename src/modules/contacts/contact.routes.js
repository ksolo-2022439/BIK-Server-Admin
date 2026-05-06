import { Router } from 'express';
import { createContact, getUserContacts, updateContact, deleteContact } from './contact.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

router.use(validateJWT);

router.post('/', createContact);
router.get('/', getUserContacts);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

export default router;