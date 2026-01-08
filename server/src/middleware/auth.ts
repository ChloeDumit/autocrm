import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { TenantRequest } from './tenant';

const prisma = new PrismaClient();

// JWT secrets - super admin uses a different secret for extra security
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SUPER_ADMIN_JWT_SECRET = process.env.SUPER_ADMIN_JWT_SECRET || 'super-admin-secret-key';

export interface AuthRequest extends TenantRequest {
  userId?: string;
  userRole?: string;
  userTenantId?: string;
  isSuperAdmin?: boolean;
  isImpersonating?: boolean;
  impersonatedBy?: string;
}

interface UserTokenPayload {
  userId: string;
  tenantId: string;
  impersonatedBy?: string; // If present, this is an impersonation token
}

interface SuperAdminTokenPayload {
  superAdminId: string;
  isSuperAdmin: true;
}

/**
 * Authenticate regular users with tenant validation
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as UserTokenPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, email: true, name: true, tenantId: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Validate that user belongs to the tenant from the subdomain
    if (req.tenantId && user.tenantId !== req.tenantId) {
      return res.status(403).json({
        error: 'Access denied: User does not belong to this tenant',
        code: 'TENANT_MISMATCH'
      });
    }

    // Also validate that the token's tenantId matches
    if (decoded.tenantId && decoded.tenantId !== user.tenantId) {
      return res.status(403).json({
        error: 'Invalid token: Tenant mismatch',
        code: 'TOKEN_TENANT_MISMATCH'
      });
    }

    req.userId = user.id;
    req.userRole = user.role;
    req.userTenantId = user.tenantId;
    req.isImpersonating = !!decoded.impersonatedBy;
    req.impersonatedBy = decoded.impersonatedBy;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Authenticate super admins
 */
export const authenticateSuperAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, SUPER_ADMIN_JWT_SECRET) as SuperAdminTokenPayload;

    if (!decoded.isSuperAdmin) {
      return res.status(401).json({ error: 'Invalid super admin token' });
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: decoded.superAdminId },
      select: { id: true, email: true, name: true }
    });

    if (!superAdmin) {
      return res.status(401).json({ error: 'Super admin not found' });
    }

    req.userId = superAdmin.id;
    req.isSuperAdmin = true;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Generate JWT token for regular users
 */
export function generateUserToken(userId: string, tenantId: string, impersonatedBy?: string): string {
  const payload: UserTokenPayload = {
    userId,
    tenantId,
    ...(impersonatedBy && { impersonatedBy }),
  };

  // Impersonation tokens expire in 1 hour, regular tokens in 7 days
  const expiresIn = impersonatedBy ? '1h' : '7d';

  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Generate JWT token for super admins
 */
export function generateSuperAdminToken(superAdminId: string): string {
  const payload: SuperAdminTokenPayload = {
    superAdminId,
    isSuperAdmin: true,
  };

  return jwt.sign(payload, SUPER_ADMIN_JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Generate impersonation token for super admin to access tenant as user
 */
export function generateImpersonationToken(
  userId: string,
  tenantId: string,
  superAdminId: string
): string {
  return generateUserToken(userId, tenantId, superAdminId);
}

/**
 * Require specific roles for access
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

/**
 * Middleware that allows either authenticated user or super admin
 */
export const authenticateAny = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Try super admin token first
  try {
    const decoded = jwt.verify(token, SUPER_ADMIN_JWT_SECRET) as SuperAdminTokenPayload;
    if (decoded.isSuperAdmin) {
      const superAdmin = await prisma.superAdmin.findUnique({
        where: { id: decoded.superAdminId },
        select: { id: true, email: true, name: true }
      });

      if (superAdmin) {
        req.userId = superAdmin.id;
        req.isSuperAdmin = true;
        return next();
      }
    }
  } catch {
    // Not a super admin token, try regular user token
  }

  // Try regular user token
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserTokenPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, email: true, name: true, tenantId: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Validate tenant if present
    if (req.tenantId && user.tenantId !== req.tenantId) {
      return res.status(403).json({
        error: 'Access denied: User does not belong to this tenant',
        code: 'TENANT_MISMATCH'
      });
    }

    req.userId = user.id;
    req.userRole = user.role;
    req.userTenantId = user.tenantId;
    req.isImpersonating = !!decoded.impersonatedBy;
    req.impersonatedBy = decoded.impersonatedBy;

    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
