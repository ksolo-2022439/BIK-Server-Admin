import User from '../users/user.model.js';
import Account from '../accounts/account.model.js';
import Card from '../cards/card.model.js';
import Transaction from '../transactions/transaction.model.js';
import Request from '../requests/request.model.js';
import mongoose from 'mongoose';
import Decimal from 'decimal.js';

/**
 * Escapa caracteres especiales de regex para prevenir ReDoS (SEC-014).
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Obtiene estadísticas generales del sistema para el dashboard administrativo.
 * Los datos se adaptan según el rol del usuario autenticado.
 */
export const getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsuarios,
            usuariosActivos,
            usuariosPendientes,
            totalCuentas,
            cuentasActivas,
            gestionesPendientes,
            gestionesEnProceso,
            transaccionesHoy
        ] = await Promise.all([
            User.countDocuments({ rol: 'Cliente' }),
            User.countDocuments({ rol: 'Cliente', estado: 'Activo' }),
            User.countDocuments({ rol: 'Cliente', estado: 'En Verificacion' }),
            Account.countDocuments(),
            Account.countDocuments({ estado: 'Activa' }),
            Request.countDocuments({ estado: 'Pendiente' }),
            Request.countDocuments({ estado: 'En_Proceso' }),
            Transaction.countDocuments({
                createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
            })
        ]);

        // Calcular volumen de transacciones del día
        const volumenHoy = await Transaction.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                    estado: 'Completada'
                }
            },
            { $group: { _id: null, total: { $sum: '$monto' } } }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                totalUsuarios,
                usuariosActivos,
                usuariosPendientes,
                totalCuentas,
                cuentasActivas,
                gestionesPendientes,
                gestionesEnProceso,
                transaccionesHoy,
                volumenTransaccionesHoy: volumenHoy[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Lista todos los usuarios con paginación y filtros opcionales.
 * Soporta búsqueda por nombre, estado y rol.
 */
export const listUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, estado, rol } = req.query;
        const query = {};

        if (search) {
            const safeSearch = escapeRegex(search);
            query.$or = [
                { nombres: { $regex: safeSearch, $options: 'i' } },
                { apellidos: { $regex: safeSearch, $options: 'i' } },
                { dpi: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } },
                { telefono: { $regex: safeSearch, $options: 'i' } }
            ];
        }
        if (estado) query.estado = estado;
        if (rol) query.rol = rol;

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-passwordHash')
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.status(200).json({
            status: 'success',
            data: users,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Obtiene el perfil completo de un cliente incluyendo sus cuentas, tarjetas y transacciones recientes.
 */
export const getFullClientProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByAnyId(id).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
        }

        // Usamos user._id (ObjectId) para las consultas en otras colecciones
        // DB-039: Obtener cuentas una sola vez para evitar consultas N+1
        const accounts = await Account.find({ usuarioId: user._id });
        const accountIds = accounts.map(a => a._id);

        const [cards, recentTransactions] = await Promise.all([
            Card.find({ usuarioId: user._id }),
            Transaction.find({
                $or: [
                    { cuentaOrigenId: { $in: accountIds } },
                    { cuentaDestinoId: { $in: accountIds } }
                ]
            }).sort({ createdAt: -1 }).limit(20)
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                user,
                accounts,
                cards,
                recentTransactions
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Lista TODAS las gestiones del sistema con filtros y paginación.
 * A diferencia del endpoint de usuario que solo muestra las propias.
 */
export const listAllRequests = async (req, res) => {
    try {
        const { page = 1, limit = 20, estado, tipoGestion, prioridad } = req.query;
        const query = {};

        if (estado) query.estado = estado;
        if (tipoGestion) query.tipoGestion = tipoGestion;
        if (prioridad) query.prioridad = prioridad;

        const total = await Request.countDocuments(query);
        const requests = await Request.find(query)
            .populate('usuarioId', 'nombres apellidos dpi email telefono')
            .sort({ fechaSolicitud: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.status(200).json({
            status: 'success',
            data: requests,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Obtiene el detalle de una gestión específica por su ID.
 */
export const getRequestById = async (req, res) => {
    try {
        const { id } = req.params;

        // Búsqueda por publicId/ObjectId (UUID/String)
        const request = await Request.findByAnyId(id)
            .populate('usuarioId', 'nombres apellidos dpi email telefono publicId');

        if (!request) {
            return res.status(404).json({ status: 'error', message: 'Gestión no encontrada.' });
        }

        res.status(200).json({ status: 'success', data: request });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};


/**
 * Escalar una gestión asignándole prioridad alta.
 * Exclusivo para Soporte Remoto.
 */
export const escalateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { prioridad, comentario } = req.body;

        const request = await Request.findByAnyId(id);
        if (!request) {
            return res.status(404).json({ status: 'error', message: 'Gestión no encontrada.' });
        }

        request.prioridad = prioridad || 'Alta';
        request.estado = 'En_Proceso';
        request.notas.push({
            autor: req.user.uid,
            texto: comentario || 'Gestión escalada por Soporte',
            fecha: new Date()
        });

        await request.save();

        const updatedRequest = await Request.findById(request._id).populate('usuarioId', 'nombres apellidos dpi');

        res.status(200).json({ status: 'success', data: updatedRequest });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Retiro de fondos en ventanilla.
 * Solo disponible para Cajeros. Requiere cuenta origen y monto.
 */
export const executeWithdrawal = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { cuentaOrigenId, monto, descripcion } = req.body;
        const referenciaCajero = req.user.uid;

        if (!monto || typeof monto !== 'number' || monto <= 0) {
            throw new Error('El monto debe ser mayor a cero.');
        }

        const cuenta = await Account.findByAnyId(cuentaOrigenId).session(session);

        if (!cuenta || cuenta.estado !== 'Activa') {
            throw new Error('Cuenta no válida o inactiva.');
        }

        if (cuenta.saldo < monto) {
            throw new Error('Fondos insuficientes para el retiro.');
        }

        cuenta.saldo = Number(new Decimal(cuenta.saldo).sub(monto).toFixed(2));
        await cuenta.save({ session });

        const transaction = new Transaction({
            cuentaOrigenId: cuenta._id,
            cuentaDestinoId: null,
            monto,
            tipo: 'Retiro',
            descripcion: descripcion || 'Retiro en ventanilla',
            estado: 'Completada',
            referenciaCajero
        });

        await transaction.save({ session });
        await session.commitTransaction();

        res.status(200).json({ status: 'success', data: transaction });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ status: 'error', message: error.message });
    } finally {
        session.endSession();
    }
};

/**
 * Genera un estado de cuenta para una cuenta específica.
 * Devuelve información de la cuenta y las transacciones del período.
 */
export const getAccountStatement = async (req, res) => {
    try {
        const { id } = req.params;
        const { desde, hasta } = req.query;

        const account = await Account.findByAnyId(id).populate('usuarioId', 'nombres apellidos dpi email telefono direccion publicId');
        if (!account) {
            return res.status(404).json({ status: 'error', message: 'Cuenta no encontrada.' });
        }

        const dateFilter = {};
        if (desde) dateFilter.$gte = new Date(desde);
        if (hasta) dateFilter.$lte = new Date(hasta);

        const transactionQuery = {
            $or: [
                { cuentaOrigenId: account._id },
                { cuentaDestinoId: account._id }
            ]
        };

        if (Object.keys(dateFilter).length > 0) {
            transactionQuery.createdAt = dateFilter;
        }

        const transactions = await Transaction.find(transactionQuery)
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json({
            status: 'success',
            data: {
                cuenta: account,
                transacciones: transactions,
                periodo: {
                    desde: desde || 'Todo el historial',
                    hasta: hasta || new Date().toISOString()
                }
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Busca una cuenta por su número y devuelve la info de la cuenta + propietario.
 * Usado por ventanilla para verificar la cuenta destino/origen antes de operar.
 */
export const findAccountByNumber = async (req, res) => {
    try {
        const { numeroCuenta } = req.params;
        const account = await Account.findOne({ numeroCuenta })
            .populate('usuarioId', 'nombres apellidos dpi email telefono');

        if (!account) {
            return res.status(404).json({ status: 'error', message: 'Cuenta no encontrada.' });
        }

        res.status(200).json({ status: 'success', data: account });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Obtiene el detalle completo de una cuenta específica:
 * datos de la cuenta, propietario, tarjetas vinculadas y últimas transacciones.
 */
export const getAccountDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const account = await Account.findByAnyId(id)
            .populate('usuarioId', 'nombres apellidos dpi email telefono direccion ingresosMensuales estado publicId');

        if (!account) {
            return res.status(404).json({ status: 'error', message: 'Cuenta no encontrada.' });
        }

        // Importante: Para las tarjetas usamos el id (publicId) si la relación es por publicId, 
        // pero Card.cuentaVinculadaId es un ObjectId en el modelo.
        const [cards, recentTransactions] = await Promise.all([
            Card.find({ cuentaVinculadaId: account._id }),
            Transaction.find({
                $or: [
                    { cuentaOrigenId: account._id },
                    { cuentaDestinoId: account._id }
                ]
            }).sort({ createdAt: -1 }).limit(20)
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                account,
                owner: account.usuarioId,
                cards,
                recentTransactions
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Lista todas las cuentas bancarias del sistema con paginación.
 */
export const listAllAccounts = async (req, res) => {
    try {
        const { page = 1, limit = 20, estado, tipo } = req.query;
        const query = {};

        if (estado) query.estado = estado;
        if (tipo) query.tipo = tipo;

        const total = await Account.countDocuments(query);
        const accounts = await Account.find(query)
            .populate('usuarioId', 'nombres apellidos dpi email')
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.status(200).json({
            status: 'success',
            data: accounts,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};


/**
 * Lista todas las transacciones del sistema con filtros.
 */
export const listAllTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 20, tipo, estado, desde, hasta } = req.query;
        const query = {};

        if (tipo) query.tipo = tipo;
        if (estado) query.estado = estado;
        if (desde || hasta) {
            query.createdAt = {};
            if (desde) query.createdAt.$gte = new Date(desde);
            if (hasta) query.createdAt.$lte = new Date(hasta);
        }

        const total = await Transaction.countDocuments(query);
        const transactions = await Transaction.find(query)
            .populate('cuentaOrigenId', 'numeroCuenta tipo')
            .populate('cuentaDestinoId', 'numeroCuenta tipo')
            .populate('referenciaCajero', 'nombres apellidos')
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.status(200).json({
            status: 'success',
            data: transactions,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
