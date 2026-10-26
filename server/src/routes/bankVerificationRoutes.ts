import { Router } from 'express';
import {
  validateIFSC,
  getVerificationTickets,
  createTicket,
  updateTicketStatus,
} from '../controllers/bankVerificationController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// IFSC lookup is public for authenticated users registering FDRs
router.get('/validate-ifsc/:ifsc', validateIFSC);

// Bank verification liaison management is restricted to AICTE Admin & Scrutiny Officers
router.get('/', authorizeRoles('admin', 'officer'), getVerificationTickets);
router.post('/', authorizeRoles('admin', 'officer'), createTicket);
router.patch('/:id/status', authorizeRoles('admin', 'officer'), updateTicketStatus);

export default router;
