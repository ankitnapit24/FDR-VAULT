import { IFDR } from '../models/FDR.js';

export interface PrioritizationResult {
  score: number;
  priorityLevel: 'High' | 'Medium' | 'Low';
  reason: string;
}

export function calculateFDRPriority(fdr: IFDR, hasPendingDocs = false, hasDiscrepancy = false): PrioritizationResult {
  let score = 0;
  const reasons: string[] = [];

  const now = new Date();
  const maturityDate = new Date(fdr.maturityDate);
  const diffTime = maturityDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    score += 50;
    reasons.push(`Matured ${Math.abs(daysRemaining)} day(s) ago; action required`);
  } else if (daysRemaining <= 7) {
    score += 40;
    reasons.push(`Maturity in ${daysRemaining} day(s)`);
  } else if (daysRemaining <= 15) {
    score += 25;
    reasons.push(`Maturity approaching (${daysRemaining} days remaining)`);
  } else if (daysRemaining <= 30) {
    score += 15;
    reasons.push(`Maturity within 30 days (${daysRemaining} days)`);
  }

  if (fdr.verificationStatus === 'Pending Verification' || fdr.verificationStatus === 'Under Scrutiny') {
    score += 20;
    reasons.push('Verification is pending review');
  }

  if (fdr.verificationStatus === 'Additional Information Required') {
    score += 25;
    reasons.push('Awaiting additional information from institution');
  }

  if (hasDiscrepancy) {
    score += 25;
    reasons.push('Document discrepancy detected');
  }

  if (hasPendingDocs) {
    score += 15;
    reasons.push('Supporting documents pending');
  }

  let priorityLevel: 'High' | 'Medium' | 'Low' = 'Low';
  if (score >= 40) {
    priorityLevel = 'High';
  } else if (score >= 20) {
    priorityLevel = 'Medium';
  }

  const reason = reasons.length > 0
    ? `${priorityLevel} Priority — ${reasons.join('; ')}.`
    : 'Standard case — regular monitoring.';

  return {
    score,
    priorityLevel,
    reason,
  };
}
