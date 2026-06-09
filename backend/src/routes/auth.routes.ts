import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { registerValidator, loginValidator } from '../validators/auth.validator';
import { validate } from '../middleware/validate.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';

const router = Router();
router.post('/register', authLimiter, registerValidator, validate, AuthController.register);
router.post('/login', authLimiter, loginValidator, validate, AuthController.login);
router.get('/me', protect, AuthController.getMe);
export default router;
