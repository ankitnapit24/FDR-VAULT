import { Router } from 'express';
import {
  extractFDR,
  checkDiscrepanciesEndpoint,
  checkCompletenessEndpoint,
  triggerMaturityScanEndpoint,
} from '../controllers/aiController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.use(authenticate);

router.post('/extract-fdr', upload.single('file'), extractFDR);
router.post('/check-discrepancies', checkDiscrepanciesEndpoint);
router.get('/check-completeness/:fdrId', checkCompletenessEndpoint);
router.post('/trigger-scan', triggerMaturityScanEndpoint);

export default router;
