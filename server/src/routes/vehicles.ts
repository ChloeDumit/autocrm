import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const vehicleSchema = z.object({
  marca: z.string().min(1),
  modelo: z.string().min(1),
  ano: z.number().int().min(1900).max(2100),
  precio: z.number().positive(),
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

// Get all vehicles
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { estado, search } = req.query;
    
    const where: any = {};
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
    res.status(500).json({ error: 'Error fetching vehicles' });
  }
});

// Get single vehicle
router.get('/:id', authenticate, async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
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
    res.status(500).json({ error: 'Error fetching vehicle' });
  }
});

// Create vehicle
router.post('/', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req: AuthRequest, res) => {
  try {
    const data = vehicleSchema.parse(req.body);

    const vehicle = await prisma.vehicle.create({
      data: {
        marca: data.marca,
        modelo: data.modelo,
        ano: data.ano,
        precio: data.precio,
        kilometraje: data.kilometraje,
        estado: data.estado || 'DISPONIBLE',
        descripcion: data.descripcion || null,
        imagen: data.imagen || null,
        imagenes: data.imagenes && data.imagenes.length > 0 ? data.imagenes : [],
        createdById: req.userId!,
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
    res.status(500).json({ error: 'Error creating vehicle' });
  }
});

// Update vehicle
router.put('/:id', authenticate, requireRole('ADMIN', 'VENDEDOR'), async (req: AuthRequest, res) => {
  try {
    const data = vehicleSchema.partial().parse(req.body);

    const updateData: any = {};
    
    if (data.marca !== undefined) updateData.marca = data.marca;
    if (data.modelo !== undefined) updateData.modelo = data.modelo;
    if (data.ano !== undefined) updateData.ano = data.ano;
    if (data.precio !== undefined) updateData.precio = data.precio;
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
    res.status(500).json({ error: 'Error updating vehicle' });
  }
});

// Delete vehicle
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.vehicle.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting vehicle' });
  }
});

export default router;

