import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AppDocument } from '../models/Document.js';
import { FDR } from '../models/FDR.js';
import { AuthRequest, enforceInstitutionScope } from '../middleware/authMiddleware.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import { extractFDRDataFromFile } from '../services/ocrService.js';
import { detectDiscrepancies } from '../services/discrepancyService.js';
import { calculateFDRPriority } from '../services/prioritizationService.js';
import { sendNotification } from '../services/notificationService.js';
import { env } from '../config/env.js';
import { computeFileSHA256, inspectDocumentIntegritySignals } from '../services/documentIntegrityService.js';
import { uploadToStorage, getDocumentDownloadUrlOrPath } from '../services/storageService.js';

export async function uploadDocument(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, message: 'No file uploaded or file format invalid.' });
      return;
    }

    const { institutionId, fdrId, documentType } = req.body;
    const targetInstId = user.role === 'institution' ? user.institutionId?.toString() : institutionId;

    if (!targetInstId) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      res.status(400).json({ success: false, message: 'Institution ID is required.' });
      return;
    }

    const isScoped = await enforceInstitutionScope(req, res, targetInstId);
    if (!isScoped) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      res.status(403).json({ success: false, message: 'Forbidden: You cannot upload documents for this institution.' });
      return;
    }

    // Run OCR / PDF Extraction
    const extraction = await extractFDRDataFromFile(file.path, file.mimetype);

    // Compute SHA-256 Hash and Inspect PDF Structural Signals
    const fileHash = await computeFileSHA256(file.path);
    const integritySignals = await inspectDocumentIntegritySignals(file.path, file.mimetype);

    // If linked to an FDR, detect discrepancies
    let discrepancies: any[] = [];
    if (fdrId) {
      const fdr = await FDR.findById(fdrId);
      if (fdr) {
        discrepancies = detectDiscrepancies(fdr, extraction);
      }
    }

    // Upload to local storage or Cloud S3 Object Storage
    await uploadToStorage(file.path, file.filename, file.mimetype);

    const doc = await AppDocument.create({
      institutionId: targetInstId,
      fdrId: fdrId || null,
      documentType: documentType || 'FDR Certificate',
      storageKey: file.filename,
      originalFilename: file.originalname,
      contentType: file.mimetype,
      fileSize: file.size,
      uploadedBy: user._id,
      verificationStatus: 'Pending Verification',
      fileHash,
      hashAlgorithm: 'SHA-256',
      hashTimestamp: new Date(),
      integritySignals,
      hashHistory: [
        {
          fileHash,
          hashAlgorithm: 'SHA-256',
          uploadedAt: new Date(),
          uploadedBy: user._id,
        },
      ],
      ocrExtracted: !!extraction.rawText,
      ocrData: extraction,
      discrepancyFlags: discrepancies,
    });

    // If discrepancies found or priority changed, update linked FDR
    if (fdrId) {
      const fdr = await FDR.findById(fdrId);
      if (fdr) {
        const priorityResult = calculateFDRPriority(fdr, false, discrepancies.length > 0);
        fdr.priorityScore = priorityResult.score;
        fdr.priorityReason = priorityResult.reason;
        await fdr.save();
      }
    }

    await logAudit({
      req,
      action: 'UPLOAD_DOCUMENT',
      entityType: 'Document',
      entityId: doc._id.toString(),
      institutionId: targetInstId,
      newValues: {
        filename: file.originalname,
        documentType: doc.documentType,
        discrepancyCount: discrepancies.length,
      },
    });

    // Notify officers if discrepancy detected
    if (discrepancies.length > 0) {
      await sendNotification({
        targetRole: 'officer',
        institutionId: targetInstId,
        type: 'Discrepancy Detected',
        title: `Document Discrepancy Flagged: ${file.originalname}`,
        message: `${discrepancies.length} discrepancy flag(s) detected during automated scan for document ${file.originalname}. Officer review required.`,
        relatedEntityType: 'Document',
        relatedEntityId: doc._id,
        priority: 'high',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Document uploaded and analyzed successfully.',
      document: doc,
      extraction,
      discrepancies,
    });
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: error.message || 'Error processing document upload.' });
  }
}

export async function getDocumentMetadata(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const doc = await AppDocument.findById(id)
      .populate('uploadedBy', 'name email role')
      .populate('verifiedBy', 'name role')
      .populate('institutionId', 'name institutionCode');

    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found.' });
      return;
    }

    const isScoped = await enforceInstitutionScope(req, res, doc.institutionId._id.toString());
    if (!isScoped) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    res.json({ success: true, document: doc });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching document metadata.' });
  }
}

