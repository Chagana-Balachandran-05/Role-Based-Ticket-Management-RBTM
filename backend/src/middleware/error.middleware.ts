import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { errorResponse } from '../utils/apiResponse';

interface AppErrorDetails extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
}

export const globalErrorHandler = (
  err: AppErrorDetails,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('ERROR:', err);

  let statusCode = 500;
  let message = 'Internal server error';
  let errors: string[] | null = null;

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  } else if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e: { message: string }) => e.message);
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = err.message || 'Invalid token';
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  return res.status(statusCode).json(errorResponse(message, errors));
};

