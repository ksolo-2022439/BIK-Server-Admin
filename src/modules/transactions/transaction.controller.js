import mongoose from 'mongoose';
import Decimal from 'decimal.js';
import Transaction from './transaction.model.js';
import Account from '../accounts/account.model.js';
import User from '../users/user.model.js';
import Currency from '../currency/currency.model.js';

/**
 * Ejecuta una transferencia interna entre cuentas de Banco Informático Kinal.
 * Usa transacciones MongoDB para garantizar atomicidad.
 * Verifica propiedad de cuenta, fondos disponibles y límites diarios.
 */
export const executeInternalTransfer = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { cuentaOrigenId, cuentaDestinoId, monto, descripcion, monedaTransferencia } = req.body;

        // FIN-028: Validación de monto
        if (!monto || typeof monto !== 'number' || monto <= 0 || monto > 999999999) {
            throw new Error('El monto debe ser un número positivo válido.');
        }

        const cuentaOrigen = await Account.findByAnyId(cuentaOrigenId).session(session);
        
        let cuentaDestino;
        if (cuentaDestinoId && cuentaDestinoId.length > 20) {
            cuentaDestino = await Account.findByAnyId(cuentaDestinoId).session(session);
        } else {
            cuentaDestino = await Account.findOne({ numeroCuenta: cuentaDestinoId }).session(session);
        }

        if (!cuentaOrigen || !cuentaDestino) {
            throw new Error('Cuenta de origen o destino no encontrada.');
        }

        // SEC-008: Verificar propiedad de la cuenta origen
        const user = await User.findByAnyId(req.user.uid).session(session);
        if (!user || cuentaOrigen.usuarioId.toString() !== user._id.toString()) {
            throw new Error('No tienes permiso para operar con esta cuenta.');
        }

        if (cuentaOrigen._id.toString() === cuentaDestino._id.toString()) {
            throw new Error('No puedes transferir a la misma cuenta.');
        }

        if (cuentaOrigen.estado !== 'Activa' || cuentaDestino.estado !== 'Activa') {
            throw new Error('Ambas cuentas deben estar activas para realizar la transferencia.');
        }

        const monedaEnvio = monedaTransferencia || cuentaOrigen.moneda || 'GTQ';

        let montoAcreditar = monto;
        let montoDebitar = monto;
        let tasaCambioUsada = null;
        let descripcionFinal = descripcion;

        if (cuentaOrigen.moneda !== cuentaDestino.moneda) {
            const rate = await Currency.findOne({ monedaBase: 'USD', monedaDestino: 'GTQ' }).session(session);
            if (!rate) throw new Error('No hay tasa de cambio disponible.');

            const decMonto = new Decimal(monto);
            const decTasaVenta = new Decimal(rate.tasaVenta);
            const decTasaCompra = new Decimal(rate.tasaCompra);

            if (cuentaOrigen.moneda === 'GTQ' && cuentaDestino.moneda === 'USD') {
                if (monedaEnvio === 'GTQ') {
                    montoAcreditar = Number(decMonto.div(decTasaVenta).toFixed(2));
                    montoDebitar = monto;
                    tasaCambioUsada = rate.tasaVenta;
                    descripcionFinal = `${descripcion || 'Transferencia'} [Q${monto.toFixed(2)} → $${montoAcreditar.toFixed(2)} @ TC ${rate.tasaVenta}]`;
                } else if (monedaEnvio === 'USD') {
                    montoAcreditar = monto;
                    montoDebitar = Number(decMonto.mul(decTasaVenta).toFixed(2));
                    tasaCambioUsada = rate.tasaVenta;
                    descripcionFinal = `${descripcion || 'Transferencia'} [$${monto.toFixed(2)} cobrados como Q${montoDebitar.toFixed(2)} @ TC ${rate.tasaVenta}]`;
                }
            } else if (cuentaOrigen.moneda === 'USD' && cuentaDestino.moneda === 'GTQ') {
                if (monedaEnvio === 'USD') {
                    montoAcreditar = Number(decMonto.mul(decTasaCompra).toFixed(2));
                    montoDebitar = monto;
                    tasaCambioUsada = rate.tasaCompra;
                    descripcionFinal = `${descripcion || 'Transferencia'} [$${monto.toFixed(2)} → Q${montoAcreditar.toFixed(2)} @ TC ${rate.tasaCompra}]`;
                } else if (monedaEnvio === 'GTQ') {
                    montoAcreditar = monto;
                    montoDebitar = Number(decMonto.div(decTasaCompra).toFixed(2));
                    tasaCambioUsada = rate.tasaCompra;
                    descripcionFinal = `${descripcion || 'Transferencia'} [Q${monto.toFixed(2)} cobrados como $${montoDebitar.toFixed(2)} @ TC ${rate.tasaCompra}]`;
                }
            }
        }

        if (cuentaOrigen.saldo < montoDebitar) {
            throw new Error('Fondos insuficientes.');
        }

        // FIN-027: Verificar límite diario acumulado
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const transferenciasHoy = await Transaction.aggregate([
            { $match: { cuentaOrigenId: cuentaOrigen._id, createdAt: { $gte: hoy }, estado: 'Completada' } },
            { $group: { _id: null, total: { $sum: '$monto' } } }
        ]).session(session);
        const totalHoy = Number(new Decimal(transferenciasHoy[0]?.total || 0).add(montoDebitar).toFixed(2));
        if (totalHoy > cuentaOrigen.limiteTransferenciaDiario) {
            throw new Error(`El monto supera el límite de transferencia diario. Disponible: ${Number(new Decimal(cuentaOrigen.limiteTransferenciaDiario).sub(transferenciasHoy[0]?.total || 0).toFixed(2))}`);
        }

        cuentaOrigen.saldo = Number(new Decimal(cuentaOrigen.saldo).sub(montoDebitar).toFixed(2));
        cuentaDestino.saldo = Number(new Decimal(cuentaDestino.saldo).add(montoAcreditar).toFixed(2));

        await cuentaOrigen.save({ session });
        await cuentaDestino.save({ session });

        const transaction = new Transaction({
            cuentaOrigenId: cuentaOrigen._id,
            cuentaDestinoId: cuentaDestino._id,
            monto: montoDebitar,
            montoAcreditado: montoAcreditar,
            tasaCambio: tasaCambioUsada || 1,
            tipo: 'Transferencia_Local',
            descripcion: descripcionFinal,
            estado: 'Completada'
        });

        await transaction.save({ session });
        await session.commitTransaction();

        res.status(200).json({ 
            status: 'success', 
            data: transaction,
            ...(tasaCambioUsada && { tasaCambio: tasaCambioUsada, montoAcreditado: montoAcreditar })
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ status: 'error', message: error.message });
    } finally {
        session.endSession();
    }
};

