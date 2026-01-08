import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, AuthRequest } from '../middleware/auth';

// Función para convertir archivo a base64
const fileToBase64 = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const base64 = data.toString('base64');
        resolve(base64);
      }
    });
  });
};

const router = express.Router();

// Crear directorios de uploads si no existen
const uploadsDir = path.join(__dirname, '../../uploads');
const imagesDir = path.join(__dirname, '../../uploads/images');
const documentsDir = path.join(__dirname, '../../uploads/documents');

[uploadsDir, imagesDir, documentsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configurar multer para almacenar archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Crear subdirectorios según el tipo de archivo
    let uploadDir;
    if (file.mimetype.startsWith('image/')) {
      uploadDir = path.join(__dirname, '../../uploads/images');
    } else {
      uploadDir = path.join(__dirname, '../../uploads/documents');
    }
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'vehicle-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB para documentos
  },
  fileFilter: (req, file, cb) => {
    // Permitir imágenes y documentos
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const allowedDocTypes = /pdf|doc|docx|xls|xlsx/;
    const extname = path.extname(file.originalname).toLowerCase();
    const isImage = allowedImageTypes.test(extname) && file.mimetype.startsWith('image/');
    const isDocument = allowedDocTypes.test(extname) || 
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    if (isImage || isDocument) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Se permiten: imágenes (jpeg, jpg, png, gif, webp) y documentos (pdf, doc, docx, xls, xlsx)'));
    }
  },
});

// Upload single image/document - guarda en DB como base64
router.post('/vehicle-image', authenticate, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    // Convertir archivo a base64
    const base64Content = await fileToBase64(req.file.path);
    const base64String = `data:${req.file.mimetype};base64,${base64Content}`;

    // Eliminar archivo temporal después de convertirlo
    fs.unlinkSync(req.file.path);

    // Determinar la ruta según el tipo de archivo (para compatibilidad)
    const fileType = req.file.mimetype.startsWith('image/') ? 'images' : 'documents';
    const fileUrl = `/uploads/${fileType}/${req.file.filename}`;
    
    res.json({
      url: fileUrl, // Mantener URL para compatibilidad
      base64: base64String, // Contenido base64 para guardar en DB
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error: any) {
    // Limpiar archivo si hay error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message || 'Error al subir archivo' });
  }
});

// Upload multiple images/documents - guarda en DB como base64
router.post('/vehicle-images', authenticate, upload.array('images', 10), async (req: AuthRequest, res) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: 'No se subieron archivos' });
    }

    const files = req.files as Express.Multer.File[];
    const fileData = await Promise.all(
      files.map(async (file) => {
        // Convertir archivo a base64
        const base64Content = await fileToBase64(file.path);
        const base64String = `data:${file.mimetype};base64,${base64Content}`;

        // Eliminar archivo temporal
        fs.unlinkSync(file.path);

        const fileType = file.mimetype.startsWith('image/') ? 'images' : 'documents';
        const fileUrl = `/uploads/${fileType}/${file.filename}`;

        return {
          url: fileUrl,
          base64: base64String,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
        };
      })
    );
    
    res.json({
      files: fileData,
      urls: fileData.map(f => f.url), // Para compatibilidad
      count: files.length,
    });
  } catch (error: any) {
    // Limpiar archivos si hay error
    if (req.files) {
      (req.files as Express.Multer.File[]).forEach(file => {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({ error: error.message || 'Error al subir archivos' });
  }
});

// Upload logo - guarda en DB como base64
router.post('/upload-logo', authenticate, upload.single('image'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    // Only allow images for logo
    if (!req.file.mimetype.startsWith('image/')) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Solo se permiten imágenes para el logo' });
    }

    // Convertir archivo a base64
    const base64Content = await fileToBase64(req.file.path);
    const base64String = `data:${req.file.mimetype};base64,${base64Content}`;

    // Eliminar archivo temporal después de convertirlo
    fs.unlinkSync(req.file.path);

    res.json({
      url: base64String, // Return base64 directly as the URL
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error: any) {
    // Limpiar archivo si hay error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message || 'Error al subir logo' });
  }
});

// Servir archivos estáticos
router.use('/uploads', express.static(uploadsDir));

export default router;

