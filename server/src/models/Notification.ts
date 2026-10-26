import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
  | 'Maturity Alert'
  | 'Verification Needed'
  | 'Renewal Pending'
  | 'Refund Status Update'
  | 'Discrepancy Detected'
  | 'System';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface INotification extends Document {
  userId?: mongoose.Types.ObjectId;
  targetRole?: 'admin' | 'officer' | 'institution';
  institutionId?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: 'FDR' | 'Document' | 'RenewalRequest' | 'RefundRequest' | 'Institution';
  relatedEntityId?: mongoose.Types.ObjectId;
  priority: NotificationPriority;
  dueAt?: Date;
  readAt?: Date;
  dedupKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    targetRole: { type: String, enum: ['admin', 'officer', 'institution'], default: null },
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', default: null },
    type: {
      type: String,
      enum: [
        'Maturity Alert',
        'Verification Needed',
        'Renewal Pending',
        'Refund Status Update',
        'Discrepancy Detected',
        'System',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedEntityType: {
      type: String,
      enum: ['FDR', 'Document', 'RenewalRequest', 'RefundRequest', 'Institution'],
      default: null,
    },
    relatedEntityId: { type: Schema.Types.ObjectId, default: null },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    dueAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
    dedupKey: { type: String, default: null, index: true },
  },
  { timestamps: true }
);

NotificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
