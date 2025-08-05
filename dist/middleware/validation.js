import Joi from 'joi';
import { logger } from '../utils/logger.js';
const messageSchema = Joi.object({
    message: Joi.string().min(1).max(10000).required(),
    session_id: Joi.string().min(1).max(100).required(),
});
export function validateMessageRequest(req, res, next) {
    const { error, value } = messageSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });
    if (error) {
        const validationErrors = error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value,
        }));
        logger.warn('Validation failed', { errors: validationErrors, body: req.body });
        res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            timestamp: new Date().toISOString(),
            details: validationErrors,
        });
        return;
    }
    req.body = value;
    next();
}
export function validateSessionId(req, res, next) {
    const sessionId = req.params.session_id || req.query.session_id;
    if (!sessionId || typeof sessionId !== 'string') {
        res.status(400).json({
            error: 'Session ID is required',
            code: 'MISSING_SESSION_ID',
            timestamp: new Date().toISOString(),
        });
        return;
    }
    if (sessionId.length > 100) {
        res.status(400).json({
            error: 'Session ID too long',
            code: 'INVALID_SESSION_ID',
            timestamp: new Date().toISOString(),
        });
        return;
    }
    next();
}
//# sourceMappingURL=validation.js.map