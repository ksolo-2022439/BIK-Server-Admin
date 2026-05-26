import IdempotencyKey from '../modules/idempotency/idempotency.model.js';

/**
 * FIN-030: Middleware de Idempotencia para endpoints financieros mutativos.
 * Detecta y procesa la cabecera 'X-Idempotency-Key'.
 * - Si está en proceso, responde con status 409 (Conflict).
 * - Si ya se completó, re-envía la misma respuesta almacenada para evitar duplicados.
 * - Si no existe, inicia el procesamiento y captura la respuesta exitosa para guardarla.
 */
export const validateIdempotency = async (req, res, next) => {
    const key = req.headers['x-idempotency-key'];
    if (!key) return next();

    // Validar longitud del token de idempotencia
    if (typeof key !== 'string' || key.trim().length < 8) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'La cabecera X-Idempotency-Key provista no es válida (mínimo 8 caracteres).' 
        });
    }

    try {
        const record = await IdempotencyKey.findOne({ key });
        if (record) {
            if (record.estado === 'in_progress') {
                return res.status(409).json({ 
                    status: 'error', 
                    message: 'Operación financiera en progreso. Por favor, espere un momento antes de reintentar.' 
                });
            }
            if (record.estado === 'completed') {
                // Re-enviar la respuesta guardada
                return res.status(record.responseStatus).json(record.responseBody);
            }
        }

        // Intentar registrar la clave para bloquear concurrencia
        try {
            await IdempotencyKey.create({ key, estado: 'in_progress' });
        } catch (dbError) {
            // Excepción de clave duplicada ante peticiones extremadamente concurrentes
            return res.status(409).json({ 
                status: 'error', 
                message: 'Operación financiera duplicada y en proceso concurrente.' 
            });
        }

        // Interceptar res.json para guardar la respuesta exitosa
        const originalJson = res.json;
        res.json = function (body) {
            res.json = originalJson;
            const statusCode = res.statusCode;

            // Si es un éxito (2xx o 3xx), registramos la respuesta
            if (statusCode >= 200 && statusCode < 400) {
                IdempotencyKey.findOneAndUpdate(
                    { key }, 
                    { estado: 'completed', responseStatus: statusCode, responseBody: body }
                ).catch(err => console.error('Error guardando éxito de idempotencia:', err.message));
            } else {
                // Si la petición falla (4xx o 5xx), eliminamos el bloqueo de idempotencia 
                // para que el usuario pueda corregir los datos y reintentar con el mismo ID.
                IdempotencyKey.deleteOne({ key })
                    .catch(err => console.error('Error limpiando idempotencia fallida:', err.message));
            }

            return originalJson.call(this, body);
        };

        next();
    } catch (error) {
        console.error('Fallo grave en middleware de idempotencia:', error.message);
        next();
    }
};
