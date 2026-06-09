import { body } from 'express-validator';

export const createTicketValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category')
    .isIn(['Bug', 'Feature Request', 'Technical Issue', 'Payment Issue', 'Account Issue', 'Other'])
    .withMessage('Invalid category'),
  body('priority')
    .isIn(['Low', 'Medium', 'High', 'Urgent'])
    .withMessage('Invalid priority'),
];

export const updateTicketValidator = [
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim().notEmpty(),
  body('category')
    .optional()
    .isIn(['Bug', 'Feature Request', 'Technical Issue', 'Payment Issue', 'Account Issue', 'Other']),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']),
];

export const statusUpdateValidator = [
  body('status')
    .isIn(['Open', 'In Progress', 'Resolved', 'Closed'])
    .withMessage('Invalid status'),
  body('note').optional().trim(),
];

export const addCommentValidator = [
  body('text').trim().notEmpty().withMessage('Comment text is required'),
];

export const assignValidator = [
  body('assignedTo').isMongoId().withMessage('Invalid user ID'),
];
