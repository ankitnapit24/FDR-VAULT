import mongoose, { Schema, Document } from 'mongoose';

export type RenewalStatusType =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Additional Information Required'
  | 'Approved'
  | 'Rejected';

export interface IRenewalRequest extends Document {
  institutionId: mongoose.Types.ObjectId;
  existingFdrId: mongoose.Types.ObjectId;
  replacementFdrId?: mongoose.Types.ObjectId;
  requestReference: string;
  reason: string;
  proposedTenureMonths: number;
  supportingDocuments: mongoose.Types.ObjectId[];
  status: RenewalStatusType;
  submittedBy: mongoose.Types.ObjectId;
  assignedOfficer?: mongoose.Types.ObjectId;
  reviewRemarks?: string;
  decisionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RenewalRequestSchema = new Schema<IRenewalRequest>(
  {
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    existingFdrId: { type: Schema.Types.ObjectId, ref: 'FDR', required: true, index: true },
    replacementFdrId: { type: Schema.Types.ObjectId, ref: 'FDR', default: null },
    requestReference: { type: String, required: true, unique: true },
    reason: { type: String, required: true },
    proposedTenureMonths: { type: Number, default: 60 },
    supportingDocuments: [{ type: Schema.Types.ObjectId, ref: 'Document' }],
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Under Review', 'Additional Information Required', 'Approved', 'Rejected'],
      default: 'Submitted',
      index: true,
    },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedOfficer: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewRemarks: { type: String, default: '' },
    decisionDate: { type: Date, default: null },
  },
  { timestamps: true }
);

export const RenewalRequest = mongoose.model<IRenewalRequest>('RenewalRequest', RenewalRequestSchema);
