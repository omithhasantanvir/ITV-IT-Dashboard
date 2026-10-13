import { Router } from 'express';
import { getSlips, createSlip } from '../controllers/slipController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', getSlips);
router.post('/', authenticate, authorize([Role.SUPER_ADMIN, Role.IT_ADMIN, Role.IT_SUPPORT]), createSlip);

export default router;
