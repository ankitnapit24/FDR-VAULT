import { Router } from 'express';
import {
  uploadDocument,
  getDocumentMetadata,
  downloadDocument,
  verifyDocument,
  getVerificationQueue,
  getDocumentIntegrity,
} from '../controllers/documentController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/verification-queue', authorizeRoles('admin', 'officer'), getVerificationQueue);
router.post('/upload', upload.single('file'), uploadDocument);
router.get('/:id', getDocumentMetadata);
router.get('/:id/integrity', getDocumentIntegrity);
router.get('/:id/download', downloadDocument);
router.post('/:id/verify', authorizeRoles('admin', 'officer'), verifyDocument);

export default router;
