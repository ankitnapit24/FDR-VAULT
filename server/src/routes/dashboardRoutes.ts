import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/summary', getDashboardSummary);

export default router;
