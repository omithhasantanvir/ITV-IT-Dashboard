import { Router } from 'express';
import {
  getRosters,
  getRosterById,
  createRoster,
  updateRoster,
  updateRosterStatus,
  deleteRoster,
  generateWeeklyRoster,
  swapDuties,
  getSwapLogs,
  notifyRosterEmail,
} from '../controllers/rosterController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', getRosters);
router.get('/swaps', getSwapLogs);
router.post('/swap', authenticate, swapDuties);
router.post('/notify-email', authenticate, notifyRosterEmail);
router.get('/:id', getRosterById);
router.post('/', authenticate, authorize([Role.SUPER_ADMIN, Role.IT_ADMIN]), createRoster);
router.post('/generate-week', authenticate, authorize([Role.SUPER_ADMIN, Role.IT_ADMIN]), generateWeeklyRoster);
router.put('/:id', authenticate, authorize([Role.SUPER_ADMIN, Role.IT_ADMIN]), updateRoster);
router.patch('/:id/status', authenticate, updateRosterStatus);
router.delete('/:id', authenticate, authorize([Role.SUPER_ADMIN, Role.IT_ADMIN]), deleteRoster);

export default router;
