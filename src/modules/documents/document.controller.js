import Document from './document.model.js';
import User from '../users/user.model.js';

/**
 * Registra la aceptación legal de un documento o contrato por parte del usuario.
 * SEC-021: Verifica propiedad antes de firmar.
 */
export const signDocument = async (req, res) => {
    try {
        const { id } = req.params;
        
        const doc = await Document.findById(id);
        if (!doc) {
            return res.status(404).json({ status: 'error', message: 'Documento no encontrado.' });
        }

        // SEC-021: Verificar propiedad
        const user = await User.findByAnyId(req.user.uid);
        if (!user || doc.usuarioId.toString() !== user._id.toString()) {
            return res.status(403).json({ status: 'error', message: 'No tienes permiso para firmar este documento.' });
        }

        doc.estado = 'Firmado';
        doc.fechaFirma = new Date();
        await doc.save();
        
        res.status(200).json({ status: 'success', data: doc });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Lista todos los documentos contractuales y legales vinculados al expediente del usuario.
 */
export const getMyDocuments = async (req, res) => {
    try {
        const user = await User.findByAnyId(req.user.uid);
        if (!user) throw new Error('Usuario no encontrado.');

        const docs = await Document.find({ usuarioId: user._id });
        res.status(200).json({ status: 'success', data: docs });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};