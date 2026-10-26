import { PolicyRule, IPolicyRule } from '../models/PolicyRule.js';
import { Institution, IInstitution } from '../models/Institution.js';
import { FDR } from '../models/FDR.js';

export interface DepositAdequacyResult {
  institution: {
    id: string;
    code: string;
    name: string;
    discipline: string;
    approvedIntake: number;
    intakeLevel: string;
  };
  policy: {
    ruleCode: string;
    version: string;
    title: string;
    regulatorySource: string;
    minimumTenureMonths: number;
    isIllustrativeDemoRule: boolean;
  };
  calculation: {
    baseRequiredAmount: number;
    intakeAdditionAmount: number;
    totalRequiredDeposit: number;
    eligibleActiveFDRTotal: number;
    shortfallOrSurplus: number; // positive = surplus, negative = shortfall
    isAdequate: boolean;
    tenureMismatchCount: number;
    eligibleFdrCount: number;
    ineligibleFdrCount: number;
    breakdownExplanation: string;
  };
  evaluatedAt: Date;
}

export async function calculateDepositAdequacy(
  institutionId: string,
  selectedPolicyVersion?: string
): Promise<DepositAdequacyResult> {
  const institution = await Institution.findById(institutionId);
  if (!institution) throw new Error('Institution profile not found.');

  // Find active or specified policy rule
  const query: any = { isActive: true };
  if (selectedPolicyVersion) {
    query.version = selectedPolicyVersion;
  }
  let policy = await PolicyRule.findOne(query).sort({ effectiveFrom: -1 });

  // If no policy rule exists, use fallback default benchmark
  if (!policy) {
    policy = await PolicyRule.create({
      ruleCode: 'AICTE-APH-2024',
      version: '2024.1',
      title: 'AICTE Approval Process Handbook (Illustrative Norm Benchmark)',
      formulaDescription: 'Base Security Deposit by Discipline + Variable Intake Tier Multiplier',
      regulatorySource: 'AICTE APH Guidelines (Demo Norm Rule)',
      effectiveFrom: new Date('2024-01-01'),
      minimumTenureMonths: 60,
      disciplineRates: [
        { discipline: 'Engineering', level: 'UG', baseDepositAmount: 3500000, perIntakeUnitAmount: 500000, intakeUnitSize: 60 },
        { discipline: 'Management', level: 'PG', baseDepositAmount: 2500000, perIntakeUnitAmount: 400000, intakeUnitSize: 60 },
        { discipline: 'Polytechnic', level: 'Diploma', baseDepositAmount: 2000000, perIntakeUnitAmount: 300000, intakeUnitSize: 60 },
        { discipline: 'Pharmacy', level: 'UG', baseDepositAmount: 2000000, perIntakeUnitAmount: 300000, intakeUnitSize: 60 },
        { discipline: 'Architecture', level: 'UG', baseDepositAmount: 2000000, perIntakeUnitAmount: 300000, intakeUnitSize: 60 },
        { discipline: 'Other', level: 'UG', baseDepositAmount: 1500000, perIntakeUnitAmount: 250000, intakeUnitSize: 60 },
      ],
      isActive: true,
      isIllustrativeDemoRule: true,
    });
  }

  // Find matching discipline rate
  const rate =
    policy.disciplineRates.find(
      r => r.discipline.toLowerCase() === institution.type.toLowerCase()
    ) ||
    policy.disciplineRates.find(r => r.discipline === 'Other') ||
    { baseDepositAmount: 2000000, perIntakeUnitAmount: 400000, intakeUnitSize: 60 };

  const intake = institution.approvedIntake || 0;
  const baseUnits = 2; // base covers 120 seats
  const additionalUnits = Math.max(0, Math.ceil(intake / (rate.intakeUnitSize || 60)) - baseUnits);
  const intakeAdditionAmount = additionalUnits * (rate.perIntakeUnitAmount || 500000);
  const totalRequiredDeposit = rate.baseDepositAmount + intakeAdditionAmount;

  // Retrieve FDRs
  const fdrs = await FDR.find({ institutionId: institution._id });

  let eligibleActiveFDRTotal = 0;
  let eligibleCount = 0;
  let ineligibleCount = 0;
  let tenureMismatchCount = 0;

  for (const f of fdrs) {
    const isEligibleStatus = ['Active', 'Expiring Soon'].includes(f.currentStatus);
    const isVerified = f.verificationStatus === 'Verified';

    if (isEligibleStatus && isVerified) {
      eligibleActiveFDRTotal += f.depositAmount;
      eligibleCount++;

      if (f.tenureMonths < policy.minimumTenureMonths) {
        tenureMismatchCount++;
      }
    } else {
      ineligibleCount++;
    }
  }

  const shortfallOrSurplus = eligibleActiveFDRTotal - totalRequiredDeposit;
  const isAdequate = shortfallOrSurplus >= 0;

  const breakdownExplanation = isAdequate
    ? `Adequate: Institution holds ₹${(eligibleActiveFDRTotal / 100000).toFixed(2)}L in verified active deposits against required statutory norm of ₹${(totalRequiredDeposit / 100000).toFixed(2)}L (Surplus: ₹${(shortfallOrSurplus / 100000).toFixed(2)}L).`
    : `Shortfall Detected: Institution holds ₹${(eligibleActiveFDRTotal / 100000).toFixed(2)}L against required statutory norm of ₹${(totalRequiredDeposit / 100000).toFixed(2)}L. Deficit of ₹${(Math.abs(shortfallOrSurplus) / 100000).toFixed(2)}L must be secured before approval renewal.`;

  return {
    institution: {
      id: institution._id.toString(),
      code: institution.institutionCode,
      name: institution.name,
      discipline: institution.type,
      approvedIntake: institution.approvedIntake,
      intakeLevel: institution.intakeLevel || 'UG',
    },
    policy: {
      ruleCode: policy.ruleCode,
      version: policy.version,
      title: policy.title,
      regulatorySource: policy.regulatorySource,
      minimumTenureMonths: policy.minimumTenureMonths,
      isIllustrativeDemoRule: policy.isIllustrativeDemoRule,
    },
    calculation: {
      baseRequiredAmount: rate.baseDepositAmount,
      intakeAdditionAmount,
      totalRequiredDeposit,
      eligibleActiveFDRTotal,
      shortfallOrSurplus,
      isAdequate,
      tenureMismatchCount,
      eligibleFdrCount: eligibleCount,
      ineligibleFdrCount: ineligibleCount,
      breakdownExplanation,
    },
    evaluatedAt: new Date(),
  };
}
