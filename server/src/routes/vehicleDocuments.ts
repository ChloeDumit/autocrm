import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const documentSchema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(['TITULO', 'SEGURO', 'REVISION', 'OTRO']),
  archivo: z.string().min(1),
  contenido: z.string().optional(), // Base64 del archivo
  mimetype: z.string().optional(),
  descripcion: z.string().optional(),
  fechaVencimiento: z.string().optional(),
});

// Get all documents for a vehicle
router.get('/vehicle/:vehicleId', authenticate, async (req: AuthRequest, res) => {
  try {
    const documents = await prisma.vehicleDocument.findMany({
      where: { vehicleId: req.params.vehicleId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

// Get single document
router.get('/:id', authenticate, async (req, res) => {
  try {
    const document = await prisma.vehicleDocument.findUnique({
      where: { id: req.params.id },
      include: {
        vehicle: true,
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching document' });
  }
});

// Create document
router.post('/', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req: AuthRequest, res) => {
  try {
    const data = documentSchema.parse(req.body);
    const { vehicleId } = req.body;

    if (!vehicleId) {
      return res.status(400).json({ error: 'vehicleId is required' });
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
    res.status(500).json({ error: 'Error creating document' });
  }
});

// Update document
router.put('/:id', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req: AuthRequest, res) => {
  try {
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

    // Eliminar campos undefined
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
    res.status(500).json({ error: 'Error updating document' });
  }
});

// Delete document
router.delete('/:id', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req, res) => {
  try {
    await prisma.vehicleDocument.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting document' });
  }
});

export default router;

