import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User, IUser, UserRole } from '../models/User.js';
import { Institution } from '../models/Institution.js';

export interface AuthRequest extends Request {
  user?: IUser;
  file?: any;
  files?: any;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; role: string };

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'User not found or account is deactivated.' });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized. Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource.`,
      });
      return;
    }

    next();
  };
}

/**
 * Returns the list of institution IDs allowed for the authenticated user:
 * - Admin / Officer: null (unrestricted)
 * - Institution: [user.institutionId]
 * - Trustee: all institutions associated with user.trustId
 */
export async function getScopedInstitutionIds(user: IUser): Promise<mongoose.Types.ObjectId[] | null> {
  if (user.role === 'admin' || user.role === 'officer') {
    return null; // Unrestricted access
  }
  if (user.role === 'institution') {
    return user.institutionId ? [user.institutionId] : [];
  }
  if (user.role === 'trust') {
    if (!user.trustId) return [];
    const ids = await Institution.find({ trustId: user.trustId }).distinct('_id');
    return ids as mongoose.Types.ObjectId[];
  }
  return [];
}

/**
 * Constructs a MongoDB query filter scoping records by institution:
 * - Admin / Officer: {}
 * - Institution: { [fieldName]: user.institutionId }
 * - Trustee: { [fieldName]: { $in: [...] } }
 */
export async function getScopedInstitutionQuery(user: IUser, fieldName = 'institutionId'): Promise<any> {
  const scopedIds = await getScopedInstitutionIds(user);
  if (scopedIds === null) {
    return {};
  }
  if (scopedIds.length === 1 && user.role === 'institution') {
    return { [fieldName]: scopedIds[0] };
  }
  return { [fieldName]: { $in: scopedIds } };
}

/**
 * Validates whether the user is authorized to view or mutate a specific institution's data:
 * - Admin / Officer: true
 * - Institution: true iff targetId matches user.institutionId
 * - Trustee: true iff targetId belongs to user.trustId
 */
export async function enforceInstitutionScope(
  req: AuthRequest,
  _res: Response,
  targetInstitutionId: string | mongoose.Types.ObjectId | undefined
): Promise<boolean> {
  if (!req.user || !targetInstitutionId) return false;
  if (req.user.role === 'admin' || req.user.role === 'officer') {
    return true;
  }
  const targetIdStr = targetInstitutionId.toString();
  if (req.user.role === 'institution') {
    if (!req.user.institutionId) return false;
    return req.user.institutionId.toString() === targetIdStr;
  }
  if (req.user.role === 'trust') {
    if (!req.user.trustId) return false;
    const exists = await Institution.exists({ _id: targetInstitutionId, trustId: req.user.trustId });
    return !!exists;
  }
  return false;
}
