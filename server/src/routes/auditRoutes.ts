import { Router } from 'express';
import { getAuditLogs, verifyAuditLedger } from '../controllers/auditController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Internal immutable audit logs are restricted to AICTE Admin & Scrutiny Officers
router.use(authenticate, authorizeRoles('admin', 'officer'));

router.get('/verify-integrity', verifyAuditLedger);
router.get('/', getAuditLogs);

export default router;
