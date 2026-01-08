import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, generateUserToken } from '../middleware/auth';
import { TenantRequest, tenantMiddleware } from '../middleware/tenant';
import { sendPasswordReset, sendWelcomeEmail } from '../services/email';

const router = express.Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'VENDEDOR', 'ASISTENTE']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register a new user within a tenant (requires ADMIN role)
router.post('/register', tenantMiddleware, authenticate, async (req: AuthRequest, res) => {
  try {
    // Only admins can create new users
    if (req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can register new users' });
    }

    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const data = registerSchema.parse(req.body);

    // Check if email already exists within this tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        tenantId: req.tenantId,
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists in this organization' });
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
        role: data.role || 'ASISTENTE',
        tenantId: req.tenantId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    res.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Login - requires tenant context from subdomain
router.post('/login', tenantMiddleware, async (req: TenantRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({
        error: 'Please access through your organization subdomain',
        code: 'TENANT_REQUIRED'
      });
    }

    const data = loginSchema.parse(req.body);

    // Find user within the tenant
    const user = await prisma.user.findFirst({
      where: {
        email: data.email,
        tenantId: req.tenantId,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(data.password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token with tenant context
    const token = generateUserToken(user.id, user.tenantId);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Get current user
router.get('/me', tenantMiddleware, authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate user belongs to current tenant
    if (req.tenantId && user.tenantId !== req.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Error fetching user' });
  }
});

// Forgot password - request reset (no tenant required - works from any domain)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email (search across all tenants)
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        tenant: {
          select: { subdomain: true }
        }
      }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save token to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send reset email
    await sendPasswordReset(
      user.email,
      user.name,
      resetToken,
      user.tenant.subdomain
    );

    res.json({
      message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña'
    });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ error: 'Error processing request' });
  }
});

// Reset password - with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Find user with valid token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        error: 'El enlace es inválido o ha expirado. Por favor solicitá uno nuevo.'
      });
    }

    // Hash new password and clear reset token
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Error resetting password' });
  }
});

// Validate reset token
router.get('/validate-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
      select: {
        email: true,
        name: true,
      },
    });

    if (!user) {
      return res.status(400).json({
        valid: false,
        error: 'El enlace es inválido o ha expirado'
      });
    }

    res.json({
      valid: true,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error('Error validating reset token:', error);
    res.status(500).json({ valid: false, error: 'Error validating token' });
  }
});

// Change password
router.post('/change-password', tenantMiddleware, authenticate, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Error changing password' });
  }
});

export default router;
