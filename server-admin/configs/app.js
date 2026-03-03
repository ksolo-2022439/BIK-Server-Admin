'use strict';

//Importaciones
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { corsOptions } from './cors-configuration.js';
import { dbConnection } from './db.js'; 
import { createAdminSeed } from './admin.seed.js'

//Rutas
import accountRoutes from '../src/accounts/account.routes.js';
import serviceRoutes from '../src/services/service.routes.js';
import authRoutes from '../src/auth/auth.routes.js';
import depositRoutes from '../src/deposits/deposit.routes.js';
import transactionRoutes from '../src/transactions/transaction.routes.js';
import userRoutes from '../src/users/user.routes.js';

const BASE_URL = '/BIK/v1';

//Configuración de mi aplicación
const middlewares = (app) => {
    app.use(express.urlencoded({ extended: false, limit: '10mb' }));
    app.use(express.json({ limit: '10mb' }));
    app.use(cors(corsOptions));
    app.use(morgan('dev'));
}

//Integracion de todas las rutas
const routes = (app) => {
    app.use(`${BASE_URL}/accounts`, accountRoutes);
    app.use(`${BASE_URL}/services`, serviceRoutes);
    app.use(`${BASE_URL}/auth`, authRoutes);
    app.use(`${BASE_URL}/deposits`, depositRoutes);
    app.use(`${BASE_URL}/transactions`, transactionRoutes);
    app.use(`${BASE_URL}/users`, userRoutes);
}

//FUNCIÓN PARA INICIAR EL SERVIDOR
const initServer = async () => {
    //Creación de la instancia de la aplicaccion
    const app = express();
    const PORT = process.env.PORT || 3001;

    try {
        //Conexión a Base de Datos (Esperamos a que conecte)
        await dbConnection();

        //CONFIGURACIONES DEL MIDDLEWARES Y RUTAS
        middlewares(app);
        routes(app);
        createAdminSeed(app);

        app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
            console.log(`Base URL: http://localhost:${PORT}${BASE_URL}`);
        });

        //Primera ruta (Health Check)
        app.get(`${BASE_URL}/health`, (req, res) => {
            res.status(200).json({
                status: 'ok',
                service: 'BIK Admin',
                version: '1.0.0'
            });
        });

    } catch (error) {
        console.log('Error al iniciar el servidor:', error);
    }
}

export { initServer };
