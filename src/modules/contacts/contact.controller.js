import Contact from './contact.model.js';

/**
 * Registra un nuevo destinatario en la libreta de contactos del usuario.
 * Vincula el contacto directamente al identificador extraído del token de seguridad.
 */
export const createContact = async (req, res) => {
    try {
        const newContact = new Contact({
            ...req.body,
            usuarioId: req.user.uid
        });
        await newContact.save();
        res.status(201).json({ status: 'success', data: newContact });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Recupera el listado completo de destinatarios registrados por el usuario autenticado.
 * Ordena los resultados alfabéticamente según el alias asignado.
 */
export const getUserContacts = async (req, res) => {
    try {
        const contacts = await Contact.find({ usuarioId: req.user.uid }).sort({ alias: 1 });
        res.status(200).json({ status: 'success', data: contacts });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Modifica la información de un destinatario existente.
 * Permite actualizar datos de enrutamiento, números de cuenta o alias.
 */
export const updateContact = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedContact = await Contact.findOneAndUpdate(
            { _id: id, usuarioId: req.user.uid },
            req.body,
            { new: true }
        );
        
        if (!updatedContact) {
            return res.status(404).json({ status: 'error', message: 'Contacto no encontrado.' });
        }
        res.status(200).json({ status: 'success', data: updatedContact });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Elimina un destinatario de la libreta de contactos del usuario.
 * Aplica verificación de pertenencia mediante el ID de usuario del token.
 */
export const deleteContact = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedContact = await Contact.findOneAndDelete({ _id: id, usuarioId: req.user.uid });
        
        if (!deletedContact) {
            return res.status(404).json({ status: 'error', message: 'Contacto no encontrado.' });
        }
        res.status(200).json({ status: 'success', message: 'Contacto eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};