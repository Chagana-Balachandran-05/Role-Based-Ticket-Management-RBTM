import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { errorResponse } from '../utils/apiResponse';
import { logger } from '../utils/winston';

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
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: string[] | null = null;
  let isOperational = false;

  // 1. YOUR custom errors — always check first
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = true;

  // 2. MongoDB/Mongoose known errors
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    isOperational = true;

  } else if (err.code === 11000) {
    statusCode = 409;
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    isOperational = true;

  } else if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e: { message: string }) => e.message);
    isOperational = true;

  // 3. JWT errors
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token';
    isOperational = true;
  }

  // 4. Only log TRUE unknown programmer errors
  if (!isOperational) {
    logger.error('Unhandled error:', { message: err.message, stack: err.stack });
  }

  return res.status(statusCode).json(errorResponse(message, errors));
};
