import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import {
  generateSuperAdminToken,
  authenticateSuperAdmin,
  AuthRequest,
  generateUserToken
} from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const createSuperAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

// SuperAdmin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email },
    });

    if (!superAdmin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, superAdmin.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateSuperAdminToken(superAdmin.id);

    res.json({
      token,
      superAdmin: {
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('SuperAdmin login error:', error);
    res.status(500).json({ error: 'Error during login' });
  }
});

// Get current SuperAdmin profile
router.get('/me', authenticateSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!superAdmin) {
      return res.status(404).json({ error: 'SuperAdmin not found' });
    }

    res.json(superAdmin);
  } catch (error) {
    console.error('Error fetching SuperAdmin:', error);
    res.status(500).json({ error: 'Error fetching SuperAdmin profile' });
  }
});

// Create new SuperAdmin (only existing super admins can create new ones)
router.post('/create', authenticateSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const data = createSuperAdminSchema.parse(req.body);

    // Check if email already exists
    const existingSuperAdmin = await prisma.superAdmin.findUnique({
      where: { email: data.email },
    });

    if (existingSuperAdmin) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const superAdmin = await prisma.superAdmin.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    res.status(201).json(superAdmin);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating SuperAdmin:', error);
    res.status(500).json({ error: 'Error creating SuperAdmin' });
  }
});

// Impersonate a tenant user
router.post('/impersonate/:userId', authenticateSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      include: { tenant: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.tenantId) {
      return res.status(400).json({ error: 'User has no tenant' });
    }

    // Generate impersonation token (valid for 1 hour, marked as impersonation)
    const token = generateUserToken(user.id, user.tenantId, req.userId);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant: {
          id: user.tenant?.id,
          name: user.tenant?.name,
          subdomain: user.tenant?.subdomain,
        },
      },
      impersonatedBy: req.userId,
    });
  } catch (error) {
    console.error('Error impersonating user:', error);
    res.status(500).json({ error: 'Error impersonating user' });
  }
});

// List all SuperAdmins
router.get('/list', authenticateSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const superAdmins = await prisma.superAdmin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(superAdmins);
  } catch (error) {
    console.error('Error fetching SuperAdmins:', error);
    res.status(500).json({ error: 'Error fetching SuperAdmins' });
  }
});

// Update SuperAdmin password
router.put('/password', authenticateSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    });

    const { currentPassword, newPassword } = schema.parse(req.body);

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: req.userId },
    });

    if (!superAdmin) {
      return res.status(404).json({ error: 'SuperAdmin not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, superAdmin.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.superAdmin.update({
      where: { id: req.userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Error updating password' });
  }
});

export default router;
