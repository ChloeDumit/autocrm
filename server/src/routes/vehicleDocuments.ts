import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();
const prisma = new PrismaClient();

const documentSchema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(['TITULO', 'SEGURO', 'REVISION', 'OTRO']),
  archivo: z.string().min(1),
  contenido: z.string().optional(),
  mimetype: z.string().optional(),
  descripcion: z.string().optional(),
  fechaVencimiento: z.string().optional(),
});

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Get all documents for a vehicle
router.get('/vehicle/:vehicleId', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify vehicle belongs to tenant
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: req.params.vehicleId,
        tenantId: req.tenantId,
      },
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const documents = await prisma.vehicleDocument.findMany({
      where: { vehicleId: req.params.vehicleId },
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

    const document = await prisma.vehicleDocument.findUnique({
      where: { id: req.params.id },
      include: {
        vehicle: true,
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Verify vehicle belongs to tenant
    if (document.vehicle.tenantId !== req.tenantId) {
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
    const { vehicleId } = req.body;

    if (!vehicleId) {
      return res.status(400).json({ error: 'vehicleId is required' });
    }

    // Verify vehicle belongs to tenant
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        tenantId: req.tenantId,
      },
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const document = await prisma.vehicleDocument.create({
      data: {
        nombre: data.nombre,
        tipo: data.tipo,
        archivo: data.archivo,
        contenido: data.contenido || null,
        mimetype: data.mimetype || null,
        descripcion: data.descripcion || null,
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
        vehicleId,
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

    // Verify document belongs to a vehicle in this tenant
    const existingDocument = await prisma.vehicleDocument.findUnique({
      where: { id: req.params.id },
      include: { vehicle: true },
    });

    if (!existingDocument || existingDocument.vehicle.tenantId !== req.tenantId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const data = documentSchema.partial().parse(req.body);

    const updateData: any = {
      nombre: data.nombre,
      tipo: data.tipo,
      archivo: data.archivo,
      contenido: data.contenido !== undefined ? data.contenido : undefined,
      mimetype: data.mimetype !== undefined ? data.mimetype : undefined,
      descripcion: data.descripcion !== undefined ? data.descripcion : undefined,
    };

    if (data.fechaVencimiento) {
      updateData.fechaVencimiento = new Date(data.fechaVencimiento);
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const document = await prisma.vehicleDocument.update({
      where: { id: req.params.id },
      data: updateData,
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

    // Verify document belongs to a vehicle in this tenant
    const existingDocument = await prisma.vehicleDocument.findUnique({
      where: { id: req.params.id },
      include: { vehicle: true },
    });

    if (!existingDocument || existingDocument.vehicle.tenantId !== req.tenantId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await prisma.vehicleDocument.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Error deleting document' });
  }
});

export default router;
