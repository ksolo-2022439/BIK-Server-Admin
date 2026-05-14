import Request from './request.model.js';
import Card from '../cards/card.model.js';
import Account from '../accounts/account.model.js';

/**
 * Crea una nueva gestión en línea vinculada al usuario autenticado.
 */
export const createRequest = async (req, res) => {
    try {
        let cuentaId = null;
        if (req.body.cuentaVinculadaId) {
            const cuenta = await Account.findOne({ publicId: req.body.cuentaVinculadaId });
            if (cuenta) cuentaId = cuenta._id;
        }

        const newRequest = new Request({
            ...req.body,
            cuentaVinculadaId: cuentaId,
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
        const request = await Request.findById(req.params.id);
        
        if (!request) {
            return res.status(404).json({ status: 'error', message: 'Gestión no encontrada.' });
        }

        const oldEstado = request.estado;
        request.estado = estado;
        if (estado === 'Aprobada' || estado === 'Rechazada') {
            request.fechaResolucion = new Date();
        }
        
        request.notas.push({
            autor: req.user.uid,
            texto: comentario || `Estado actualizado a ${estado}`,
            fecha: new Date()
        });

        // Lógica de automatización al aprobar (Solo si cambia a Aprobada)
        if (estado === 'Aprobada' && oldEstado !== 'Aprobada') {
            const { tipoGestion, usuarioId, montoSolicitado, descripcion, cuentaVinculadaId } = request;

            // Creación automática de Cuenta Digital
            if (tipoGestion.includes('Nueva Cuenta') || tipoGestion.includes('Cuenta Digital')) {
                const isUSD = descripcion.toUpperCase().includes('USD') || descripcion.toUpperCase().includes('DOLARES');
                const isAhorro = descripcion.toUpperCase().includes('AHORRO');
                
                // Generar un número de cuenta aleatorio de 10 dígitos
                const numCuenta = Math.floor(Math.random() * 9000000000) + 1000000000;
                
                await Account.create({ 
                    usuarioId, 
                    numeroCuenta: numCuenta.toString(),
                    tipo: isAhorro ? 'Ahorro' : 'Monetaria', 
                    moneda: isUSD ? 'USD' : 'GTQ',
                    estado: 'Activa' 
                });
            }
            else if (tipoGestion.includes('Tarjeta de Crédito')) {
                await generateCard(usuarioId, null, 'Credito', montoSolicitado || 5000);
            } else if (tipoGestion.includes('Tarjeta de Débito')) {
                // Usar la cuenta vinculada si existe, sino buscar la primera activa
                let cuenta = cuentaVinculadaId ? await Account.findById(cuentaVinculadaId) : await Account.findOne({ usuarioId, estado: 'Activa' });
                if (cuenta) {
                    await generateCard(usuarioId, cuenta._id, 'Debito Fisica', 0, cuenta.tipo);
                }
            }
        }

        await request.save();
        res.status(200).json({ status: 'success', data: request });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Función interna para generar tarjetas con lógica de marca (Visa/Mastercard).
 */
const generateCard = async (usuarioId, cuentaVinculadaId, tipo, limiteCredito = 0, tipoCuenta = '') => {
    let primerDigito = '4'; // Visa por defecto
    if (tipo.includes('Debito') && (tipoCuenta === 'Ahorro' || tipoCuenta.toLowerCase().includes('ahorro'))) {
        primerDigito = '5'; // Mastercard para Ahorro
    }
    
    const numeroTarjeta = primerDigito + Math.floor(Math.random() * 1000000000000000).toString().padStart(15, '0');
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

    return await newCard.save();
};