import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const configSchema = z.object({
  nombreEmpresa: z.string().min(1),
  colorPrimario: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  colorSecundario: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  logo: z.string().url().optional().or(z.literal('')),
});

// Get app config (public, no auth required)
router.get('/', async (req, res) => {
  try {
    let config = await prisma.appConfig.findFirst();

    if (!config) {
      // Create default config
      config = await prisma.appConfig.create({
        data: {
          nombreEmpresa: 'AutoCRM',
          colorPrimario: '#3b82f6',
          colorSecundario: '#1e40af',
        },
      });
    }

    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching config' });
  }
});

// Update app config (only admin)
router.put('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = configSchema.parse(req.body);

    let config = await prisma.appConfig.findFirst();

    if (!config) {
      config = await prisma.appConfig.create({
        data: {
          nombreEmpresa: data.nombreEmpresa,
          colorPrimario: data.colorPrimario,
          colorSecundario: data.colorSecundario,
          logo: data.logo || null,
        },
      });
    } else {
      config = await prisma.appConfig.update({
        where: { id: config.id },
        data: {
          nombreEmpresa: data.nombreEmpresa,
          colorPrimario: data.colorPrimario,
          colorSecundario: data.colorSecundario,
          logo: data.logo || null,
        },
      });
    }

    res.json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error updating config' });
  }
});

export default router;

