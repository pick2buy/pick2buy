import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[ErrorHandler] Error caught:', err);

  if (err instanceof ZodError) {
    const errorMessages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages,
    });
  }

  // Never expose database-provider errors, query details, or filesystem paths to customers.
  if (err?.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'An account with those details already exists.',
      errors: ['An account with those details already exists.'],
    });
  }

  const statusCode = err.statusCode || (err.status >= 400 && err.status < 600 ? err.status : 500);
  const message = statusCode >= 500
    ? 'Something went wrong on our side. Please try again.'
    : err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [message],
  });
}
