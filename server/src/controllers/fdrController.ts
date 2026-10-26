import { Response } from 'express';
import { FDR } from '../models/FDR.js';
import { AppDocument } from '../models/Document.js';
import { AuthRequest, enforceInstitutionScope } from '../middleware/authMiddleware.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import { calculateFDRPriority } from '../services/prioritizationService.js';
import { checkForDuplicateFDR } from '../services/duplicateService.js';
import { checkFDRDocumentCompleteness } from '../services/completenessService.js';
import { sendNotification } from '../services/notificationService.js';

export async function getFDRs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const {
      search,
      currentStatus,
      verificationStatus,
      institutionId,
      maturityWithinDays,
      page = '1',
      limit = '10',
    } = req.query;

    const query: any = {};

    // Data isolation
    if (user.role === 'institution') {
      if (!user.institutionId) {
        res.status(200).json({ success: true, fdrs: [], total: 0 });
        return;
      }
      query.institutionId = user.institutionId;
    } else if (institutionId) {
      query.institutionId = institutionId;
    }

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { fdrNumber: searchRegex },
        { bankName: searchRegex },
        { branchName: searchRegex },
      ];
    }

    if (currentStatus) {
      query.currentStatus = currentStatus;
    }

    if (verificationStatus) {
      query.verificationStatus = verificationStatus;
    }

    if (maturityWithinDays) {
      const days = parseInt(maturityWithinDays as string, 10);
      if (!isNaN(days)) {
        const now = new Date();
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + days);
        query.maturityDate = { $gte: now, $lte: targetDate };
      }
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    const [fdrs, total] = await Promise.all([
      FDR.find(query)
        .populate('institutionId', 'name institutionCode')
        .populate('previousFdrId', 'fdrNumber bankName')
        .populate('replacementFdrId', 'fdrNumber bankName')
        .sort({ priorityScore: -1, maturityDate: 1 })
        .skip(skip)
        .limit(limitNum),
      FDR.countDocuments(query),
    ]);

    res.json({
      success: true,
      fdrs,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching FDR records.' });
  }
}

export async function getFDRById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const fdr = await FDR.findById(id)
      .populate('institutionId', 'name institutionCode contactEmail address')
      .populate('previousFdrId')
      .populate('replacementFdrId');

    if (!fdr) {
      res.status(404).json({ success: false, message: 'FDR record not found.' });
      return;
    }

    if (!enforceInstitutionScope(req, res, fdr.institutionId._id.toString())) {
      res.status(403).json({ success: false, message: 'Access denied to this FDR record.' });
      return;
    }

    // Associated documents
    const documents = await AppDocument.find({ fdrId: id }).populate('uploadedBy', 'name role');

    // Document completeness check
    const completeness = await checkFDRDocumentCompleteness(id);

    res.json({
      success: true,
      fdr,
      documents,
      completeness,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching FDR details.' });
  }
}

