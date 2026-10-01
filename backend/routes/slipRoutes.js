import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/', (req, res) => res.json({ success: true, data: [] }));
router.get('/:id/pdf', (req, res) => res.json({ success: true, message: 'PDF generation endpoint ready' }));

export default router;
