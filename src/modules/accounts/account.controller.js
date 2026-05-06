import Account from './account.model.js';
import User from '../users/user.model.js';

/**
 * Crea una nueva cuenta bancaria vinculada a un usuario existente.
 * Genera un número de cuenta secuencial basado en el timestamp actual.
 */
export const createAccount = async (req, res) => {
    try {
        const { usuarioId, tipo, moneda } = req.body;

        const userExists = await User.findById(usuarioId);
        if (!userExists) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
        }

        const numeroCuenta = Date.now().toString().slice(-10);

        const newAccount = new Account({
            numeroCuenta,
            usuarioId,
            tipo,
            moneda
        });

        await newAccount.save();

        res.status(201).json({ status: 'success', data: newAccount });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Obtiene el listado completo de cuentas asociadas a un identificador de usuario.
 */
export const getUserAccounts = async (req, res) => {
    try {
        const accounts = await Account.find({ usuarioId: req.params.usuarioId });
        res.status(200).json({ status: 'success', data: accounts });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Modifica el estado operativo de una cuenta.
 * Restringe la cancelación si la cuenta posee un saldo superior a cero.
 */
export const updateAccountStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (estado === 'Cancelada') {
            const account = await Account.findById(id);
            if (account && account.saldo > 0) {
                return res.status(400).json({ status: 'error', message: 'No se puede cancelar una cuenta con fondos activos.' });
            }
        }

        const updatedAccount = await Account.findByIdAndUpdate(id, { estado }, { new: true });
        res.status(200).json({ status: 'success', data: updatedAccount });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Actualiza el límite máximo permitido para transferencias diarias de una cuenta.
 */
export const updateTransferLimit = async (req, res) => {
    try {
        const { id } = req.params;
        const { limiteTransferenciaDiario } = req.body;

        const updatedAccount = await Account.findByIdAndUpdate(id, { limiteTransferenciaDiario }, { new: true });
        res.status(200).json({ status: 'success', data: updatedAccount });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Alterna el estado de cuenta favorita.
 */
export const toggleFavoriteAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const account = await Account.findById(id);
        if (!account) {
            return res.status(404).json({ status: 'error', message: 'Cuenta no encontrada.' });
        }

        account.isFavorite = !account.isFavorite;
        await account.save();
        
        res.status(200).json({ status: 'success', data: account });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};