export async function createFDR(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const {
      institutionId,
      fdrNumber,
      bankName,
      branchName,
      ifscCode,
      depositAmount,
      issueDate,
      maturityDate,
      tenureMonths,
      interestRate,
      jointHolderName,
      remarks,
    } = req.body;

    // Check authorization: if institution user, must match their assigned institution
    const targetInstId = user.role === 'institution' ? user.institutionId?.toString() : institutionId;

    if (!targetInstId) {
      res.status(400).json({ success: false, message: 'Institution ID is required.' });
      return;
    }

    if (!fdrNumber || !bankName || depositAmount === undefined || !issueDate || !maturityDate) {
      res.status(400).json({ success: false, message: 'FDR number, bank name, deposit amount, issue date, and maturity date are required.' });
      return;
    }

    // Check for duplicate FDR
    const duplicateCheck = await checkForDuplicateFDR(fdrNumber, bankName);
    if (duplicateCheck.isDuplicate && duplicateCheck.matchedFdrs.length > 0) {
      // Return 409 if exact duplicate exists under same bank
      const exactMatch = duplicateCheck.matchedFdrs.some(m => m.bankName.toLowerCase() === bankName.toLowerCase());
      if (exactMatch) {
        res.status(409).json({
          success: false,
          message: `Duplicate FDR Error: An FDR with number ${fdrNumber} from ${bankName} already exists in the system.`,
          duplicateDetails: duplicateCheck,
        });
        return;
      }
    }

    const newFdr = new FDR({
      institutionId: targetInstId,
      fdrNumber: fdrNumber.trim(),
      bankName: bankName.trim(),
      branchName: branchName || '',
      ifscCode: ifscCode?.toUpperCase() || '',
      depositAmount: Number(depositAmount),
      issueDate: new Date(issueDate),
      maturityDate: new Date(maturityDate),
      tenureMonths: tenureMonths || 60,
      interestRate: interestRate || 6.5,
      jointHolderName: jointHolderName || 'Regional Officer, AICTE & Principal',
      verificationStatus: 'Pending Verification',
      currentStatus: 'Active',
      renewalStatus: 'Not Applicable',
      remarks: remarks || '',
    });

    // Compute priority
    const priorityResult = calculateFDRPriority(newFdr);
    newFdr.priorityScore = priorityResult.score;
    newFdr.priorityReason = priorityResult.reason;

    await newFdr.save();

    await logAudit({
      req,
      action: 'CREATE_FDR',
      entityType: 'FDR',
      entityId: newFdr._id.toString(),
      institutionId: targetInstId,
      newValues: newFdr.toObject(),
    });

    // Notify officers of new submission
    await sendNotification({
      targetRole: 'officer',
      institutionId: targetInstId,
      type: 'Verification Needed',
      title: `New FDR Submitted: ${newFdr.fdrNumber}`,
      message: `A new FDR record (${newFdr.fdrNumber}, ₹${newFdr.depositAmount.toLocaleString('en-IN')}) has been submitted for scrutiny.`,
      relatedEntityType: 'FDR',
      relatedEntityId: newFdr._id,
      priority: 'medium',
    });

    res.status(201).json({
      success: true,
      message: 'FDR record created successfully and queued for scrutiny.',
      fdr: newFdr,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating FDR.' });
  }
}

export async function updateFDR(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const fdr = await FDR.findById(id);
    if (!fdr) {
      res.status(404).json({ success: false, message: 'FDR record not found.' });
      return;
    }

    if (!enforceInstitutionScope(req, res, fdr.institutionId.toString())) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    const prev = fdr.toObject();
    Object.assign(fdr, req.body);

    const priorityResult = calculateFDRPriority(fdr);
    fdr.priorityScore = priorityResult.score;
    fdr.priorityReason = priorityResult.reason;

    await fdr.save();

    await logAudit({
      req,
      action: 'UPDATE_FDR',
      entityType: 'FDR',
      entityId: fdr._id.toString(),
      institutionId: fdr.institutionId,
      previousValues: prev,
      newValues: fdr.toObject(),
    });

    res.json({
      success: true,
      message: 'FDR record updated successfully.',
      fdr,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating FDR.' });
  }
}

export async function addScrutinyObservation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { observation, verificationStatus } = req.body;
    const user = req.user!;

    if (!observation) {
      res.status(400).json({ success: false, message: 'Observation text is required.' });
      return;
    }

    const fdr = await FDR.findById(id);
    if (!fdr) {
      res.status(404).json({ success: false, message: 'FDR record not found.' });
      return;
    }

    const prevStatus = fdr.verificationStatus;

    fdr.scrutinyObservations.push({
      officerId: user._id as any,
      officerName: user.name,
      observation,
      createdAt: new Date(),
    });

    if (verificationStatus) {
      fdr.verificationStatus = verificationStatus;
    }

    const priorityResult = calculateFDRPriority(fdr);
    fdr.priorityScore = priorityResult.score;
    fdr.priorityReason = priorityResult.reason;

    await fdr.save();

    await logAudit({
      req,
      action: 'ADD_SCRUTINY_OBSERVATION',
      entityType: 'FDR',
      entityId: fdr._id.toString(),
      institutionId: fdr.institutionId,
      previousValues: { verificationStatus: prevStatus },
      newValues: { observation, verificationStatus: fdr.verificationStatus },
    });

    // Notify institution
    await sendNotification({
      institutionId: fdr.institutionId,
      type: 'Verification Needed',
      title: `Scrutiny Observation Added: ${fdr.fdrNumber}`,
      message: `An AICTE scrutiny observation was added for FDR ${fdr.fdrNumber}: "${observation}". Status: ${fdr.verificationStatus}`,
      relatedEntityType: 'FDR',
      relatedEntityId: fdr._id,
      priority: 'high',
    });

    res.json({
      success: true,
      message: 'Scrutiny observation recorded successfully.',
      fdr,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error recording observation.' });
  }
}

export async function checkDuplicate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { fdrNumber, bankName, excludeId } = req.query;

    if (!fdrNumber || !bankName) {
      res.status(400).json({ success: false, message: 'fdrNumber and bankName query parameters are required.' });
      return;
    }

    const result = await checkForDuplicateFDR(
      fdrNumber as string,
      bankName as string,
      excludeId as string
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error performing duplicate check.' });
  }
}
