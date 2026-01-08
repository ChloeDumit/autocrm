import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();
const prisma = new PrismaClient();

const saleSchema = z.object({
  vehicleId: z.string(),
  clientId: z.string(),
  etapa: z.enum(['INTERESADO', 'PRUEBA', 'NEGOCIACION', 'VENDIDO', 'CANCELADO']).optional(),
  precioFinal: z.number().positive().optional(),
  notas: z.string().optional(),
});

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Get all sales
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const { etapa, vendedorId } = req.query;

    const where: any = {
      tenantId: req.tenantId,
    };
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
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Error fetching sales' });
  }
});

// Get single sale
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const sale = await prisma.sale.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
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
        paymentMethods: {
          include: {
            paymentMethod: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          include: {
            salePaymentMethod: {
              include: {
                paymentMethod: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    res.json(sale);
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ error: 'Error fetching sale' });
  }
});

// Create sale
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const data = saleSchema.parse(req.body);

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

    const sale = await prisma.sale.create({
      data: {
        ...data,
        etapa: data.etapa || 'INTERESADO',
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
        titulo: 'Nueva venta iniciada',
        mensaje: `Se inició una venta para ${sale.client.nombre} - ${sale.vehicle.marca} ${sale.vehicle.modelo}`,
        tipo: 'INFO',
        userId: req.userId!,
        tenantId: req.tenantId,
      },
    });

    res.status(201).json(sale);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating sale:', error);
    res.status(500).json({ error: 'Error creating sale' });
  }
});

// Update sale
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify sale belongs to tenant
    const existingSale = await prisma.sale.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
    });

    if (!existingSale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

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
          tenantId: req.tenantId,
        },
      });
    }

    res.json(sale);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating sale:', error);
    res.status(500).json({ error: 'Error updating sale' });
  }
});

// Delete sale
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify sale belongs to tenant
    const existingSale = await prisma.sale.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
    });

    if (!existingSale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    await prisma.sale.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ error: 'Error deleting sale' });
  }
});

export default router;
