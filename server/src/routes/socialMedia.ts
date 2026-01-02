import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Generar texto para publicación de Instagram
router.post('/instagram/generate', authenticate, async (req: AuthRequest, res) => {
  try {
    const { vehicleId } = req.body;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        createdBy: {
          select: { name: true },
        },
      },
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    // Generar texto para Instagram
    const caption = `🚗 ${vehicle.marca} ${vehicle.modelo} ${vehicle.ano}

💰 Precio: $${vehicle.precio.toLocaleString()}
📏 Kilometraje: ${vehicle.kilometraje.toLocaleString()} km
${vehicle.descripcion ? `📝 ${vehicle.descripcion}` : ''}

${vehicle.estado === 'DISPONIBLE' ? '✅ Disponible ahora' : ''}

#${vehicle.marca.replace(/\s+/g, '')} #${vehicle.modelo.replace(/\s+/g, '')} #AutoUsado #VentaDeAutos #Concesionaria
#${vehicle.ano} #Carros #Autos #Vehiculos`;

    res.json({
      caption,
      hashtags: [
        vehicle.marca.replace(/\s+/g, ''),
        vehicle.modelo.replace(/\s+/g, ''),
        'AutoUsado',
        'VentaDeAutos',
        'Concesionaria',
        vehicle.ano.toString(),
        'Carros',
        'Autos',
        'Vehiculos',
      ],
      vehicle: {
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        ano: vehicle.ano,
        precio: vehicle.precio,
        kilometraje: vehicle.kilometraje,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al generar publicación de Instagram' });
  }
});

// Generar datos para publicación en MercadoLibre
router.post('/mercadolibre/generate', authenticate, async (req: AuthRequest, res) => {
  try {
    const { vehicleId } = req.body;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    // Generar título y descripción para MercadoLibre
    const title = `${vehicle.marca} ${vehicle.modelo} ${vehicle.ano} - ${vehicle.kilometraje.toLocaleString()} km`;

    const description = `
${vehicle.marca} ${vehicle.modelo} ${vehicle.ano}
Kilometraje: ${vehicle.kilometraje.toLocaleString()} km
Precio: $${vehicle.precio.toLocaleString()}

${vehicle.descripcion || ''}

Estado: ${vehicle.estado}

¡Contactanos para más información!
    `.trim();

    // Mapeo de categorías de MercadoLibre (ejemplo - necesitarías ajustar según tu país)
    const categoryId = 'MLA1744'; // Categoría de autos (Argentina) - ajustar según país

    res.json({
      title,
      description,
      price: vehicle.precio,
      category_id: categoryId,
      currency_id: 'ARS', // Ajustar según tu país
      available_quantity: vehicle.estado === 'DISPONIBLE' ? 1 : 0,
      condition: 'used',
      listing_type_id: 'bronze', // bronze, silver, gold, premium
      pictures: vehicle.imagenes && vehicle.imagenes.length > 0 
        ? vehicle.imagenes.map(img => ({ source: img }))
        : vehicle.imagen 
          ? [{ source: vehicle.imagen }]
          : [],
      attributes: [
        {
          id: 'BRAND',
          value_name: vehicle.marca,
        },
        {
          id: 'MODEL',
          value_name: vehicle.modelo,
        },
        {
          id: 'VEHICLE_YEAR',
          value_name: vehicle.ano.toString(),
        },
        {
          id: 'KILOMETERS',
          value_name: vehicle.kilometraje.toString(),
        },
      ],
      vehicle: {
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        ano: vehicle.ano,
        precio: vehicle.precio,
        kilometraje: vehicle.kilometraje,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al generar publicación de MercadoLibre' });
  }
});

export default router;

