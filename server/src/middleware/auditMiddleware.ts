import { Request } from 'express';
import { AuthRequest } from './authMiddleware.js';
import { appendAuditBlock } from '../services/auditLedgerService.js';

export interface AuditParams {
  req?: AuthRequest | Request;
  action: string;
  entityType: 'FDR' | 'Document' | 'Institution' | 'RenewalRequest' | 'RefundRequest' | 'User' | 'SystemSetting' | 'Trust' | 'PolicyRule' | 'BankVerification';
  entityId: string;
  institutionId?: any;
  previousValues?: any;
  newValues?: any;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    const authReq = params.req as AuthRequest | undefined;
    const actorId = authReq?.user?._id;
    const actorName = authReq?.user?.name || 'System';
    const actorRole = authReq?.user?.role || 'System';
    
    // Extract IP safely
    const ipAddress =
      (authReq?.headers['x-forwarded-for'] as string) ||
      authReq?.socket?.remoteAddress ||
      '';
    const userAgent = (authReq?.headers['user-agent'] as string) || '';

    await appendAuditBlock({
      actorId,
      actorName,
      actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      institutionId: params.institutionId || authReq?.user?.institutionId || null,
      previousValues: params.previousValues,
      newValues: params.newValues,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    console.error('[AuditLog] Error recording audit block:', err);
  }
}
