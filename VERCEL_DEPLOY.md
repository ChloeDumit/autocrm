# Guía de Despliegue en Vercel

Esta guía te ayudará a desplegar tu proyecto AutoCRM en Vercel.

## 📋 Prerrequisitos

1. Cuenta en [Vercel](https://vercel.com)
2. Cuenta en un servicio de base de datos PostgreSQL (recomendado: [Neon](https://neon.tech) o [Supabase](https://supabase.com))
3. Cuenta para el backend (recomendado: [Railway](https://railway.app) o [Render](https://render.com))

## 🏗️ Arquitectura de Despliegue

```
┌─────────────┐
│   Vercel    │  → Frontend Next.js
│  (Frontend) │
└─────────────┘
       │
       ↓ (API calls)
┌─────────────┐
│  Railway/   │  → Backend Express
│  Render     │
└─────────────┘
       │
       ↓
┌─────────────┐
│   Neon/     │  → PostgreSQL Database
│  Supabase   │
└─────────────┘
```

## 🚀 Paso 1: Preparar la Base de Datos

### Opción A: Neon (Recomendado)

1. Ve a [neon.tech](https://neon.tech) y crea una cuenta
2. Crea un nuevo proyecto
3. Copia la connection string (ejemplo: `postgresql://user:pass@host/db?sslmode=require`)
4. Guarda esta URL para el paso 3

### Opción B: Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Ve a Settings → Database
4. Copia la connection string
5. Guarda esta URL para el paso 3

## 🔧 Paso 2: Desplegar el Backend

### Opción A: Railway (Recomendado)

1. Ve a [railway.app](https://railway.app) y crea una cuenta
2. Click en "New Project"
3. Selecciona "Deploy from GitHub repo" (conecta tu repositorio)
4. O selecciona "Empty Project" y luego "Add Service" → "GitHub Repo"
5. Selecciona la carpeta `server` de tu repositorio
6. En "Settings" → "Variables", agrega:
   ```
   DATABASE_URL=tu_connection_string_de_postgresql
   JWT_SECRET=tu-secret-key-super-segura-genera-una-aleatoria
   PORT=8000
   NODE_ENV=production
   ```
7. Railway detectará automáticamente Node.js y ejecutará `npm install` y `npm run build`
8. Necesitarás ejecutar las migraciones de Prisma manualmente:
   - En Railway, ve a tu servicio
   - Click en "Deployments" → "View Logs"
   - Abre una terminal y ejecuta:
     ```bash
     cd server
     npm install
     npx prisma generate
     npx prisma migrate deploy
     ```
9. Railway te dará una URL como: `https://tu-proyecto.railway.app`
10. **Guarda esta URL** - la necesitarás para el frontend

### Opción B: Render

1. Ve a [render.com](https://render.com) y crea una cuenta
2. Click en "New" → "Web Service"
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name**: `autocrm-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. En "Environment Variables", agrega:
   ```
   DATABASE_URL=tu_connection_string_de_postgresql
   JWT_SECRET=tu-secret-key-super-segura-genera-una-aleatoria
   PORT=8000
   NODE_ENV=production
   ```
6. Click en "Create Web Service"
7. Una vez desplegado, Render te dará una URL como: `https://autocrm-backend.onrender.com`
8. **Guarda esta URL** - la necesitarás para el frontend
9. Ejecuta las migraciones de Prisma:
   - En Render, ve a tu servicio → "Shell"
   - Ejecuta:
     ```bash
     cd server
     npm install
     npx prisma generate
     npx prisma migrate deploy
     ```

## 🎨 Paso 3: Desplegar el Frontend en Vercel

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta (o inicia sesión)
2. Click en "Add New..." → "Project"
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente Next.js
5. En "Configure Project", verifica:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (raíz del proyecto)
   - **Build Command**: `npm run build` (debería detectarse automáticamente)
   - **Output Directory**: `.next` (debería detectarse automáticamente)
6. Click en "Environment Variables" y agrega:
   ```
   NEXT_PUBLIC_API_URL=https://tu-backend-url.railway.app/api
   ```
   (Reemplaza con la URL de tu backend de Railway/Render)
7. Click en "Deploy"
8. Espera a que el build termine (puede tardar unos minutos)
9. Una vez completado, Vercel te dará una URL como: `https://tu-proyecto.vercel.app`

## ✅ Paso 4: Verificar el Despliegue

1. Visita la URL de tu frontend en Vercel
2. Intenta registrarte como nuevo usuario
3. Verifica que puedas hacer login
4. Prueba crear un vehículo, cliente, etc.

## 🔧 Configuración Adicional

### Actualizar URLs de Imágenes

Si tu backend está en Railway/Render, necesitas actualizar `next.config.js` para permitir imágenes remotas:

El archivo ya está configurado para aceptar cualquier hostname HTTPS. Si necesitas un dominio específico, agrega:

```javascript
remotePatterns: [
  {
    protocol: 'https',
    hostname: 'tu-backend.railway.app',
    pathname: '/uploads/**',
  },
]
```

### Variables de Entorno en Vercel

Puedes agregar más variables de entorno en Vercel si es necesario:
- Ve a tu proyecto en Vercel
- Settings → Environment Variables
- Agrega cualquier variable que necesites

### Dominio Personalizado (Opcional)

1. En Vercel, ve a tu proyecto → Settings → Domains
2. Agrega tu dominio personalizado
3. Sigue las instrucciones para configurar DNS

## 🐛 Troubleshooting

### Error: "Cannot connect to API"

- Verifica que `NEXT_PUBLIC_API_URL` esté correctamente configurado en Vercel
- Asegúrate de que el backend esté corriendo y accesible
- Verifica que la URL del backend termine en `/api` si es necesario

### Error: "Database connection failed"

- Verifica que `DATABASE_URL` esté correctamente configurado en Railway/Render
- Asegúrate de que la base de datos esté accesible desde internet
- Verifica que las migraciones de Prisma se hayan ejecutado

### Error: "Prisma Client not generated"

En Railway/Render, ejecuta:
```bash
cd server
npx prisma generate
npx prisma migrate deploy
```

### Imágenes no se cargan

- Verifica que `next.config.js` tenga los `remotePatterns` correctos
- Asegúrate de que las imágenes estén siendo servidas correctamente desde el backend

## 📝 Checklist de Despliegue

- [ ] Base de datos PostgreSQL creada y accesible
- [ ] Backend desplegado en Railway/Render
- [ ] Migraciones de Prisma ejecutadas
- [ ] Variables de entorno del backend configuradas
- [ ] Frontend desplegado en Vercel
- [ ] `NEXT_PUBLIC_API_URL` configurado en Vercel
- [ ] Probar registro de usuario
- [ ] Probar login
- [ ] Probar creación de vehículo
- [ ] Probar creación de cliente
- [ ] Probar creación de venta

## 🎉 ¡Listo!

Tu aplicación debería estar funcionando en producción. Si encuentras algún problema, revisa los logs en:
- Vercel: Dashboard → Tu Proyecto → Deployments → View Function Logs
- Railway: Tu Servicio → Deployments → View Logs
- Render: Tu Servicio → Logs
