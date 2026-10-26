import { Router } from 'express';
import { getSettings, updateSetting } from '../controllers/settingsController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getSettings);
router.patch('/:key', authorizeRoles('admin'), updateSetting);

export default router;
