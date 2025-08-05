import { logger } from '../utils/logger.js';
export class AppError extends Error {
    statusCode;
    code;
    isOperational;
    constructor(message, statusCode, code, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
export function errorHandler(err, req, res, _next) {
    let error = err;
    // Handle Joi validation errors
    if (err.name === 'ValidationError') {
        error = new AppError('Validation Error', 400, 'VALIDATION_ERROR');
    }
    // Handle OpenAI API errors
    if (err.message.includes('OpenAI')) {
        error = new AppError('AI Service Error', 503, 'AI_SERVICE_ERROR');
    }
    // Default error
    if (!(error instanceof AppError)) {
        error = new AppError('Internal Server Error', 500, 'INTERNAL_ERROR', false);
    }
    const appError = error;
    // Log error
    logger.error('Request error', {
        error: appError.message,
        code: appError.code,
        statusCode: appError.statusCode,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        stack: appError.stack,
    });
    // Send error response
    const errorResponse = {
        error: appError.message,
        code: appError.code,
        timestamp: new Date().toISOString(),
    };
    res.status(appError.statusCode).json(errorResponse);
}
export function notFoundHandler(req, res) {
    logger.warn('Route not found', { url: req.url, method: req.method });
    const errorResponse = {
        error: 'Route not found',
        code: 'NOT_FOUND',
        timestamp: new Date().toISOString(),
    };
    res.status(404).json(errorResponse);
}
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=errorHandler.js.map