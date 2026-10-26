import { Router } from 'express';
import { getUsers, createUser, toggleUserStatus } from '../controllers/userController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate, authorizeRoles('admin'));

router.get('/', getUsers);
router.post('/', createUser);
router.patch('/:id/toggle-status', toggleUserStatus);

export default router;
