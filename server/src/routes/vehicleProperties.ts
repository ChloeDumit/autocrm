import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const propertyFieldSchema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(['TEXT', 'NUMBER', 'DATE', 'BOOLEAN']),
  orden: z.number().int().optional(),
  activa: z.boolean().optional(),
});

const propertyValueSchema = z.object({
  fieldId: z.string(),
  valor: z.string(),
});

// Get all property fields (predefined and custom)
router.get('/fields', authenticate, async (req: AuthRequest, res) => {
  try {
    const fields = await prisma.vehiclePropertyField.findMany({
      where: { activa: true },
      orderBy: [
        { esPredefinida: 'desc' },
        { orden: 'asc' },
        { nombre: 'asc' },
      ],
    });

    res.json(fields);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching property fields' });
  }
});

// Get property fields for a specific vehicle
router.get('/vehicle/:vehicleId', authenticate, async (req: AuthRequest, res) => {
  try {
    const properties = await prisma.vehicleProperty.findMany({
      where: { vehicleId: req.params.vehicleId },
      include: {
        field: true,
      },
      orderBy: {
        field: {
          orden: 'asc',
        },
      },
    });

    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching vehicle properties' });
  }
});

// Create custom property field (only ADMIN)
router.post('/fields', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const data = propertyFieldSchema.parse(req.body);
    
    // Obtener el máximo orden para campos custom
    const maxOrder = await prisma.vehiclePropertyField.findFirst({
      where: { esPredefinida: false },
      orderBy: { orden: 'desc' },
    });

    const field = await prisma.vehiclePropertyField.create({
      data: {
        nombre: data.nombre,
        tipo: data.tipo,
        esPredefinida: false,
        orden: data.orden ?? (maxOrder ? maxOrder.orden + 1 : 100),
        activa: data.activa ?? true,
      },
    });

    res.status(201).json(field);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error creating property field' });
  }
});

// Update property field (only ADMIN, and only custom fields)
router.put('/fields/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const field = await prisma.vehiclePropertyField.findUnique({
      where: { id: req.params.id },
    });

    if (!field) {
      return res.status(404).json({ error: 'Property field not found' });
    }

    if (field.esPredefinida) {
      return res.status(403).json({ error: 'Cannot modify predefined fields' });
    }

    const data = propertyFieldSchema.partial().parse(req.body);

    const updated = await prisma.vehiclePropertyField.update({
      where: { id: req.params.id },
      data,
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error updating property field' });
  }
});

// Delete property field (only ADMIN, and only custom fields)
router.delete('/fields/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const field = await prisma.vehiclePropertyField.findUnique({
      where: { id: req.params.id },
    });

    if (!field) {
      return res.status(404).json({ error: 'Property field not found' });
    }

    if (field.esPredefinida) {
      return res.status(403).json({ error: 'Cannot delete predefined fields' });
    }

    await prisma.vehiclePropertyField.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Property field deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting property field' });
  }
});

// Set property value for a vehicle
router.post('/vehicle/:vehicleId', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req: AuthRequest, res) => {
  try {
    const { vehicleId } = req.params;
    const { properties } = req.body; // Array of { fieldId, valor }

    if (!Array.isArray(properties)) {
      return res.status(400).json({ error: 'Properties must be an array' });
    }

    // Verificar que el vehículo existe
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Eliminar propiedades existentes del vehículo
    await prisma.vehicleProperty.deleteMany({
      where: { vehicleId },
    });

    // Crear nuevas propiedades
    const createdProperties = await Promise.all(
      properties.map(async (prop: { fieldId: string; valor: string }) => {
        const propertyValueSchema = z.object({
          fieldId: z.string(),
          valor: z.string(),
        });
        
        const data = propertyValueSchema.parse(prop);
        
        return prisma.vehicleProperty.upsert({
          where: {
            vehicleId_fieldId: {
              vehicleId,
              fieldId: data.fieldId,
            },
          },
          update: {
            valor: data.valor,
          },
          create: {
            vehicleId,
            fieldId: data.fieldId,
            valor: data.valor,
          },
        });
      })
    );

    res.json(createdProperties);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error setting vehicle properties' });
  }
});

export default router;



