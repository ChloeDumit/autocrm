import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();
const prisma = new PrismaClient();

const templateSchema = z.object({
  nombre: z.string().min(1),
  contenido: z.string().min(1),
  descripcion: z.string().optional(),
  activo: z.boolean().optional(),
});

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Get all templates
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

    const templates = await prisma.documentTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Error fetching templates' });
  }
});

// Get single template
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const template = await prisma.documentTemplate.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Error fetching template' });
  }
});

// Helper: replace all template placeholders with data
function replacePlaceholders(
  contenido: string,
  data: {
    client: { nombre: string; email?: string | null; telefono: string; direccion?: string | null };
    vehicle: { marca: string; modelo: string; ano: number; precio: number; kilometraje: number };
    precioFinal?: number | null;
    vendedorNombre: string;
    fechaVenta: string;
    pagoMetodos: string;
    pagoTotal: string;
  }
): string {
  let document = contenido;
  document = document.replace(/\{\{cliente_nombre\}\}/g, data.client.nombre);
  document = document.replace(/\{\{cliente_email\}\}/g, data.client.email || '');
  document = document.replace(/\{\{cliente_telefono\}\}/g, data.client.telefono);
  document = document.replace(/\{\{cliente_direccion\}\}/g, data.client.direccion || '');
  document = document.replace(/\{\{vehiculo_marca\}\}/g, data.vehicle.marca);
  document = document.replace(/\{\{vehiculo_modelo\}\}/g, data.vehicle.modelo);
  document = document.replace(/\{\{vehiculo_ano\}\}/g, data.vehicle.ano.toString());
  document = document.replace(/\{\{vehiculo_precio\}\}/g, data.vehicle.precio.toString());
  document = document.replace(/\{\{vehiculo_kilometraje\}\}/g, data.vehicle.kilometraje.toString());
  const precio = data.precioFinal?.toString() || data.vehicle.precio.toString();
  document = document.replace(/\{\{precio_final\}\}/g, precio);
  document = document.replace(/\{\{venta_precio\}\}/g, precio);
  document = document.replace(/\{\{vendedor_nombre\}\}/g, data.vendedorNombre);
  const fechaActual = new Date().toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  document = document.replace(/\{\{fecha_venta\}\}/g, data.fechaVenta);
  document = document.replace(/\{\{fecha_actual\}\}/g, fechaActual);
  document = document.replace(/\{\{pago_metodos\}\}/g, data.pagoMetodos);
  document = document.replace(/\{\{pago_total\}\}/g, data.pagoTotal);
  return document;
}

// Generate document from template
// Supports three modes:
//   1. Existing sale: { saleId } - fetches all data from the sale
//   2. New sale (pre-save with existing client): { clientId, vehicleId, precioFinal } - fetches client/vehicle directly
//   3. New sale (pre-save with new client): { client: {...}, vehicleId, precioFinal } - uses client data from form
router.post('/:id/generate', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const { saleId, clientId, vehicleId, precioFinal, client } = req.body;

    const template = await prisma.documentTemplate.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (!template.activo) {
      return res.status(400).json({ error: 'Template is not active' });
    }

    let document: string;

    if (saleId && typeof saleId === 'string') {
      // Mode 1: Generate from existing sale
      const sale = await prisma.sale.findUnique({
        where: { id: saleId },
        include: {
          vehicle: true,
          client: true,
          vendedor: true,
          paymentMethods: {
            include: { paymentMethod: true },
          },
        },
      });

      if (!sale || sale.tenantId !== req.tenantId) {
        return res.status(404).json({ error: 'Sale not found' });
      }

      const fechaVenta = new Date(sale.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      const pagoMetodos = sale.paymentMethods && sale.paymentMethods.length > 0
        ? sale.paymentMethods.map((pm) => pm.paymentMethod.nombre).join(', ')
        : 'No especificado';
      const pagoTotal = sale.paymentMethods
        .reduce((sum, pm) => sum + (pm.monto || 0), 0)
        .toString();

      document = replacePlaceholders(template.contenido, {
        client: sale.client,
        vehicle: sale.vehicle,
        precioFinal: sale.precioFinal,
        vendedorNombre: sale.vendedor.name,
        fechaVenta,
        pagoMetodos,
        pagoTotal,
      });
    } else if (client && typeof client === 'object' && vehicleId) {
      // Mode 3: Generate from client data (from form) + vehicleId (new sale, client not yet saved)
      // Validate client data structure
      if (!client.nombre || !client.telefono) {
        return res.status(400).json({ error: 'Client data must include nombre and telefono' });
      }

      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });

      if (!vehicle || vehicle.tenantId !== req.tenantId) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      // Get current user name as vendedor
      const vendedor = await prisma.user.findUnique({ where: { id: req.userId } });

      const fechaActual = new Date().toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric',
      });

      // Use client data from form
      const clientData = {
        nombre: client.nombre,
        email: client.email || null,
        telefono: client.telefono,
        direccion: client.direccion || null,
      };

      document = replacePlaceholders(template.contenido, {
        client: clientData,
        vehicle,
        precioFinal: precioFinal ? Number(precioFinal) : null,
        vendedorNombre: vendedor?.name || '',
        fechaVenta: fechaActual,
        pagoMetodos: 'No especificado',
        pagoTotal: '0',
      });
    } else if (clientId && vehicleId) {
      // Mode 2: Generate from clientId + vehicleId (new sale, client already exists in DB)
      const [clientFromDb, vehicle] = await Promise.all([
        prisma.client.findUnique({ where: { id: clientId } }),
        prisma.vehicle.findUnique({ where: { id: vehicleId } }),
      ]);

      if (!clientFromDb || clientFromDb.tenantId !== req.tenantId) {
        return res.status(404).json({ error: 'Client not found' });
      }
      if (!vehicle || vehicle.tenantId !== req.tenantId) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      // Get current user name as vendedor
      const vendedor = await prisma.user.findUnique({ where: { id: req.userId } });

      const fechaActual = new Date().toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric',
      });

      document = replacePlaceholders(template.contenido, {
        client: clientFromDb,
        vehicle,
        precioFinal: precioFinal ? Number(precioFinal) : null,
        vendedorNombre: vendedor?.name || '',
        fechaVenta: fechaActual,
        pagoMetodos: 'No especificado',
        pagoTotal: '0',
      });
    } else {
      return res.status(400).json({ 
        error: 'Either saleId, or (clientId+vehicleId), or (client object+vehicleId) is required' 
      });
    }

    res.json({ document, template: template.nombre });
  } catch (error) {
    console.error('Error generating document:', error);
    res.status(500).json({ error: 'Error generating document' });
  }
});

// Create template
router.post('/', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const data = templateSchema.parse(req.body);

    const template = await prisma.documentTemplate.create({
      data: {
        ...data,
        activo: data.activo !== undefined ? data.activo : true,
        tenantId: req.tenantId,
      },
    });

    res.status(201).json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Error creating template' });
  }
});

// Update template
router.put('/:id', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify template belongs to tenant
    const existingTemplate = await prisma.documentTemplate.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

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
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Error updating template' });
  }
});

// Delete template
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify template belongs to tenant
    const existingTemplate = await prisma.documentTemplate.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await prisma.documentTemplate.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Error deleting template' });
  }
});

export default router;
