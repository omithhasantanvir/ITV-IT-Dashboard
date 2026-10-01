import express from 'express';
import { getMe, loginUser } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.post('/login', loginUser);
router.get('/me', protect, getMe);

export default router;
