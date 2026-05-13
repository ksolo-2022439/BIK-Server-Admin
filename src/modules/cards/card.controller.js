import Card from './card.model.js';
import Account from '../accounts/account.model.js';

/**
 * Genera una nueva tarjeta de débito o crédito para un usuario.
 * Asigna automáticamente una fecha de expiración a 5 años y genera el código CVV.
 */
export const requestCard = async (req, res) => {
    try {
        const { usuarioId, cuentaVinculadaId, tipo, limiteCredito } = req.body;
        
        if (tipo !== 'Credito') {
            const cuenta = await Account.findById(cuentaVinculadaId);
            if (!cuenta) {
                return res.status(404).json({ status: 'error', message: 'Cuenta vinculada no encontrada.' });
            }
        }

        const numeroTarjeta = '4' + Math.floor(Math.random() * 1000000000000000).toString().padStart(15, '0');
        const cvv = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const fechaActual = new Date();
        const fechaExpiracion = `${String(fechaActual.getMonth() + 1).padStart(2, '0')}/${String(fechaActual.getFullYear() + 5).slice(2)}`;

        const newCard = new Card({
            numeroTarjeta,
            usuarioId,
            cuentaVinculadaId,
            tipo,
            limiteCredito: tipo === 'Credito' ? limiteCredito : 0,
            cvv,
            fechaExpiracion
        });

        await newCard.save();
        res.status(201).json({ status: 'success', data: newCard });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Alterna el estado de bloqueo de una tarjeta específica.
 * Previene el uso de la tarjeta en transacciones futuras si el estado de bloqueo es activado.
 */
export const toggleCardFreeze = async (req, res) => {
    try {
        const { id } = req.params;
        const card = await Card.findById(id);
        
        if (!card) {
            return res.status(404).json({ status: 'error', message: 'Tarjeta no encontrada.' });
        }

        card.configuraciones.bloqueada = !card.configuraciones.bloqueada;
        await card.save();

        res.status(200).json({ status: 'success', data: card });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Actualiza configuraciones generales de la tarjeta (Bloqueo, Compras Internacionales, etc.)
 */
export const updateCardConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const { configuraciones } = req.body;

        const updatedCard = await Card.findByIdAndUpdate(
            id, 
            { configuraciones }, 
            { new: true }
        );

        if (!updatedCard) {
            return res.status(404).json({ status: 'error', message: 'Tarjeta no encontrada.' });
        }

        res.status(200).json({ status: 'success', data: updatedCard });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Obtiene el listado completo de tarjetas asociadas a un identificador de usuario.
 */
export const getUserCards = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const cards = await Card.find({ usuarioId });
        res.status(200).json({ status: 'success', data: cards });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};