import { Router } from 'express';
import * as TicketController from '../controllers/ticket.controller';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { generalLimiter } from '../middleware/rateLimit.middleware';
import {
  createTicketValidator, updateTicketValidator,
  statusUpdateValidator, addCommentValidator, assignValidator,
} from '../validators/ticket.validator';

const router = Router();
router.use(protect);
router.use(generalLimiter);

router.post('/', authorize('Admin', 'User'), createTicketValidator, validate, TicketController.createTicket);
router.get('/', TicketController.getTickets);
router.get('/:id', TicketController.getTicket);
router.put('/:id', authorize('Admin', 'Agent'), updateTicketValidator, validate, TicketController.updateTicket);
router.patch('/:id/status', authorize('Admin', 'Agent'), statusUpdateValidator, validate, TicketController.updateStatus);
router.patch('/:id/assign', authorize('Admin'), assignValidator, validate, TicketController.assignTicket);
router.post('/:id/comments', addCommentValidator, validate, TicketController.addComment);
router.delete('/:id', authorize('Admin'), TicketController.deleteTicket);

export default router;
