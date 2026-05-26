import mongoose from 'mongoose';

/**
 * Modelo para registrar las claves de idempotencia financieras.
 * Protege contra dobles peticiones y reintentos innecesarios o duplicados.
 * Utiliza un TTL (Time To Live) de 24 horas (86400 segundos) para auto-limpieza.
 */
const idempotencyKeySchema = new mongoose.Schema({
    key: { 
        type: String, 
        required: true, 
        unique: true 
    },
    estado: { 
        type: String, 
        enum: ['in_progress', 'completed'], 
        required: true 
    },
    responseStatus: { 
        type: Number 
    },
    responseBody: { 
        type: mongoose.Schema.Types.Mixed 
    },
    createdAt: { 
        type: Date, 
        default: Date.now, 
        expires: 86400 // Expira automáticamente después de 24 horas
    }
});

export default mongoose.model('IdempotencyKey', idempotencyKeySchema);
