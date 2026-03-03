import { Router } from 'express';
import { getServices, getServiceById, createService, updateService, changeServiceStatus } from './service.controller.js';

import {
        validateCreateService, 
        validateUpdateService,
        validateGetServiceById,
        validateServiceStatusChange
    } from "../../middlewares/services-validators.js";

const router = Router();

//GET
router.get('/', getServices);
router.get('/:id', validateGetServiceById, getServiceById);

//POST
router.post('/', validateCreateService, createService);

//PUT 
router.put('/:id', validateUpdateService, updateService);
router.put('/:id/:status', validateServiceStatusChange, changeServiceStatus);

export default router;