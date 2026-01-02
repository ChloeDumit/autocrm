import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const clientSchema = z.object({
  nombre: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().min(1),
  direccion: z.string().optional(),
  interes: z.string().optional(),
  notas: z.string().optional(),
});

// Get all clients
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { search } = req.query;
    
    const where: any = {};
    if (search) {
      where.OR = [
        { nombre: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { telefono: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
        sales: {
          include: {
            vehicle: true,
            vendedor: {
              select: { name: true },
            },
          },
        },
        testDrives: {
          include: {
            vehicle: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching clients' });
  }
});

// Get single client
router.get('/:id', authenticate, async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
        sales: {
          include: {
            vehicle: {
              include: {
                createdBy: {
                  select: { name: true },
                },
              },
            },
            vendedor: {
              select: { name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        testDrives: {
          include: {
            vehicle: true,
            vendedor: {
              select: { name: true },
            },
          },
          orderBy: { fecha: 'desc' },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching client' });
  }
});

// Create client
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = clientSchema.parse(req.body);

    const client = await prisma.client.create({
      data: {
        ...data,
        email: data.email || undefined,
        createdById: req.userId!,
      },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    res.status(201).json(client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error creating client' });
  }
});

// Update client
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = clientSchema.partial().parse(req.body);

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        ...data,
        email: data.email || undefined,
      },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    res.json(client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error updating client' });
  }
});

// Delete client
router.delete('/:id', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req, res) => {
  try {
    await prisma.client.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting client' });
  }
});

export default router;

