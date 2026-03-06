'use strict';

import Deposit from './deposit.model.js';
import Account from '../accounts/account.model.js';
import axios from 'axios';
import mongoose from 'mongoose';

export const createDeposit = async (req, res) => {
    try {
        const { accountId, amount, description } = req.body;

        const { role, email, uid } = req.user;

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser mayor a 0'
            });
        }

        const destinationAccount = await Account.findById(accountId);
        if (!destinationAccount) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta de destino no encontrada'
            });
        }
        if (!destinationAccount.isActive) {
            return res.status(400).json({
                success: false,
                message: 'La cuenta de destino no está activa'
            });
        }

        let finalDescription = description;

        if (role === 'ADMIN_ROLE') {
            try {
                await axios.post('http://core-banking:8080/BIK/v1/Transactions/deposit', {
                    AccountNumber: destinationAccount.numberAccount,
                    Amount: amount
                });
            } catch (coreError) {
                return res.status(502).json({
                    success: false,
                    message: 'Error al sincronizar el depósito en el Core Banking',
                    error: coreError.response?.data || coreError.message
                });
            }

            destinationAccount.balance += parseFloat(amount);
            finalDescription = description || `Depósito en Ventanilla (Admin: ${email})`;
            await destinationAccount.save();
        }
        else {
            const sourceAccount = await Account.findOne({ email: email });

            if (!sourceAccount) return res.status(404).json({ success: false, message: 'No tienes una cuenta asociada.' });
            if (sourceAccount._id.equals(destinationAccount._id)) return res.status(400).json({ success: false, message: 'No puedes transferirte a tu propia cuenta.' });
            if (sourceAccount.balance < amount) return res.status(400).json({ success: false, message: 'Fondos insuficientes.' });

            try {
                await axios.post('http://core-banking:8080/BIK/v1/Transactions/transfer', {
                    FromAccountNumber: sourceAccount.numberAccount,
                    ToAccountNumber: destinationAccount.numberAccount,
                    Amount: amount
                });
            } catch (coreError) {
                return res.status(502).json({
                    success: false,
                    message: 'Error al sincronizar la transferencia en el Core Banking',
                    error: coreError.response?.data || coreError.message
                });
            }

            sourceAccount.balance -= parseFloat(amount);
            destinationAccount.balance += parseFloat(amount);
            finalDescription = description || `Transferencia de cuenta ${sourceAccount.numberAccount}`;

            await sourceAccount.save();
            await destinationAccount.save();
        }

        const deposit = new Deposit({
            accountId,
            amount,
            description: finalDescription,
            status: 'COMPLETED',
            madeBy: uid,
            date: new Date()
        });

        await deposit.save();

        res.status(200).json({
            success: true,
            message: 'Transacción realizada con éxito',
            deposit,
            newBalance: destinationAccount.balance
        });

    } catch (error) {
        console.error('Error en depósito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al realizar la transacción',
            error: error.message
        });
    }
};

export const getDepositsByAccount = async (req, res) => {
    try {
        const { accountId } = req.params;
        const { limit = 5 } = req.query;

        const deposits = await Deposit.find({ accountId })
            .populate('accountId', 'numberAccount nameAccount')
            .sort({ date: -1 })
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: deposits.length,
            deposits
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial',
            error: error.message
        });
    }
};

export const getDepositById = async (req, res) => {
    try {
        const { id } = req.params;

        const deposit = await Deposit.findById(id)
            .populate('accountId', 'numberAccount nameAccount');

        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: 'Depósito no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            deposit
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener el depósito',
            error: error.message
        });
    }
};