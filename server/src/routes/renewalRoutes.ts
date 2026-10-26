import { Router } from 'express';
import {
  getRenewalRequests,
  getRenewalRequestById,
  createRenewalRequest,
  updateRenewalStatus,
} from '../controllers/renewalController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getRenewalRequests);
router.get('/:id', getRenewalRequestById);
router.post('/', createRenewalRequest);
router.patch('/:id/status', authorizeRoles('admin', 'officer'), updateRenewalStatus);

export default router;
