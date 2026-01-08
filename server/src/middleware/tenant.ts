import { Request, Response, NextFunction } from 'express';
import { PrismaClient, TenantStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface TenantRequest extends Request {
  tenantId?: string;
  tenantSubdomain?: string;
  tenant?: {
    id: string;
    name: string;
    subdomain: string;
    status: TenantStatus;
    plan: string;
  };
}

// Reserved subdomains that cannot be used by tenants
export const RESERVED_SUBDOMAINS = [
  'admin',
  'www',
  'api',
  'app',
  'mail',
  'ftp',
  'autocrm',
  'support',
  'help',
  'billing',
  'test',
  'demo',
  'staging',
  'dev',
];

/**
 * Middleware to extract and validate tenant from subdomain header
 * Expects X-Tenant-Subdomain header to be set by the frontend
 */
export const tenantMiddleware = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const subdomain = req.headers['x-tenant-subdomain'] as string;

    // Skip tenant validation for public routes
    if (isPublicRoute(req.path)) {
      return next();
    }

    // Skip tenant validation for super admin routes
    if (req.path.startsWith('/super-admin') || req.path.startsWith('/superauth')) {
      return next();
    }

    // Skip tenant validation for registration routes
    if (req.path.startsWith('/registration')) {
      return next();
    }

    // Skip tenant validation for password reset routes
    if (req.path.includes('/forgot-password') || req.path.includes('/reset-password') || req.path.includes('/validate-reset-token')) {
      return next();
    }

    if (!subdomain) {
      return res.status(400).json({
        error: 'Tenant subdomain is required',
        code: 'TENANT_REQUIRED'
      });
    }

    // Check if subdomain is reserved
    if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid subdomain',
        code: 'INVALID_SUBDOMAIN'
      });
    }

    // Find tenant by subdomain
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: subdomain.toLowerCase() },
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
        plan: true,
      },
    });

    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant not found',
        code: 'TENANT_NOT_FOUND'
      });
    }

    // Check tenant status
    if (tenant.status !== 'ACTIVE') {
      if (tenant.status === 'PENDING') {
        return res.status(403).json({
          error: 'Your account is pending approval',
          code: 'TENANT_PENDING'
        });
      }
      if (tenant.status === 'SUSPENDED') {
        return res.status(403).json({
          error: 'Your account has been suspended',
          code: 'TENANT_SUSPENDED'
        });
      }
      if (tenant.status === 'CANCELLED') {
        return res.status(403).json({
          error: 'Your account has been cancelled',
          code: 'TENANT_CANCELLED'
        });
      }
    }

    // Attach tenant info to request
    req.tenantId = tenant.id;
    req.tenantSubdomain = tenant.subdomain;
    req.tenant = tenant;

    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Check if a route is public (doesn't require tenant validation)
 */
function isPublicRoute(path: string): boolean {
  const publicPaths = [
    '/health',
    '/status',
  ];

  return publicPaths.some(p => path === p || path.startsWith(p + '/'));
}

/**
 * Middleware for routes that optionally accept tenant context
 * Used for routes that work both with and without tenant (e.g., checking subdomain availability)
 */
export const optionalTenantMiddleware = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const subdomain = req.headers['x-tenant-subdomain'] as string;

    if (subdomain && !RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
      const tenant = await prisma.tenant.findUnique({
        where: { subdomain: subdomain.toLowerCase() },
        select: {
          id: true,
          name: true,
          subdomain: true,
          status: true,
          plan: true,
        },
      });

      if (tenant && tenant.status === 'ACTIVE') {
        req.tenantId = tenant.id;
        req.tenantSubdomain = tenant.subdomain;
        req.tenant = tenant;
      }
    }

    next();
  } catch (error) {
    console.error('Optional tenant middleware error:', error);
    next();
  }
};

/**
 * Check if a subdomain is available for registration
 */
export async function isSubdomainAvailable(subdomain: string): Promise<boolean> {
  const normalizedSubdomain = subdomain.toLowerCase();

  // Check reserved subdomains
  if (RESERVED_SUBDOMAINS.includes(normalizedSubdomain)) {
    return false;
  }

  // Check if subdomain already exists in tenants
  const existingTenant = await prisma.tenant.findUnique({
    where: { subdomain: normalizedSubdomain },
  });

  if (existingTenant) {
    return false;
  }

  // Check if subdomain is in pending registrations
  const pendingRegistration = await prisma.tenantRegistration.findUnique({
    where: { subdomain: normalizedSubdomain },
  });

  if (pendingRegistration && pendingRegistration.status === 'PENDING') {
    return false;
  }

  return true;
}
