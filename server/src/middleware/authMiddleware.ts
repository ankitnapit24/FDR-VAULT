import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User, IUser, UserRole } from '../models/User.js';

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

export function enforceInstitutionScope(
  req: AuthRequest,
  res: Response,
  targetInstitutionId: string | undefined
): boolean {
  if (!req.user) return false;
  // Admin and AICTE officers can access all institutions
  if (req.user.role === 'admin' || req.user.role === 'officer') {
    return true;
  }
  // Institution user can only access their assigned institution
  if (req.user.role === 'institution') {
    if (!req.user.institutionId || !targetInstitutionId) {
      return false;
    }
    return req.user.institutionId.toString() === targetInstitutionId.toString();
  }
  return false;
}
