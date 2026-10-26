import { Response } from 'express';
import { Trust } from '../models/Trust.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import { getTrustConsolidatedExposure } from '../services/trustExposureService.js';

export async function getTrusts(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const query: any = {};

    if (user.role === 'trust' && user.trustId) {
      query._id = user.trustId;
    }

    const trusts = await Trust.find(query)
      .populate('institutionIds', 'name institutionCode type approvedIntake')
      .sort({ trustName: 1 });

    res.json({ success: true, trusts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching trusts.' });
  }
}

export async function getTrustExposure(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (user.role === 'trust' && user.trustId && user.trustId.toString() !== id) {
      res.status(403).json({ success: false, message: 'Forbidden: You can only access your assigned trust dossier.' });
      return;
    }

    const exposure = await getTrustConsolidatedExposure(id);
    res.json({ success: true, exposure });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error compiling trust financial exposure.' });
  }
}

export async function createTrust(req: AuthRequest, res: Response): Promise<void> {
  try {
    const {
      trustName,
      registrationNumber,
      panNumber,
      chairmanName,
      contactEmail,
      contactPhone,
      registeredAddress,
      institutionIds,
    } = req.body;

    if (!trustName || !registrationNumber || !contactEmail || !registeredAddress?.city) {
      res.status(400).json({ success: false, message: 'Trust name, registration number, email, and city are required.' });
      return;
    }

    const newTrust = await Trust.create({
      trustName: trustName.trim(),
      registrationNumber: registrationNumber.toUpperCase().trim(),
      panNumber: panNumber ? panNumber.toUpperCase().trim() : '',
      chairmanName: chairmanName || '',
      contactEmail: contactEmail.toLowerCase().trim(),
      contactPhone: contactPhone || '',
      registeredAddress,
      institutionIds: institutionIds || [],
    });

    await logAudit({
      req,
      action: 'CREATE_TRUST',
      entityType: 'Trust',
      entityId: newTrust._id.toString(),
      newValues: { trustName: newTrust.trustName, registrationNumber: newTrust.registrationNumber },
    });

    res.status(201).json({
      success: true,
      message: 'Trust profile created successfully.',
      trust: newTrust,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating trust.' });
  }
}
