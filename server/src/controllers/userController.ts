import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { logAudit } from '../middleware/auditMiddleware.js';

export async function getUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { role, search } = req.query;
    const query: any = {};

    if (role) query.role = role;
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { designation: searchRegex }];
    }

    const users = await User.find(query)
      .populate('institutionId', 'name institutionCode')
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching users.' });
  }
}

export async function createUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, email, password, role, institutionId, trustId, designation, phone } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
      return;
    }

    if (role === 'institution' && !institutionId) {
      res.status(400).json({ success: false, message: 'Institution association is required for institution user.' });
      return;
    }

    if (role === 'trust' && !trustId) {
      res.status(400).json({ success: false, message: 'Trust association is required for trustee user.' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      res.status(409).json({ success: false, message: 'A user with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      institutionId: role === 'institution' ? institutionId : null,
      trustId: role === 'trust' ? trustId : null,
      designation: designation || '',
      phone: phone || '',
      isActive: true,
    });

    await logAudit({
      req,
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: newUser._id.toString(),
      institutionId: newUser.institutionId,
      newValues: { name: newUser.name, email: newUser.email, role: newUser.role },
    });

    res.status(201).json({
      success: true,
      message: 'User account created successfully.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        designation: newUser.designation,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error creating user.' });
  }
}

export async function toggleUserStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    user.isActive = !user.isActive;
    await user.save();

    await logAudit({
      req,
      action: 'TOGGLE_USER_STATUS',
      entityType: 'User',
      entityId: user._id.toString(),
      newValues: { isActive: user.isActive },
    });

    res.json({
      success: true,
      message: `User account has been ${user.isActive ? 'activated' : 'deactivated'}.`,
      user: { id: user._id, isActive: user.isActive },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating user status.' });
  }
}
