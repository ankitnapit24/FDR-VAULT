export type UserRole = 'admin' | 'officer' | 'institution' | 'trust';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation?: string;
  phone?: string;
  institution?: {
    _id: string;
    name: string;
    institutionCode: string;
  };
  trustId?: string;
}

export interface Trust {
  _id: string;
  trustName: string;
  registrationNumber: string;
  panNumber: string;
  chairmanName: string;
  contactEmail: string;
  contactPhone: string;
  registeredAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  institutionIds: Institution[] | string[];
  createdAt: string;
  updatedAt: string;
}

export interface TrustExposureSummary {
  trust: Trust;
  institutionsCount: number;
  totalFdrsCount: number;
  totalActiveFdrAmount: number;
  totalRequiredDeposit: number;
  totalShortfall: number;
  totalSurplus: number;
  institutionsBreakdown: Array<{
    institutionId: string;
    institutionName: string;
    institutionCode: string;
    discipline: string;
    approvedIntake: number;
    activeFdrsCount: number;
    activeFdrsAmount: number;
    requiredDeposit: number;
    shortfall: number;
    surplus: number;
    isCompliant: boolean;
  }>;
}

export interface DisciplineRate {
  discipline: string;
  level: string;
  baseDepositAmount: number;
  perIntakeUnitAmount: number;
  intakeUnitSize: number;
}

export interface PolicyRule {
  _id: string;
  ruleCode: string;
  version: string;
  title: string;
  formulaDescription: string;
  regulatorySource: string;
  effectiveFrom: string;
  effectiveTo?: string;
  minimumTenureMonths: number;
  disciplineRates: DisciplineRate[];
  isActive: boolean;
  isIllustrativeDemoRule: boolean;
  createdAt: string;
}

export interface AdequacyEvaluation {
  institution: {
    id: string;
    name: string;
    code: string;
    discipline: string;
    approvedIntake: number;
  };
  policyUsed: {
    ruleCode: string;
    version: string;
    title: string;
    isIllustrativeDemoRule: boolean;
  };
  requiredDepositAmount: number;
  currentActiveDepositAmount: number;
  activeFdrCount: number;
  shortfallAmount: number;
  surplusAmount: number;
  isCompliant: boolean;
  explanation: string;
}

export type BankVerificationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Pending Response'
  | 'Responded'
  | 'Verified'
  | 'Unable to Verify'
  | 'Cancelled';

