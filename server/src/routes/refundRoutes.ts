import { Router } from 'express';
import {
  getRefundRequests,
  getRefundRequestById,
  createRefundRequest,
  updateRefundStatus,
  getReleasePreCheck,
  updateDepartmentClearance,
  generateNOCAction,
} from '../controllers/refundController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/pre-check/:fdrId', getReleasePreCheck);
router.get('/', getRefundRequests);
router.get('/:id', getRefundRequestById);
router.post('/', createRefundRequest);
router.patch('/:id/status', authorizeRoles('admin', 'officer'), updateRefundStatus);
router.patch('/:id/clearances/:deptKey', authorizeRoles('admin', 'officer'), updateDepartmentClearance);
router.post('/:id/generate-noc', authorizeRoles('admin', 'officer'), generateNOCAction);

export default router;
