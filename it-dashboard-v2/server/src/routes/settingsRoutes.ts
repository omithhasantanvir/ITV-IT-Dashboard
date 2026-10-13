import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', getSettings);
router.put('/', authenticate, authorize([Role.SUPER_ADMIN]), updateSettings);

export default router;
