import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserModel, { IUser } from '../models/User.model';
import { AppError } from '../utils/AppError';

interface JwtPayload {
  id: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      return next(new AppError('Not authenticated. Please log in.', 401));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

    const user = await UserModel.findById(decoded.id).select('-password');
    if (!user) return next(new AppError('User no longer exists.', 401));
    if (!user.isActive) return next(new AppError('Your account has been deactivated.', 403));

    req.user = user;
    next();
  } catch (err: unknown) {
    const error = err as Error;
    if (error.name === 'JsonWebTokenError') return next(new AppError('Invalid token.', 401));
    if (error.name === 'TokenExpiredError') return next(new AppError('Token expired. Please log in again.', 401));
    next(err);
  }
};
