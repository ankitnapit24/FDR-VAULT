import { Router } from 'express';
import {
  getPolicies,
  getDepositAdequacy,
  createPolicyRule,
  togglePolicyRule,
} from '../controllers/policyController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getPolicies);
router.get('/calculate-adequacy/:institutionId', getDepositAdequacy);
router.post('/', authorizeRoles('admin'), createPolicyRule);
router.patch('/:id/toggle-status', authorizeRoles('admin'), togglePolicyRule);

export default router;
