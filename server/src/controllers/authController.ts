import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { env } from '../config/env.js';
import { logAudit } from '../middleware/auditMiddleware.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('institutionId');
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'Account is deactivated. Contact an administrator.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, institutionId: user.institutionId },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logAudit({
      req,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id.toString(),
      institutionId: (user.institutionId as any)?._id || user.institutionId,
      newValues: { email: user.email, role: user.role },
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        institution: user.institutionId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Login failed.' });
  }
}

export async function getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const user = await User.findById(req.user._id).populate('institutionId');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        phone: user.phone,
        institution: user.institutionId,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching user profile.' });
  }
}

export async function logout(req: AuthRequest, res: Response): Promise<void> {
  if (req.user) {
    await logAudit({
      req,
      action: 'USER_LOGOUT',
      entityType: 'User',
      entityId: req.user._id.toString(),
    });
  }
  res.json({ success: true, message: 'Logged out successfully.' });
}
