import { Router } from 'express';
import {
  getServers,
  createServer,
  updateServer,
  deleteServer,
  probeServer,
  pingAllServers,
  pingSingleServer,
} from '../controllers/serverController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', getServers);
router.get('/ping-all', pingAllServers);
router.post('/ping-all', pingAllServers);
router.get('/:id/ping', pingSingleServer);
router.post('/:id/ping', pingSingleServer);
router.post('/:id/probe', authenticate, probeServer);
router.post('/', authenticate, authorize([Role.SUPER_ADMIN, Role.IT_ADMIN, Role.IT_SUPPORT]), createServer);
router.put('/:id', authenticate, authorize([Role.SUPER_ADMIN, Role.IT_ADMIN, Role.IT_SUPPORT]), updateServer);
router.delete('/:id', authenticate, authorize([Role.SUPER_ADMIN, Role.IT_ADMIN]), deleteServer);

export default router;
