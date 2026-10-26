import { Router } from 'express';
import { getTrusts, getTrustExposure, createTrust } from '../controllers/trustController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getTrusts);
router.get('/:id/exposure', getTrustExposure);
router.post('/', authorizeRoles('admin'), createTrust);

export default router;