/**
 * Ejecuta una transferencia ACH hacia un banco externo.
 * Usa transacciones MongoDB para garantizar atomicidad.
 */
export const executeACHTransfer = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { cuentaOrigenId, monto, descripcion, achDetails, monedaTransferencia } = req.body;

        if (!monto || typeof monto !== 'number' || monto <= 0) {
            throw new Error('El monto debe ser un número positivo válido.');
        }

        const cuentaOrigen = await Account.findByAnyId(cuentaOrigenId).session(session);

        if (!cuentaOrigen || cuentaOrigen.estado !== 'Activa') {
            throw new Error('Cuenta de origen no válida o inactiva.');
        }

        // SEC-008: Verificar propiedad
        const user = await User.findByAnyId(req.user.uid).session(session);
        if (!user || cuentaOrigen.usuarioId.toString() !== user._id.toString()) {
            throw new Error('No tienes permiso para operar con esta cuenta.');
        }

        const monedaEnvio = monedaTransferencia || 'GTQ';
        let montoDebitar = monto;
        let tasaCambioUsada = null;
        let descripcionFinal = descripcion;

        if (cuentaOrigen.moneda !== monedaEnvio) {
            const rate = await Currency.findOne({ monedaBase: 'USD', monedaDestino: 'GTQ' }).session(session);
            if (!rate) throw new Error('No hay tasa de cambio disponible.');

            const decMonto = new Decimal(monto);
            const decTasaCompra = new Decimal(rate.tasaCompra);
            const decTasaVenta = new Decimal(rate.tasaVenta);

            if (cuentaOrigen.moneda === 'USD' && monedaEnvio === 'GTQ') {
                montoDebitar = Number(decMonto.div(decTasaCompra).toFixed(2));
                tasaCambioUsada = rate.tasaCompra;
                descripcionFinal = `${descripcion || 'Transferencia ACH'} [Q${monto.toFixed(2)} cobrados como $${montoDebitar.toFixed(2)} @ TC ${rate.tasaCompra}]`;
            } else if (cuentaOrigen.moneda === 'GTQ' && monedaEnvio === 'USD') {
                montoDebitar = Number(decMonto.mul(decTasaVenta).toFixed(2));
                tasaCambioUsada = rate.tasaVenta;
                descripcionFinal = `${descripcion || 'Transferencia ACH'} [$${monto.toFixed(2)} cobrados como Q${montoDebitar.toFixed(2)} @ TC ${rate.tasaVenta}]`;
            }
        }

        if (cuentaOrigen.saldo < montoDebitar) {
            throw new Error('Fondos insuficientes.');
        }

        cuentaOrigen.saldo = Number(new Decimal(cuentaOrigen.saldo).sub(montoDebitar).toFixed(2));
        await cuentaOrigen.save({ session });

        const transaction = new Transaction({
            cuentaOrigenId: cuentaOrigen._id,
            cuentaDestinoId: null,
            monto: montoDebitar,
            montoAcreditado: monto,
            tasaCambio: tasaCambioUsada || 1,
            tipo: 'Transferencia_ACH',
            descripcion: descripcionFinal,
            achDetails,
            estado: 'En_Proceso'
        });

        await transaction.save({ session });
        await session.commitTransaction();

        res.status(200).json({ 
            status: 'success', 
            data: transaction,
            ...(tasaCambioUsada && { tasaCambio: tasaCambioUsada, montoEnviado: monto, monedaEnviada: monedaEnvio })
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ status: 'error', message: error.message });
    } finally {
        session.endSession();
    }
};

