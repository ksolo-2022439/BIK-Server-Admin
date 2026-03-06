'use strict';

import Transaction from './transaction.model.js';
import Service from '../services/service.model.js';
import Account from '../accounts/account.model.js';
import axios from 'axios';
import mongoose from 'mongoose';

export const makeTransfer = async (req, res) => {
    try {
        const { sourceAccountId, destinationAccountId, amount, description } = req.body;
        const amountNum = parseFloat(amount);

        if (sourceAccountId === destinationAccountId) throw new Error('No puedes transferir a tu propia cuenta');
        if (amountNum <= 0) throw new Error('El monto debe ser mayor a 0');
        if (amountNum > 2000) throw new Error('El límite máximo por transferencia es de Q2000.00');

        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

        const dailyTransactions = await Transaction.aggregate([
            {
                $match: {
                    sourceAccount: new mongoose.Types.ObjectId(sourceAccountId),
                    transactionType: 'TRANSFERENCIA',
                    status: 'COMPLETED',
                    date: { $gte: startOfDay, $lte: endOfDay }
                }
            },
            { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
        ]);

        const currentDailyTotal = dailyTransactions.length > 0 ? dailyTransactions[0].totalAmount : 0;
        if (currentDailyTotal + amountNum > 100) throw new Error(`Límite diario superado.`);

        const sourceAccount = await Account.findById(sourceAccountId);
        if (!sourceAccount || !sourceAccount.isActive) throw new Error('Cuenta de origen inválida');
        if (sourceAccount.balance < amountNum) throw new Error('Fondos insuficientes');

        const destinationAccount = await Account.findById(destinationAccountId);
        if (!destinationAccount || !destinationAccount.isActive) throw new Error('Cuenta de destino inválida');

        sourceAccount.balance -= amountNum;
        destinationAccount.balance += amountNum;

        await sourceAccount.save();
        await destinationAccount.save();

        const transaction = new Transaction({
            sourceAccount: sourceAccountId,
            destinationAccount: destinationAccountId,
            amount: amountNum,
            transactionType: 'TRANSFERENCIA',
            description: description || 'Transferencia entre cuentas',
            status: 'COMPLETED',
            date: new Date()
        });

        await transaction.save();

        res.status(200).json({
            success: true,
            message: 'Transferencia realizada con éxito',
            transaction
        });

    } catch (error) {
        res.status(400).json({ success: false, message: 'Error en la transferencia', error: error.message });
    }
};

/**
 * PAGO DE SERVICIOS
 */
export const payService = async (req, res) => {
    try {
        const { sourceAccountId, amount, typeService, nameService, numberAccountPay, methodPayment } = req.body;
        const amountNum = parseFloat(amount);

        const sourceAccount = await Account.findById(sourceAccountId);
        if (!sourceAccount) throw new Error('Cuenta de origen no encontrada');
        if (!sourceAccount.isActive) throw new Error('La cuenta está inactiva');

        if (sourceAccount.balance < amountNum) {
            throw new Error('Fondos insuficientes para pagar el servicio');
        }

        try {
            await axios.post('http://core-banking:8080/BIK/v1/Transactions/withdraw', {
                AccountNumber: sourceAccount.numberAccount,
                Amount: amountNum
            });
        } catch (coreError) {
            return res.status(502).json({
                success: false,
                message: 'Error al procesar el pago en el motor financiero. El cobro fue cancelado.',
                error: coreError.response?.data || coreError.message
            });
        }

        sourceAccount.balance -= amountNum;
        await sourceAccount.save();

        const newService = new Service({
            nameService: nameService || 'Pago de servicios',
            typeService,
            numberAccountPay,
            methodPayment: methodPayment || 'Bancaria',
            amounth: amountNum,
            status: 'COMPLETED'
        });
        await newService.save();

        const transaction = new Transaction({
            sourceAccount: sourceAccountId,
            amount: amountNum,
            transactionType: 'PAGO_SERVICIO',
            serviceId: newService._id,
            description: `Pago de ${typeService} - Ref: ${numberAccountPay}`,
            status: 'COMPLETED'
        });
        await transaction.save();

        res.status(200).json({
            success: true,
            message: 'Servicio pagado con éxito en ambos sistemas',
            service: newService,
            transaction
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al pagar servicio',
            error: error.message
        });
    }
};

/**
 * OBTENER HISTORIAL
 */
export const getTransactionHistory = async (req, res) => {
    try {
        const { accountId } = req.params;
        const { limit = 10, page = 1 } = req.query;

        const query = {
            $or: [
                { sourceAccount: accountId },
                { destinationAccount: accountId }
            ]
        };

        const transactions = await Transaction.find(query)
            .populate('sourceAccount', 'numberAccount nameAccount')
            .populate('destinationAccount', 'numberAccount nameAccount')
            .populate('serviceId', 'nameService typeService')
            .sort({ date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Transaction.countDocuments(query);

        res.status(200).json({
            success: true,
            total,
            transactions,
            pagination: {
                page: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial',
            error: error.message
        });
    }
};

export const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findById(id)
            .populate('sourceAccount', 'numberAccount nameAccount')
            .populate('destinationAccount', 'numberAccount nameAccount')
            .populate('serviceId');

        if (!transaction) return res.status(404).json({ success: false, message: 'Transacción no encontrada' });

        res.status(200).json({ success: true, data: transaction });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error', error: error.message });
    }
};