import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import vehicleRoutes from './routes/vehicles';
import clientRoutes from './routes/clients';
import saleRoutes from './routes/sales';
import testDriveRoutes from './routes/testDrives';
import notificationRoutes from './routes/notifications';
import documentTemplateRoutes from './routes/documentTemplates';
import dashboardRoutes from './routes/dashboard';
import uploadRoutes from './routes/upload';
import socialMediaRoutes from './routes/socialMedia';
import vehicleDocumentRoutes from './routes/vehicleDocuments';
import paymentMethodRoutes from './routes/paymentMethods';
import userRoutes from './routes/users';
import appConfigRoutes from './routes/appConfig';
import fileRoutes from './routes/files';
import vehiclePropertyRoutes from './routes/vehicleProperties';
import saleDocumentRoutes from './routes/saleDocuments';
import salePaymentMethodRoutes from './routes/salePaymentMethods';
// Multi-tenancy routes
import superAuthRoutes from './routes/superAuth';
import tenantRoutes from './routes/tenants';
import registrationRoutes from './routes/registration';
import superDashboardRoutes from './routes/superDashboard';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// CORS configuration - more flexible in development
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      callback(null, true);
      return;
    }

    // In development, allow localhost and any subdomain of localhost
    if (process.env.NODE_ENV === 'development') {
      // Match localhost, 127.0.0.1, and any subdomain like autosdelnorte.localhost
      if (
        origin.includes('localhost:') ||
        origin.includes('127.0.0.1:') ||
        origin.match(/^https?:\/\/[a-z0-9-]+\.localhost:\d+$/)
      ) {
        callback(null, true);
        return;
      }
    }

    // In production, use FRONTEND_URL and allow subdomains
    const allowedOrigins = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
      : ['http://localhost:3000'];

    // Check exact match or subdomain match
    const isAllowed = allowedOrigins.some(allowed => {
      if (origin === allowed) return true;
      // Check if origin is a subdomain of allowed domain
      const allowedDomain = allowed.replace(/^https?:\/\//, '');
      const originDomain = origin.replace(/^https?:\/\//, '');
      return originDomain.endsWith('.' + allowedDomain.split(':')[0] + ':' + (allowedDomain.split(':')[1] || ''));
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logging middleware para debug
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/test-drives', testDriveRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/document-templates', documentTemplateRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', uploadRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/vehicle-documents', vehicleDocumentRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/users', userRoutes);
app.use('/api/app-config', appConfigRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/vehicle-properties', vehiclePropertyRoutes);
app.use('/api/sale-documents', saleDocumentRoutes);
app.use('/api/sale-payment-methods', salePaymentMethodRoutes);

// Multi-tenancy routes (SuperAdmin and Registration)
app.use('/api/super-admin/auth', superAuthRoutes);
app.use('/api/super-admin/tenants', tenantRoutes);
app.use('/api/super-admin/dashboard', superDashboardRoutes);
app.use('/api/registration', registrationRoutes);

// Servir archivos estáticos de uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads/images', express.static(path.join(__dirname, '../uploads/images')));
app.use('/uploads/documents', express.static(path.join(__dirname, '../uploads/documents')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Rodar API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