/**
 * Procesa un depósito en efectivo realizado por un administrador en ventanilla.
 * Usa transacciones MongoDB para garantizar atomicidad.
 */
export const executeCashDeposit = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { cuentaDestinoId, monto, descripcion, monedaDeposito } = req.body;
        const referenciaCajero = req.user.uid;

        if (!monto || typeof monto !== 'number' || monto <= 0) {
            throw new Error('El monto debe ser un número positivo válido.');
        }

        const cuentaDestino = await Account.findByAnyId(cuentaDestinoId).session(session);

        if (!cuentaDestino || cuentaDestino.estado !== 'Activa') {
            throw new Error('Cuenta de destino no válida o inactiva.');
        }

        let montoAcreditar = monto;
        let tasaCambioUsada = null;
        let descripcionFinal = descripcion || 'Depósito en efectivo en ventanilla';

        const monedaRecibida = monedaDeposito || cuentaDestino.moneda || 'GTQ';

        if (monedaRecibida !== cuentaDestino.moneda) {
            const rate = await Currency.findOne({ monedaBase: 'USD', monedaDestino: 'GTQ' }).session(session);
            if (!rate) throw new Error('No hay tasa de cambio disponible para realizar la conversión.');

            const decMonto = new Decimal(monto);
            const decTasaVenta = new Decimal(rate.tasaVenta);
            const decTasaCompra = new Decimal(rate.tasaCompra);

            if (monedaRecibida === 'GTQ' && cuentaDestino.moneda === 'USD') {
                montoAcreditar = Number(decMonto.div(decTasaVenta).toFixed(2));
                tasaCambioUsada = rate.tasaVenta;
                descripcionFinal = `${descripcionFinal} [Q${monto.toFixed(2)} → $${montoAcreditar.toFixed(2)} @ TC ${rate.tasaVenta}]`;
            } else if (monedaRecibida === 'USD' && cuentaDestino.moneda === 'GTQ') {
                montoAcreditar = Number(decMonto.mul(decTasaCompra).toFixed(2));
                tasaCambioUsada = rate.tasaCompra;
                descripcionFinal = `${descripcionFinal} [$${monto.toFixed(2)} → Q${montoAcreditar.toFixed(2)} @ TC ${rate.tasaCompra}]`;
            }
        }

        cuentaDestino.saldo = Number(new Decimal(cuentaDestino.saldo).add(montoAcreditar).toFixed(2));
        await cuentaDestino.save({ session });

        const transaction = new Transaction({
            cuentaOrigenId: null,
            cuentaDestinoId: cuentaDestino._id,
            monto: monto, // Guardamos el monto original recibido en ventanilla
            montoAcreditado: montoAcreditar,
            tasaCambio: tasaCambioUsada || 1,
            tipo: 'Deposito_Efectivo',
            descripcion: descripcionFinal,
            estado: 'Completada',
            referenciaCajero
        });

        await transaction.save({ session });
        await session.commitTransaction();

        res.status(200).json({ 
            status: 'success', 
            data: transaction,
            montoRecibido: monto,
            monedaRecibida,
            montoAcreditado: montoAcreditar,
            monedaCuenta: cuentaDestino.moneda,
            ...(tasaCambioUsada && { tasaCambio: tasaCambioUsada })
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ status: 'error', message: error.message });
    } finally {
        session.endSession();
    }
};

