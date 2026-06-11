import { Router } from 'express';
import * as TicketController from '../controllers/ticket.controller';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { generalLimiter } from '../middleware/rateLimit.middleware';
import { uploadLimiter } from '../middleware/throttle.middleware';
import { handleAttachmentUpload } from '../middleware/multer.config';
import { createTicketValidator } from '../validators/ticket.validator';

const router = Router();
router.use(protect);
router.use(generalLimiter);

// Create ticket with optional attachments — mirrors /api/tickets POST guards exactly
router.post(
  '/',
  authorize('Admin', 'User'),
  uploadLimiter,
  handleAttachmentUpload('attachments'),
  createTicketValidator,
  validate,
  TicketController.createTicket
);

// Add attachments to existing ticket
router.post(
  '/:id/attachments',
  uploadLimiter,
  handleAttachmentUpload('attachments'),
  TicketController.addAttachments
);

// Delete attachment from existing ticket
router.delete(
  '/:id/attachments/:attachmentId',
  TicketController.deleteAttachment
);

// Real-time SSE stream of attachment uploads
router.get(
  '/:id/attachments/stream',
  TicketController.streamAttachments
);

export default router;
