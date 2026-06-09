import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { AppError } from '../utils/AppError';

export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each user to 10 upload requests per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    return req.user?._id?.toString() || (Array.isArray(ip) ? ip[0] : ip);
  },
  handler: (req, res, next) => {
    next(new AppError('Too many file upload requests. Please try again after 10 minutes.', 429));
  },
});
