import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Servir archivo desde la base de datos
router.get('/vehicle-document/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const document = await prisma.vehicleDocument.findUnique({
      where: { id: req.params.id },
    });

    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    // Si tiene contenido base64, servirlo
    if (document.contenido) {
      const base64Data = document.contenido.replace(/^data:.*,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      res.setHeader('Content-Type', document.mimetype || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${document.nombre}"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.send(buffer);
    } else if (document.archivo) {
      // Si no tiene contenido pero tiene archivo, redirigir a la URL
      res.redirect(document.archivo);
    } else {
      res.status(404).json({ error: 'Archivo no disponible' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener documento' });
  }
});

// Servir archivo de forma de pago desde la base de datos
router.get('/payment-document/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const document = await prisma.paymentDocument.findUnique({
      where: { id: req.params.id },
    });

    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    // Si tiene contenido base64, servirlo
    if (document.contenido) {
      const base64Data = document.contenido.replace(/^data:.*,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      res.setHeader('Content-Type', document.mimetype || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${document.nombre}"`);
      res.send(buffer);
    } else if (document.archivo) {
      // Si no tiene contenido pero tiene archivo, redirigir a la URL
      res.redirect(document.archivo);
    } else {
      res.status(404).json({ error: 'Archivo no disponible' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener documento' });
  }
});

export default router;

