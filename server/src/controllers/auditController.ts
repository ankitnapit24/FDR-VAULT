import { Response } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { verifyAuditLedgerIntegrity } from '../services/auditLedgerService.js';

export async function verifyAuditLedger(req: AuthRequest, res: Response): Promise<void> {
  try {
    const verification = await verifyAuditLedgerIntegrity();
    res.json({
      success: true,
      verification,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error checking audit chain integrity.' });
  }
}

export async function getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { entityType, entityId, actorRole, page = '1', limit = '20' } = req.query;

    const query: any = {};

    if (user.role === 'institution') {
      if (!user.institutionId) {
        res.status(200).json({ success: true, logs: [], total: 0 });
        return;
      }
      query.institutionId = user.institutionId;
    }

    if (entityType) {
      query.entityType = entityType;
    }

    if (entityId) {
      query.entityId = entityId;
    }

    if (actorRole) {
      query.actorRole = actorRole;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actorId', 'name email role')
        .populate('institutionId', 'name institutionCode')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      logs,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching audit logs.' });
  }
}
