import cron from 'node-cron';
import Currency from '../modules/currency/currency.model.js';
import Insurance from '../modules/insurance/insurance.model.js';
import Account from '../modules/accounts/account.model.js';
import Transaction from '../modules/transactions/transaction.model.js';

/**
 * Inicializa las tareas programadas del sistema bancario.
 * Gestiona la actualización de divisas y la deducción automática de primas de seguros.
 */
export const initCronJobs = () => {
    // Actualización de Divisas (Cada hora)
    cron.schedule('0 * * * *', async () => {
        try {
            // Lógica para actualizar tasas (Simulación de consumo de API externa)
            await Currency.updateMany({}, { fechaActualizacion: new Date() });
        } catch (error) {
            console.error('Error en Cron de Divisas:', error.message);
        }
    });

    // Cobro de Seguros (El primer día de cada mes a medianoche)
    cron.schedule('0 0 1 * *', async () => {
        try {
            const insurances = await Insurance.find({ estado: 'Activo' });
            for (const ins of insurances) {
                const account = await Account.findById(ins.cuentaId);
                if (account && account.saldo >= ins.primaMensual) {
                    account.saldo -= ins.primaMensual;
                    await account.save();
                    
                    const log = new Transaction({
                        cuentaOrigenId: account._id,
                        monto: ins.primaMensual,
                        tipo: 'Pago_Servicio',
                        descripcion: `Cobro automático mensual: Seguro de ${ins.tipo}`,
                        estado: 'Completada'
                    });
                    await log.save();
                }
            }
        } catch (error) {
            console.error('Error en Cron de Seguros:', error.message);
        }
    });
};