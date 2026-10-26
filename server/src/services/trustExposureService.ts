import { Trust, ITrust } from '../models/Trust.js';
import { Institution } from '../models/Institution.js';
import { FDR } from '../models/FDR.js';
import { RefundRequest } from '../models/RefundRequest.js';
import { calculateDepositAdequacy } from './policyAdequacyService.js';

export interface TrustExposureSummary {
  trust: {
    id: string;
    trustName: string;
    registrationNumber: string;
    chairmanName: string;
    contactEmail: string;
    city: string;
    state: string;
  };
  metrics: {
    totalInstitutions: number;
    totalApprovedIntake: number;
    cumulativeRequiredDeposit: number;
    cumulativeEligibleActiveDeposit: number;
    netShortfallOrSurplus: number;
    isOverallAdequate: boolean;
    totalActiveFdrs: number;
    impendingMaturitiesCount: number;
    pendingRefundRequestsCount: number;
  };
  institutionsBreakdown: Array<{
    id: string;
    code: string;
    name: string;
    discipline: string;
    approvedIntake: number;
    requiredDeposit: number;
    activeDeposit: number;
    shortfallOrSurplus: number;
    isAdequate: boolean;
    activeFdrCount: number;
  }>;
  evaluatedAt: Date;
}

export async function getTrustConsolidatedExposure(trustId: string): Promise<TrustExposureSummary> {
  const trust = await Trust.findById(trustId);
  if (!trust) throw new Error('Trust entity not found.');

  const institutions = await Institution.find({
    $or: [{ _id: { $in: trust.institutionIds } }, { trustId: trust._id }],
  });

  let totalIntake = 0;
  let cumulativeRequired = 0;
  let cumulativeEligible = 0;
  let totalActiveFdrs = 0;
  const breakdown: any[] = [];

  const now = new Date();
  const in60Days = new Date();
  in60Days.setDate(in60Days.getDate() + 60);

  const institutionIds = institutions.map(i => i._id);

  const [upcomingMaturitiesCount, pendingRefundsCount] = await Promise.all([
    FDR.countDocuments({
      institutionId: { $in: institutionIds },
      currentStatus: { $in: ['Active', 'Expiring Soon'] },
      maturityDate: { $gte: now, $lte: in60Days },
    }),
    RefundRequest.countDocuments({
      institutionId: { $in: institutionIds },
      status: { $in: ['Submitted', 'Under Document Review', 'Under Approval'] },
    }),
  ]);

  for (const inst of institutions) {
    totalIntake += inst.approvedIntake || 0;

    let adequacy;
    try {
      adequacy = await calculateDepositAdequacy(inst._id.toString());
    } catch (e) {
      adequacy = {
        calculation: {
          totalRequiredDeposit: 0,
          eligibleActiveFDRTotal: 0,
          shortfallOrSurplus: 0,
          isAdequate: true,
          eligibleFdrCount: 0,
        },
      };
    }

    cumulativeRequired += adequacy.calculation.totalRequiredDeposit;
    cumulativeEligible += adequacy.calculation.eligibleActiveFDRTotal;
    totalActiveFdrs += adequacy.calculation.eligibleFdrCount;

    breakdown.push({
      id: inst._id.toString(),
      code: inst.institutionCode,
      name: inst.name,
      discipline: inst.type,
      approvedIntake: inst.approvedIntake,
      requiredDeposit: adequacy.calculation.totalRequiredDeposit,
      activeDeposit: adequacy.calculation.eligibleActiveFDRTotal,
      shortfallOrSurplus: adequacy.calculation.shortfallOrSurplus,
      isAdequate: adequacy.calculation.isAdequate,
      activeFdrCount: adequacy.calculation.eligibleFdrCount,
    });
  }

  const netShortfallOrSurplus = cumulativeEligible - cumulativeRequired;

  return {
    trust: {
      id: trust._id.toString(),
      trustName: trust.trustName,
      registrationNumber: trust.registrationNumber,
      chairmanName: trust.chairmanName,
      contactEmail: trust.contactEmail,
      city: trust.registeredAddress.city,
      state: trust.registeredAddress.state,
    },
    metrics: {
      totalInstitutions: institutions.length,
      totalApprovedIntake: totalIntake,
      cumulativeRequiredDeposit: cumulativeRequired,
      cumulativeEligibleActiveDeposit: cumulativeEligible,
      netShortfallOrSurplus,
      isOverallAdequate: netShortfallOrSurplus >= 0,
      totalActiveFdrs,
      impendingMaturitiesCount: upcomingMaturitiesCount,
      pendingRefundRequestsCount: pendingRefundsCount,
    },
    institutionsBreakdown: breakdown,
    evaluatedAt: new Date(),
  };
}
