import mongoose, { Schema, Document } from 'mongoose';

export type BankVerificationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Pending Response'
  | 'Responded'
  | 'Verified'
  | 'Unable to Verify'
  | 'Cancelled';

export interface IBankVerificationRequest extends Document {
  requestReference: string;
  fdrId: mongoose.Types.ObjectId;
  institutionId: mongoose.Types.ObjectId;
  fdrNumber: string;
  bankName: string;
  branchName: string;
  ifscCode: string;
  claimedDepositAmount: number;
  verificationMethod: 'Official Bank Portal' | 'SFMS / Formal Letter' | 'Offline Institutional Liaison';
  status: BankVerificationStatus;
  requestedBy: mongoose.Types.ObjectId;
  submittedAt?: Date;
  respondedAt?: Date;
  bankOfficerName?: string;
  bankOfficerDesignation?: string;
  responseNotes?: string;
  lienConfirmed?: boolean;
  amountConfirmed?: number;
  evidenceDocumentId?: mongoose.Types.ObjectId;
  isDemoMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BankVerificationRequestSchema = new Schema<IBankVerificationRequest>(
  {
    requestReference: { type: String, required: true, unique: true, uppercase: true },
    fdrId: { type: Schema.Types.ObjectId, ref: 'FDR', required: true, index: true },
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    fdrNumber: { type: String, required: true, trim: true },
    bankName: { type: String, required: true },
    branchName: { type: String, default: '' },
    ifscCode: { type: String, required: true, uppercase: true, trim: true },
    claimedDepositAmount: { type: Number, required: true },
    verificationMethod: {
      type: String,
      enum: ['Official Bank Portal', 'SFMS / Formal Letter', 'Offline Institutional Liaison'],
      default: 'Official Bank Portal',
    },
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Pending Response', 'Responded', 'Verified', 'Unable to Verify', 'Cancelled'],
      default: 'Pending Response',
      index: true,
    },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    submittedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date, default: null },
    bankOfficerName: { type: String, default: '' },
    bankOfficerDesignation: { type: String, default: '' },
    responseNotes: { type: String, default: '' },
    lienConfirmed: { type: Boolean, default: false },
    amountConfirmed: { type: Number, default: 0 },
    evidenceDocumentId: { type: Schema.Types.ObjectId, ref: 'Document', default: null },
    isDemoMode: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const BankVerificationRequest = mongoose.model<IBankVerificationRequest>(
  'BankVerificationRequest',
  BankVerificationRequestSchema
);
