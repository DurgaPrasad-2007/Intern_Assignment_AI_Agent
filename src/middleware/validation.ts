import type { Request, Response, NextFunction } from 'express';
import type { MessageRequest, ValidationError } from '../types/index.js';
import Joi from 'joi';
import { logger } from '../utils/logger.js';

const messageSchema = Joi.object<MessageRequest>({
  message: Joi.string().min(1).max(10000).required(),
  session_id: Joi.string().min(1).max(100).required(),
});

export function validateMessageRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { error, value } = messageSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const validationErrors: ValidationError[] = error.details.map((detail) => ({
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

export function validateSessionId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
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