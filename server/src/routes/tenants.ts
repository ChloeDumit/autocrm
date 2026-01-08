import express from 'express';
import { PrismaClient, TenantStatus, SubscriptionPlan } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticateSuperAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const createTenantSchema = z.object({
  name: z.string().min(1),
  subdomain: z.string().min(3).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  phone: z.string().optional(),
  plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
  maxUsers: z.number().int().positive().optional(),
  maxVehicles: z.number().int().positive().optional(),
  // Admin user details
  adminName: z.string().min(1),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
});

const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'CANCELLED']).optional(),
  plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
  maxUsers: z.number().int().positive().optional(),
  maxVehicles: z.number().int().positive().optional(),
});

// Apply super admin authentication to all routes
router.use(authenticateSuperAdmin);

// Get all tenants
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, plan, search } = req.query;

    const where: any = {};

    if (status) {
      where.status = status as TenantStatus;
    }

    if (plan) {
      where.plan = plan as SubscriptionPlan;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { subdomain: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const tenants = await prisma.tenant.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    });

    res.json(tenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ error: 'Error fetching tenants' });
  }
});

// Get tenant by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        appConfig: true,
        _count: {
          select: {
            vehicles: true,
            clients: true,
            sales: true,
            testDrives: true,
          },
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ error: 'Error fetching tenant' });
  }
});

// Create new tenant with admin user
router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = createTenantSchema.parse(req.body);

    // Check subdomain availability
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain: data.subdomain },
    });

    if (existingTenant) {
      return res.status(400).json({ error: 'Subdomain already in use' });
    }

    // Check admin email availability
    const existingUser = await prisma.user.findUnique({
      where: { email: data.adminEmail },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Admin email already in use' });
    }

    const hashedPassword = await bcrypt.hash(data.adminPassword, 10);

    // Create tenant and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          subdomain: data.subdomain,
          email: data.email,
          phone: data.phone,
          status: 'ACTIVE',
          plan: (data.plan as SubscriptionPlan) || 'FREE',
          maxUsers: data.maxUsers || 5,
          maxVehicles: data.maxVehicles || 100,
          approvedAt: new Date(),
        },
      });

      const adminUser = await tx.user.create({
        data: {
          name: data.adminName,
          email: data.adminEmail,
          password: hashedPassword,
          role: 'ADMIN',
          tenantId: tenant.id,
        },
      });

      // Create default app config
      await tx.appConfig.create({
        data: {
          nombreEmpresa: data.name,
          colorPrimario: '#3b82f6',
          colorSecundario: '#1e40af',
          tenantId: tenant.id,
        },
      });

      // Create default payment methods
      await tx.paymentMethod.createMany({
        data: [
          { nombre: 'Efectivo', descripcion: 'Pago en efectivo', activo: true, tenantId: tenant.id },
          { nombre: 'Tarjeta de crédito', descripcion: 'Pago con tarjeta de crédito', activo: true, tenantId: tenant.id },
          { nombre: 'Transferencia', descripcion: 'Transferencia bancaria', activo: true, tenantId: tenant.id },
          { nombre: 'Financiamiento', descripcion: 'Pago financiado', activo: true, tenantId: tenant.id },
        ],
      });

      return { tenant, adminUser };
    });

    res.status(201).json({
      tenant: result.tenant,
      adminUser: {
        id: result.adminUser.id,
        name: result.adminUser.name,
        email: result.adminUser.email,
        role: result.adminUser.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Error creating tenant' });
  }
});

// Update tenant
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
    });

    if (!existingTenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const data = updateTenantSchema.parse(req.body);

    // Track if status is changing to ACTIVE
    const wasActivated = existingTenant.status !== 'ACTIVE' && data.status === 'ACTIVE';

    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: {
        ...data,
        status: data.status as TenantStatus,
        plan: data.plan as SubscriptionPlan,
        approvedAt: wasActivated ? new Date() : undefined,
      },
    });

    res.json(tenant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating tenant:', error);
    res.status(500).json({ error: 'Error updating tenant' });
  }
});

