import Account from './account.model.js';
import User from '../users/user.model.js';

/**
 * Crea una nueva cuenta bancaria vinculada a un usuario existente.
 * Genera un número de cuenta secuencial basado en el timestamp actual.
 */
export const createAccount = async (req, res) => {
    try {
        const { usuarioId, tipo, moneda } = req.body;

        const userExists = await User.findOne({ publicId: usuarioId });
        if (!userExists) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
        }

        const numeroCuenta = Date.now().toString().slice(-10);

        const newAccount = new Account({
            numeroCuenta,
            usuarioId: userExists._id,
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
        const { usuarioId } = req.params;
        const user = await User.findByAnyId(usuarioId);
        
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'Usuario no encontrado.' });
        }

        const accounts = await Account.find({ usuarioId: user._id });
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

        const account = await Account.findByAnyId(id);
        if (!account) {
            return res.status(404).json({ status: 'error', message: 'Cuenta no encontrada.' });
        }

        if (estado === 'Cancelada' && account.saldo > 0) {
            return res.status(400).json({ status: 'error', message: 'No se puede cancelar una cuenta con fondos activos.' });
        }

        account.estado = estado;
        await account.save();
        res.status(200).json({ status: 'success', data: account });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Permite al usuario congelar su propia cuenta por seguridad.
 */
export const freezeAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const account = await Account.findByAnyId(id);

        if (!account) {
            return res.status(404).json({ status: 'error', message: 'Cuenta no encontrada.' });
        }

        // Verificar que la cuenta pertenezca al usuario del token (comparando ObjectId)
        const user = await User.findByAnyId(req.user.uid);
        if (!user || account.usuarioId.toString() !== user._id.toString()) {
            return res.status(403).json({ status: 'error', message: 'No tienes permiso para modificar esta cuenta.' });
        }

        account.estado = account.estado === 'Congelada' ? 'Activa' : 'Congelada';
        await account.save();

        res.status(200).json({ status: 'success', data: account });
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

        const account = await Account.findByAnyId(id);
        if (!account) {
            return res.status(404).json({ status: 'error', message: 'Cuenta no encontrada.' });
        }

        // Verificar que la cuenta pertenezca al usuario del token
        const user = await User.findByAnyId(req.user.uid);
        if (!user || account.usuarioId.toString() !== user._id.toString()) {
            return res.status(403).json({ status: 'error', message: 'No tienes permiso para modificar esta cuenta.' });
        }

        account.limiteTransferenciaDiario = Number(limiteTransferenciaDiario);
        await account.save();
        res.status(200).json({ status: 'success', data: account });
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
        const account = await Account.findByAnyId(id);
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