export interface BankVerificationRequest {
  _id: string;
  requestReference: string;
  fdrId: FDR | string;
  institutionId: Institution | string;
  fdrNumber: string;
  bankName: string;
  branchName: string;
  ifscCode: string;
  claimedDepositAmount: number;
  verificationMethod: 'Official Bank Portal' | 'SFMS / Formal Letter' | 'Offline Institutional Liaison';
  status: BankVerificationStatus;
  requestedBy: User | string;
  submittedAt?: string;
  respondedAt?: string;
  bankOfficerName?: string;
  bankOfficerDesignation?: string;
  responseNotes?: string;
  lienConfirmed?: boolean;
  amountConfirmed?: number;
  isDemoMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClearanceItem {
  departmentKey: string;
  departmentName: string;
  isMandatory: boolean;
  status: 'Pending' | 'Approved' | 'Objected' | 'Waived';
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  comments?: string;
  objectionReason?: string;
  decidedAt?: string;
  decidedBy?: string;
  decidedByName?: string;
  auditRef?: string;
}

export interface ReleasePreCheckItem {
  key: string;
  label: string;
  passed: boolean;
  details: string;
  blockingReasons?: string[];
}

export interface ReleasePreCheckResult {
  eligible: boolean;
  score: number;
  checks: ReleasePreCheckItem[];
  checkedAt: string;
}

export interface Institution {
  _id: string;
  institutionCode: string;
  name: string;
  type: 'Engineering' | 'Management' | 'Polytechnic' | 'Pharmacy' | 'Architecture' | 'Other';
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  contactEmail: string;
  contactPhone: string;
  status: 'Active' | 'Under Review' | 'Suspended';
  approvedIntake: number;
  establishedYear: number;
  stats?: {
    totalFdrs: number;
    totalAmount: number;
    activeCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FDR {
  _id: string;
  institutionId: Institution | string;
  fdrNumber: string;
  bankName: string;
  branchName: string;
  ifscCode: string;
  depositAmount: number;
  issueDate: string;
  maturityDate: string;
  tenureMonths: number;
  interestRate: number;
  jointHolderName: string;
  verificationStatus:
    | 'Pending Verification'
    | 'Under Scrutiny'
    | 'Verified'
    | 'Rejected'
    | 'Additional Information Required';
  currentStatus:
    | 'Active'
    | 'Expiring Soon'
    | 'Matured'
    | 'Renewed'
    | 'Released'
    | 'Under Dispute';
  renewalStatus:
    | 'Not Applicable'
    | 'Renewal Pending'
    | 'Renewal Requested'
    | 'Renewal Approved'
    | 'Renewed';
  previousFdrId?: FDR | string;
  replacementFdrId?: FDR | string;
  remarks?: string;
  scrutinyObservations?: Array<{
    officerId: string;
    officerName: string;
    observation: string;
    createdAt: string;
  }>;
  priorityScore: number;
  priorityReason: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscrepancyFlag {
  field: string;
  expected: any;
  found: any;
  description: string;
  severity: 'warning' | 'error';
}

export interface AppDocument {
  _id: string;
  institutionId: Institution | string;
  fdrId?: FDR | string;
  documentType:
    | 'FDR Certificate'
    | 'Bank Confirmation Letter'
    | 'Renewal Request Letter'
    | 'Refund Application'
    | 'Board Resolution'
    | 'Other';
  storageKey: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  fileHash?: string;
  hashAlgorithm?: string;
  integritySignals?: {
    isSafePdf?: boolean;
    hasJavascript?: boolean;
    hasSuspiciousActions?: boolean;
    producer?: string;
    pageCount?: number;
    error?: string;
  };
  hashHistory?: Array<{
    calculatedAt: string;
    fileHash: string;
    status: 'Verified' | 'Mismatch' | 'Error';
  }>;
  uploadedBy: User | string;
  verificationStatus:
    | 'Uploaded'
    | 'Pending Verification'
    | 'Verified'
    | 'Rejected'
    | 'Additional Information Required';
  verificationRemarks?: string;
  verifiedBy?: User | string;
  verifiedAt?: string;
  ocrExtracted: boolean;
  ocrData?: {
    fdrNumber?: string;
    bankName?: string;
    depositAmount?: number;
    issueDate?: string;
    maturityDate?: string;
    rawText?: string;
    confidence?: number;
  };
  discrepancyFlags: DiscrepancyFlag[];
  createdAt: string;
  updatedAt: string;
}

export interface RenewalRequest {
  _id: string;
  institutionId: Institution | string;
  existingFdrId: FDR;
  replacementFdrId?: FDR;
  requestReference: string;
  reason: string;
  proposedTenureMonths: number;
  supportingDocuments: AppDocument[];
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Additional Information Required' | 'Approved' | 'Rejected';
  submittedBy: User;
  assignedOfficer?: User;
  reviewRemarks?: string;
  decisionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RefundRequest {
  _id: string;
  institutionId: Institution | string;
  fdrId: FDR;
  requestReference: string;
  reason: 'Closure of Program' | 'Reduction in Intake' | 'Excess Deposit' | 'Statutory Release' | 'Other';
  refundAmount: number;
  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
  };
  supportingDocuments: AppDocument[];
  status:
    | 'Draft'
    | 'Submitted'
    | 'Under Document Review'
    | 'Additional Information Required'
    | 'Under Approval'
    | 'Approved'
    | 'Rejected'
    | 'Sent for Authorized External Processing'
    | 'Completed';
  clearances?: ClearanceItem[];
  nocGenerated?: boolean;
  nocGeneratedAt?: string;
  nocCertificateNumber?: string;
  preCheckResult?: ReleasePreCheckResult;
  submittedBy: User;
  assignedOfficer?: User;
  remarks?: string;
  approvalObservations: Array<{
    stage: string;
    officerId: string;
    officerName: string;
    decision: string;
    remarks: string;
    date: string;
  }>;
  finalOutcome?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  _id: string;
  userId?: string;
  targetRole?: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueAt?: string;
  readAt?: string;
  createdAt: string;
}

export interface AuditLogItem {
  _id: string;
  sequenceNumber?: number;
  previousHash?: string;
  currentHash?: string;
  canonicalData?: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  institutionId?: Institution;
  previousValues?: any;
  newValues?: any;
  ipAddress?: string;
  timestamp: string;
}

export interface AuditIntegrityVerificationResult {
  valid: boolean;
  totalBlocks: number;
  genesisHash: string;
  latestHash?: string;
  error?: string;
  brokenBlockSequence?: number;
}

export interface SystemSettingItem {
  _id: string;
  key: string;
  value: any;
  category: 'workflow' | 'notifications' | 'ai' | 'security';
  description: string;
  updatedAt: string;
}
