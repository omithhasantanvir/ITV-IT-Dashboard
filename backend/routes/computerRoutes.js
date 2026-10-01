import express from 'express';
import { createComputer, deleteComputer, getComputerById, listComputers, updateComputer } from '../controllers/computerController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.get('/', listComputers);
router.get('/:id', getComputerById);
router.post('/', authorize('Super Admin', 'IT Admin', 'IT Support'), createComputer);
router.put('/:id', authorize('Super Admin', 'IT Admin', 'IT Support'), updateComputer);
router.delete('/:id', authorize('Super Admin', 'IT Admin', 'IT Support'), deleteComputer);

export default router;
