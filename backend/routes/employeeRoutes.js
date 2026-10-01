import express from 'express';
import { createEmployee, deleteEmployee, getEmployeeById, getFormerEmployees, getITTeam, listEmployees, updateEmployee } from '../controllers/employeeController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/', listEmployees);
router.get('/it-team', getITTeam);
router.get('/former', getFormerEmployees);
router.get('/:id', getEmployeeById);
router.post('/', authorize('Super Admin', 'IT Admin', 'IT Support'), createEmployee);
router.put('/:id', authorize('Super Admin', 'IT Admin', 'IT Support'), updateEmployee);
router.delete('/:id', authorize('Super Admin', 'IT Admin', 'IT Support'), deleteEmployee);

export default router;
