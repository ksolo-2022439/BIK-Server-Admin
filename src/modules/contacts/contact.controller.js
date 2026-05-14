import Contact from './contact.model.js';
import Account from '../accounts/account.model.js';
import User from '../users/user.model.js';

/**
 * Registra un nuevo destinatario en la libreta de contactos del usuario.
 * Vincula el contacto directamente al identificador extraído del token de seguridad.
 */
export const createContact = async (req, res) => {
    try {
        const { numeroCuenta, tipoDestinatario, banco, alias } = req.body;

        if (!alias || !numeroCuenta || !tipoDestinatario) {
            return res.status(400).json({ status: 'error', message: 'Faltan campos obligatorios (alias, número de cuenta, tipo).' });
        }

        // Validación para cuentas internas BIK
        if (tipoDestinatario === 'BIK') {
            const accountExists = await Account.findOne({ numeroCuenta });
            if (!accountExists) {
                return res.status(404).json({ 
                    status: 'error', 
                    message: 'La cuenta BIK destino no existe.' 
                });
            }
            if (accountExists.estado !== 'Activa') {
                return res.status(400).json({ 
                    status: 'error', 
                    message: `La cuenta BIK está en estado '${accountExists.estado}' y no puede ser agregada como contacto.` 
                });
            }
        }

        // Validación para transferencias ACH (Otros Bancos)
        if (tipoDestinatario === 'ACH') {
            if (numeroCuenta.length < 6) {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'El número de cuenta de otro banco debe tener al menos 6 dígitos.' 
                });
            }
            if (!banco || banco === 'BIK') {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'Debe seleccionar un banco destino válido para cuentas ACH.' 
                });
            }
        }

        const user = await User.findByAnyId(req.user.uid);
        if (!user) {
            return res.status(401).json({ status: 'error', message: 'Sesión inválida o usuario no encontrado.' });
        }

        const newContact = new Contact({
            ...req.body,
            usuarioId: user._id
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
        const user = await User.findByAnyId(req.user.uid);
        if (!user) throw new Error('Usuario no encontrado.');

        const contacts = await Contact.find({ usuarioId: user._id }).sort({ alias: 1 });
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
        const user = await User.findByAnyId(req.user.uid);
        if (!user) throw new Error('Usuario no encontrado.');

        const updatedContact = await Contact.findOneAndUpdate(
            { _id: id, usuarioId: user._id },
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
        const user = await User.findByAnyId(req.user.uid);
        if (!user) throw new Error('Usuario no encontrado.');

        const deletedContact = await Contact.findOneAndDelete({ _id: id, usuarioId: user._id });
        
        if (!deletedContact) {
            return res.status(404).json({ status: 'error', message: 'Contacto no encontrado.' });
        }
        res.status(200).json({ status: 'success', message: 'Contacto eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};