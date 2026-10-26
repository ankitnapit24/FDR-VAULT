import cron from 'node-cron';
import { FDR } from '../models/FDR.js';
import { sendNotification } from './notificationService.js';
import { calculateFDRPriority } from './prioritizationService.js';
import { env } from '../config/env.js';

export async function runMaturityAndWorkflowChecks(): Promise<{
  scanned: number;
  expiringCount: number;
  maturedCount: number;
  notificationsSent: number;
}> {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  
  const fdrs = await FDR.find({
    currentStatus: { $in: ['Active', 'Expiring Soon'] },
  });

  let expiringCount = 0;
  let maturedCount = 0;
  let notificationsSent = 0;

  for (const fdr of fdrs) {
    const maturity = new Date(fdr.maturityDate);
    const diffDays = Math.ceil((maturity.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Update statuses
    let statusChanged = false;
    if (diffDays <= 0 && fdr.currentStatus !== 'Matured') {
      fdr.currentStatus = 'Matured';
      if (fdr.renewalStatus === 'Not Applicable') {
        fdr.renewalStatus = 'Renewal Pending';
      }
      statusChanged = true;
      maturedCount++;

      // Send matured alert
      const dedupKey = `matured_${fdr._id}_${todayStr}`;
      await sendNotification({
        targetRole: 'officer',
        institutionId: fdr.institutionId,
        type: 'Maturity Alert',
        title: `FDR Matured: ${fdr.fdrNumber}`,
        message: `FDR ${fdr.fdrNumber} (${fdr.bankName}) matured on ${maturity.toLocaleDateString()}. Action required for renewal or release review.`,
        relatedEntityType: 'FDR',
        relatedEntityId: fdr._id,
        priority: 'urgent',
        dueAt: fdr.maturityDate,
        dedupKey,
      });
      notificationsSent++;
    } else if (diffDays > 0 && diffDays <= 30 && fdr.currentStatus !== 'Expiring Soon') {
      fdr.currentStatus = 'Expiring Soon';
      statusChanged = true;
      expiringCount++;
    }

    // Advance reminder checks: 30, 15, 7 days
    if (env.REMINDER_DAYS_BEFORE.includes(diffDays) || (diffDays <= 7 && diffDays > 0)) {
      const dedupKey = `remind_${diffDays}d_${fdr._id}_${todayStr}`;
      await sendNotification({
        targetRole: 'officer',
        institutionId: fdr.institutionId,
        type: 'Maturity Alert',
        title: `Advance Maturity Alert (${diffDays} days): ${fdr.fdrNumber}`,
        message: `FDR ${fdr.fdrNumber} matures in ${diffDays} days (${maturity.toLocaleDateString()}). Please verify renewal readiness.`,
        relatedEntityType: 'FDR',
        relatedEntityId: fdr._id,
        priority: diffDays <= 7 ? 'high' : 'medium',
        dueAt: fdr.maturityDate,
        dedupKey,
      });
      notificationsSent++;
    }

    // Recalculate priority
    const priorityResult = calculateFDRPriority(fdr);
    if (fdr.priorityScore !== priorityResult.score || fdr.priorityReason !== priorityResult.reason) {
      fdr.priorityScore = priorityResult.score;
      fdr.priorityReason = priorityResult.reason;
      statusChanged = true;
    }

    if (statusChanged) {
      await fdr.save();
    }
  }

  console.log(`[Cron/Check] Evaluated ${fdrs.length} FDRs: ${expiringCount} expiring soon, ${maturedCount} matured, ${notificationsSent} notifications generated.`);
  return {
    scanned: fdrs.length,
    expiringCount,
    maturedCount,
    notificationsSent,
  };
}

export function initializeCronJobs(): void {
  // Run once immediately upon server start for fresh state
  setTimeout(() => {
    runMaturityAndWorkflowChecks().catch(err => console.error('[Cron] Initial run error:', err));
  }, 4000);

  // Schedule daily cron
  cron.schedule(env.CRON_SCHEDULE, () => {
    console.log('[Cron] Executing scheduled daily FDR maturity and workflow scan...');
    runMaturityAndWorkflowChecks().catch(err => console.error('[Cron] Scheduled run error:', err));
  });

  console.log(`[Cron] Initialized maturity monitoring cron schedule: "${env.CRON_SCHEDULE}"`);
}
