import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

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
  contenido: z.string().optional(),
  mimetype: z.string().optional(),
  descripcion: z.string().optional(),
});

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Get all payment methods
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const { activo } = req.query;

    const where: any = {
      tenantId: req.tenantId,
    };
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
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Error fetching payment methods' });
  }
});

// Get single payment method
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const method = await prisma.paymentMethod.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
      include: {
        documents: true,
      },
    });

    if (!method) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    res.json(method);
  } catch (error) {
    console.error('Error fetching payment method:', error);
    res.status(500).json({ error: 'Error fetching payment method' });
  }
});

// Create payment method
router.post('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const data = paymentMethodSchema.parse(req.body);

    const method = await prisma.paymentMethod.create({
      data: {
        ...data,
        activo: data.activo !== undefined ? data.activo : true,
        tenantId: req.tenantId,
      },
    });

    res.status(201).json(method);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating payment method:', error);
    res.status(500).json({ error: 'Error creating payment method' });
  }
});

// Update payment method
router.put('/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify payment method belongs to tenant
    const existingMethod = await prisma.paymentMethod.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
    });

    if (!existingMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

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
    console.error('Error updating payment method:', error);
    res.status(500).json({ error: 'Error updating payment method' });
  }
});

// Delete payment method
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify payment method belongs to tenant
    const existingMethod = await prisma.paymentMethod.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
    });

    if (!existingMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    await prisma.paymentMethod.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ error: 'Error deleting payment method' });
  }
});

// Add document to payment method
router.post('/:id/documents', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify payment method belongs to tenant
    const existingMethod = await prisma.paymentMethod.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
    });

    if (!existingMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

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
    console.error('Error creating payment document:', error);
    res.status(500).json({ error: 'Error creating payment document' });
  }
});

// Delete payment document
router.delete('/documents/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify document belongs to a payment method in this tenant
    const document = await prisma.paymentDocument.findUnique({
      where: { id: req.params.id },
      include: { paymentMethod: true },
    });

    if (!document || document.paymentMethod.tenantId !== req.tenantId) {
      return res.status(404).json({ error: 'Payment document not found' });
    }

    await prisma.paymentDocument.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Payment document deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment document:', error);
    res.status(500).json({ error: 'Error deleting payment document' });
  }
});

export default router;
