import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();
const prisma = new PrismaClient();

const testDriveSchema = z.object({
  vehicleId: z.string(),
  clientId: z.string(),
  fecha: z.string(),
  hora: z.string(),
  notas: z.string().optional(),
  estado: z.enum(['PENDIENTE', 'CONFIRMADO', 'COMPLETADO', 'CANCELADO']).optional(),
});

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Get all test drives
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const { fecha, estado, vendedorId } = req.query;

    const where: any = {
      tenantId: req.tenantId,
    };
    if (fecha) {
      const startDate = new Date(fecha as string);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(fecha as string);
      endDate.setHours(23, 59, 59, 999);
      where.fecha = {
        gte: startDate,
        lte: endDate,
      };
    }
    if (estado) {
      where.estado = estado;
    }
    if (vendedorId) {
      where.vendedorId = vendedorId;
    }

    const testDrives = await prisma.testDrive.findMany({
      where,
      include: {
        vehicle: true,
        client: true,
        vendedor: {
          select: { name: true, email: true },
        },
      },
      orderBy: { fecha: 'asc' },
    });

    res.json(testDrives);
  } catch (error) {
    console.error('Error fetching test drives:', error);
    res.status(500).json({ error: 'Error fetching test drives' });
  }
});

// Get single test drive
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const testDrive = await prisma.testDrive.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
      include: {
        vehicle: true,
        client: true,
        vendedor: {
          select: { name: true, email: true },
        },
      },
    });

    if (!testDrive) {
      return res.status(404).json({ error: 'Test drive not found' });
    }

    res.json(testDrive);
  } catch (error) {
    console.error('Error fetching test drive:', error);
    res.status(500).json({ error: 'Error fetching test drive' });
  }
});

// Create test drive
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const data = testDriveSchema.parse(req.body);

    // Verify vehicle belongs to tenant
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: data.vehicleId,
        tenantId: req.tenantId,
      },
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Verify client belongs to tenant
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        tenantId: req.tenantId,
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const testDrive = await prisma.testDrive.create({
      data: {
        ...data,
        fecha: new Date(data.fecha),
        estado: data.estado || 'PENDIENTE',
        vendedorId: req.userId!,
        tenantId: req.tenantId,
      },
      include: {
        vehicle: true,
        client: true,
        vendedor: {
          select: { name: true, email: true },
        },
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        titulo: 'Test drive agendado',
        mensaje: `Test drive agendado: ${testDrive.client.nombre} - ${testDrive.vehicle.marca} ${testDrive.vehicle.modelo} el ${data.fecha} a las ${data.hora}`,
        tipo: 'INFO',
        userId: req.userId!,
        tenantId: req.tenantId,
      },
    });

    res.status(201).json(testDrive);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating test drive:', error);
    res.status(500).json({ error: 'Error creating test drive' });
  }
});

// Update test drive
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify test drive belongs to tenant
    const existingTestDrive = await prisma.testDrive.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
    });

    if (!existingTestDrive) {
      return res.status(404).json({ error: 'Test drive not found' });
    }

    const data = testDriveSchema.partial().parse(req.body);

    const updateData: any = { ...data };
    if (data.fecha) {
      updateData.fecha = new Date(data.fecha);
    }

    const testDrive = await prisma.testDrive.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        vehicle: true,
        client: true,
        vendedor: {
          select: { name: true, email: true },
        },
      },
    });

    res.json(testDrive);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating test drive:', error);
    res.status(500).json({ error: 'Error updating test drive' });
  }
});

// Delete test drive
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify test drive belongs to tenant
    const existingTestDrive = await prisma.testDrive.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
    });

    if (!existingTestDrive) {
      return res.status(404).json({ error: 'Test drive not found' });
    }

    await prisma.testDrive.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Test drive deleted successfully' });
  } catch (error) {
    console.error('Error deleting test drive:', error);
    res.status(500).json({ error: 'Error deleting test drive' });
  }
});

export default router;
