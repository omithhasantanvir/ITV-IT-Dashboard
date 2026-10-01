import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/', (req, res) => res.json({ success: true, data: { companyName: 'IT Management & Asset Control System', subtitle: 'Internal IT Operations Dashboard' } }));
router.put('/', (req, res) => res.json({ success: true, data: req.body }));

export default router;
