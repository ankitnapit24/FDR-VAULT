import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  sequenceNumber: number;
  actorId?: mongoose.Types.ObjectId;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: 'FDR' | 'Document' | 'Institution' | 'RenewalRequest' | 'RefundRequest' | 'User' | 'SystemSetting' | 'Trust' | 'PolicyRule' | 'BankVerification';
  entityId: string;
  institutionId?: mongoose.Types.ObjectId;
  previousValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  canonicalData: string;
  previousHash: string;
  currentHash: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    sequenceNumber: { type: Number, required: true, unique: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actorName: { type: String, default: 'System' },
    actorRole: { type: String, default: 'System' },
    action: { type: String, required: true },
    entityType: {
      type: String,
      enum: ['FDR', 'Document', 'Institution', 'RenewalRequest', 'RefundRequest', 'User', 'SystemSetting', 'Trust', 'PolicyRule', 'BankVerification'],
      required: true,
      index: true,
    },
    entityId: { type: String, required: true, index: true },
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', default: null, index: true },
    previousValues: { type: Schema.Types.Mixed, default: null },
    newValues: { type: Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    canonicalData: { type: String, default: '' },
    previousHash: { type: String, required: true },
    currentHash: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

AuditLogSchema.index({ timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
