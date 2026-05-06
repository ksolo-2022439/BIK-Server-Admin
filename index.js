import dotenv from 'dotenv';
import app from './src/configs/app.js';
import { connectDB } from './src/configs/db.js';
import { initCronJobs } from './src/configs/cron.js';
import { seedData } from './seeder.js';

dotenv.config();

/**
 * Punto de entrada principal del servidor administrativo.
 * Inicializa la conexión a datos, las tareas programadas y el servicio HTTP.
 */
const startServer = async () => {
    try {
        await connectDB();
        await seedData();
        initCronJobs();
        
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`=========================================`);
            console.log(`🚀 BIK Server Admin: Full Integration 🚀`);
            console.log(`Puerto: ${PORT} | Modo: ${process.env.NODE_ENV}`);
            console.log(`=========================================`);
        });
    } catch (error) {
        console.error('Fallo crítico en el inicio:', error);
        process.exit(1);
    }
};

startServer();