/**
 * Ejecuta una transferencia utilizando el número telefónico como identificador.
 * Usa transacciones MongoDB para garantizar atomicidad.
 */
export const executeMobileTransfer = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { monto, telefonoDestino, descripcion, monedaTransferencia } = req.body;

        if (!monto || typeof monto !== 'number' || monto <= 0) {
            throw new Error('El monto debe ser un número positivo válido.');
        }

        const usuarioDestino = await User.findOne({ telefono: telefonoDestino }).session(session);

        if (!usuarioDestino) {
            throw new Error('No existe un usuario vinculado a este número telefónico.');
        }

        // SEC-008: Verificar propiedad - buscar usuario del token
        const userOrigen = await User.findByAnyId(req.user.uid).session(session);
        if (!userOrigen) {
            throw new Error('Usuario no encontrado.');
        }

        const cuentaDestino = await Account.findOne({ usuarioId: usuarioDestino._id, tipo: 'Monetaria' }).session(session);
        const cuentaOrigen = await Account.findOne({ usuarioId: userOrigen._id, tipo: 'Monetaria' }).session(session);

        if (!cuentaOrigen || !cuentaDestino) {
            throw new Error('Error en la vinculación de cuentas para transferencia móvil.');
        }

        if (cuentaOrigen._id.toString() === cuentaDestino._id.toString()) {
            throw new Error('No puedes transferir a tu propia cuenta.');
        }

        const monedaEnvio = monedaTransferencia || cuentaOrigen.moneda || 'GTQ';

        let montoAcreditar = monto;
        let montoDebitar = monto;
        let tasaCambioUsada = null;
        let descripcionFinal = `Transferencia Móvil a ${telefonoDestino}: ${descripcion}`;

        if (cuentaOrigen.moneda !== cuentaDestino.moneda) {
            const rate = await Currency.findOne({ monedaBase: 'USD', monedaDestino: 'GTQ' }).session(session);
            if (!rate) throw new Error('No hay tasa de cambio disponible.');

            const decMonto = new Decimal(monto);
            const decTasaVenta = new Decimal(rate.tasaVenta);
            const decTasaCompra = new Decimal(rate.tasaCompra);

            if (cuentaOrigen.moneda === 'GTQ' && cuentaDestino.moneda === 'USD') {
                if (monedaEnvio === 'GTQ') {
                    montoAcreditar = Number(decMonto.div(decTasaVenta).toFixed(2));
                    montoDebitar = monto;
                    tasaCambioUsada = rate.tasaVenta;
                    descripcionFinal = `${descripcionFinal} [Q${monto.toFixed(2)} → $${montoAcreditar.toFixed(2)} @ TC ${rate.tasaVenta}]`;
                } else if (monedaEnvio === 'USD') {
                    montoAcreditar = monto;
                    montoDebitar = Number(decMonto.mul(decTasaVenta).toFixed(2));
                    tasaCambioUsada = rate.tasaVenta;
                    descripcionFinal = `${descripcionFinal} [$${monto.toFixed(2)} cobrados como Q${montoDebitar.toFixed(2)} @ TC ${rate.tasaVenta}]`;
                }
            } else if (cuentaOrigen.moneda === 'USD' && cuentaDestino.moneda === 'GTQ') {
                if (monedaEnvio === 'USD') {
                    montoAcreditar = Number(decMonto.mul(decTasaCompra).toFixed(2));
                    montoDebitar = monto;
                    tasaCambioUsada = rate.tasaCompra;
                    descripcionFinal = `${descripcionFinal} [$${monto.toFixed(2)} → Q${montoAcreditar.toFixed(2)} @ TC ${rate.tasaCompra}]`;
                } else if (monedaEnvio === 'GTQ') {
                    montoAcreditar = monto;
                    montoDebitar = Number(decMonto.div(decTasaCompra).toFixed(2));
                    tasaCambioUsada = rate.tasaCompra;
                    descripcionFinal = `${descripcionFinal} [Q${monto.toFixed(2)} cobrados como $${montoDebitar.toFixed(2)} @ TC ${rate.tasaCompra}]`;
                }
            }
        }

        if (cuentaOrigen.saldo < montoDebitar) {
            throw new Error('Fondos insuficientes para la transferencia móvil.');
        }

        cuentaOrigen.saldo = Number(new Decimal(cuentaOrigen.saldo).sub(montoDebitar).toFixed(2));
        cuentaDestino.saldo = Number(new Decimal(cuentaDestino.saldo).add(montoAcreditar).toFixed(2));

        await cuentaOrigen.save({ session });
        await cuentaDestino.save({ session });

        const transaction = new Transaction({
            cuentaOrigenId: cuentaOrigen._id,
            cuentaDestinoId: cuentaDestino._id,
            monto: montoDebitar,
            montoAcreditado: montoAcreditar,
            tasaCambio: tasaCambioUsada || 1,
            tipo: 'Transferencia_Movil',
            descripcion: descripcionFinal,
            estado: 'Completada'
        });

        await transaction.save({ session });
        await session.commitTransaction();

        res.status(200).json({ 
            status: 'success', 
            data: transaction,
            ...(tasaCambioUsada && { tasaCambio: tasaCambioUsada, montoAcreditado: montoAcreditar })
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ status: 'error', message: error.message });
    } finally {
        session.endSession();
    }
};

