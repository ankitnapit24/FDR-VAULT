import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { extractFDRDataFromFile, parseFDRFieldsFromText } from '../services/ocrService.js';
import { detectDiscrepancies } from '../services/discrepancyService.js';
import { checkFDRDocumentCompleteness } from '../services/completenessService.js';
import { runMaturityAndWorkflowChecks } from '../services/cronJobs.js';
import fs from 'fs';

export async function extractFDR(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (req.file) {
      const extraction = await extractFDRDataFromFile(req.file.path, req.file.mimetype);
      // Clean up temporary preview file if uploaded solely for extraction testing
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.json({ success: true, extraction });
      return;
    }

    if (req.body.text) {
      const parsed = parseFDRFieldsFromText(req.body.text);
      res.json({
        success: true,
        extraction: {
          ...parsed,
          rawText: req.body.text.slice(0, 1000),
          confidence: 0.9,
        },
      });
      return;
    }

    res.status(400).json({ success: false, message: 'Please upload a file or provide text for FDR extraction.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error processing AI extraction.' });
  }
}

export async function checkDiscrepanciesEndpoint(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { fdrData, extractedData } = req.body;
    if (!fdrData || !extractedData) {
      res.status(400).json({ success: false, message: 'Both fdrData and extractedData are required.' });
      return;
    }

    const discrepancies = detectDiscrepancies(fdrData, extractedData);
    res.json({
      success: true,
      hasDiscrepancies: discrepancies.length > 0,
      discrepancies,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error checking discrepancies.' });
  }
}

export async function checkCompletenessEndpoint(req: AuthRequest, res: Response): Promise<void> {
  try {
    const fdrId = Array.isArray(req.params.fdrId) ? req.params.fdrId[0] : req.params.fdrId;
    if (!fdrId) {
      res.status(400).json({ success: false, message: 'fdrId parameter is required.' });
      return;
    }

    const completeness = await checkFDRDocumentCompleteness(fdrId);
    res.json({ success: true, completeness });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error checking document completeness.' });
  }
}

export async function triggerMaturityScanEndpoint(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await runMaturityAndWorkflowChecks();
    res.json({
      success: true,
      message: 'Maturity scan and workflow evaluation completed successfully.',
      result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error running scan.' });
  }
}
