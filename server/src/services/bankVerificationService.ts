import { BankVerificationRequest, IBankVerificationRequest, BankVerificationStatus } from '../models/BankVerificationRequest.js';
import { FDR } from '../models/FDR.js';
import { logAudit } from '../middleware/auditMiddleware.js';

const KNOWN_IFSC_BANKS: Record<string, string> = {
  SBIN: 'State Bank of India',
  PUNB: 'Punjab National Bank',
  BARB: 'Bank of Baroda',
  CNRB: 'Canara Bank',
  UBIN: 'Union Bank of India',
  HDFC: 'HDFC Bank',
  ICIC: 'ICICI Bank',
  UTIB: 'Axis Bank',
  KKBK: 'Kotak Mahindra Bank',
  IDIB: 'Indian Bank',
};

export function validateIFSCSyntax(ifsc: string): boolean {
  if (!ifsc) return false;
  const clean = ifsc.trim().toUpperCase();
  // Standard RBI IFSC Format: 4 alphabetic characters, followed by '0', followed by 6 alphanumeric characters
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(clean);
}

export function lookupBankMetadata(ifsc: string): {
  isValidFormat: boolean;
  bankName: string;
  sourceNote: string;
  isMockDemo: boolean;
} {
  const clean = (ifsc || '').trim().toUpperCase();
  const isValidFormat = validateIFSCSyntax(clean);

  if (!isValidFormat) {
    return {
      isValidFormat: false,
      bankName: 'Unknown / Invalid IFSC',
      sourceNote: 'IFSC does not match standard 11-character RBI syntax (e.g. SBIN0001234).',
      isMockDemo: true,
    };
  }

  const prefix = clean.substring(0, 4);
  const detectedBank = KNOWN_IFSC_BANKS[prefix] || 'Scheduled Commercial Bank';

  return {
    isValidFormat: true,
    bankName: detectedBank,
    sourceNote: 'Format checked (Regex valid); Core banking reference lookup simulated in offline demonstration mode (DEMO/MOCK).',
    isMockDemo: true,
  };
}

export async function createBankVerificationTicket(params: {
  fdrId: string;
  requestedBy: any;
  verificationMethod?: any;
}): Promise<IBankVerificationRequest> {
  const fdr = await FDR.findById(params.fdrId);
  if (!fdr) throw new Error('FDR instrument not found.');

  const refNumber = `BVR-${Date.now().toString().slice(-6)}`;

  const ticket = await BankVerificationRequest.create({
    requestReference: refNumber,
    fdrId: fdr._id,
    institutionId: fdr.institutionId,
    fdrNumber: fdr.fdrNumber,
    bankName: fdr.bankName,
    branchName: fdr.branchName,
    ifscCode: fdr.ifscCode,
    claimedDepositAmount: fdr.depositAmount,
    verificationMethod: params.verificationMethod || 'Official Bank Portal',
    status: 'Pending Response',
    requestedBy: params.requestedBy,
    submittedAt: new Date(),
    isDemoMode: true,
  });

  return ticket;
}

export async function updateBankVerificationStatus(params: {
  ticketId: string;
  status: BankVerificationStatus;
  bankOfficerName?: string;
  bankOfficerDesignation?: string;
  responseNotes?: string;
  lienConfirmed?: boolean;
  amountConfirmed?: number;
  actor: any;
}): Promise<IBankVerificationRequest> {
  const ticket = await BankVerificationRequest.findById(params.ticketId);
  if (!ticket) throw new Error('Bank verification ticket not found.');

  ticket.status = params.status;
  ticket.respondedAt = new Date();
  if (params.bankOfficerName) ticket.bankOfficerName = params.bankOfficerName;
  if (params.bankOfficerDesignation) ticket.bankOfficerDesignation = params.bankOfficerDesignation;
  if (params.responseNotes) ticket.responseNotes = params.responseNotes;
  if (params.lienConfirmed !== undefined) ticket.lienConfirmed = params.lienConfirmed;
  if (params.amountConfirmed !== undefined) ticket.amountConfirmed = params.amountConfirmed;

  await ticket.save();

  // If verified by bank, update FDR verification status
  if (params.status === 'Verified' && params.lienConfirmed) {
    const fdr = await FDR.findById(ticket.fdrId);
    if (fdr) {
      fdr.verificationStatus = 'Verified';
      await fdr.save();
    }
  }

  return ticket;
}
