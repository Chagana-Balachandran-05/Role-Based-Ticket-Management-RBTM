import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role)) {
      return next(
        new AppError(`Access denied. Required role: ${roles.join(' or ')}.`, 403)
      );
    }
    next();
  };
};
