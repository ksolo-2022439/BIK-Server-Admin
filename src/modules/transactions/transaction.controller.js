import mongoose from 'mongoose';
import Transaction from './transaction.model.js';
import Account from '../accounts/account.model.js';
import User from '../users/user.model.js';
import Currency from '../currency/currency.model.js';

/**
 * Ejecuta una transferencia interna entre cuentas de Banco Informático Kinal.
 * Verifica fondos disponibles, límites diarios y actualiza los saldos.
 */
export const executeInternalTransfer = async (req, res) => {
    try {
        const { cuentaOrigenId, cuentaDestinoId, monto, descripcion, monedaTransferencia } = req.body;

        const cuentaOrigen = await Account.findOne({ publicId: cuentaOrigenId });
        
        // Soporte para buscar cuenta destino por publicId (UUID) o por número de cuenta (String)
        let cuentaDestino;
        if (cuentaDestinoId && cuentaDestinoId.length > 20) {
            cuentaDestino = await Account.findOne({ publicId: cuentaDestinoId });
        } else {
            cuentaDestino = await Account.findOne({ numeroCuenta: cuentaDestinoId });
        }

        if (!cuentaOrigen || !cuentaDestino) {
            throw new Error('Cuenta de origen o destino no encontrada.');
        }

        if (cuentaOrigen.estado !== 'Activa' || cuentaDestino.estado !== 'Activa') {
            throw new Error('Ambas cuentas deben estar activas para realizar la transferencia.');
        }

        const monedaEnvio = monedaTransferencia || cuentaOrigen.moneda || 'GTQ';

        // Manejo de conversión entre monedas diferentes
        let montoAcreditar = monto;
        let montoDebitar = monto;
        let tasaCambioUsada = null;
        let descripcionFinal = descripcion;

        if (cuentaOrigen.moneda !== cuentaDestino.moneda) {
            const rate = await Currency.findOne({ monedaBase: 'USD', monedaDestino: 'GTQ' });
            if (!rate) throw new Error('No hay tasa de cambio disponible.');

            if (cuentaOrigen.moneda === 'GTQ' && cuentaDestino.moneda === 'USD') {
                if (monedaEnvio === 'GTQ') {
                    montoAcreditar = monto / rate.tasaVenta;
                    montoDebitar = monto;
                    tasaCambioUsada = rate.tasaVenta;
                    descripcionFinal = `${descripcion || 'Transferencia'} [Q${monto.toFixed(2)} → $${montoAcreditar.toFixed(2)} @ TC ${rate.tasaVenta}]`;
                } else if (monedaEnvio === 'USD') {
                    montoAcreditar = monto;
                    montoDebitar = monto * rate.tasaVenta;
                    tasaCambioUsada = rate.tasaVenta;
                    descripcionFinal = `${descripcion || 'Transferencia'} [$${monto.toFixed(2)} cobrados como Q${montoDebitar.toFixed(2)} @ TC ${rate.tasaVenta}]`;
                }
            } else if (cuentaOrigen.moneda === 'USD' && cuentaDestino.moneda === 'GTQ') {
                if (monedaEnvio === 'USD') {
                    montoAcreditar = monto * rate.tasaCompra;
                    montoDebitar = monto;
                    tasaCambioUsada = rate.tasaCompra;
                    descripcionFinal = `${descripcion || 'Transferencia'} [$${monto.toFixed(2)} → Q${montoAcreditar.toFixed(2)} @ TC ${rate.tasaCompra}]`;
                } else if (monedaEnvio === 'GTQ') {
                    montoAcreditar = monto;
                    montoDebitar = monto / rate.tasaCompra;
                    tasaCambioUsada = rate.tasaCompra;
                    descripcionFinal = `${descripcion || 'Transferencia'} [Q${monto.toFixed(2)} cobrados como $${montoDebitar.toFixed(2)} @ TC ${rate.tasaCompra}]`;
                }
            }
        }

        if (cuentaOrigen.saldo < montoDebitar) {
            throw new Error('Fondos insuficientes.');
        }

        if (montoDebitar > cuentaOrigen.limiteTransferenciaDiario) {
            throw new Error('El monto supera el límite de transferencia diario.');
        }

        cuentaOrigen.saldo -= montoDebitar;
        cuentaDestino.saldo += montoAcreditar;

        await cuentaOrigen.save();
        await cuentaDestino.save();

        const transaction = new Transaction({
            cuentaOrigenId: cuentaOrigen._id,
            cuentaDestinoId: cuentaDestino._id,
            monto: montoDebitar,
            tipo: 'Transferencia_Local',
            descripcion: descripcionFinal,
            estado: 'Completada'
        });

        await transaction.save();

        res.status(200).json({ 
            status: 'success', 
            data: transaction,
            ...(tasaCambioUsada && { tasaCambio: tasaCambioUsada, montoAcreditado: montoAcreditar })
        });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * Ejecuta una transferencia ACH hacia un banco externo.
 */
export const executeACHTransfer = async (req, res) => {
    try {
        const { cuentaOrigenId, monto, descripcion, achDetails, monedaTransferencia } = req.body;

        const cuentaOrigen = await Account.findOne({ publicId: cuentaOrigenId });

        if (!cuentaOrigen || cuentaOrigen.estado !== 'Activa') {
            throw new Error('Cuenta de origen no válida o inactiva.');
        }

        const monedaEnvio = monedaTransferencia || 'GTQ';
        let montoDebitar = monto;
        let tasaCambioUsada = null;
        let descripcionFinal = descripcion;

        if (cuentaOrigen.moneda !== monedaEnvio) {
            const rate = await Currency.findOne({ monedaBase: 'USD', monedaDestino: 'GTQ' });
            if (!rate) throw new Error('No hay tasa de cambio disponible.');

            if (cuentaOrigen.moneda === 'USD' && monedaEnvio === 'GTQ') {
                montoDebitar = monto / rate.tasaCompra;
                tasaCambioUsada = rate.tasaCompra;
                descripcionFinal = `${descripcion || 'Transferencia ACH'} [Q${monto.toFixed(2)} cobrados como $${montoDebitar.toFixed(2)} @ TC ${rate.tasaCompra}]`;
            } else if (cuentaOrigen.moneda === 'GTQ' && monedaEnvio === 'USD') {
                montoDebitar = monto * rate.tasaVenta;
                tasaCambioUsada = rate.tasaVenta;
                descripcionFinal = `${descripcion || 'Transferencia ACH'} [$${monto.toFixed(2)} cobrados como Q${montoDebitar.toFixed(2)} @ TC ${rate.tasaVenta}]`;
            }
        }

        if (cuentaOrigen.saldo < montoDebitar) {
            throw new Error('Fondos insuficientes.');
        }

        cuentaOrigen.saldo -= montoDebitar;
        await cuentaOrigen.save();

        const transaction = new Transaction({
            cuentaOrigenId: cuentaOrigen._id,
            cuentaDestinoId: null,
            monto: montoDebitar,
            tipo: 'Transferencia_ACH',
            descripcion: descripcionFinal,
            achDetails,
            estado: 'En_Proceso'
        });

        await transaction.save();

        res.status(200).json({ 
            status: 'success', 
            data: transaction,
            ...(tasaCambioUsada && { tasaCambio: tasaCambioUsada, montoEnviado: monto, monedaEnviada: monedaEnvio })
        });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * Procesa un depósito en efectivo realizado por un administrador en ventanilla.
 */
export const executeCashDeposit = async (req, res) => {
    try {
        const { cuentaDestinoId, monto, descripcion, monedaDeposito } = req.body;
        const referenciaCajero = req.user.uid;

        const cuentaDestino = await Account.findOne({ publicId: cuentaDestinoId });

        if (!cuentaDestino || cuentaDestino.estado !== 'Activa') {
            throw new Error('Cuenta de destino no válida o inactiva.');
        }

        let montoAcreditar = monto;
        let tasaCambioUsada = null;
        let descripcionFinal = descripcion || 'Depósito en efectivo en ventanilla';

        const monedaRecibida = monedaDeposito || cuentaDestino.moneda || 'GTQ';

        if (monedaRecibida !== cuentaDestino.moneda) {
            const rate = await Currency.findOne({ monedaBase: 'USD', monedaDestino: 'GTQ' });
            if (!rate) throw new Error('No hay tasa de cambio disponible para realizar la conversión.');

            if (monedaRecibida === 'GTQ' && cuentaDestino.moneda === 'USD') {
                montoAcreditar = monto / rate.tasaVenta;
                tasaCambioUsada = rate.tasaVenta;
                descripcionFinal = `${descripcionFinal} [Q${monto.toFixed(2)} → $${montoAcreditar.toFixed(2)} @ TC ${rate.tasaVenta}]`;
            } else if (monedaRecibida === 'USD' && cuentaDestino.moneda === 'GTQ') {
                montoAcreditar = monto * rate.tasaCompra;
                tasaCambioUsada = rate.tasaCompra;
                descripcionFinal = `${descripcionFinal} [$${monto.toFixed(2)} → Q${montoAcreditar.toFixed(2)} @ TC ${rate.tasaCompra}]`;
            }
        }

        cuentaDestino.saldo += montoAcreditar;
        await cuentaDestino.save();

        const transaction = new Transaction({
            cuentaOrigenId: null,
            cuentaDestinoId: cuentaDestino._id,
            monto: montoAcreditar,
            tipo: 'Deposito_Efectivo',
            descripcion: descripcionFinal,
            estado: 'Completada',
            referenciaCajero
        });

        await transaction.save();

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
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * Ejecuta una transferencia utilizando el número telefónico como identificador.
 */
export const executeMobileTransfer = async (req, res) => {
    try {
        const { monto, telefonoDestino, descripcion, monedaTransferencia } = req.body;
        const usuarioDestino = await User.findOne({ telefono: telefonoDestino });

        if (!usuarioDestino) {
            throw new Error('No existe un usuario vinculado a este número telefónico.');
        }

        const cuentaDestino = await Account.findOne({ usuarioId: usuarioDestino._id, tipo: 'Monetaria' });
        const cuentaOrigen = await Account.findOne({ usuarioId: req.user.uid, tipo: 'Monetaria' });

        if (!cuentaOrigen || !cuentaDestino) {
            throw new Error('Error en la vinculación de cuentas para transferencia móvil.');
        }

        const monedaEnvio = monedaTransferencia || cuentaOrigen.moneda || 'GTQ';

        let montoAcreditar = monto;
        let montoDebitar = monto;
        let tasaCambioUsada = null;
        let descripcionFinal = `Transferencia Móvil a ${telefonoDestino}: ${descripcion}`;

        if (cuentaOrigen.moneda !== cuentaDestino.moneda) {
            const rate = await Currency.findOne({ monedaBase: 'USD', monedaDestino: 'GTQ' });
            if (!rate) throw new Error('No hay tasa de cambio disponible.');

            if (cuentaOrigen.moneda === 'GTQ' && cuentaDestino.moneda === 'USD') {
                if (monedaEnvio === 'GTQ') {
                    montoAcreditar = monto / rate.tasaVenta;
                    montoDebitar = monto;
                    tasaCambioUsada = rate.tasaVenta;
                    descripcionFinal = `${descripcionFinal} [Q${monto.toFixed(2)} → $${montoAcreditar.toFixed(2)} @ TC ${rate.tasaVenta}]`;
                } else if (monedaEnvio === 'USD') {
                    montoAcreditar = monto;
                    montoDebitar = monto * rate.tasaVenta;
                    tasaCambioUsada = rate.tasaVenta;
                    descripcionFinal = `${descripcionFinal} [$${monto.toFixed(2)} cobrados como Q${montoDebitar.toFixed(2)} @ TC ${rate.tasaVenta}]`;
                }
            } else if (cuentaOrigen.moneda === 'USD' && cuentaDestino.moneda === 'GTQ') {
                if (monedaEnvio === 'USD') {
                    montoAcreditar = monto * rate.tasaCompra;
                    montoDebitar = monto;
                    tasaCambioUsada = rate.tasaCompra;
                    descripcionFinal = `${descripcionFinal} [$${monto.toFixed(2)} → Q${montoAcreditar.toFixed(2)} @ TC ${rate.tasaCompra}]`;
                } else if (monedaEnvio === 'GTQ') {
                    montoAcreditar = monto;
                    montoDebitar = monto / rate.tasaCompra;
                    tasaCambioUsada = rate.tasaCompra;
                    descripcionFinal = `${descripcionFinal} [Q${monto.toFixed(2)} cobrados como $${montoDebitar.toFixed(2)} @ TC ${rate.tasaCompra}]`;
                }
            }
        }

        if (cuentaOrigen.saldo < montoDebitar) {
            throw new Error('Fondos insuficientes para la transferencia móvil.');
        }

        cuentaOrigen.saldo -= montoDebitar;
        cuentaDestino.saldo += montoAcreditar;

        await cuentaOrigen.save();
        await cuentaDestino.save();

        const transaction = new Transaction({
            cuentaOrigenId: cuentaOrigen._id,
            cuentaDestinoId: cuentaDestino._id,
            monto: montoDebitar,
            tipo: 'Transferencia_Movil',
            descripcion: descripcionFinal,
            estado: 'Completada'
        });

        await transaction.save();

        res.status(200).json({ 
            status: 'success', 
            data: transaction,
            ...(tasaCambioUsada && { tasaCambio: tasaCambioUsada, montoAcreditado: montoAcreditar })
        });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

/**
 * Procesa una transferencia internacional simulando la red SWIFT.
 */
export const executeInternationalTransfer = async (req, res) => {
    try {
        const { 
            cuentaOrigenId, 
            monto, 
            descripcion, 
            internationalDetails,
            monedaTransferencia
        } = req.body;

        if (!internationalDetails || !internationalDetails.swiftBic || !internationalDetails.bancoDestino || !internationalDetails.cuentaIban || !internationalDetails.nombreBeneficiario) {
            throw new Error('Faltan datos obligatorios para la transferencia internacional (SWIFT, Banco, Cuenta o Beneficiario).');
        }

        const cuentaOrigen = await Account.findOne({ publicId: cuentaOrigenId });

        if (!cuentaOrigen || cuentaOrigen.estado !== 'Activa') {
            throw new Error('Cuenta de origen no válida o inactiva.');
        }

        const monedaEnvio = monedaTransferencia || 'USD';
        let montoDebitar = monto;
        let tasaCambioUsada = null;
        let descripcionFinal = descripcion || `Transferencia Internacional a ${internationalDetails.nombreBeneficiario}`;
        
        let comisionUsd = 35;
        let comisionCobrada = comisionUsd;

        if (cuentaOrigen.moneda !== monedaEnvio) {
            const rate = await Currency.findOne({ monedaBase: 'USD', monedaDestino: 'GTQ' });
            if (!rate) throw new Error('No hay tasa de cambio disponible.');

            if (cuentaOrigen.moneda === 'GTQ' && monedaEnvio === 'USD') {
                montoDebitar = monto * rate.tasaVenta;
                comisionCobrada = comisionUsd * rate.tasaVenta;
                tasaCambioUsada = rate.tasaVenta;
                descripcionFinal = `${descripcionFinal} [$${monto.toFixed(2)} cobrados como Q${montoDebitar.toFixed(2)} @ TC ${rate.tasaVenta}]`;
            } else if (cuentaOrigen.moneda === 'USD' && monedaEnvio === 'GTQ') {
                montoDebitar = monto / rate.tasaCompra;
                comisionCobrada = comisionUsd;
                tasaCambioUsada = rate.tasaCompra;
                descripcionFinal = `${descripcionFinal} [Q${monto.toFixed(2)} cobrados como $${montoDebitar.toFixed(2)} @ TC ${rate.tasaCompra}]`;
            }
        }

        const montoTotal = montoDebitar + comisionCobrada;

        if (cuentaOrigen.saldo < montoTotal) {
            throw new Error(`Fondos insuficientes para cubrir el monto a enviar y la comisión internacional (${comisionCobrada.toFixed(2)} ${cuentaOrigen.moneda}).`);
        }

        cuentaOrigen.saldo -= montoTotal;
        await cuentaOrigen.save();

        const transaction = new Transaction({
            cuentaOrigenId: cuentaOrigen._id,
            cuentaDestinoId: null,
            monto: montoDebitar,
            tipo: 'Transferencia_Internacional',
            descripcion: descripcionFinal,
            internationalDetails: {
                ...internationalDetails,
                comisionAplicada: comisionCobrada
            },
            estado: 'En_Proceso'
        });

        await transaction.save();

        res.status(200).json({ 
            status: 'success', 
            data: transaction, 
            comisionAplicada: comisionCobrada,
            mensaje: 'Transferencia SWIFT iniciada. Los fondos pueden tardar entre 2 y 5 días hábiles en acreditarse.',
            ...(tasaCambioUsada && { tasaCambio: tasaCambioUsada, montoEnviado: monto, monedaEnviada: monedaEnvio })
        });

    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
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

        const transactions = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('cuentaOrigenId', 'numeroCuenta tipo')
            .populate('cuentaDestinoId', 'numeroCuenta tipo');

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
        const limit = parseInt(req.query.limit) || 20;

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
