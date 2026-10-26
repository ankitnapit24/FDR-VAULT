import mongoose, { Schema, Document } from 'mongoose';

export type VerificationStatus =
  | 'Pending Verification'
  | 'Under Scrutiny'
  | 'Verified'
  | 'Rejected'
  | 'Additional Information Required';

export type CurrentStatus =
  | 'Active'
  | 'Expiring Soon'
  | 'Matured'
  | 'Renewed'
  | 'Released'
  | 'Under Dispute';

export type RenewalStatus =
  | 'Not Applicable'
  | 'Renewal Pending'
  | 'Renewal Requested'
  | 'Renewal Approved'
  | 'Renewed';

export interface IScrutinyObservation {
  officerId: mongoose.Types.ObjectId;
  officerName: string;
  observation: string;
  createdAt: Date;
}

export interface IFDR extends Document {
  institutionId: mongoose.Types.ObjectId;
  fdrNumber: string;
  bankName: string;
  branchName: string;
  ifscCode: string;
  depositAmount: number;
  issueDate: Date;
  maturityDate: Date;
  tenureMonths: number;
  interestRate: number;
  jointHolderName: string;
  verificationStatus: VerificationStatus;
  currentStatus: CurrentStatus;
  renewalStatus: RenewalStatus;
  previousFdrId?: mongoose.Types.ObjectId;
  replacementFdrId?: mongoose.Types.ObjectId;
  remarks?: string;
  scrutinyObservations: IScrutinyObservation[];
  priorityScore: number;
  priorityReason: string;
  createdAt: Date;
  updatedAt: Date;
}

const FDRSchema = new Schema<IFDR>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    fdrNumber: { type: String, required: true, trim: true, index: true },
    bankName: { type: String, required: true, trim: true },
    branchName: { type: String, default: '' },
    ifscCode: { type: String, uppercase: true, trim: true, default: '' },
    depositAmount: { type: Number, required: true, min: 0 },
    issueDate: { type: Date, required: true },
    maturityDate: { type: Date, required: true, index: true },
    tenureMonths: { type: Number, default: 60 },
    interestRate: { type: Number, default: 6.5 },
    jointHolderName: { type: String, default: 'Regional Officer, AICTE & Principal' },
    verificationStatus: {
      type: String,
      enum: [
        'Pending Verification',
        'Under Scrutiny',
        'Verified',
        'Rejected',
        'Additional Information Required',
      ],
      default: 'Pending Verification',
      index: true,
    },
    currentStatus: {
      type: String,
      enum: ['Active', 'Expiring Soon', 'Matured', 'Renewed', 'Released', 'Under Dispute'],
      default: 'Active',
      index: true,
    },
    renewalStatus: {
      type: String,
      enum: [
        'Not Applicable',
        'Renewal Pending',
        'Renewal Requested',
        'Renewal Approved',
        'Renewed',
      ],
      default: 'Not Applicable',
    },
    previousFdrId: { type: Schema.Types.ObjectId, ref: 'FDR', default: null },
    replacementFdrId: { type: Schema.Types.ObjectId, ref: 'FDR', default: null },
    remarks: { type: String, default: '' },
    scrutinyObservations: [
      {
        officerId: { type: Schema.Types.ObjectId, ref: 'User' },
        officerName: { type: String, default: '' },
        observation: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    priorityScore: { type: Number, default: 0 },
    priorityReason: { type: String, default: 'Standard case' },
  },
  { timestamps: true }
);

FDRSchema.index({ fdrNumber: 1, bankName: 1 });
FDRSchema.index({ maturityDate: 1, currentStatus: 1 });

export const FDR = mongoose.model<IFDR>('FDR', FDRSchema);
