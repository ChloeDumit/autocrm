import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const saleSchema = z.object({
  vehicleId: z.string(),
  clientId: z.string(),
  etapa: z.enum(['INTERESADO', 'PRUEBA', 'NEGOCIACION', 'VENDIDO', 'CANCELADO']).optional(),
  precioFinal: z.number().positive().optional(),
  notas: z.string().optional(),
});

// Get all sales
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { etapa, vendedorId } = req.query;
    
    const where: any = {};
    if (etapa) {
      where.etapa = etapa;
    }
    if (vendedorId) {
      where.vendedorId = vendedorId;
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        vehicle: true,
        client: true,
        vendedor: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching sales' });
  }
});

// Get single sale
router.get('/:id', authenticate, async (req, res) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: {
        vehicle: {
          include: {
            createdBy: {
              select: { name: true },
            },
          },
        },
        client: true,
        vendedor: {
          select: { name: true, email: true, role: true },
        },
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching sale' });
  }
});

// Create sale
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = saleSchema.parse(req.body);

    const sale = await prisma.sale.create({
      data: {
        ...data,
        etapa: data.etapa || 'INTERESADO',
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
        titulo: 'Nueva venta iniciada',
        mensaje: `Se inició una venta para ${sale.client.nombre} - ${sale.vehicle.marca} ${sale.vehicle.modelo}`,
        tipo: 'INFO',
        userId: req.userId!,
      },
    });

    res.status(201).json(sale);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error creating sale' });
  }
});

// Update sale
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = saleSchema.partial().parse(req.body);

    const sale = await prisma.sale.update({
      where: { id: req.params.id },
      data,
      include: {
        vehicle: true,
        client: true,
        vendedor: {
          select: { name: true, email: true },
        },
      },
    });

    // If sale is completed, update vehicle status
    if (data.etapa === 'VENDIDO') {
      await prisma.vehicle.update({
        where: { id: sale.vehicleId },
        data: { estado: 'VENDIDO' },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          titulo: 'Venta completada',
          mensaje: `Venta completada: ${sale.client.nombre} - ${sale.vehicle.marca} ${sale.vehicle.modelo}`,
          tipo: 'SUCCESS',
          userId: req.userId!,
        },
      });
    }

    res.json(sale);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error updating sale' });
  }
});

// Delete sale
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.sale.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting sale' });
  }
});

export default router;

