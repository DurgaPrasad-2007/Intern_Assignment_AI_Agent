import type { Request, Response, NextFunction } from 'express';
import type { ErrorResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, code: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
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

  const appError = error as AppError;

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
  const errorResponse: ErrorResponse = {
    error: appError.message,
    code: appError.code,
    timestamp: new Date().toISOString(),
  };

  res.status(appError.statusCode).json(errorResponse);
}

export function notFoundHandler(req: Request, res: Response): void {
  logger.warn('Route not found', { url: req.url, method: req.method });

  const errorResponse: ErrorResponse = {
    error: 'Route not found',
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(errorResponse);
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
} 