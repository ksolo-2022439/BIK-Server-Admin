export const errorHandler = (err, req, res) => {
 
  console.error(`Error in Admin Server: ${err.message}`);
  console.error(`Stack trace: ${err.stack}`);
  console.error(`Request: ${req.method} ${req.path}`);
 
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));
 
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors,
    });
  }
 
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} ya existe`,
      error: 'DUPLICATE_FIELD',
    });
  }
 
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Formato de ID inválido',
      error: 'INVALID_ID',
    });
  }
 
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido',
      error: 'INVALID_TOKEN',
    });
  }
 
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado',
      error: 'TOKEN_EXPIRED',
    });
  }
 
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.code || 'CUSTOM_ERROR',
    });
  }
 
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && {
      details: err.message,
      stack: err.stack,
    }),
  });
};