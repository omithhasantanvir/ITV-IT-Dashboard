import express from 'express';
import {
  createServer,
  getServerOverview,
  listServers,
  probeServer,
  updateServer,
} from '../controllers/serverController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
// Declared before the collection route so "overview"/"probe" are never read as an id.
router.get('/overview', getServerOverview);
router.get('/probe', probeServer);
router.get('/', listServers);
router.post('/', authorize('Super Admin', 'IT Admin', 'IT Support'), createServer);
router.put('/:id', authorize('Super Admin', 'IT Admin', 'IT Support'), updateServer);

export default router;
