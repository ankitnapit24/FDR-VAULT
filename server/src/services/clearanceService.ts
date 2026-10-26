import { IRefundRequest, IDepartmentClearance, ClearanceStatus } from '../models/RefundRequest.js';
import { FDR } from '../models/FDR.js';
import { logAudit } from '../middleware/auditMiddleware.js';

export function getDefaultClearances(): IDepartmentClearance[] {
  return [
    {
      departmentKey: 'regional_office',
      departmentName: 'AICTE Regional Office (Field Inspection & Liaison)',
      isMandatory: true,
      status: 'Pending',
      comments: 'Awaiting local physical verification and campus intake surrender report.',
    },
    {
      departmentKey: 'approval_bureau',
      departmentName: 'Approval Bureau (HQ - Regulatory Compliance)',
      isMandatory: true,
      status: 'Pending',
      comments: 'Awaiting council resolution clearance for program surrender.',
    },
    {
      departmentKey: 'pgrc_grc',
      departmentName: 'Public Grievance Redressal Cell (PGRC)',
      isMandatory: true,
      status: 'Pending',
      comments: 'Verifying zero pending student/faculty fee grievances or disputes.',
    },
    {
      departmentKey: 'finance_vigilance',
      departmentName: 'Finance & Vigilance Scrutiny Cell',
      isMandatory: true,
      status: 'Pending',
      comments: 'Auditing statutory dues and bank lien status.',
    },
  ];
}

export function evaluateClearancesState(clearances: IDepartmentClearance[]): {
  isAllMandatoryApproved: boolean;
  blockingDepartments: string[];
  totalDepartments: number;
  approvedCount: number;
  objectedCount: number;
  pendingCount: number;
} {
  const blockingDepartments: string[] = [];
  let approvedCount = 0;
  let objectedCount = 0;
  let pendingCount = 0;

  for (const c of clearances) {
    if (c.status === 'Approved' || c.status === 'Waived') {
      approvedCount++;
    } else {
      if (c.status === 'Objected') objectedCount++;
      if (c.status === 'Pending') pendingCount++;
      if (c.isMandatory) {
        blockingDepartments.push(c.departmentName);
      }
    }
  }

  return {
    isAllMandatoryApproved: blockingDepartments.length === 0,
    blockingDepartments,
    totalDepartments: clearances.length,
    approvedCount,
    objectedCount,
    pendingCount,
  };
}

export async function processClearanceDecision(
  refund: IRefundRequest,
  deptKey: string,
  newStatus: ClearanceStatus,
  officerId: any,
  officerName: string,
  comments?: string,
  objectionReason?: string
): Promise<IRefundRequest> {
  const clearance = refund.clearances.find(c => c.departmentKey === deptKey);
  if (!clearance) {
    throw new Error(`Configured department '${deptKey}' not found in release case.`);
  }

  clearance.status = newStatus;
  clearance.decidedAt = new Date();
  clearance.decidedBy = officerId;
  clearance.decidedByName = officerName;
  if (comments) clearance.comments = comments;
  if (objectionReason) clearance.objectionReason = objectionReason;

  // Add observation record
  refund.approvalObservations.push({
    stage: `Department Clearance: ${clearance.departmentName}`,
    officerId,
    officerName,
    decision: newStatus,
    remarks: comments || objectionReason || `Department clearance updated to ${newStatus}.`,
    date: new Date(),
  });

  // Evaluate if all are approved
  const evaluation = evaluateClearancesState(refund.clearances);
  if (evaluation.isAllMandatoryApproved && refund.status === 'Under Document Review') {
    refund.status = 'Under Approval';
  } else if (newStatus === 'Objected') {
    refund.status = 'Additional Information Required';
  }

  await refund.save();
  return refund;
}

export async function generateRegulatoryNOC(
  refund: IRefundRequest,
  officerId: any,
  officerName: string
): Promise<{ success: boolean; nocReference?: string; error?: string }> {
  // Server-side strict guard: NOC CANNOT be generated if any mandatory clearance is not Approved/Waived!
  const evalResult = evaluateClearancesState(refund.clearances);
  if (!evalResult.isAllMandatoryApproved) {
    return {
      success: false,
      error: `NOC Generation Blocked: ${evalResult.blockingDepartments.length} mandatory clearance(s) pending or objected (${evalResult.blockingDepartments.join(', ')}).`,
    };
  }

  const nocNumber = `AICTE/NOC/${new Date().getFullYear()}/${refund.requestReference}`;
  refund.nocGenerated = true;
  refund.nocReferenceNumber = nocNumber;
  refund.nocGeneratedAt = new Date();
  refund.nocGeneratedBy = officerId;
  refund.status = 'Completed';
  refund.finalOutcome = `Statutory No-Objection Certificate (${nocNumber}) granted by AICTE Council. Lien revoked.`;

  // Release the linked FDR
  const fdr = await FDR.findById(refund.fdrId);
  if (fdr) {
    fdr.currentStatus = 'Released';
    await fdr.save();
  }

  refund.approvalObservations.push({
    stage: 'NOC Certificate Issuance',
    officerId,
    officerName,
    decision: 'NOC Issued',
    remarks: `Council NOC ${nocNumber} generated. Security deposit lien officially released.`,
    date: new Date(),
  });

  await refund.save();
  return { success: true, nocReference: nocNumber };
}
