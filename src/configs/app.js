import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import userRoutes from '../modules/users/user.routes.js';
import accountRoutes from '../modules/accounts/account.routes.js';
import transactionRoutes from '../modules/transactions/transaction.routes.js';
import cardRoutes from '../modules/cards/card.routes.js';
import serviceRoutes from '../modules/services/service.routes.js';
import qrRoutes from '../modules/qr/qr.routes.js';
import currencyRoutes from '../modules/currency/currency.routes.js';
import insuranceRoutes from '../modules/insurance/insurance.routes.js';
import notificationRoutes from '../modules/notification/notification.routes.js';
import documentRoutes from '../modules/document/document.routes.js';
import auditRoutes from '../modules/audit/audit.routes.js';

const app = express();

app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

/**
 * Registro de todas las rutas del ecosistema BIK.
 * Los módulos administrativos integran internamente el middleware de auditoría.
 */
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/audit', auditRoutes);

/**
 * Endpoint de verificación de disponibilidad del sistema.
 */
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'BIK Server Admin - Sistema Integral Operativo 🛡️'
    });
});

export default app;