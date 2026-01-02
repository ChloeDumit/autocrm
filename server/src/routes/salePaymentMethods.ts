import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const salePaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1),
  monto: z.number().positive().optional(),
  notas: z.string().optional(),
});

// Get all payment methods for a sale
router.get('/sale/:saleId', authenticate, async (req: AuthRequest, res) => {
  try {
    const paymentMethods = await prisma.salePaymentMethod.findMany({
      where: { saleId: req.params.saleId },
      include: {
        paymentMethod: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(paymentMethods);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching payment methods' });
  }
});

// Add payment method to sale
router.post('/', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req: AuthRequest, res) => {
  try {
    const data = salePaymentMethodSchema.parse(req.body);
    const { saleId } = req.body;

    if (!saleId) {
      return res.status(400).json({ error: 'saleId is required' });
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
    res.status(500).json({ error: 'Error adding payment method' });
  }
});

// Update sale payment method
router.put('/:id', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req: AuthRequest, res) => {
  try {
    const data = salePaymentMethodSchema.partial().parse(req.body);

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
    res.status(500).json({ error: 'Error updating payment method' });
  }
});

// Remove payment method from sale
router.delete('/:id', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req, res) => {
  try {
    await prisma.salePaymentMethod.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Payment method removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error removing payment method' });
  }
});

export default router;
