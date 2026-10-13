import { Router } from 'express';
import { getInventoryReport, getEmployeesReport } from '../controllers/reportController';

const router = Router();

router.get('/inventory', getInventoryReport);
router.get('/employees', getEmployeesReport);

export default router;
