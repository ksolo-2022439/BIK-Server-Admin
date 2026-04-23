import dotenv from 'dotenv';
import app from './src/configs/app.js';
import { connectDB } from './src/configs/db.js';

dotenv.config();
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectDB();
        
        app.listen(PORT, () => {
            console.log(`=================================`);
            console.log(`🛡️ BIK Admin Server iniciado 🛡️`);
            console.log(`=================================`);
            console.log(`Entorno: ${process.env.NODE_ENV}`);
            console.log(`Escuchando en el puerto: ${PORT}`);
        });
    } catch (error) {
        console.error('Error al arrancar el servidor:', error);
        process.exit(1);
    }
};

startServer();