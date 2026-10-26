import { Router } from 'express';
import {
  getFDRs,
  getFDRById,
  createFDR,
  updateFDR,
  addScrutinyObservation,
  checkDuplicate,
} from '../controllers/fdrController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/check-duplicate', checkDuplicate);
router.get('/', getFDRs);
router.get('/:id', getFDRById);
router.post('/', createFDR);
router.patch('/:id', updateFDR);
router.post('/:id/observations', authorizeRoles('admin', 'officer'), addScrutinyObservation);

export default router;
