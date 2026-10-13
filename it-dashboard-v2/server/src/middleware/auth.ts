import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  employeeId: string;
  name: string;
  username: string;
  email: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback-secret';

    let decoded: { id: string; role: Role; employeeId?: string; name?: string; username?: string; email?: string };
    try {
      decoded = jwt.verify(token, secret) as any;
    } catch (jwtErr) {
      return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          employeeId: true,
          name: true,
          username: true,
          email: true,
          role: true,
          employmentStatus: true,
        },
      });

      if (user) {
        if (user.employmentStatus !== 'Active') {
          return res.status(403).json({ success: false, message: 'Account is deactivated or inactive.' });
        }
        req.user = user;
        return next();
      }

      // If user not in database (e.g. fallback store) keep exact token claims without escalation
      if (decoded.id && decoded.role) {
        req.user = {
          id: decoded.id,
          employeeId: decoded.employeeId || 'EMP-UNKNOWN',
          name: decoded.name || 'User',
          username: decoded.username || 'user',
          email: decoded.email || '',
          role: decoded.role,
        };
        return next();
      }

      return res.status(401).json({ success: false, message: 'User account not found.' });
    } catch (dbErr) {
      // In case of database connection issue, authenticate with verified token signature
      if (decoded.id && decoded.role) {
        req.user = {
          id: decoded.id,
          employeeId: decoded.employeeId || 'EMP-UNKNOWN',
          name: decoded.name || 'User',
          username: decoded.username || 'user',
          email: decoded.email || '',
          role: decoded.role,
        };
        return next();
      }
      return res.status(500).json({ success: false, message: 'Database authentication check failed.' });
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Authentication validation error.' });
  }
};

export const authorize = (allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not have permission for this resource.' });
    }

    next();
  };
};
