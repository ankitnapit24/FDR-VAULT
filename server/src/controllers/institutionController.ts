import { Response } from 'express';
import { Institution } from '../models/Institution.js';
import { FDR } from '../models/FDR.js';
import { AuthRequest, enforceInstitutionScope, getScopedInstitutionIds } from '../middleware/authMiddleware.js';
import { logAudit } from '../middleware/auditMiddleware.js';

export async function getInstitutions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { search, type, status, page = '1', limit = '10' } = req.query;

    const query: any = {};
    const scopedIds = await getScopedInstitutionIds(user);

    if (scopedIds !== null) {
      if (scopedIds.length === 0) {
        res.status(200).json({ success: true, institutions: [], total: 0, page: 1, totalPages: 0 });
        return;
      }
      query._id = { $in: scopedIds };
    }

    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { name: searchRegex },
        { institutionCode: searchRegex },
        { 'address.city': searchRegex },
        { 'address.state': searchRegex },
      ];
    }

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.max(1, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    const [institutions, total] = await Promise.all([
      Institution.find(query).sort({ name: 1 }).skip(skip).limit(limitNum),
      Institution.countDocuments(query),
    ]);

    // Enhance with FDR counts for summary view
    const institutionIds = institutions.map(i => i._id);
    const fdrAgg = await FDR.aggregate([
      { $match: { institutionId: { $in: institutionIds } } },
      {
        $group: {
          _id: '$institutionId',
          totalFdrs: { $sum: 1 },
          totalAmount: { $sum: '$depositAmount' },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$currentStatus', 'Active'] }, 1, 0] },
          },
        },
      },
    ]);

    const statsMap = new Map();
    fdrAgg.forEach(stat => statsMap.set(stat._id.toString(), stat));

    const enriched = institutions.map(inst => {
      const stats = statsMap.get(inst._id.toString()) || { totalFdrs: 0, totalAmount: 0, activeCount: 0 };
      return {
        ...inst.toObject(),
        stats,
      };
    });

    res.json({
      success: true,
      institutions: enriched,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching institutions.' });
  }
}

export async function getInstitutionById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const isScoped = await enforceInstitutionScope(req, res, id);
    if (!isScoped) {
      res.status(403).json({ success: false, message: 'Access denied to this institution profile.' });
      return;
    }

    const institution = await Institution.findById(id);
    if (!institution) {
      res.status(404).json({ success: false, message: 'Institution not found.' });
      return;
    }

    // Fetch related FDRs
    const fdrs = await FDR.find({ institutionId: id }).sort({ maturityDate: 1 });

    const totalDepositAmount = fdrs.reduce((acc, f) => acc + (f.depositAmount || 0), 0);
    const activeFdrs = fdrs.filter(f => f.currentStatus === 'Active' || f.currentStatus === 'Expiring Soon');
    const maturedFdrs = fdrs.filter(f => f.currentStatus === 'Matured');

    res.json({
      success: true,
      institution,
      metrics: {
        totalFdrs: fdrs.length,
        totalDepositAmount,
        activeCount: activeFdrs.length,
        maturedCount: maturedFdrs.length,
      },
      fdrs,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching institution details.' });
  }
}

export async function createInstitution(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden: Only AICTE System Administrators can register institutions.' });
      return;
    }

    const {
      institutionCode,
      name,
      type,
      address,
      contactEmail,
      contactPhone,
      approvedIntake,
      establishedYear,
      trustId,
    } = req.body;

    if (!institutionCode || !name || !contactEmail || !address?.city || !address?.state || !address?.pincode) {
      res.status(400).json({ success: false, message: 'Institution code, name, email, and address are required.' });
      return;
    }

    const existing = await Institution.findOne({ institutionCode: institutionCode.toUpperCase() });
    if (existing) {
      res.status(409).json({ success: false, message: `Institution with code ${institutionCode} already exists.` });
      return;
    }

    const newInst = new Institution({
      institutionCode: institutionCode.toUpperCase().trim(),
      name: name.trim(),
      type: type || 'Engineering',
      address,
      contactEmail: contactEmail.toLowerCase().trim(),
      contactPhone: contactPhone || '',
      approvedIntake: approvedIntake || 0,
      establishedYear: establishedYear || 2000,
      trustId: trustId || null,
      status: 'Active',
    });

    await newInst.save();

    await logAudit({
      req,
      action: 'CREATE_INSTITUTION',
      entityType: 'Institution',
      entityId: newInst._id.toString(),
      institutionId: newInst._id,
      newValues: newInst.toObject(),
    });

    res.status(201).json({
      success: true,
      message: 'Institution profile created successfully.',
      institution: newInst,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating institution.' });
  }
}

export async function updateInstitution(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden: Only AICTE System Administrators can update institutional regulatory records.' });
      return;
    }

    const { id } = req.params;
    const inst = await Institution.findById(id);

    if (!inst) {
      res.status(404).json({ success: false, message: 'Institution not found.' });
      return;
    }

    const prev = inst.toObject();
    Object.assign(inst, req.body);
    await inst.save();

    await logAudit({
      req,
      action: 'UPDATE_INSTITUTION',
      entityType: 'Institution',
      entityId: inst._id.toString(),
      institutionId: inst._id,
      previousValues: prev,
      newValues: inst.toObject(),
    });

    res.json({
      success: true,
      message: 'Institution profile updated successfully.',
      institution: inst,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating institution.' });
  }
}
