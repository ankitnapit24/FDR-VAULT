import { Notification, NotificationType, NotificationPriority } from '../models/Notification.js';

export interface CreateNotificationParams {
  userId?: any;
  targetRole?: 'admin' | 'officer' | 'institution';
  institutionId?: any;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: 'FDR' | 'Document' | 'RenewalRequest' | 'RefundRequest' | 'Institution';
  relatedEntityId?: any;
  priority?: NotificationPriority;
  dueAt?: Date;
  dedupKey?: string;
}

export async function sendNotification(params: CreateNotificationParams): Promise<void> {
  try {
    if (params.dedupKey) {
      const existing = await Notification.findOne({ dedupKey: params.dedupKey });
      if (existing) {
        // Notification already generated for this cycle
        return;
      }
    }

    await Notification.create({
      userId: params.userId || null,
      targetRole: params.targetRole || null,
      institutionId: params.institutionId || null,
      type: params.type,
      title: params.title,
      message: params.message,
      relatedEntityType: params.relatedEntityType || null,
      relatedEntityId: params.relatedEntityId || null,
      priority: params.priority || 'medium',
      dueAt: params.dueAt || null,
      dedupKey: params.dedupKey || null,
    });
  } catch (err) {
    console.error('[NotificationService] Error creating notification:', err);
  }
}
