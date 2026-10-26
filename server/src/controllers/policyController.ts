import { Response } from 'express';
import { PolicyRule } from '../models/PolicyRule.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import { calculateDepositAdequacy } from '../services/policyAdequacyService.js';

export async function getPolicies(req: AuthRequest, res: Response): Promise<void> {
  try {
    const policies = await PolicyRule.find().sort({ effectiveFrom: -1 });
    res.json({ success: true, policies });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching policy rules.' });
  }
}

export async function getDepositAdequacy(req: AuthRequest, res: Response): Promise<void> {
  try {
    const institutionId = Array.isArray(req.params.institutionId)
      ? req.params.institutionId[0]
      : req.params.institutionId;
    const { version } = req.query;

    const result = await calculateDepositAdequacy(institutionId, version as string | undefined);
    res.json({ success: true, adequacy: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error calculating deposit adequacy.' });
  }
}

export async function createPolicyRule(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const {
      ruleCode,
      version,
      title,
      formulaDescription,
      regulatorySource,
      effectiveFrom,
      disciplineRates,
      minimumTenureMonths,
    } = req.body;

    if (!ruleCode || !version || !title || !effectiveFrom) {
      res.status(400).json({ success: false, message: 'ruleCode, version, title, and effectiveFrom are required.' });
      return;
    }

    const newRule = await PolicyRule.create({
      ruleCode: ruleCode.toUpperCase().trim(),
      version: version.trim(),
      title: title.trim(),
      formulaDescription: formulaDescription || 'Base norm + intake tier multiplier',
      regulatorySource: regulatorySource || 'AICTE APH Guidelines (Demo Norm Rule)',
      effectiveFrom: new Date(effectiveFrom),
      disciplineRates: disciplineRates || [],
      minimumTenureMonths: minimumTenureMonths || 60,
      isActive: true,
      isIllustrativeDemoRule: true,
      createdBy: user._id,
    });

    await logAudit({
      req,
      action: 'CREATE_POLICY_RULE',
      entityType: 'PolicyRule',
      entityId: newRule._id.toString(),
      newValues: { ruleCode: newRule.ruleCode, version: newRule.version },
    });

    res.status(201).json({
      success: true,
      message: 'Versioned deposit adequacy policy rule created successfully.',
      policy: newRule,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating policy rule.' });
  }
}

export async function togglePolicyRule(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const rule = await PolicyRule.findById(id);

    if (!rule) {
      res.status(404).json({ success: false, message: 'Policy rule not found.' });
      return;
    }

    rule.isActive = !rule.isActive;
    await rule.save();

    await logAudit({
      req,
      action: 'TOGGLE_POLICY_RULE',
      entityType: 'PolicyRule',
      entityId: rule._id.toString(),
      newValues: { isActive: rule.isActive },
    });

    res.json({
      success: true,
      message: `Policy rule '${rule.ruleCode}' (v${rule.version}) has been ${rule.isActive ? 'activated' : 'deactivated'}.`,
      policy: rule,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating policy rule.' });
  }
}
