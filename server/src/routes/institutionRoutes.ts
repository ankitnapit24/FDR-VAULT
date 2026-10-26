import { Router } from 'express';
import {
  getInstitutions,
  getInstitutionById,
  createInstitution,
  updateInstitution,
} from '../controllers/institutionController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getInstitutions);
router.get('/:id', getInstitutionById);
router.post('/', authorizeRoles('admin'), createInstitution);
router.patch('/:id', authorizeRoles('admin'), updateInstitution);

export default router;
