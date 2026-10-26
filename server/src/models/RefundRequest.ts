import mongoose, { Schema, Document } from 'mongoose';

export type RefundStatusType =
  | 'Draft'
  | 'Submitted'
  | 'Under Document Review'
  | 'Additional Information Required'
  | 'Under Approval'
  | 'Approved'
  | 'Rejected'
  | 'Sent for Authorized External Processing'
  | 'Completed';

export type ClearanceStatus = 'Pending' | 'Approved' | 'Objected' | 'Waived';

export interface IDepartmentClearance {
  departmentKey: string;
  departmentName: string;
  isMandatory: boolean;
  status: ClearanceStatus;
  assignedOfficerId?: mongoose.Types.ObjectId;
  assignedOfficerName?: string;
  comments?: string;
  objectionReason?: string;
  decidedAt?: Date;
  decidedBy?: mongoose.Types.ObjectId;
  decidedByName?: string;
  auditRef?: string;
}

export interface IApprovalObservation {
  stage: string;
  officerId: mongoose.Types.ObjectId;
  officerName: string;
  decision: string;
  remarks: string;
  date: Date;
}

export interface IRefundRequest extends Document {
  institutionId: mongoose.Types.ObjectId;
  fdrId: mongoose.Types.ObjectId;
  requestReference: string;
  reason: 'Closure of Program' | 'Reduction in Intake' | 'Excess Deposit' | 'Statutory Release' | 'Other';
  refundAmount: number;
  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
  };
  supportingDocuments: mongoose.Types.ObjectId[];
  clearances: IDepartmentClearance[];
  nocGenerated: boolean;
  nocReferenceNumber?: string;
  nocGeneratedAt?: Date;
  nocGeneratedBy?: mongoose.Types.ObjectId;
  preCheckResult?: any;
  status: RefundStatusType;
  submittedBy: mongoose.Types.ObjectId;
  assignedOfficer?: mongoose.Types.ObjectId;
  remarks?: string;
  approvalObservations: IApprovalObservation[];
  finalOutcome?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RefundRequestSchema = new Schema<IRefundRequest>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    fdrId: { type: Schema.Types.ObjectId, ref: 'FDR', required: true, index: true },
    requestReference: { type: String, required: true, unique: true },
    reason: {
      type: String,
      enum: ['Closure of Program', 'Reduction in Intake', 'Excess Deposit', 'Statutory Release', 'Other'],
      required: true,
    },
    refundAmount: { type: Number, required: true, min: 0 },
    bankDetails: {
      accountHolderName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      bankName: { type: String, required: true },
      ifscCode: { type: String, required: true, uppercase: true },
    },
    supportingDocuments: [{ type: Schema.Types.ObjectId, ref: 'Document' }],
    clearances: [
      {
        departmentKey: { type: String, required: true },
        departmentName: { type: String, required: true },
        isMandatory: { type: Boolean, default: true },
        status: {
          type: String,
          enum: ['Pending', 'Approved', 'Objected', 'Waived'],
          default: 'Pending',
        },
        assignedOfficerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        assignedOfficerName: { type: String, default: '' },
        comments: { type: String, default: '' },
        objectionReason: { type: String, default: '' },
        decidedAt: { type: Date, default: null },
        decidedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        decidedByName: { type: String, default: '' },
        auditRef: { type: String, default: '' },
      },
    ],
    nocGenerated: { type: Boolean, default: false },
    nocReferenceNumber: { type: String, default: '' },
    nocGeneratedAt: { type: Date, default: null },
    nocGeneratedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    preCheckResult: { type: Schema.Types.Mixed, default: null },
    status: {
      type: String,
      enum: [
        'Draft',
        'Submitted',
        'Under Document Review',
        'Additional Information Required',
        'Under Approval',
        'Approved',
        'Rejected',
        'Sent for Authorized External Processing',
        'Completed',
      ],
      default: 'Submitted',
      index: true,
    },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedOfficer: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    remarks: { type: String, default: '' },
    approvalObservations: [
      {
        stage: { type: String, required: true },
        officerId: { type: Schema.Types.ObjectId, ref: 'User' },
        officerName: { type: String, default: '' },
        decision: { type: String, required: true },
        remarks: { type: String, default: '' },
        date: { type: Date, default: Date.now },
      },
    ],
    finalOutcome: { type: String, default: '' },
  },
  { timestamps: true }
);

export const RefundRequest = mongoose.model<IRefundRequest>('RefundRequest', RefundRequestSchema);
