import { Router } from 'express';
import { getAuditLogs, verifyAuditLedger } from '../controllers/auditController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/verify-integrity', verifyAuditLedger);
router.get('/', getAuditLogs);

export default router;
