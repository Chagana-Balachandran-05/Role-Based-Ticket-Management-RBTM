import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const authLimiter = rateLimit({
  windowMs: config.rateLimit.auth.windowMs,
  max: config.rateLimit.auth.max,
  message: {
    success: false,
    message: config.rateLimit.auth.message,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.general.windowMs,
  max: config.rateLimit.general.max,
  message: {
    success: false,
    message: config.rateLimit.general.message,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
