import { Router } from 'express';
import * as AuditLogController from '../controllers/auditLog.controller';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { generalLimiter } from '../middleware/rateLimit.middleware';

const router = Router();
router.use(protect);
router.use(authorize('Admin'));
router.use(generalLimiter);

router.get('/', AuditLogController.getAuditLogs);

export default router;
