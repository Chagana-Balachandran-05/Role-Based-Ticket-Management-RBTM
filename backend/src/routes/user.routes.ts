import { Router } from 'express';
import * as UserController from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { roleUpdateValidator } from '../validators/user.validator';
import { body } from 'express-validator';

const router = Router();
router.use(protect);

router.patch('/me/profile', UserController.updateProfile);
router.patch('/me/password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
], validate, UserController.changePassword);

router.get('/agents', authorize('Admin'), UserController.getAgents);
router.get('/', authorize('Admin'), UserController.getUsers);
router.get('/:id', authorize('Admin'), UserController.getUser);
router.put('/:id', authorize('Admin'), UserController.updateUser);
router.delete('/:id', authorize('Admin'), UserController.deleteUser);
router.patch('/:id/role', authorize('Admin'), roleUpdateValidator, validate, UserController.updateRole);
router.patch('/:id/status', authorize('Admin'), [body('isActive').isBoolean()], validate, UserController.updateStatus);

export default router;
