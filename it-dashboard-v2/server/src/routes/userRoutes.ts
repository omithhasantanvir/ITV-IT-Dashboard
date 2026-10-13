import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateITStatus,
  resetUserPassword,
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', authenticate, authorize([Role.SUPER_ADMIN, Role.IT_ADMIN]), createUser);
router.put('/:id', authenticate, authorize([Role.SUPER_ADMIN, Role.IT_ADMIN]), updateUser);
router.delete('/:id', authenticate, authorize([Role.SUPER_ADMIN]), deleteUser);
router.post('/:id/reset-password', authenticate, authorize([Role.SUPER_ADMIN]), resetUserPassword);
router.patch('/:id/it-status', authenticate, updateITStatus);

export default router;
