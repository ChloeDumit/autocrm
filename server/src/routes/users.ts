import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();
const prisma = new PrismaClient();

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'VENDEDOR', 'ASISTENTE']),
});

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Get all users (only admin)
router.get('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const users = await prisma.user.findMany({
      where: { tenantId: req.tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Get single user
router.get('/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const user = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Error fetching user' });
  }
});

// Create user (only admin)
router.post('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const data = userSchema.parse(req.body);

    // Check if email already exists in this tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        tenantId: req.tenantId,
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists in this organization' });
    }

    if (!data.password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Check tenant user limit
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: { maxUsers: true },
    });

    const currentUserCount = await prisma.user.count({
      where: { tenantId: req.tenantId },
    });

    if (tenant && currentUserCount >= tenant.maxUsers) {
      return res.status(400).json({
        error: 'Maximum user limit reached for this organization',
        code: 'USER_LIMIT_REACHED'
      });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role,
        tenantId: req.tenantId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Update user (only admin)
router.put('/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify user belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const data = userSchema.partial().parse(req.body);

    const updateData: any = {
      name: data.name,
      role: data.role,
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Error updating user' });
  }
});

// Delete user (only admin)
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify user belongs to tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow deleting yourself
    if (existingUser.id === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error deleting user' });
  }
});

export default router;
