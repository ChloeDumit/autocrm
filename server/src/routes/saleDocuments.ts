import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();
const prisma = new PrismaClient();

const documentSchema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(['CONTRATO', 'COMPROBANTE_PAGO', 'ENTREGA', 'IDENTIFICACION', 'OTRO']),
  categoria: z.enum(['contrato', 'pago', 'entrega', 'identificacion']).optional(),
  archivo: z.string().min(1),
  contenido: z.string().optional(),
  mimetype: z.string().optional(),
  descripcion: z.string().optional(),
  salePaymentMethodId: z.string().optional(),
});

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Get all documents for a sale
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

    const documents = await prisma.saleDocument.findMany({
      where: { saleId: req.params.saleId },
      include: {
        salePaymentMethod: {
          include: {
            paymentMethod: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Get single document
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const document = await prisma.saleDocument.findUnique({
      where: { id: req.params.id },
      include: {
        sale: true,
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Verify sale belongs to tenant
    if (document.sale.tenantId !== req.tenantId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Error fetching document' });
  }
});

// Create document
router.post('/', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const data = documentSchema.parse(req.body);
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

    // If salePaymentMethodId is provided, verify it belongs to this sale
    if (data.salePaymentMethodId) {
      const paymentMethod = await prisma.salePaymentMethod.findFirst({
        where: {
          id: data.salePaymentMethodId,
          saleId: saleId,
        },
      });
      if (!paymentMethod) {
        return res.status(400).json({ error: 'Payment method not found for this sale' });
      }
    }

    const document = await prisma.saleDocument.create({
      data: {
        nombre: data.nombre,
        tipo: data.tipo,
        categoria: data.categoria || null,
        archivo: data.archivo,
        contenido: data.contenido || null,
        mimetype: data.mimetype || null,
        descripcion: data.descripcion || null,
        saleId,
        salePaymentMethodId: data.salePaymentMethodId || null,
      },
      include: {
        salePaymentMethod: {
          include: {
            paymentMethod: true,
          },
        },
      },
    });

    res.status(201).json(document);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Error creating document' });
  }
});

// Update document
router.put('/:id', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify document belongs to a sale in this tenant
    const existingDocument = await prisma.saleDocument.findUnique({
      where: { id: req.params.id },
      include: { sale: true },
    });

    if (!existingDocument || existingDocument.sale.tenantId !== req.tenantId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const data = documentSchema.partial().parse(req.body);

    // If salePaymentMethodId is provided, verify it belongs to this sale
    if (data.salePaymentMethodId) {
      const paymentMethod = await prisma.salePaymentMethod.findFirst({
        where: {
          id: data.salePaymentMethodId,
          saleId: existingDocument.saleId,
        },
      });
      if (!paymentMethod) {
        return res.status(400).json({ error: 'Payment method not found for this sale' });
      }
    }

    const updateData: any = {
      nombre: data.nombre,
      tipo: data.tipo,
      categoria: data.categoria !== undefined ? data.categoria : undefined,
      archivo: data.archivo,
      contenido: data.contenido !== undefined ? data.contenido : undefined,
      mimetype: data.mimetype !== undefined ? data.mimetype : undefined,
      descripcion: data.descripcion !== undefined ? data.descripcion : undefined,
      salePaymentMethodId: data.salePaymentMethodId !== undefined ? data.salePaymentMethodId : undefined,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const document = await prisma.saleDocument.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        salePaymentMethod: {
          include: {
            paymentMethod: true,
          },
        },
      },
    });

    res.json(document);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Error updating document' });
  }
});

// Delete document
router.delete('/:id', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify document belongs to a sale in this tenant
    const existingDocument = await prisma.saleDocument.findUnique({
      where: { id: req.params.id },
      include: { sale: true },
    });

    if (!existingDocument || existingDocument.sale.tenantId !== req.tenantId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await prisma.saleDocument.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Error deleting document' });
  }
});

export default router;
