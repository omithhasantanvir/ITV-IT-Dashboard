import { Router } from 'express';
import {
  getExtensions,
  createExtension,
  updateExtension,
  deleteExtension,
} from '../controllers/extensionController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', getExtensions);
router.post('/', authenticate, authorize([Role.SUPER_ADMIN, Role.IT_ADMIN, Role.IT_SUPPORT]), createExtension);
router.put('/:id', authenticate, authorize([Role.SUPER_ADMIN, Role.IT_ADMIN, Role.IT_SUPPORT]), updateExtension);
router.delete('/:id', authenticate, authorize([Role.SUPER_ADMIN, Role.IT_ADMIN, Role.IT_SUPPORT]), deleteExtension);

export default router;
