import { Router } from 'express';
import {
  getComputers,
  getComputerById,
  createComputer,
  updateComputer,
  deleteComputer,
  assignComputer,
} from '../controllers/computerController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', getComputers);
router.get('/:id', getComputerById);
router.post('/', authenticate, authorize([Role.SUPER_ADMIN, Role.IT_ADMIN, Role.IT_SUPPORT]), createComputer);
router.put('/:id', authenticate, authorize([Role.SUPER_ADMIN, Role.IT_ADMIN, Role.IT_SUPPORT]), updateComputer);
router.delete('/:id', authenticate, authorize([Role.SUPER_ADMIN, Role.IT_ADMIN, Role.IT_SUPPORT]), deleteComputer);
router.patch('/:id/assign', authenticate, authorize([Role.SUPER_ADMIN, Role.IT_ADMIN, Role.IT_SUPPORT]), assignComputer);

export default router;
