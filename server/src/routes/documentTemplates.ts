import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const templateSchema = z.object({
  nombre: z.string().min(1),
  contenido: z.string().min(1),
  descripcion: z.string().optional(),
  activo: z.boolean().optional(),
});

// Get all templates
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { activo } = req.query;
    
    const where: any = {};
    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const templates = await prisma.documentTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching templates' });
  }
});

// Get single template
router.get('/:id', authenticate, async (req, res) => {
  try {
    const template = await prisma.documentTemplate.findUnique({
      where: { id: req.params.id },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching template' });
  }
});

// Generate document from template
router.post('/:id/generate', authenticate, async (req: AuthRequest, res) => {
  try {
    const { saleId } = req.body;
    
    const template = await prisma.documentTemplate.findUnique({
      where: { id: req.params.id },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (!template.activo) {
      return res.status(400).json({ error: 'Template is not active' });
    }

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        vehicle: true,
        client: true,
        vendedor: true,
      },
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    // Replace placeholders
    let document = template.contenido;
    document = document.replace(/\{\{cliente_nombre\}\}/g, sale.client.nombre);
    document = document.replace(/\{\{cliente_email\}\}/g, sale.client.email || '');
    document = document.replace(/\{\{cliente_telefono\}\}/g, sale.client.telefono);
    document = document.replace(/\{\{cliente_direccion\}\}/g, sale.client.direccion || '');
    document = document.replace(/\{\{vehiculo_marca\}\}/g, sale.vehicle.marca);
    document = document.replace(/\{\{vehiculo_modelo\}\}/g, sale.vehicle.modelo);
    document = document.replace(/\{\{vehiculo_ano\}\}/g, sale.vehicle.ano.toString());
    document = document.replace(/\{\{vehiculo_precio\}\}/g, sale.vehicle.precio.toString());
    document = document.replace(/\{\{vehiculo_kilometraje\}\}/g, sale.vehicle.kilometraje.toString());
    document = document.replace(/\{\{precio_final\}\}/g, sale.precioFinal?.toString() || sale.vehicle.precio.toString());
    document = document.replace(/\{\{vendedor_nombre\}\}/g, sale.vendedor.name);
    const fechaVenta = new Date(sale.createdAt).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const fechaActual = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    document = document.replace(/\{\{fecha_venta\}\}/g, fechaVenta);
    document = document.replace(/\{\{fecha_actual\}\}/g, fechaActual);

    res.json({ document, template: template.nombre });
  } catch (error) {
    res.status(500).json({ error: 'Error generating document' });
  }
});

// Create template
router.post('/', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req: AuthRequest, res) => {
  try {
    const data = templateSchema.parse(req.body);

    const template = await prisma.documentTemplate.create({
      data: {
        ...data,
        activo: data.activo !== undefined ? data.activo : true,
      },
    });

    res.status(201).json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error creating template' });
  }
});

// Update template
router.put('/:id', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req: AuthRequest, res) => {
  try {
    const data = templateSchema.partial().parse(req.body);

    const template = await prisma.documentTemplate.update({
      where: { id: req.params.id },
      data,
    });

    res.json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Error updating template' });
  }
});

// Delete template
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.documentTemplate.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting template' });
  }
});

export default router;

