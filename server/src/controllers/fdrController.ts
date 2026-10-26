import { Response } from 'express';
import { FDR } from '../models/FDR.js';
import { AppDocument } from '../models/Document.js';
import { AuthRequest, enforceInstitutionScope, getScopedInstitutionIds } from '../middleware/authMiddleware.js';
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
    const scopedIds = await getScopedInstitutionIds(user);

    if (scopedIds !== null) {
      if (scopedIds.length === 0) {
        res.status(200).json({ success: true, fdrs: [], total: 0, page: 1, totalPages: 0 });
        return;
      }

      if (user.role === 'institution') {
        query.institutionId = user.institutionId;
      } else if (user.role === 'trust') {
        // If trustee specifies an institutionId, ensure it belongs to their trust
        if (institutionId) {
          const isAllowed = scopedIds.some(id => id.toString() === institutionId.toString());
          if (!isAllowed) {
            res.status(403).json({ success: false, message: 'Forbidden: Selected institution does not belong to your trust.' });
            return;
          }
          query.institutionId = institutionId;
        } else {
          query.institutionId = { $in: scopedIds };
        }
      }
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

    const isScoped = await enforceInstitutionScope(req, res, fdr.institutionId._id.toString());
    if (!isScoped) {
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

    if (user.role === 'trust') {
      res.status(403).json({ success: false, message: 'Forbidden: Trustees have read-only oversight; FDRs must be registered by the respective technical institution.' });
      return;
    }

    // Check authorization: if institution user, must match their assigned institution
    const targetInstId = user.role === 'institution' ? user.institutionId?.toString() : institutionId;

    if (!targetInstId) {
      res.status(400).json({ success: false, message: 'Institution ID is required.' });
      return;
    }

    const isScoped = await enforceInstitutionScope(req, res, targetInstId);
    if (!isScoped) {
      res.status(403).json({ success: false, message: 'Forbidden: You cannot register an FDR for another institution.' });
      return;
    }

    if (!fdrNumber || !bankName || depositAmount === undefined || !issueDate || !maturityDate) {
      res.status(400).json({ success: false, message: 'FDR number, bank name, deposit amount, issue date, and maturity date are required.' });
      return;
    }

    // Check for duplicate FDR
    const duplicateCheck = await checkForDuplicateFDR(fdrNumber, bankName);
    if (duplicateCheck.isDuplicate && duplicateCheck.matchedFdrs.length > 0) {
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
    const user = req.user!;
    const { id } = req.params;

    if (user.role === 'trust') {
      res.status(403).json({ success: false, message: 'Forbidden: Trustees have read-only oversight to FDR records.' });
      return;
    }

    const fdr = await FDR.findById(id);
    if (!fdr) {
      res.status(404).json({ success: false, message: 'FDR record not found.' });
      return;
    }

    const isScoped = await enforceInstitutionScope(req, res, fdr.institutionId.toString());
    if (!isScoped) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    // Role-specific field protection
    if (user.role === 'institution') {
      // Disallow institution setting or modifying verificationStatus
      if ('verificationStatus' in req.body) {
        res.status(403).json({ success: false, message: 'Forbidden: Technical Institutions cannot self-verify or modify verification status.' });
        return;
      }
      delete req.body.priorityScore;
      delete req.body.priorityReason;
      delete req.body.scrutinyObservations;
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
      officerId: user._id,
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
      newValues: { verificationStatus: fdr.verificationStatus, observation },
    });

    // Notify institution
    await sendNotification({
      targetRole: 'institution',
      institutionId: fdr.institutionId,
      type: 'Verification Needed',
      title: `Scrutiny Observation Added: ${fdr.fdrNumber}`,
      message: `AICTE Scrutiny Officer added an observation: "${observation.slice(0, 80)}...". Status is now ${fdr.verificationStatus}.`,
      relatedEntityType: 'FDR',
      relatedEntityId: fdr._id,
      priority: verificationStatus === 'Rejected' ? 'high' : 'medium',
    });

    res.json({
      success: true,
      message: 'Scrutiny observation logged successfully.',
      fdr,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error logging observation.' });
  }
}

export async function checkDuplicate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { fdrNumber, bankName } = req.query;

    if (!fdrNumber || !bankName) {
      res.status(400).json({ success: false, message: 'fdrNumber and bankName query parameters are required.' });
      return;
    }

    const result = await checkForDuplicateFDR(fdrNumber as string, bankName as string);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error checking for duplicate FDR.' });
  }
}
