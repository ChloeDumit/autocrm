import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();
const prisma = new PrismaClient();

const vehicleSchema = z.object({
  marca: z.string().min(1),
  modelo: z.string().min(1),
  ano: z.number().int().min(1900).max(2100),
  precio: z.number().positive(),
  moneda: z.string().optional(),
  kilometraje: z.number().int().min(0),
  estado: z.enum(['DISPONIBLE', 'RESERVADO', 'VENDIDO', 'MANTENIMIENTO']).optional(),
  descripcion: z.string().optional(),
  imagen: z.string().optional().or(z.literal('')).refine(
    (val) => !val || val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image'),
    { message: 'La imagen debe ser una URL válida, una ruta relativa o base64' }
  ),
  imagenes: z.array(z.string()).optional().refine(
    (val) => !val || val.every(img =>
      img.startsWith('/') ||
      img.startsWith('http://') ||
      img.startsWith('https://') ||
      img.startsWith('data:image')
    ),
    { message: 'Todas las imágenes deben ser URLs válidas, rutas relativas o base64' }
  ),
});

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Get all vehicles
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const { estado, search } = req.query;

    const where: any = {
      tenantId: req.tenantId,
    };
    if (estado) {
      where.estado = estado;
    }
    if (search) {
      where.OR = [
        { marca: { contains: search as string, mode: 'insensitive' } },
        { modelo: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Error fetching vehicles' });
  }
});

// Get single vehicle
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
        sales: {
          include: {
            client: true,
            vendedor: {
              select: { name: true },
            },
          },
        },
        testDrives: {
          include: {
            client: true,
            vendedor: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Error fetching vehicle' });
  }
});

// Create vehicle
router.post('/', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const data = vehicleSchema.parse(req.body);

    // Check tenant vehicle limit
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: { maxVehicles: true },
    });

    const currentVehicleCount = await prisma.vehicle.count({
      where: { tenantId: req.tenantId },
    });

    if (tenant && currentVehicleCount >= tenant.maxVehicles) {
      return res.status(400).json({
        error: 'Maximum vehicle limit reached for this organization',
        code: 'VEHICLE_LIMIT_REACHED'
      });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        marca: data.marca,
        modelo: data.modelo,
        ano: data.ano,
        precio: data.precio,
        moneda: data.moneda || 'USD',
        kilometraje: data.kilometraje,
        estado: data.estado || 'DISPONIBLE',
        descripcion: data.descripcion || null,
        imagen: data.imagen || null,
        imagenes: data.imagenes && data.imagenes.length > 0 ? data.imagenes : [],
        createdById: req.userId!,
        tenantId: req.tenantId,
      },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    res.status(201).json(vehicle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Error creating vehicle' });
  }
});

// Update vehicle
router.put('/:id', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify vehicle belongs to tenant
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
    });

    if (!existingVehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const data = vehicleSchema.partial().parse(req.body);

    const updateData: any = {};

    if (data.marca !== undefined) updateData.marca = data.marca;
    if (data.modelo !== undefined) updateData.modelo = data.modelo;
    if (data.ano !== undefined) updateData.ano = data.ano;
    if (data.precio !== undefined) updateData.precio = data.precio;
    if (data.moneda !== undefined) updateData.moneda = data.moneda;
    if (data.kilometraje !== undefined) updateData.kilometraje = data.kilometraje;
    if (data.estado !== undefined) updateData.estado = data.estado;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion || null;
    if (data.imagen !== undefined) updateData.imagen = data.imagen || null;
    if (data.imagenes !== undefined) {
      updateData.imagenes = data.imagenes.length > 0 ? data.imagenes : [];
    }

    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    res.json(vehicle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Error updating vehicle' });
  }
});

// Delete vehicle
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify vehicle belongs to tenant
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        id: req.params.id,
        tenantId: req.tenantId,
      },
    });

    if (!existingVehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    await prisma.vehicle.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Error deleting vehicle' });
  }
});

export default router;
