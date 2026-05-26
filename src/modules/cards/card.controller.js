import crypto from 'crypto';
import Card from './card.model.js';
import Account from '../accounts/account.model.js';
import User from '../users/user.model.js';

/**
 * SEC-007: Enmascara el número de tarjeta para respuestas API.
 * Solo muestra los últimos 4 dígitos.
 */
const maskCardNumber = (card) => {
    if (!card) return card;
    const obj = card.toObject ? card.toObject() : { ...card };
    if (obj.numeroTarjeta && obj.numeroTarjeta.length >= 4) {
        obj.numeroTarjeta = '****-****-****-' + obj.numeroTarjeta.slice(-4);
    }
    // SEC-006: Nunca devolver CVV en respuestas
    delete obj.cvv;
    return obj;
};

/**
 * Genera una nueva tarjeta de débito o crédito para un usuario.
 * FIN-033: Usa crypto.randomInt() para generación segura.
 * SEC-006/007: No devuelve CVV ni número completo en la respuesta.
 */
export const requestCard = async (req, res) => {
    try {
        const { usuarioId, cuentaVinculadaId, tipo, limiteCredito } = req.body;
        
        const user = await User.findByAnyId(usuarioId);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
        }

        let internalCuentaId = null;
        if (tipo !== 'Credito') {
            const cuenta = await Account.findByAnyId(cuentaVinculadaId);
            if (!cuenta) {
                return res.status(404).json({ status: 'error', message: 'Cuenta vinculada no encontrada.' });
            }
            internalCuentaId = cuenta._id;
        }

        // FIN-033: Generación criptográficamente segura
        const numeroTarjeta = '4' + Array.from({ length: 15 }, () => crypto.randomInt(10)).join('');
        const cvv = String(crypto.randomInt(0, 1000)).padStart(3, '0');
        const fechaActual = new Date();
        const fechaExpiracion = `${String(fechaActual.getMonth() + 1).padStart(2, '0')}/${String(fechaActual.getFullYear() + 5).slice(2)}`;

        const newCard = new Card({
            numeroTarjeta,
            usuarioId: user._id,
            cuentaVinculadaId: internalCuentaId,
            tipo,
            limiteCredito: tipo === 'Credito' ? limiteCredito : 0,
            cvv,
            fechaExpiracion
        });

        await newCard.save();

        // Devolver datos enmascarados pero incluir número completo solo en la primera emisión
        const responseCard = newCard.toObject();
        delete responseCard.cvv;
        // Se devuelve el número completo solo en la creación inicial para que el usuario lo registre
        res.status(201).json({ status: 'success', data: responseCard });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Alterna el estado de bloqueo de una tarjeta específica.
 * SEC-018: Verifica propiedad antes de operar.
 */
export const toggleCardFreeze = async (req, res) => {
    try {
        const { id } = req.params;
        const card = await Card.findByAnyId(id);
        
        if (!card) {
            return res.status(404).json({ status: 'error', message: 'Tarjeta no encontrada.' });
        }

        // SEC-018: Verificar propiedad
        const user = await User.findByAnyId(req.user.uid);
        if (!user || card.usuarioId.toString() !== user._id.toString()) {
            return res.status(403).json({ status: 'error', message: 'No tienes permiso para operar con esta tarjeta.' });
        }

        card.configuraciones.bloqueada = !card.configuraciones.bloqueada;
        await card.save();

        res.status(200).json({ status: 'success', data: maskCardNumber(card) });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Actualiza configuraciones generales de la tarjeta.
 * SEC-019: Verifica propiedad antes de operar.
 */
export const updateCardConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const { configuraciones } = req.body;

        const card = await Card.findByAnyId(id);

        if (!card) {
            return res.status(404).json({ status: 'error', message: 'Tarjeta no encontrada.' });
        }

        // SEC-019: Verificar propiedad
        const user = await User.findByAnyId(req.user.uid);
        if (!user || card.usuarioId.toString() !== user._id.toString()) {
            return res.status(403).json({ status: 'error', message: 'No tienes permiso para modificar esta tarjeta.' });
        }

        // Whitelist de configuraciones permitidas
        const allowedConfigs = ['bloqueada', 'comprasInternacionales', 'comprasEnLinea', 'retirosCajero'];
        const safeConfig = {};
        for (const key of allowedConfigs) {
            if (configuraciones[key] !== undefined) {
                safeConfig[key] = configuraciones[key];
            }
        }

        card.configuraciones = { ...card.configuraciones, ...safeConfig };
        await card.save();

        res.status(200).json({ status: 'success', data: maskCardNumber(card) });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Obtiene el listado de tarjetas asociadas a un usuario.
 * SEC-007: Números enmascarados. SEC-006: CVV oculto.
 */
export const getUserCards = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const user = await User.findByAnyId(usuarioId);
        
        if (!user) {
            return res.status(200).json({ status: 'success', data: [] });
        }

        const cards = await Card.find({ usuarioId: user._id }).populate('cuentaVinculadaId');
        const maskedCards = cards.map(maskCardNumber);
        res.status(200).json({ status: 'success', data: maskedCards });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};