export async function downloadDocument(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const doc = await AppDocument.findById(id);

    if (!doc) {
      res.status(404).json({ success: false, message: 'Document record not found.' });
      return;
    }

    const isScoped = await enforceInstitutionScope(req, res, doc.institutionId.toString());
    if (!isScoped) {
      res.status(403).json({ success: false, message: 'Access denied to this document.' });
      return;
    }

    const target = await getDocumentDownloadUrlOrPath(doc.storageKey);

    if (target.type === 'presigned_url') {
      res.redirect(target.target);
      return;
    }

    if (!fs.existsSync(target.target)) {
      res.status(404).json({ success: false, message: 'Physical file not found on server.' });
      return;
    }

    res.setHeader('Content-Type', doc.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.originalFilename)}"`);
    fs.createReadStream(target.target).pipe(res);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error downloading document.' });
  }
}

export async function verifyDocument(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { verificationStatus, verificationRemarks } = req.body;
    const user = req.user!;

    if (!['Verified', 'Rejected', 'Additional Information Required'].includes(verificationStatus)) {
      res.status(400).json({ success: false, message: 'Invalid verification status.' });
      return;
    }

    const doc = await AppDocument.findById(id);
    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found.' });
      return;
    }

    const prevStatus = doc.verificationStatus;
    doc.verificationStatus = verificationStatus;
    doc.verificationRemarks = verificationRemarks || '';
    doc.verifiedBy = user._id as any;
    doc.verifiedAt = new Date();
    await doc.save();

    // If associated with FDR, update FDR's verification status if all docs verified
    if (doc.fdrId) {
      const fdr = await FDR.findById(doc.fdrId);
      if (fdr) {
        if (verificationStatus === 'Verified') {
          // Check if any other doc is unverified
          const pendingCount = await AppDocument.countDocuments({
            fdrId: doc.fdrId,
            verificationStatus: { $ne: 'Verified' },
          });
          if (pendingCount === 0) {
            fdr.verificationStatus = 'Verified';
          } else {
            fdr.verificationStatus = 'Under Scrutiny';
          }
        } else if (verificationStatus === 'Rejected') {
          fdr.verificationStatus = 'Rejected';
        } else if (verificationStatus === 'Additional Information Required') {
          fdr.verificationStatus = 'Additional Information Required';
        }

        const priorityResult = calculateFDRPriority(fdr);
        fdr.priorityScore = priorityResult.score;
        fdr.priorityReason = priorityResult.reason;
        await fdr.save();
      }
    }

    await logAudit({
      req,
      action: 'VERIFY_DOCUMENT',
      entityType: 'Document',
      entityId: doc._id.toString(),
      institutionId: doc.institutionId,
      previousValues: { status: prevStatus },
      newValues: { status: verificationStatus, remarks: verificationRemarks },
    });

    // Notify institution
    await sendNotification({
      institutionId: doc.institutionId,
      type: 'Verification Needed',
      title: `Document ${verificationStatus}: ${doc.originalFilename}`,
      message: `Document "${doc.originalFilename}" has been reviewed by an AICTE officer. Outcome: ${verificationStatus}. Remarks: ${verificationRemarks || 'None'}.`,
      relatedEntityType: 'Document',
      relatedEntityId: doc._id,
      priority: verificationStatus === 'Rejected' ? 'high' : 'medium',
    });

    res.json({
      success: true,
      message: `Document successfully marked as ${verificationStatus}.`,
      document: doc,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error verifying document.' });
  }
}

export async function getDocumentIntegrity(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const doc = await AppDocument.findById(id).populate('uploadedBy', 'name role');

    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found.' });
      return;
    }

    const isScoped = await enforceInstitutionScope(req, res, doc.institutionId.toString());
    if (!isScoped) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    res.json({
      success: true,
      integrity: {
        documentId: doc._id,
        filename: doc.originalFilename,
        fileSize: doc.fileSize,
        fileHash: doc.fileHash || 'Not calculated for legacy file',
        hashAlgorithm: doc.hashAlgorithm || 'SHA-256',
        hashTimestamp: doc.hashTimestamp || doc.createdAt,
        integritySignals: doc.integritySignals || { structuralCheckPassed: true },
        hashHistory: doc.hashHistory || [],
        discrepancyFlags: doc.discrepancyFlags || [],
        disclaimer:
          'Cryptographic hash confirms file byte integrity and change-detection since upload. It does not replace independent bank verification of instrument authenticity.',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error checking document integrity.' });
  }
}

export async function getVerificationQueue(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { status, page = '1', limit = '10' } = req.query;

    const query: any = {};
    if (status) {
      query.verificationStatus = status;
    } else {
      query.verificationStatus = { $in: ['Pending Verification', 'Uploaded', 'Additional Information Required'] };
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    const [documents, total] = await Promise.all([
      AppDocument.find(query)
        .populate('institutionId', 'name institutionCode')
        .populate('fdrId', 'fdrNumber bankName depositAmount maturityDate')
        .populate('uploadedBy', 'name role')
        .sort({ 'discrepancyFlags.0': -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AppDocument.countDocuments(query),
    ]);

    res.json({
      success: true,
      documents,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching verification queue.' });
  }
}
