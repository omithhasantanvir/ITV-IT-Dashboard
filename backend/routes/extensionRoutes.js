import express from 'express';
import {
  createExtension,
  getExtensionDirectory,
  listExtensions,
  updateExtension,
} from '../controllers/extensionController.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
// Must stay above any '/:id' style route so "directory" is never parsed as an id.
router.get('/directory', getExtensionDirectory);
router.get('/', listExtensions);
router.post('/', authorize('Super Admin', 'IT Admin', 'IT Support'), createExtension);
router.put('/:id', authorize('Super Admin', 'IT Admin', 'IT Support'), updateExtension);

export default router;