/**
 * Procesa una transferencia internacional simulando la red SWIFT.
 * Usa transacciones MongoDB para garantizar atomicidad.
 */
export const executeInternationalTransfer = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { 
            cuentaOrigenId, 
            monto, 
            descripcion, 
            internationalDetails,
            monedaTransferencia
        } = req.body;

        if (!monto || typeof monto !== 'number' || monto <= 0) {
            throw new Error('El monto debe ser un número positivo válido.');
        }

        if (!internationalDetails || !internationalDetails.swiftBic || !internationalDetails.bancoDestino || !internationalDetails.cuentaIban || !internationalDetails.nombreBeneficiario) {
            throw new Error('Faltan datos obligatorios para la transferencia internacional (SWIFT, Banco, Cuenta o Beneficiario).');
        }

        const cuentaOrigen = await Account.findByAnyId(cuentaOrigenId).session(session);

        if (!cuentaOrigen || cuentaOrigen.estado !== 'Activa') {
            throw new Error('Cuenta de origen no válida o inactiva.');
        }

        // SEC-008: Verificar propiedad
        const user = await User.findByAnyId(req.user.uid).session(session);
        if (!user || cuentaOrigen.usuarioId.toString() !== user._id.toString()) {
            throw new Error('No tienes permiso para operar con esta cuenta.');
        }

        const monedaEnvio = monedaTransferencia || 'USD';
        let montoDebitar = monto;
        let tasaCambioUsada = null;
        let descripcionFinal = descripcion || `Transferencia Internacional a ${internationalDetails.nombreBeneficiario}`;
        
        let comisionUsd = 35;
        let comisionCobrada = comisionUsd;

        if (cuentaOrigen.moneda !== monedaEnvio) {
            const rate = await Currency.findOne({ monedaBase: 'USD', monedaDestino: 'GTQ' }).session(session);
            if (!rate) throw new Error('No hay tasa de cambio disponible.');

            const decMonto = new Decimal(monto);
            const decComisionUsd = new Decimal(comisionUsd);
            const decTasaVenta = new Decimal(rate.tasaVenta);
            const decTasaCompra = new Decimal(rate.tasaCompra);

            if (cuentaOrigen.moneda === 'GTQ' && monedaEnvio === 'USD') {
                montoDebitar = Number(decMonto.mul(decTasaVenta).toFixed(2));
                comisionCobrada = Number(decComisionUsd.mul(decTasaVenta).toFixed(2));
                tasaCambioUsada = rate.tasaVenta;
                descripcionFinal = `${descripcionFinal} [$${monto.toFixed(2)} cobrados como Q${montoDebitar.toFixed(2)} @ TC ${rate.tasaVenta}]`;
            } else if (cuentaOrigen.moneda === 'USD' && monedaEnvio === 'GTQ') {
                montoDebitar = Number(decMonto.div(decTasaCompra).toFixed(2));
                comisionCobrada = comisionUsd;
                tasaCambioUsada = rate.tasaCompra;
                descripcionFinal = `${descripcionFinal} [Q${monto.toFixed(2)} cobrados como $${montoDebitar.toFixed(2)} @ TC ${rate.tasaCompra}]`;
            }
        }

        const montoTotal = Number(new Decimal(montoDebitar).add(comisionCobrada).toFixed(2));

        if (cuentaOrigen.saldo < montoTotal) {
            throw new Error(`Fondos insuficientes para cubrir el monto a enviar y la comisión internacional (${comisionCobrada.toFixed(2)} ${cuentaOrigen.moneda}).`);
        }

        cuentaOrigen.saldo = Number(new Decimal(cuentaOrigen.saldo).sub(montoTotal).toFixed(2));
        await cuentaOrigen.save({ session });

        const transaction = new Transaction({
            cuentaOrigenId: cuentaOrigen._id,
            cuentaDestinoId: null,
            monto: montoDebitar,
            montoAcreditado: monto,
            tasaCambio: tasaCambioUsada || 1,
            tipo: 'Transferencia_Internacional',
            descripcion: descripcionFinal,
            internationalDetails: {
                ...internationalDetails,
                comisionAplicada: comisionCobrada
            },
            estado: 'En_Proceso'
        });

        await transaction.save({ session });
        await session.commitTransaction();

        res.status(200).json({ 
            status: 'success', 
            data: transaction, 
            comisionAplicada: comisionCobrada,
            mensaje: 'Transferencia SWIFT iniciada. Los fondos pueden tardar entre 2 y 5 días hábiles en acreditarse.',
            ...(tasaCambioUsada && { tasaCambio: tasaCambioUsada, montoEnviado: monto, monedaEnviada: monedaEnvio })
        });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ status: 'error', message: error.message });
    } finally {
        session.endSession();
    }
};

