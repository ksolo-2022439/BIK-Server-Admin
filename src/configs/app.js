import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();

// 1. Seguridad Básica (Helmet oculta headers de Express y protege contra ataques comunes XSS/Sniffing)
app.use(helmet());

// 2. Configuración estricta de CORS (Permitiendo solo a nuestro BIK-Client-Admin)
const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:5173', // Puerto por defecto de Vite
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));

// 3. Middlewares para parseo de datos y registro de peticiones
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Ruta de prueba de salud (Healthcheck)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'BIK Server Admin is up and running securely 🚀'
    });
});

export default app;