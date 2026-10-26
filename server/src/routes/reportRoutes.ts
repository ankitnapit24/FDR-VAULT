import { Router } from 'express';
import {
  getFDRReport,
  getMaturityReport,
  getOverdueReport,
} from '../controllers/reportController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/fdrs', getFDRReport);
router.get('/maturities', getMaturityReport);
router.get('/overdue', getOverdueReport);

export default router;
