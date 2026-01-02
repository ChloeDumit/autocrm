import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const paymentMethodSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  activo: z.boolean().optional(),
});

const paymentDocumentSchema = z.object({
  nombre: z.string().min(1),
  archivo: z.string().min(1),
  contenido: z.string().optional(), // Base64 del archivo
  mimetype: z.string().optional(),
  descripcion: z.string().optional(),
});

// Get all payment methods
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { activo } = req.query;
    
    const where: any = {};
    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const methods = await prisma.paymentMethod.findMany({
      where,
      include: {
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(methods);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching payment methods' });
  }
});

// Get single payment method
router.get('/:id', authenticate, async (req, res) => {
  try {
    const method = await prisma.paymentMethod.findUnique({
      where: { id: req.params.id },
      include: {
        documents: true,
      },
    });

    if (!method) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    res.json(method);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching payment method' });
  }
});

// Create payment method
router.post('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = paymentMethodSchema.parse(req.body);

    const method = await prisma.paymentMethod.create({
      data: {
        ...data,
        activo: data.activo !== undefined ? data.activo : true,
      },
    });

    res.status(201).json(method);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error creating payment method' });
  }
});

// Update payment method
router.put('/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = paymentMethodSchema.partial().parse(req.body);

    const method = await prisma.paymentMethod.update({
      where: { id: req.params.id },
      data,
    });

    res.json(method);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error updating payment method' });
  }
});

// Delete payment method
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.paymentMethod.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting payment method' });
  }
});

// Add document to payment method
router.post('/:id/documents', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = paymentDocumentSchema.parse(req.body);

    const document = await prisma.paymentDocument.create({
      data: {
        nombre: data.nombre,
        archivo: data.archivo,
        contenido: data.contenido || null,
        mimetype: data.mimetype || null,
        descripcion: data.descripcion || null,
        paymentMethodId: req.params.id,
      },
    });

    res.status(201).json(document);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error creating payment document' });
  }
});

// Delete payment document
router.delete('/documents/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.paymentDocument.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Payment document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting payment document' });
  }
});

export default router;

