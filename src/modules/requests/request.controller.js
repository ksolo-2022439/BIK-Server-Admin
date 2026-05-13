import Request from './request.model.js';

/**
 * Crea una nueva gestión en línea vinculada al usuario autenticado.
 */
export const createRequest = async (req, res) => {
    try {
        const newRequest = new Request({
            ...req.body,
            usuarioId: req.user.uid
        });
        await newRequest.save();
        res.status(201).json({ status: 'success', data: newRequest });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Obtiene el historial de gestiones realizadas por el usuario actual.
 */
export const getUserRequests = async (req, res) => {
    try {
        const requests = await Request.find({ usuarioId: req.user.uid }).sort({ fechaSolicitud: -1 });
        res.status(200).json({ status: 'success', data: requests });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Actualiza el estado de una gestión específica y registra la fecha de resolución (Exclusivo Administradores).
 */
export const updateRequestStatus = async (req, res) => {
    try {
        const { estado, comentario } = req.body;
        const updatedRequest = await Request.findByIdAndUpdate(
            req.params.id,
            { 
                estado, 
                fechaResolucion: estado === 'Completada' || estado === 'Rechazada' ? new Date() : undefined,
                $push: {
                    notas: {
                        autor: req.user.uid,
                        texto: comentario || `Estado actualizado a ${estado}`,
                        fecha: new Date()
                    }
                }
            },
            { new: true }
        );
        res.status(200).json({ status: 'success', data: updatedRequest });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};