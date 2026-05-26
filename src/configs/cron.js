import cron from 'node-cron';
import mongoose from 'mongoose';
import Decimal from 'decimal.js';
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

    // FIN-031: Cobro de Seguros con transacciones MongoDB (El primer día de cada mes a medianoche)
    cron.schedule('0 0 1 * *', async () => {
        try {
            const insurances = await Insurance.find({ estado: 'Activo' });
            for (const ins of insurances) {
                const session = await mongoose.startSession();
                try {
                    session.startTransaction();
                    
                    const account = await Account.findById(ins.cuentaId).session(session);
                    if (account && account.saldo >= ins.primaMensual) {
                        account.saldo = Number(new Decimal(account.saldo).sub(ins.primaMensual).toFixed(2));
                        await account.save({ session });
                        
                        const log = new Transaction({
                            cuentaOrigenId: account._id,
                            monto: ins.primaMensual,
                            tipo: 'Pago_Servicio',
                            descripcion: `Cobro automático mensual: Seguro de ${ins.tipo}`,
                            estado: 'Completada'
                        });
                        await log.save({ session });
                        await session.commitTransaction();
                    } else {
                        await session.abortTransaction();
                        console.warn(`Seguro ${ins._id}: Fondos insuficientes para el cobro automático.`);
                    }
                } catch (innerError) {
                    await session.abortTransaction();
                    console.error(`Error procesando seguro ${ins._id}:`, innerError.message);
                } finally {
                    session.endSession();
                }
            }
        } catch (error) {
            console.error('Error en Cron de Seguros:', error.message);
        }
    });
};