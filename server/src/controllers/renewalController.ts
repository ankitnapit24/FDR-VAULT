import { Response } from 'express';
import { RenewalRequest } from '../models/RenewalRequest.js';
import { FDR } from '../models/FDR.js';
import { AuthRequest, enforceInstitutionScope, getScopedInstitutionIds } from '../middleware/authMiddleware.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import { sendNotification } from '../services/notificationService.js';

export async function getRenewalRequests(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { status, page = '1', limit = '10' } = req.query;

    const query: any = {};
    const scopedIds = await getScopedInstitutionIds(user);
    if (scopedIds !== null) {
      if (scopedIds.length === 0) {
        res.status(200).json({ success: true, renewals: [], total: 0, page: 1, totalPages: 0 });
        return;
      }
      query.institutionId = { $in: scopedIds };
    }

    if (status) {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    const [renewals, total] = await Promise.all([
      RenewalRequest.find(query)
        .populate('institutionId', 'name institutionCode')
        .populate('existingFdrId', 'fdrNumber bankName depositAmount maturityDate currentStatus')
        .populate('replacementFdrId', 'fdrNumber bankName depositAmount maturityDate')
        .populate('submittedBy', 'name email role')
        .populate('assignedOfficer', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      RenewalRequest.countDocuments(query),
    ]);

    res.json({
      success: true,
      renewals,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching renewal requests.' });
  }
}

export async function getRenewalRequestById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const renewal = await RenewalRequest.findById(id)
      .populate('institutionId', 'name institutionCode contactEmail')
      .populate('existingFdrId')
      .populate('replacementFdrId')
      .populate('supportingDocuments')
      .populate('submittedBy', 'name email role')
      .populate('assignedOfficer', 'name role');

    if (!renewal) {
      res.status(404).json({ success: false, message: 'Renewal request not found.' });
      return;
    }

    const isScoped = await enforceInstitutionScope(req, res, renewal.institutionId._id.toString());
    if (!isScoped) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    res.json({ success: true, renewal });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching renewal request details.' });
  }
}

export async function createRenewalRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { existingFdrId, reason, proposedTenureMonths, supportingDocuments } = req.body;

    if (!existingFdrId || !reason) {
      res.status(400).json({ success: false, message: 'Existing FDR ID and reason for renewal are required.' });
      return;
    }

    const existingFdr = await FDR.findById(existingFdrId);
    if (!existingFdr) {
      res.status(404).json({ success: false, message: 'Existing FDR record not found.' });
      return;
    }

    const isScoped = await enforceInstitutionScope(req, res, existingFdr.institutionId.toString());
    if (!isScoped) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    const refNum = `REN-${Date.now().toString().slice(-6)}`;

    const renewal = await RenewalRequest.create({
      institutionId: existingFdr.institutionId,
      existingFdrId: existingFdr._id,
      requestReference: refNum,
      reason,
      proposedTenureMonths: proposedTenureMonths || 60,
      supportingDocuments: supportingDocuments || [],
      status: 'Submitted',
      submittedBy: user._id,
    });

    // Update existing FDR renewal status
    existingFdr.renewalStatus = 'Renewal Requested';
    await existingFdr.save();

    await logAudit({
      req,
      action: 'CREATE_RENEWAL_REQUEST',
      entityType: 'RenewalRequest',
      entityId: renewal._id.toString(),
      institutionId: existingFdr.institutionId,
      newValues: renewal.toObject(),
    });

    // Notify officers
    await sendNotification({
      targetRole: 'officer',
      institutionId: existingFdr.institutionId,
      type: 'Renewal Pending',
      title: `Renewal Request Submitted: ${refNum}`,
      message: `Institution submitted a renewal request for FDR ${existingFdr.fdrNumber} (Ref: ${refNum}).`,
      relatedEntityType: 'RenewalRequest',
      relatedEntityId: renewal._id,
      priority: 'high',
    });

    res.status(201).json({
      success: true,
      message: 'Renewal request submitted successfully.',
      renewal,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating renewal request.' });
  }
}

export async function updateRenewalStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, reviewRemarks, replacementFdrData } = req.body;
    const user = req.user!;

    const renewal = await RenewalRequest.findById(id).populate('existingFdrId');
    if (!renewal) {
      res.status(404).json({ success: false, message: 'Renewal request not found.' });
      return;
    }

    const prevStatus = renewal.status;
    renewal.status = status;
    if (reviewRemarks) renewal.reviewRemarks = reviewRemarks;
    renewal.assignedOfficer = user._id as any;
    if (status === 'Approved' || status === 'Rejected') {
      renewal.decisionDate = new Date();
    }

    // If approved and replacement FDR details are provided, create replacement FDR record and link
    if (status === 'Approved') {
      const existingFdr = await FDR.findById(renewal.existingFdrId);
      if (existingFdr) {
        let replacementId = renewal.replacementFdrId;

        if (replacementFdrData) {
          const newFdr = await FDR.create({
            institutionId: existingFdr.institutionId,
            fdrNumber: replacementFdrData.fdrNumber || `${existingFdr.fdrNumber}-R`,
            bankName: replacementFdrData.bankName || existingFdr.bankName,
            branchName: replacementFdrData.branchName || existingFdr.branchName,
            ifscCode: replacementFdrData.ifscCode || existingFdr.ifscCode,
            depositAmount: replacementFdrData.depositAmount || existingFdr.depositAmount,
            issueDate: replacementFdrData.issueDate ? new Date(replacementFdrData.issueDate) : new Date(),
            maturityDate: replacementFdrData.maturityDate
              ? new Date(replacementFdrData.maturityDate)
              : new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
            tenureMonths: renewal.proposedTenureMonths || 60,
            interestRate: replacementFdrData.interestRate || existingFdr.interestRate,
            verificationStatus: 'Verified',
            currentStatus: 'Active',
            renewalStatus: 'Not Applicable',
            previousFdrId: existingFdr._id,
            remarks: `Renewed replacement for FDR ${existingFdr.fdrNumber}.`,
          });
          replacementId = newFdr._id;
          renewal.replacementFdrId = newFdr._id;
          existingFdr.replacementFdrId = newFdr._id;
        }

        existingFdr.currentStatus = 'Renewed';
        existingFdr.renewalStatus = 'Renewed';
        await existingFdr.save();
      }
    } else if (status === 'Rejected') {
      const existingFdr = await FDR.findById(renewal.existingFdrId);
      if (existingFdr) {
        existingFdr.renewalStatus = 'Renewal Pending';
        await existingFdr.save();
      }
    }

    await renewal.save();

    await logAudit({
      req,
      action: 'UPDATE_RENEWAL_STATUS',
      entityType: 'RenewalRequest',
      entityId: renewal._id.toString(),
      institutionId: renewal.institutionId,
      previousValues: { status: prevStatus },
      newValues: { status, reviewRemarks },
    });

    // Notify institution
    await sendNotification({
      institutionId: renewal.institutionId,
      type: 'Renewal Pending',
      title: `Renewal Request ${status}: ${renewal.requestReference}`,
      message: `Your FDR renewal request ${renewal.requestReference} has been updated to "${status}". Remarks: ${reviewRemarks || 'None'}.`,
      relatedEntityType: 'RenewalRequest',
      relatedEntityId: renewal._id,
      priority: status === 'Approved' ? 'medium' : 'high',
    });

    res.json({
      success: true,
      message: `Renewal request status updated to ${status}.`,
      renewal,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating renewal status.' });
  }
}
