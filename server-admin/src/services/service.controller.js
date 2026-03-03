import mongoose from 'mongoose';
import Service from './service.model.js';

export const getServices = async (req, res) => {
    try {
        const { status, datePayment } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (datePayment) filter.datePayment = datePayment;

        const services = await Service.find(filter).sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            total: services.length,
            data: services
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener los servicios',
            error: error.message
        });
    }
};

export const getServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        let query;

        if (mongoose.Types.ObjectId.isValid(id)) {
            query = { _id: id };
        } 
        else if (['PENDING', 'COMPLETED', 'CANCELED'].includes(id.toUpperCase())) {
            query = { status: id.toUpperCase() };
        } 
        else {
            query = { datePayment: id };
        }

        const service = await Service.findOne(query);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Servicio no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: service
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener el servicio',
            error: error.message
        });
    }
};

export const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        let query;

        if (mongoose.Types.ObjectId.isValid(id)) {
            query = { _id: id };
        } else if (['PENDING', 'COMPLETED', 'CANCELED'].includes(id.toUpperCase())) {
            query = { status: id.toUpperCase() };
        } else {
            query = { datePayment: id };
        }

        const service = await Service.findOneAndUpdate(query, updateData, {
            new: true,
            runValidators: true
        });

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Servicio no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Servicio actualizado exitosamente',
            data: service
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar el servicio',
            error: error.message
        });
    }
};

export const changeServiceStatus = async (req, res) => {
    try {
        const { id, status } = req.params; 
        
        let query = { _id: id };
        if (!mongoose.Types.ObjectId.isValid(id)) {
            query = { $or: [{ status: id }, { datePayment: id }] };
        }

        const service = await Service.findOneAndUpdate(
            query,
            { status: status.toUpperCase() }, 
            { new: true }
        );

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Servicio no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: `Estado del servicio actualizado a ${service.status}`,
            data: service
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al cambiar el estado del servicio',
            error: error.message
        });
    }
};

export const createService = async (req, res) => {
    try {
        const serviceData = req.body;
        const service = new Service(serviceData);
        await service.save();

        res.status(201).json({
            success: true,
            message: 'Servicio creado exitosamente',
            data: service
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear el servicio',
            error: error.message
        });
    }
};