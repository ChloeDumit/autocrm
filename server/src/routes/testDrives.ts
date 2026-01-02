import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';

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

// Get all test drives
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { fecha, estado, vendedorId } = req.query;
    
    const where: any = {};
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
    res.status(500).json({ error: 'Error fetching test drives' });
  }
});

// Get single test drive
router.get('/:id', authenticate, async (req, res) => {
  try {
    const testDrive = await prisma.testDrive.findUnique({
      where: { id: req.params.id },
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
    res.status(500).json({ error: 'Error fetching test drive' });
  }
});

// Create test drive
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = testDriveSchema.parse(req.body);

    const testDrive = await prisma.testDrive.create({
      data: {
        ...data,
        fecha: new Date(data.fecha),
        estado: data.estado || 'PENDIENTE',
        vendedorId: req.userId!,
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
      },
    });

    res.status(201).json(testDrive);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error creating test drive' });
  }
});

// Update test drive
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
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
    res.status(500).json({ error: 'Error updating test drive' });
  }
});

// Delete test drive
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.testDrive.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Test drive deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting test drive' });
  }
});

export default router;

