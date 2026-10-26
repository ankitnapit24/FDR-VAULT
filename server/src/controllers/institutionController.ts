import { Response } from 'express';
import { Institution } from '../models/Institution.js';
import { FDR } from '../models/FDR.js';
import { AuthRequest, enforceInstitutionScope } from '../middleware/authMiddleware.js';
import { logAudit } from '../middleware/auditMiddleware.js';

export async function getInstitutions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { search, type, status, page = '1', limit = '10' } = req.query;

    const query: any = {};

    // Scope check: Institution user can only see their own
    if (user.role === 'institution') {
      if (!user.institutionId) {
        res.status(200).json({ success: true, institutions: [], total: 0 });
        return;
      }
      query._id = user.institutionId;
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

    if (!enforceInstitutionScope(req, res, id)) {
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
    const { institutionCode, name, type, address, contactEmail, contactPhone, approvedIntake, establishedYear } = req.body;

    if (!institutionCode || !name || !contactEmail || !address?.city || !address?.state) {
      res.status(400).json({ success: false, message: 'Institution code, name, contact email, and city/state are required.' });
      return;
    }

    const existing = await Institution.findOne({ institutionCode: institutionCode.toUpperCase().trim() });
    if (existing) {
      res.status(409).json({ success: false, message: 'An institution with this code already exists.' });
      return;
    }

    const newInst = await Institution.create({
      institutionCode: institutionCode.toUpperCase().trim(),
      name: name.trim(),
      type: type || 'Engineering',
      address,
      contactEmail: contactEmail.toLowerCase().trim(),
      contactPhone,
      approvedIntake: approvedIntake || 0,
      establishedYear: establishedYear || 2010,
      status: 'Active',
    });

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
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!enforceInstitutionScope(req, res, id)) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

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
      message: 'Institution updated successfully.',
      institution: inst,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating institution.' });
  }
}
