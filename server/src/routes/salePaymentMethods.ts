import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();
const prisma = new PrismaClient();

const salePaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1),
  monto: z.number().positive().optional(),
  notas: z.string().optional(),
});

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Get all payment methods for a sale
router.get('/sale/:saleId', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify sale belongs to tenant
    const sale = await prisma.sale.findFirst({
      where: {
        id: req.params.saleId,
        tenantId: req.tenantId,
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const paymentMethods = await prisma.salePaymentMethod.findMany({
      where: { saleId: req.params.saleId },
      include: {
        paymentMethod: {
          include: {
            documents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(paymentMethods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Error fetching payment methods' });
  }
});

// Add payment method to sale
router.post('/', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const data = salePaymentMethodSchema.parse(req.body);
    const { saleId } = req.body;

    if (!saleId) {
      return res.status(400).json({ error: 'saleId is required' });
    }

    // Verify sale belongs to tenant
    const sale = await prisma.sale.findFirst({
      where: {
        id: saleId,
        tenantId: req.tenantId,
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    // Verify payment method belongs to tenant
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id: data.paymentMethodId,
        tenantId: req.tenantId,
      },
    });

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    const salePaymentMethod = await prisma.salePaymentMethod.create({
      data: {
        saleId,
        paymentMethodId: data.paymentMethodId,
        monto: data.monto || null,
        notas: data.notas || null,
      },
      include: {
        paymentMethod: true,
      },
    });

    res.status(201).json(salePaymentMethod);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error adding payment method:', error);
    res.status(500).json({ error: 'Error adding payment method' });
  }
});

// Update sale payment method
router.put('/:id', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify sale payment method belongs to a sale in this tenant
    const existingSalePaymentMethod = await prisma.salePaymentMethod.findUnique({
      where: { id: req.params.id },
      include: { sale: true },
    });

    if (!existingSalePaymentMethod || existingSalePaymentMethod.sale.tenantId !== req.tenantId) {
      return res.status(404).json({ error: 'Sale payment method not found' });
    }

    const data = salePaymentMethodSchema.partial().parse(req.body);

    // If changing payment method, verify it belongs to tenant
    if (data.paymentMethodId) {
      const paymentMethod = await prisma.paymentMethod.findFirst({
        where: {
          id: data.paymentMethodId,
          tenantId: req.tenantId,
        },
      });

      if (!paymentMethod) {
        return res.status(404).json({ error: 'Payment method not found' });
      }
    }

    const salePaymentMethod = await prisma.salePaymentMethod.update({
      where: { id: req.params.id },
      data: {
        paymentMethodId: data.paymentMethodId,
        monto: data.monto !== undefined ? data.monto : undefined,
        notas: data.notas !== undefined ? data.notas : undefined,
      },
      include: {
        paymentMethod: true,
      },
    });

    res.json(salePaymentMethod);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating payment method:', error);
    res.status(500).json({ error: 'Error updating payment method' });
  }
});

// Remove payment method from sale
router.delete('/:id', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify sale payment method belongs to a sale in this tenant
    const existingSalePaymentMethod = await prisma.salePaymentMethod.findUnique({
      where: { id: req.params.id },
      include: { sale: true },
    });

    if (!existingSalePaymentMethod || existingSalePaymentMethod.sale.tenantId !== req.tenantId) {
      return res.status(404).json({ error: 'Sale payment method not found' });
    }

    await prisma.salePaymentMethod.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Payment method removed successfully' });
  } catch (error) {
    console.error('Error removing payment method:', error);
    res.status(500).json({ error: 'Error removing payment method' });
  }
});

export default router;
