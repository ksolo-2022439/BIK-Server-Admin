import rateLimit from 'express-rate-limit';

/**
 * SEC-004/SEC-012: Rate limiters centralizados.
 * Evita la dependencia circular al importar límites desde configs/app.js en los archivos de rutas.
 */

// Rate Limiter global para todas las llamadas API
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { 
        status: 'error', 
        message: 'Demasiadas peticiones. Por favor, intente de nuevo en 15 minutos.' 
    }
});

// Rate Limiter estricto para endpoints críticos/sensibles (ej. login, registro, etc.)
export const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { 
        status: 'error', 
        message: 'Demasiados intentos detectados. Por favor, intente de nuevo más tarde.' 
    }
});
