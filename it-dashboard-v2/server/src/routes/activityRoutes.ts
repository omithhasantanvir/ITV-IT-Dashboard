import { Router } from 'express';
import { getActivityLogs } from '../controllers/activityController';

const router = Router();

router.get('/', getActivityLogs);

export default router;
