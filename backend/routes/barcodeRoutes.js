import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/', (req, res) => res.json({ success: true, data: [] }));
router.get('/generate', (req, res) => res.json({ success: true, message: 'Barcode generator ready' }));

export default router;
