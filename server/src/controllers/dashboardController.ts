import { Response } from 'express';
import { FDR } from '../models/FDR.js';
import { Institution } from '../models/Institution.js';
import { AppDocument } from '../models/Document.js';
import { RenewalRequest } from '../models/RenewalRequest.js';
import { RefundRequest } from '../models/RefundRequest.js';
import { AuditLog } from '../models/AuditLog.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export async function getDashboardSummary(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const fdrFilter: any = {};
    const instFilter: any = {};
    const docFilter: any = {};
    const renFilter: any = {};
    const refFilter: any = {};
    const auditFilter: any = {};

    if (user.role === 'institution') {
      if (!user.institutionId) {
        res.status(200).json({ success: true, summary: {} });
        return;
      }
      fdrFilter.institutionId = user.institutionId;
      instFilter._id = user.institutionId;
      docFilter.institutionId = user.institutionId;
      renFilter.institutionId = user.institutionId;
      refFilter.institutionId = user.institutionId;
      auditFilter.institutionId = user.institutionId;
    }

    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const in60Days = new Date();
    in60Days.setDate(in60Days.getDate() + 60);

    const [
      totalInstitutions,
      totalFdrs,
      activeFdrs,
      expiringFdrs,
      maturedFdrs,
      renewedFdrs,
      releasedFdrs,
      pendingVerifications,
      pendingRenewals,
      pendingRefunds,
      totalDepositAgg,
      priorityCases,
      upcomingMaturities,
      recentActivities,
    ] = await Promise.all([
      Institution.countDocuments(instFilter),
      FDR.countDocuments(fdrFilter),
      FDR.countDocuments({ ...fdrFilter, currentStatus: 'Active' }),
      FDR.countDocuments({
        ...fdrFilter,
        $or: [
          { currentStatus: 'Expiring Soon' },
          { maturityDate: { $gte: now, $lte: in30Days }, currentStatus: { $in: ['Active', 'Expiring Soon'] } },
        ],
      }),
      FDR.countDocuments({ ...fdrFilter, currentStatus: 'Matured' }),
      FDR.countDocuments({ ...fdrFilter, currentStatus: 'Renewed' }),
      FDR.countDocuments({ ...fdrFilter, currentStatus: 'Released' }),
      AppDocument.countDocuments({
        ...docFilter,
        verificationStatus: { $in: ['Pending Verification', 'Uploaded', 'Additional Information Required'] },
      }),
      RenewalRequest.countDocuments({
        ...renFilter,
        status: { $in: ['Submitted', 'Under Review', 'Additional Information Required'] },
      }),
      RefundRequest.countDocuments({
        ...refFilter,
        status: { $in: ['Submitted', 'Under Document Review', 'Under Approval', 'Additional Information Required'] },
      }),
      FDR.aggregate([
        { $match: fdrFilter },
        { $group: { _id: null, total: { $sum: '$depositAmount' } } },
      ]),
      FDR.find({
        ...fdrFilter,
        priorityScore: { $gte: 20 },
      })
        .populate('institutionId', 'name institutionCode')
        .sort({ priorityScore: -1 })
        .limit(6),
      FDR.find({
        ...fdrFilter,
        maturityDate: { $gte: now, $lte: in60Days },
        currentStatus: { $in: ['Active', 'Expiring Soon'] },
      })
        .populate('institutionId', 'name institutionCode')
        .sort({ maturityDate: 1 })
        .limit(8),
      AuditLog.find(auditFilter).sort({ timestamp: -1 }).limit(10),
    ]);

    const totalDepositAmount = totalDepositAgg[0]?.total || 0;

    res.json({
      success: true,
      metrics: {
        totalInstitutions,
        totalFdrs,
        totalDepositAmount,
        activeFdrs,
        expiringFdrs,
        maturedFdrs,
        renewedFdrs,
        releasedFdrs,
        pendingVerifications,
        pendingRenewals,
        pendingRefunds,
      },
      priorityCases,
      upcomingMaturities,
      recentActivities,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error generating dashboard data.' });
  }
}
