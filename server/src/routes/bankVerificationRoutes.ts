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

router.get('/validate-ifsc/:ifsc', validateIFSC);
router.get('/', getVerificationTickets);
router.post('/', createTicket);
router.patch('/:id/status', authorizeRoles('admin', 'officer'), updateTicketStatus);

export default router;
