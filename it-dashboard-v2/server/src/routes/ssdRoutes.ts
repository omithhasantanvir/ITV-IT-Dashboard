import { Router } from 'express';
import {
  getSSDs,
  getSSDById,
  createSSD,
  updateSSD,
  deleteSSD,
} from '../controllers/ssdController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', getSSDs);
router.get('/:id', getSSDById);
router.post('/', authenticate, authorize([Role.SUPER_ADMIN, Role.IT_ADMIN, Role.IT_SUPPORT]), createSSD);
router.put('/:id', authenticate, authorize([Role.SUPER_ADMIN, Role.IT_ADMIN, Role.IT_SUPPORT]), updateSSD);
router.delete('/:id', authenticate, authorize([Role.SUPER_ADMIN, Role.IT_ADMIN, Role.IT_SUPPORT]), deleteSSD);

export default router;
