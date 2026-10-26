import { Response } from 'express';
import { SystemSetting } from '../models/SystemSetting.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { logAudit } from '../middleware/auditMiddleware.js';

export async function getSettings(req: AuthRequest, res: Response): Promise<void> {
  try {
    const settings = await SystemSetting.find().sort({ category: 1, key: 1 });
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching system settings.' });
  }
}

export async function updateSetting(req: AuthRequest, res: Response): Promise<void> {
  try {
    const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
    const { value, description } = req.body;
    const user = req.user!;

    let setting = await SystemSetting.findOne({ key });
    let prevVal = setting ? setting.value : null;

    if (!setting) {
      setting = await SystemSetting.create({
        key,
        value,
        description: description || '',
        updatedBy: user._id,
      });
    } else {
      setting.value = value;
      if (description) setting.description = description;
      setting.updatedBy = user._id as any;
      await setting.save();
    }

    await logAudit({
      req,
      action: 'UPDATE_SYSTEM_SETTING',
      entityType: 'SystemSetting',
      entityId: key,
      previousValues: { value: prevVal },
      newValues: { value },
    });

    res.json({
      success: true,
      message: `System setting '${key}' updated successfully.`,
      setting,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating system setting.' });
  }
}
