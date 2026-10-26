import { Response } from 'express';
import { RefundRequest } from '../models/RefundRequest.js';
import { FDR } from '../models/FDR.js';
import { AuthRequest, enforceInstitutionScope } from '../middleware/authMiddleware.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import { sendNotification } from '../services/notificationService.js';
import {
  getDefaultClearances,
  processClearanceDecision,
  generateRegulatoryNOC,
} from '../services/clearanceService.js';
import { evaluateReleaseEligibility } from '../services/releasePreCheckService.js';

export async function getRefundRequests(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { status, page = '1', limit = '10' } = req.query;

    const query: any = {};
    if (user.role === 'institution') {
      if (!user.institutionId) {
        res.status(200).json({ success: true, refunds: [], total: 0 });
        return;
      }
      query.institutionId = user.institutionId;
    }

    if (status) {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    const [refunds, total] = await Promise.all([
      RefundRequest.find(query)
        .populate('institutionId', 'name institutionCode')
        .populate('fdrId', 'fdrNumber bankName depositAmount maturityDate currentStatus')
        .populate('submittedBy', 'name role')
        .populate('assignedOfficer', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      RefundRequest.countDocuments(query),
    ]);

    res.json({
      success: true,
      refunds,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching refund requests.' });
  }
}

export async function getRefundRequestById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const refund = await RefundRequest.findById(id)
      .populate('institutionId', 'name institutionCode contactEmail address')
      .populate('fdrId')
      .populate('supportingDocuments')
      .populate('submittedBy', 'name email role')
      .populate('assignedOfficer', 'name role');

    if (!refund) {
      res.status(404).json({ success: false, message: 'Refund request not found.' });
      return;
    }

    if (!enforceInstitutionScope(req, res, refund.institutionId._id.toString())) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    res.json({ success: true, refund });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching refund request details.' });
  }
}

export async function createRefundRequest(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { fdrId, reason, refundAmount, bankDetails, supportingDocuments, remarks } = req.body;

    if (!fdrId || !reason || refundAmount === undefined || !bankDetails?.accountNumber || !bankDetails?.ifscCode) {
      res.status(400).json({
        success: false,
        message: 'FDR ID, reason, refund amount, and bank details (account number and IFSC) are required.',
      });
      return;
    }

    const fdr = await FDR.findById(fdrId);
    if (!fdr) {
      res.status(404).json({ success: false, message: 'FDR record not found.' });
      return;
    }

    if (!enforceInstitutionScope(req, res, fdr.institutionId.toString())) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    const refNum = `REF-${Date.now().toString().slice(-6)}`;

    // Run release pre-check
    const preCheckResult = await evaluateReleaseEligibility(fdr._id.toString());

    const refund = await RefundRequest.create({
      institutionId: fdr.institutionId,
      fdrId: fdr._id,
      requestReference: refNum,
      reason,
      refundAmount: Number(refundAmount),
      bankDetails,
      supportingDocuments: supportingDocuments || [],
      clearances: getDefaultClearances(),
      preCheckResult,
      status: 'Submitted',
      submittedBy: user._id,
      remarks: remarks || '',
      approvalObservations: [
        {
          stage: 'Submission',
          officerId: user._id as any,
          officerName: user.name,
          decision: 'Submitted',
          remarks: 'Request submitted by institution with pre-check validation for regulatory processing.',
          date: new Date(),
        },
      ],
    });

    await logAudit({
      req,
      action: 'CREATE_REFUND_REQUEST',
      entityType: 'RefundRequest',
      entityId: refund._id.toString(),
      institutionId: fdr.institutionId,
      newValues: refund.toObject(),
    });

    // Notify officers
    await sendNotification({
      targetRole: 'officer',
      institutionId: fdr.institutionId,
      type: 'Refund Status Update',
      title: `Refund/Release Request: ${refNum}`,
      message: `Institution submitted a refund request for FDR ${fdr.fdrNumber} (Amount: ₹${Number(refundAmount).toLocaleString('en-IN')}).`,
      relatedEntityType: 'RefundRequest',
      relatedEntityId: refund._id,
      priority: 'high',
    });

    res.status(201).json({
      success: true,
      message: 'Refund/release request submitted successfully.',
      refund,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error submitting refund request.' });
  }
}

export async function updateRefundStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, remarks, finalOutcome } = req.body;
    const user = req.user!;

    const refund = await RefundRequest.findById(id).populate('fdrId');
    if (!refund) {
      res.status(404).json({ success: false, message: 'Refund request not found.' });
      return;
    }

    const prevStatus = refund.status;
    refund.status = status;
    refund.assignedOfficer = user._id as any;
    if (remarks) refund.remarks = remarks;
    if (finalOutcome) refund.finalOutcome = finalOutcome;

    // Record timeline observation
    refund.approvalObservations.push({
      stage: status,
      officerId: user._id as any,
      officerName: user.name,
      decision: status,
      remarks: remarks || `Status changed from ${prevStatus} to ${status}.`,
      date: new Date(),
    });

    // If final release completed, mark FDR as Released
    if (status === 'Completed') {
      const fdr = await FDR.findById(refund.fdrId);
      if (fdr) {
        fdr.currentStatus = 'Released';
        await fdr.save();
      }
    }

    await refund.save();

    await logAudit({
      req,
      action: 'UPDATE_REFUND_STATUS',
      entityType: 'RefundRequest',
      entityId: refund._id.toString(),
      institutionId: refund.institutionId,
      previousValues: { status: prevStatus },
      newValues: { status, remarks, finalOutcome },
    });

    // Notify institution
    await sendNotification({
      institutionId: refund.institutionId,
      type: 'Refund Status Update',
      title: `Refund Request Updated: ${refund.requestReference}`,
      message: `Refund/release application ${refund.requestReference} is now marked as "${status}". Remarks: ${remarks || 'None'}.`,
      relatedEntityType: 'RefundRequest',
      relatedEntityId: refund._id,
      priority: status === 'Approved' || status === 'Completed' ? 'medium' : 'high',
    });

    res.json({
      success: true,
      message: `Refund request updated to ${status}.`,
      refund,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating refund status.' });
  }
}

export async function getReleasePreCheck(req: AuthRequest, res: Response): Promise<void> {
  try {
    const fdrId = Array.isArray(req.params.fdrId) ? req.params.fdrId[0] : req.params.fdrId;
    const existingRefund = await RefundRequest.findOne({ fdrId }).sort({ createdAt: -1 });

    const evaluation = await evaluateReleaseEligibility(fdrId, existingRefund);
    res.json({
      success: true,
      evaluation,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error running release pre-check.' });
  }
}

export async function updateDepartmentClearance(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deptKey = Array.isArray(req.params.deptKey) ? req.params.deptKey[0] : req.params.deptKey;
    const { status, comments, objectionReason } = req.body;
    const user = req.user!;

    const refund = await RefundRequest.findById(id);
    if (!refund) {
      res.status(404).json({ success: false, message: 'Refund request not found.' });
      return;
    }

    const updatedRefund = await processClearanceDecision(
      refund,
      deptKey,
      status,
      user._id,
      user.name,
      comments,
      objectionReason
    );

    await logAudit({
      req,
      action: 'UPDATE_DEPARTMENT_CLEARANCE',
      entityType: 'RefundRequest',
      entityId: refund._id.toString(),
      institutionId: refund.institutionId,
      newValues: { deptKey, status, comments, objectionReason },
    });

    res.json({
      success: true,
      message: `Department clearance '${deptKey}' updated to ${status}.`,
      refund: updatedRefund,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating clearance.' });
  }
}

export async function generateNOCAction(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = req.user!;

    const refund = await RefundRequest.findById(id);
    if (!refund) {
      res.status(404).json({ success: false, message: 'Refund request not found.' });
      return;
    }

    const result = await generateRegulatoryNOC(refund, user._id, user.name);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error || 'Cannot generate NOC. Mandatory clearances or prerequisites are pending.',
      });
      return;
    }

    await logAudit({
      req,
      action: 'GENERATE_COUNCIL_NOC',
      entityType: 'RefundRequest',
      entityId: refund._id.toString(),
      institutionId: refund.institutionId,
      newValues: { nocReference: result.nocReference },
    });

    res.json({
      success: true,
      message: `Statutory Council NOC generated successfully (${result.nocReference}). Security deposit lien discharged.`,
      nocReference: result.nocReference,
      refund,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error generating NOC.' });
  }
}
