import { FDR, IFDR } from '../models/FDR.js';
import { AppDocument } from '../models/Document.js';
import { validateIFSCSyntax } from './bankVerificationService.js';
import { IRefundRequest } from '../models/RefundRequest.js';

export interface PreCheckItem {
  key: string;
  title: string;
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  reason: string;
  guidance: string;
}

export interface ReleasePreCheckResult {
  isEligible: boolean;
  score: number;
  items: PreCheckItem[];
  evaluatedAt: Date;
  summary: string;
  disclaimer: string;
}

export async function evaluateReleaseEligibility(
  fdrId: string,
  refundRequest?: IRefundRequest | null
): Promise<ReleasePreCheckResult> {
  const fdr = await FDR.findById(fdrId);
  const items: PreCheckItem[] = [];

  if (!fdr) {
    return {
      isEligible: false,
      score: 0,
      items: [
        {
          key: 'fdr_exists',
          title: 'FDR Record Existence',
          passed: false,
          severity: 'error',
          reason: 'FDR instrument record not found in registry.',
          guidance: 'Verify the FDR identifier or register the deposit first.',
        },
      ],
      evaluatedAt: new Date(),
      summary: 'Evaluation failed: FDR not found.',
      disclaimer: 'Pre-check evaluation indicates regulatory checklist readiness only.',
    };
  }

  // 1. FDR Lifecycle Status Check
  const validStatuses = ['Active', 'Expiring Soon', 'Matured'];
  const statusPassed = validStatuses.includes(fdr.currentStatus);
  items.push({
    key: 'fdr_lifecycle_status',
    title: 'FDR Lifecycle Status Validity',
    passed: statusPassed,
    severity: 'error',
    reason: statusPassed
      ? `FDR status is '${fdr.currentStatus}', eligible for release processing.`
      : `FDR status is '${fdr.currentStatus}'. Instruments under dispute or already released cannot be released.`,
    guidance: statusPassed
      ? 'Instrument is active in registry.'
      : 'Resolve instrument dispute or check if already discharged.',
  });

  // 2. FDR Verification Status Check
  const isVerified = fdr.verificationStatus === 'Verified';
  items.push({
    key: 'fdr_verified',
    title: 'AICTE Regulatory Verification State',
    passed: isVerified,
    severity: 'error',
    reason: isVerified
      ? 'Deposit has been scrutinized and endorsed as Verified by an AICTE officer.'
      : `Deposit verification state is '${fdr.verificationStatus}'. Must be fully verified before release.`,
    guidance: isVerified
      ? 'Verification requirement satisfied.'
      : 'Submit supporting documents and await officer scrutiny verification.',
  });

  // 3. Document Completeness Check
  const documents = await AppDocument.find({ fdrId: fdr._id });
  const hasCertificate = documents.some(
    d => d.documentType === 'FDR Certificate' && d.verificationStatus === 'Verified'
  );
  const hasConfirmation = documents.some(
    d => d.documentType === 'Bank Confirmation Letter' && d.verificationStatus === 'Verified'
  );

  const docsPassed = hasCertificate && hasConfirmation;
  items.push({
    key: 'mandatory_documents',
    title: 'Mandatory Verified Supporting Documents',
    passed: docsPassed,
    severity: 'error',
    reason: docsPassed
      ? 'Mandatory FDR Certificate and Bank Lien Confirmation are verified on file.'
      : `Missing or unverified documents (${!hasCertificate ? 'Verified FDR Certificate ' : ''}${!hasConfirmation ? 'Verified Bank Confirmation' : ''}).`,
    guidance: docsPassed
      ? 'Documentary prerequisites complete.'
      : 'Upload the missing documents in the FDR dossier and obtain officer verification.',
  });

  // 4. Discrepancy Integrity Check
  const hasErrorDiscrepancies = documents.some(
    d => d.discrepancyFlags && d.discrepancyFlags.some(f => f.severity === 'error')
  );
  items.push({
    key: 'discrepancy_flags',
    title: 'Automated Discrepancy & Tamper Flags',
    passed: !hasErrorDiscrepancies,
    severity: 'error',
    reason: !hasErrorDiscrepancies
      ? 'No unresolved high-severity discrepancy flags detected.'
      : 'Unresolved discrepancy flags detected between uploaded documents and database records.',
    guidance: !hasErrorDiscrepancies
      ? 'Data consistency verified.'
      : 'Scrutinize deposit amount, FDR number, or bank details to clear discrepancy.',
  });

  // 5. Bank IFSC Code Validation Check
  const ifscValid = validateIFSCSyntax(fdr.ifscCode);
  items.push({
    key: 'ifsc_syntax',
    title: 'Bank IFSC Standard Syntax Check',
    passed: ifscValid,
    severity: 'warning',
    reason: ifscValid
      ? `IFSC '${fdr.ifscCode}' conforms to RBI alphanumeric format.`
      : `IFSC '${fdr.ifscCode}' is invalid or empty. Must match 4 letters, '0', 6 alphanumeric characters.`,
    guidance: ifscValid ? 'IFSC format valid.' : 'Update FDR record with valid branch IFSC code.',
  });

  // 6. Multi-Department Clearance Check (if refund request exists)
  if (refundRequest && refundRequest.clearances && refundRequest.clearances.length > 0) {
    const unapprovedMandatory = refundRequest.clearances.filter(
      c => c.isMandatory && c.status !== 'Approved' && c.status !== 'Waived'
    );
    const clearancesPassed = unapprovedMandatory.length === 0;
    items.push({
      key: 'department_clearances',
      title: 'Mandatory Multi-Department Clearances',
      passed: clearancesPassed,
      severity: 'error',
      reason: clearancesPassed
        ? 'All mandatory departmental clearances have been granted.'
        : `${unapprovedMandatory.length} departmental clearance(s) pending (${unapprovedMandatory.map(c => c.departmentName).join(', ')}).`,
      guidance: clearancesPassed
        ? 'Clearances satisfied.'
        : 'Ensure each authorized department reviews and grants their formal clearance.',
    });
  }

  const errorItems = items.filter(i => i.severity === 'error');
  const passedErrors = errorItems.filter(i => i.passed);
  const isEligible = errorItems.length === passedErrors.length;
  const score = Math.round((items.filter(i => i.passed).length / items.length) * 100);

  const summary = isEligible
    ? 'All statutory release prerequisites satisfied. Application is ready for executive Council review.'
    : `Ineligible for release: ${errorItems.length - passedErrors.length} mandatory requirement(s) failed.`;

  return {
    isEligible,
    score,
    items,
    evaluatedAt: new Date(),
    summary,
    disclaimer:
      'Notice: A successful pre-check evaluation indicates documentary and clearance readiness only. It does not constitute final council approval or prove that the bank has transferred funds.',
  };
}
