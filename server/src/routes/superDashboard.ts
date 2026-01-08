import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateSuperAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Apply super admin authentication to all routes
router.use(authenticateSuperAdmin);

// Get platform-wide dashboard metrics
router.get('/metrics', async (req: AuthRequest, res) => {
  try {
    const [
      totalTenants,
      activeTenants,
      pendingTenants,
      suspendedTenants,
      totalUsers,
      totalVehicles,
      totalClients,
      totalSales,
      tenantsByPlan,
      recentTenants,
      pendingRegistrations,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.tenant.count({ where: { status: 'PENDING' } }),
      prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count(),
      prisma.vehicle.count(),
      prisma.client.count(),
      prisma.sale.count(),
      prisma.tenant.groupBy({
        by: ['plan'],
        _count: true,
      }),
      prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          _count: {
            select: { users: true, vehicles: true },
          },
        },
      }),
      prisma.tenantRegistration.count({ where: { status: 'PENDING' } }),
    ]);

    res.json({
      tenants: {
        total: totalTenants,
        active: activeTenants,
        pending: pendingTenants,
        suspended: suspendedTenants,
      },
      platform: {
        totalUsers,
        totalVehicles,
        totalClients,
        totalSales,
      },
      tenantsByPlan,
      recentTenants,
      pendingRegistrations,
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Error fetching dashboard metrics' });
  }
});

// Get growth metrics over time
router.get('/growth', async (req: AuthRequest, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period as string, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [newTenants, newUsers, newSales] = await Promise.all([
      prisma.tenant.findMany({
        where: { createdAt: { gte: startDate } },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.sale.findMany({
        where: { createdAt: { gte: startDate } },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Group by date
    const groupByDate = (items: { createdAt: Date }[]) => {
      const grouped: Record<string, number> = {};
      items.forEach((item) => {
        const date = item.createdAt.toISOString().split('T')[0];
        grouped[date] = (grouped[date] || 0) + 1;
      });
      return grouped;
    };

    res.json({
      period: days,
      tenants: groupByDate(newTenants),
      users: groupByDate(newUsers),
      sales: groupByDate(newSales),
      totals: {
        newTenants: newTenants.length,
        newUsers: newUsers.length,
        newSales: newSales.length,
      },
    });
  } catch (error) {
    console.error('Error fetching growth metrics:', error);
    res.status(500).json({ error: 'Error fetching growth metrics' });
  }
});

// Get top performing tenants
router.get('/top-tenants', async (req: AuthRequest, res) => {
  try {
    const { limit = '10', metric = 'sales' } = req.query;
    const take = parseInt(limit as string, 10);

    let tenants;

    if (metric === 'sales') {
      // Top tenants by sales count
      const salesByTenant = await prisma.sale.groupBy({
        by: ['tenantId'],
        _count: true,
        orderBy: { _count: { tenantId: 'desc' } },
        take,
      });

      const tenantIds = salesByTenant.map((s) => s.tenantId);
      const tenantDetails = await prisma.tenant.findMany({
        where: { id: { in: tenantIds } },
      });

      tenants = salesByTenant.map((s) => ({
        tenant: tenantDetails.find((t) => t.id === s.tenantId),
        salesCount: s._count,
      }));
    } else if (metric === 'vehicles') {
      // Top tenants by vehicle count
      const vehiclesByTenant = await prisma.vehicle.groupBy({
        by: ['tenantId'],
        _count: true,
        orderBy: { _count: { tenantId: 'desc' } },
        take,
      });

      const tenantIds = vehiclesByTenant.map((v) => v.tenantId);
      const tenantDetails = await prisma.tenant.findMany({
        where: { id: { in: tenantIds } },
      });

      tenants = vehiclesByTenant.map((v) => ({
        tenant: tenantDetails.find((t) => t.id === v.tenantId),
        vehicleCount: v._count,
      }));
    } else if (metric === 'clients') {
      // Top tenants by client count
      const clientsByTenant = await prisma.client.groupBy({
        by: ['tenantId'],
        _count: true,
        orderBy: { _count: { tenantId: 'desc' } },
        take,
      });

      const tenantIds = clientsByTenant.map((c) => c.tenantId);
      const tenantDetails = await prisma.tenant.findMany({
        where: { id: { in: tenantIds } },
      });

      tenants = clientsByTenant.map((c) => ({
        tenant: tenantDetails.find((t) => t.id === c.tenantId),
        clientCount: c._count,
      }));
    } else {
      return res.status(400).json({ error: 'Invalid metric. Use: sales, vehicles, or clients' });
    }

    res.json(tenants);
  } catch (error) {
    console.error('Error fetching top tenants:', error);
    res.status(500).json({ error: 'Error fetching top tenants' });
  }
});

// Get revenue/subscription overview (placeholder for billing integration)
router.get('/revenue', async (req: AuthRequest, res) => {
  try {
    // Count tenants by plan for MRR calculation
    const tenantsByPlan = await prisma.tenant.groupBy({
      by: ['plan'],
      where: { status: 'ACTIVE' },
      _count: true,
    });

    // Define plan pricing (placeholder values)
    const planPricing: Record<string, number> = {
      FREE: 0,
      STARTER: 29,
      PROFESSIONAL: 79,
      ENTERPRISE: 199,
    };

    let mrr = 0;
    const breakdown = tenantsByPlan.map((p) => {
      const price = planPricing[p.plan] || 0;
      const revenue = price * p._count;
      mrr += revenue;
      return {
        plan: p.plan,
        count: p._count,
        pricePerTenant: price,
        monthlyRevenue: revenue,
      };
    });

    res.json({
      mrr,
      arr: mrr * 12,
      breakdown,
      note: 'This is a placeholder. Integrate with your billing provider for accurate data.',
    });
  } catch (error) {
    console.error('Error fetching revenue metrics:', error);
    res.status(500).json({ error: 'Error fetching revenue metrics' });
  }
});

// Get system health overview
router.get('/health', async (req: AuthRequest, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Get some basic stats
    const [
      tenantsAtLimit,
      largestTenants,
    ] = await Promise.all([
      // Tenants approaching user/vehicle limits (over 80%)
      prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
        include: {
          _count: { select: { users: true, vehicles: true } },
        },
      }),
      // Largest tenants by data
      prisma.tenant.findMany({
        include: {
          _count: {
            select: {
              users: true,
              vehicles: true,
              clients: true,
              sales: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 5,
      }),
    ]);

    const tenantsNearLimits = tenantsAtLimit.filter((t) => {
      const userUsage = (t._count.users / t.maxUsers) * 100;
      const vehicleUsage = (t._count.vehicles / t.maxVehicles) * 100;
      return userUsage >= 80 || vehicleUsage >= 80;
    }).map((t) => ({
      id: t.id,
      name: t.name,
      subdomain: t.subdomain,
      userUsage: Math.round((t._count.users / t.maxUsers) * 100),
      vehicleUsage: Math.round((t._count.vehicles / t.maxVehicles) * 100),
    }));

    res.json({
      status: 'healthy',
      database: 'connected',
      tenantsNearLimits,
      largestTenants: largestTenants.map((t) => ({
        id: t.id,
        name: t.name,
        subdomain: t.subdomain,
        counts: t._count,
      })),
    });
  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: 'Error checking system health',
    });
  }
});

export default router;
