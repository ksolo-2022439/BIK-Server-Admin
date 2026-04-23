import Document from './document.model.js';

/**
 * Registra la aceptación legal de un documento o contrato por parte del usuario.
 * Almacena el timestamp exacto de la firma para fines de auditoría legal.
 */
export const signDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const signedDoc = await Document.findByIdAndUpdate(
            id, 
            { estado: 'Firmado', fechaFirma: new Date() }, 
            { new: true }
        );
        res.status(200).json({ status: 'success', data: signedDoc });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Lista todos los documentos contractuales y legales vinculados al expediente del usuario.
 */
export const getMyDocuments = async (req, res) => {
    try {
        const docs = await Document.find({ usuarioId: req.user.uid });
        res.status(200).json({ status: 'success', data: docs });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};