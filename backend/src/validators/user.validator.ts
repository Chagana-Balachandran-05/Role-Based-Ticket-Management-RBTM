import { body } from 'express-validator';

export const roleUpdateValidator = [
  body('role').isIn(['Admin', 'Agent', 'User']).withMessage('Invalid role'),
];
