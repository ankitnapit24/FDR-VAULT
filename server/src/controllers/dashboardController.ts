import { Response } from 'express';
import { FDR } from '../models/FDR.js';
import { Institution } from '../models/Institution.js';
import { Trust } from '../models/Trust.js';
import { AppDocument } from '../models/Document.js';
import { RenewalRequest } from '../models/RenewalRequest.js';
import { RefundRequest } from '../models/RefundRequest.js';
import { AuditLog } from '../models/AuditLog.js';
import { BankVerificationRequest } from '../models/BankVerificationRequest.js';
import { AuthRequest, getScopedInstitutionIds } from '../middleware/authMiddleware.js';

export async function getDashboardSummary(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const scopedIds = await getScopedInstitutionIds(user);

    const fdrFilter: any = {};
    const instFilter: any = {};
    const docFilter: any = {};
    const renFilter: any = {};
    const refFilter: any = {};
    const auditFilter: any = {};
    const bankFilter: any = {};

    if (scopedIds !== null) {
      fdrFilter.institutionId = { $in: scopedIds };
      instFilter._id = { $in: scopedIds };
      docFilter.institutionId = { $in: scopedIds };
      renFilter.institutionId = { $in: scopedIds };
      refFilter.institutionId = { $in: scopedIds };
      auditFilter.institutionId = { $in: scopedIds };
      bankFilter.institutionId = { $in: scopedIds };
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
      pendingBankTickets,
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
      BankVerificationRequest.countDocuments({
        ...bankFilter,
        status: { $in: ['Initiated', 'Dispatched'] },
      }),
      FDR.aggregate([
        { $match: fdrFilter },
        { $group: { _id: null, total: { $sum: '$depositAmount' } } },
      ]),
      FDR.find({
        ...fdrFilter,
        priorityScore: { $gte: 15 },
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
      user.role === 'admin' || user.role === 'officer'
        ? AuditLog.find(auditFilter).sort({ timestamp: -1 }).limit(10)
        : Promise.resolve([]),
    ]);

    const totalDepositAmount = totalDepositAgg[0]?.total || 0;

    // Role-specific supplemental data
    let roleMeta: any = { role: user.role };

    if (user.role === 'institution' && user.institutionId) {
      const institution = await Institution.findById(user.institutionId);
      roleMeta.institution = institution;
    } else if (user.role === 'trust' && user.trustId) {
      const trust = await Trust.findById(user.trustId).populate('institutionIds', 'name institutionCode type status approvedIntake');
      const trustInstitutions = await Institution.find({ trustId: user.trustId });
      
      // Calculate campus breakdown for trustee
      const campusBreakdown = await Promise.all(
        trustInstitutions.map(async inst => {
          const instFdrs = await FDR.find({ institutionId: inst._id });
          const totalAmt = instFdrs.reduce((sum, f) => sum + (f.depositAmount || 0), 0);
          return {
            _id: inst._id,
            name: inst.name,
            code: inst.institutionCode,
            type: inst.type,
            fdrCount: instFdrs.length,
            totalDeposit: totalAmt,
          };
        })
      );

      roleMeta.trust = trust;
      roleMeta.campuses = campusBreakdown;
    }

    res.json({
      success: true,
      roleMeta,
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
        pendingBankTickets,
      },
      priorityCases,
      upcomingMaturities,
      recentActivities,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error generating dashboard data.' });
  }
}