/**
 * Genera un desglose analítico de los movimientos financieros del usuario.
 */
export const getPersonalFinances = async (req, res) => {
    try {
        const userId = req.user.uid;
        const user = await User.findByAnyId(userId);
        
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
        }

        const userAccounts = await Account.find({ usuarioId: user._id }).distinct('_id');

        const stats = await Transaction.aggregate([
            { 
                $match: { 
                    $or: [
                        { cuentaOrigenId: { $in: userAccounts } },
                        { cuentaDestinoId: { $in: userAccounts } }
                    ]
                } 
            },
            { $group: {
                _id: "$tipo",
                totalGastado: { $sum: "$monto" },
                conteo: { $sum: 1 }
            }},
            { $sort: { totalGastado: -1 } }
        ]);

        res.status(200).json({ status: 'success', data: stats });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Obtiene el historial de transacciones del usuario autenticado.
 * Permite filtrar por tipo de transacción (ej. 'Remesa') o por ID de cuenta.
 */
export const getUserTransactions = async (req, res) => {
    try {
        const { tipo, accountId, limit = 50 } = req.query;
        const userId = req.user.uid;

        const user = await User.findByAnyId(userId);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
        }

        const userAccounts = await Account.find({ usuarioId: user._id }).distinct('_id');

        const query = {
            $or: [
                { cuentaOrigenId: { $in: userAccounts } },
                { cuentaDestinoId: { $in: userAccounts } }
            ]
        };

        if (tipo) query.tipo = tipo;
        
        if (accountId) {
            const acc = await Account.findByAnyId(accountId);
            if (acc) {
                query.$and = [{ $or: [{ cuentaOrigenId: acc._id }, { cuentaDestinoId: acc._id }] }];
            }
        }

        const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 200);

        const transactions = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .limit(parsedLimit)
            .populate('cuentaOrigenId', 'numeroCuenta tipo moneda')
            .populate('cuentaDestinoId', 'numeroCuenta tipo moneda');

        res.status(200).json({ status: 'success', data: transactions });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Obtiene el historial de una cuenta específica con validación de propiedad.
 */
export const getAccountHistory = async (req, res) => {
    try {
        const { accountId } = req.query;
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 200);

        const account = await Account.findByAnyId(accountId);
        if (!account) {
            return res.status(404).json({ status: 'error', message: 'Cuenta no encontrada.' });
        }

        const user = await User.findByAnyId(req.user.uid);
        if (!user || account.usuarioId.toString() !== user._id.toString()) {
            return res.status(403).json({ status: 'error', message: 'No tienes permiso para ver esta cuenta.' });
        }

        const transactions = await Transaction.find({
            $or: [{ cuentaOrigenId: account._id }, { cuentaDestinoId: account._id }]
        })
        .populate('cuentaOrigenId cuentaDestinoId')
        .sort({ createdAt: -1 })
        .limit(limit);

        res.status(200).json({ status: 'success', data: transactions });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
