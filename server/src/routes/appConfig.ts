import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { tenantMiddleware, TenantRequest } from '../middleware/tenant';

const router = express.Router();
const prisma = new PrismaClient();

const configSchema = z.object({
  nombreEmpresa: z.string().min(1),
  colorPrimario: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  colorSecundario: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  logo: z.string().optional().or(z.literal('')),
  plantillaInstagram: z.string().optional().nullable(),
  plantillaMercadolibreTitulo: z.string().optional().nullable(),
  plantillaMercadolibreDescripcion: z.string().optional().nullable(),
});

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Get app config for tenant
router.get('/', async (req: TenantRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    let config = await prisma.appConfig.findUnique({
      where: { tenantId: req.tenantId },
    });

    if (!config) {
      // Create default config for this tenant
      config = await prisma.appConfig.create({
        data: {
          nombreEmpresa: req.tenant?.name || 'Rodar',
          colorPrimario: '#3b82f6',
          colorSecundario: '#1e40af',
          tenantId: req.tenantId,
        },
      });
    }

    res.json(config);
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Error fetching config' });
  }
});

// Update app config (only admin)
router.put('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const data = configSchema.parse(req.body);

    let config = await prisma.appConfig.findUnique({
      where: { tenantId: req.tenantId },
    });

    const configData = {
      nombreEmpresa: data.nombreEmpresa,
      colorPrimario: data.colorPrimario,
      colorSecundario: data.colorSecundario,
      logo: data.logo || null,
      plantillaInstagram: data.plantillaInstagram || null,
      plantillaMercadolibreTitulo: data.plantillaMercadolibreTitulo || null,
      plantillaMercadolibreDescripcion: data.plantillaMercadolibreDescripcion || null,
    };

    if (!config) {
      config = await prisma.appConfig.create({
        data: { ...configData, tenantId: req.tenantId },
      });
    } else {
      config = await prisma.appConfig.update({
        where: { tenantId: req.tenantId },
        data: configData,
      });
    }

    res.json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Error updating config' });
  }
});

export default router;
