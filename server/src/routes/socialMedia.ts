import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Replace {{placeholders}} with vehicle data
function applyTemplate(template: string, vehicle: {
  marca: string; modelo: string; ano: number;
  precio: number; kilometraje: number;
  descripcion: string | null; estado: string;
}): string {
  return template
    .replace(/\{\{marca\}\}/g, vehicle.marca)
    .replace(/\{\{modelo\}\}/g, vehicle.modelo)
    .replace(/\{\{ano\}\}/g, vehicle.ano.toString())
    .replace(/\{\{precio\}\}/g, vehicle.precio.toLocaleString())
    .replace(/\{\{kilometraje\}\}/g, vehicle.kilometraje.toLocaleString())
    .replace(/\{\{descripcion\}\}/g, vehicle.descripcion || '')
    .replace(/\{\{estado\}\}/g, vehicle.estado);
}

// Default templates (used when tenant has no custom template)
const DEFAULT_INSTAGRAM = `🚗 {{marca}} {{modelo}} {{ano}}

💰 Precio: ${{precio}}
📏 Kilometraje: {{kilometraje}} km
{{descripcion}}

#{{marca}} #{{modelo}} #AutoUsado #VentaDeAutos #Concesionaria
#{{ano}} #Autos #Vehiculos`;

const DEFAULT_ML_TITLE = `{{marca}} {{modelo}} {{ano}} - {{kilometraje}} km`;

const DEFAULT_ML_DESCRIPTION = `{{marca}} {{modelo}} {{ano}}
Kilometraje: {{kilometraje}} km
Precio: ${{precio}}

{{descripcion}}

Estado: {{estado}}

¡Contactanos para más información!`;

// Generar texto para publicación de Instagram
router.post('/instagram/generate', authenticate, async (req: AuthRequest, res) => {
  try {
    const { vehicleId } = req.body;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    // Fetch tenant template
    const config = req.tenantId
      ? await prisma.appConfig.findUnique({ where: { tenantId: req.tenantId } })
      : null;

    const template = config?.plantillaInstagram || DEFAULT_INSTAGRAM;
    const caption = applyTemplate(template, vehicle);

    // Clean up whitespace from replaced empty placeholders
    const cleanCaption = caption.replace(/\n{3,}/g, '\n\n').trim();

    res.json({
      caption: cleanCaption,
      hashtags: [
        vehicle.marca.replace(/\s+/g, ''),
        vehicle.modelo.replace(/\s+/g, ''),
        'AutoUsado',
        'VentaDeAutos',
        'Concesionaria',
        vehicle.ano.toString(),
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

    // Fetch tenant template
    const config = req.tenantId
      ? await prisma.appConfig.findUnique({ where: { tenantId: req.tenantId } })
      : null;

    const titleTemplate = config?.plantillaMercadolibreTitulo || DEFAULT_ML_TITLE;
    const descTemplate = config?.plantillaMercadolibreDescripcion || DEFAULT_ML_DESCRIPTION;

    const title = applyTemplate(titleTemplate, vehicle).trim();
    const description = applyTemplate(descTemplate, vehicle).replace(/\n{3,}/g, '\n\n').trim();

    const categoryId = 'MLU1744'; // Categoría de autos (Uruguay)

    res.json({
      title,
      description,
      price: vehicle.precio,
      category_id: categoryId,
      currency_id: 'USD',
      available_quantity: vehicle.estado === 'DISPONIBLE' ? 1 : 0,
      condition: 'used',
      listing_type_id: 'bronze',
      pictures: vehicle.imagenes && vehicle.imagenes.length > 0
        ? vehicle.imagenes.map(img => ({ source: img }))
        : vehicle.imagen
          ? [{ source: vehicle.imagen }]
          : [],
      attributes: [
        { id: 'BRAND', value_name: vehicle.marca },
        { id: 'MODEL', value_name: vehicle.modelo },
        { id: 'VEHICLE_YEAR', value_name: vehicle.ano.toString() },
        { id: 'KILOMETERS', value_name: vehicle.kilometraje.toString() },
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
