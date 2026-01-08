import express from 'express';
import { PrismaClient, SubscriptionPlan } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { isSubdomainAvailable, RESERVED_SUBDOMAINS } from '../middleware/tenant';
import { authenticateSuperAdmin, AuthRequest } from '../middleware/auth';
import {
  sendRegistrationConfirmation,
  sendAccountApproved,
  sendAccountRejected,
} from '../services/email';

const router = express.Router();
const prisma = new PrismaClient();

const registrationSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(30, 'Subdomain must be at most 30 characters')
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      'Subdomain must start and end with a letter or number, and can contain hyphens'
    ),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  userName: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Public: Check subdomain availability
router.get('/check-subdomain/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;

    // Basic validation
    if (!subdomain || subdomain.length < 3) {
      return res.json({ available: false, reason: 'Subdomain must be at least 3 characters' });
    }

    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(subdomain) && subdomain.length > 2) {
      return res.json({
        available: false,
        reason: 'Subdomain must start and end with a letter or number',
      });
    }

    if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
      return res.json({ available: false, reason: 'This subdomain is reserved' });
    }

    const available = await isSubdomainAvailable(subdomain);

    res.json({
      available,
      reason: available ? null : 'This subdomain is already taken',
    });
  } catch (error) {
    console.error('Error checking subdomain:', error);
    res.status(500).json({ error: 'Error checking subdomain availability' });
  }
});

// Public: Submit registration request
router.post('/', async (req, res) => {
  try {
    const data = registrationSchema.parse(req.body);

    // Check subdomain availability
    const available = await isSubdomainAvailable(data.subdomain);
    if (!available) {
      return res.status(400).json({ error: 'Subdomain is not available' });
    }

    // Check if email is already registered (in registrations or users)
    const existingRegistration = await prisma.tenantRegistration.findFirst({
      where: {
        email: data.email,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existingRegistration) {
      return res.status(400).json({ error: 'A registration with this email already exists' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'This email is already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create registration request
    const registration = await prisma.tenantRegistration.create({
      data: {
        companyName: data.companyName,
        subdomain: data.subdomain.toLowerCase(),
        email: data.email,
        phone: data.phone,
        userName: data.userName,
        password: hashedPassword,
        status: 'PENDING',
      },
    });

    // Send confirmation email to user (async, don't block response)
    sendRegistrationConfirmation(
      registration.email,
      registration.companyName,
      registration.subdomain
    ).catch(err => console.error('Failed to send confirmation email:', err));

    res.status(201).json({
      message: 'Registration submitted successfully. You will receive an email once your account is approved.',
      registrationId: registration.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating registration:', error);
    res.status(500).json({ error: 'Error submitting registration' });
  }
});

// SuperAdmin: Get all pending registrations
router.get('/pending', authenticateSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const registrations = await prisma.tenantRegistration.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        companyName: true,
        subdomain: true,
        email: true,
        phone: true,
        userName: true,
        status: true,
        createdAt: true,
      },
    });

    res.json(registrations);
  } catch (error) {
    console.error('Error fetching pending registrations:', error);
    res.status(500).json({ error: 'Error fetching pending registrations' });
  }
});

// SuperAdmin: Get all registrations (with filters)
router.get('/all', authenticateSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const registrations = await prisma.tenantRegistration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        companyName: true,
        subdomain: true,
        email: true,
        phone: true,
        userName: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        reviewedAt: true,
      },
    });

    res.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Error fetching registrations' });
  }
});

// SuperAdmin: Approve registration
router.post('/:id/approve', authenticateSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { plan = 'FREE', maxUsers = 5, maxVehicles = 100 } = req.body;

    const registration = await prisma.tenantRegistration.findUnique({
      where: { id: req.params.id },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (registration.status !== 'PENDING') {
      return res.status(400).json({ error: 'Registration is not pending' });
    }

    // Double-check subdomain is still available
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain: registration.subdomain },
    });

    if (existingTenant) {
      return res.status(400).json({ error: 'Subdomain is no longer available' });
    }

    // Create tenant and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: registration.companyName,
          subdomain: registration.subdomain,
          email: registration.email,
          phone: registration.phone,
          status: 'ACTIVE',
          plan: plan as SubscriptionPlan,
          maxUsers,
          maxVehicles,
          approvedAt: new Date(),
        },
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          name: registration.userName,
          email: registration.email,
          password: registration.password, // Already hashed
          role: 'ADMIN',
          tenantId: tenant.id,
        },
      });

      // Create default app config
      await tx.appConfig.create({
        data: {
          nombreEmpresa: registration.companyName,
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

      // Update registration status
      await tx.tenantRegistration.update({
        where: { id: registration.id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
        },
      });

      return { tenant, user };
    });

    // Send welcome/approval email to user (async, don't block response)
    sendAccountApproved(
      registration.email,
      registration.userName,
      registration.companyName,
      registration.subdomain
    ).catch(err => console.error('Failed to send approval email:', err));

    res.json({
      message: 'Registration approved successfully',
      tenant: result.tenant,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
    });
  } catch (error) {
    console.error('Error approving registration:', error);
    res.status(500).json({ error: 'Error approving registration' });
  }
});

// SuperAdmin: Reject registration
router.post('/:id/reject', authenticateSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const registration = await prisma.tenantRegistration.findUnique({
      where: { id: req.params.id },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (registration.status !== 'PENDING') {
      return res.status(400).json({ error: 'Registration is not pending' });
    }

    await prisma.tenantRegistration.update({
      where: { id: req.params.id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        reviewedAt: new Date(),
      },
    });

    // Send rejection email to user (async, don't block response)
    sendAccountRejected(
      registration.email,
      registration.userName,
      registration.companyName,
      reason
    ).catch(err => console.error('Failed to send rejection email:', err));

    res.json({ message: 'Registration rejected' });
  } catch (error) {
    console.error('Error rejecting registration:', error);
    res.status(500).json({ error: 'Error rejecting registration' });
  }
});

// SuperAdmin: Delete registration
router.delete('/:id', authenticateSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const registration = await prisma.tenantRegistration.findUnique({
      where: { id: req.params.id },
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    await prisma.tenantRegistration.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Registration deleted' });
  } catch (error) {
    console.error('Error deleting registration:', error);
    res.status(500).json({ error: 'Error deleting registration' });
  }
});

export default router;
