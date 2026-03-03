export const helmetConfiguration = {
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'blob:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'none'"],
        },
    },
    hsts: false,
    frameguard: { action: 'deny' },
    noSniff: true,
    hidePoweredBy: true,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
};
 
import rateLimit from 'express-rate-limit';
 
export const requestLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
        error: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
        res.status(429).json({
            success: false,
            message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
            error: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.round(
                (req.rateLimit.resetTime - Date.now()) / 1000
            ),
        });
    },
});