// Suspend tenant
router.post('/:id/suspend', async (req: AuthRequest, res) => {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { status: 'SUSPENDED' },
    });

    res.json(tenant);
  } catch (error) {
    console.error('Error suspending tenant:', error);
    res.status(500).json({ error: 'Error suspending tenant' });
  }
});

// Reactivate tenant
router.post('/:id/reactivate', async (req: AuthRequest, res) => {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE' },
    });

    res.json(tenant);
  } catch (error) {
    console.error('Error reactivating tenant:', error);
    res.status(500).json({ error: 'Error reactivating tenant' });
  }
});

// Cancel tenant
router.post('/:id/cancel', async (req: AuthRequest, res) => {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });

    res.json(tenant);
  } catch (error) {
    console.error('Error cancelling tenant:', error);
    res.status(500).json({ error: 'Error cancelling tenant' });
  }
});

// Delete tenant (soft delete by cancelling, or hard delete if needed)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { hard } = req.query;

    if (hard === 'true') {
      // Hard delete - remove all data
      await prisma.$transaction(async (tx) => {
        // Delete in order of dependencies
        await tx.salePaymentMethod.deleteMany({ where: { sale: { tenantId: req.params.id } } });
        await tx.saleDocument.deleteMany({ where: { sale: { tenantId: req.params.id } } });
        await tx.sale.deleteMany({ where: { tenantId: req.params.id } });
        await tx.testDrive.deleteMany({ where: { tenantId: req.params.id } });
        await tx.vehicleDocument.deleteMany({ where: { vehicle: { tenantId: req.params.id } } });
        await tx.vehicle.deleteMany({ where: { tenantId: req.params.id } });
        await tx.client.deleteMany({ where: { tenantId: req.params.id } });
        await tx.notification.deleteMany({ where: { tenantId: req.params.id } });
        await tx.documentTemplate.deleteMany({ where: { tenantId: req.params.id } });
        await tx.paymentMethod.deleteMany({ where: { tenantId: req.params.id } });
        await tx.vehiclePropertyField.deleteMany({ where: { tenantId: req.params.id } });
        await tx.appConfig.deleteMany({ where: { tenantId: req.params.id } });
        await tx.user.deleteMany({ where: { tenantId: req.params.id } });
        await tx.tenant.delete({ where: { id: req.params.id } });
      });

      res.json({ message: 'Tenant and all data permanently deleted' });
    } else {
      // Soft delete - just cancel
      await prisma.tenant.update({
        where: { id: req.params.id },
        data: { status: 'CANCELLED' },
      });

      res.json({ message: 'Tenant cancelled' });
    }
  } catch (error) {
    console.error('Error deleting tenant:', error);
    res.status(500).json({ error: 'Error deleting tenant' });
  }
});

// Get tenant statistics
router.get('/:id/stats', async (req: AuthRequest, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const [
      userCount,
      vehicleCount,
      clientCount,
      saleCount,
      testDriveCount,
      salesByStage,
      recentSales,
    ] = await Promise.all([
      prisma.user.count({ where: { tenantId: req.params.id } }),
      prisma.vehicle.count({ where: { tenantId: req.params.id } }),
      prisma.client.count({ where: { tenantId: req.params.id } }),
      prisma.sale.count({ where: { tenantId: req.params.id } }),
      prisma.testDrive.count({ where: { tenantId: req.params.id } }),
      prisma.sale.groupBy({
        by: ['etapa'],
        where: { tenantId: req.params.id },
        _count: true,
      }),
      prisma.sale.findMany({
        where: { tenantId: req.params.id },
        include: { vehicle: true, client: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    res.json({
      counts: {
        users: userCount,
        vehicles: vehicleCount,
        clients: clientCount,
        sales: saleCount,
        testDrives: testDriveCount,
      },
      limits: {
        maxUsers: tenant.maxUsers,
        maxVehicles: tenant.maxVehicles,
        usersUsage: (userCount / tenant.maxUsers) * 100,
        vehiclesUsage: (vehicleCount / tenant.maxVehicles) * 100,
      },
      salesByStage,
      recentSales,
    });
  } catch (error) {
    console.error('Error fetching tenant stats:', error);
    res.status(500).json({ error: 'Error fetching tenant statistics' });
  }
});

export default router;
