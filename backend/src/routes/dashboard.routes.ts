import { Router } from 'express';
import { getStats } from '../controllers/dashboard.controller';
import { protect } from '../middleware/auth.middleware';
import { generalLimiter } from '../middleware/rateLimit.middleware';

const router = Router();
router.use(protect);
router.use(generalLimiter);
router.get('/stats', getStats);
export default router;
