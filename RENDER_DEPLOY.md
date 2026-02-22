# Guía de Despliegue en Render

Esta guía te ayudará a desplegar tu proyecto AutoCRM en Render.

## 📋 Prerrequisitos

1. Cuenta en [Render](https://render.com)
2. Cuenta en un servicio de base de datos PostgreSQL (recomendado: [Neon](https://neon.tech) o [Supabase](https://supabase.com))
3. Repositorio en GitHub

## 🏗️ Arquitectura de Despliegue

```
┌─────────────┐
│   Render    │  → Frontend Next.js
│  (Frontend) │
└─────────────┘
       │
       ↓ (API calls)
┌─────────────┐
│   Render    │  → Backend Express
│  (Backend)  │
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
4. Guarda esta URL para el paso 2

### Opción B: Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Ve a Settings → Database
4. Copia la connection string
5. Guarda esta URL para el paso 2

## 🔧 Paso 2: Desplegar el Backend en Render (Web Service)

1. Ve a [render.com](https://render.com) y crea una cuenta
2. Click en "New" → **"Web Service"** (importante: debe ser Web Service, no Static Site)
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name**: `autocrm-backend`
   - **Root Directory**: `server` ⚠️ **IMPORTANTE: Debe ser `server`**
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. En "Environment Variables", agrega:
   ```
   DATABASE_URL=tu_connection_string_de_postgresql
   JWT_SECRET=tu-secret-key-super-segura-genera-una-aleatoria
   PORT=8000
   NODE_ENV=production
   FRONTEND_URL=https://autocrm-frontend.onrender.com
   ```
   (Actualiza `FRONTEND_URL` después de desplegar el frontend)
6. Click en "Create Web Service"
7. Una vez desplegado, Render te dará una URL como: `https://autocrm-backend.onrender.com`
8. **Guarda esta URL** - la necesitarás para el frontend
9. Ejecuta las migraciones de Prisma:
   - En Render, ve a tu servicio → "Shell"
   - Ejecuta:
     ```bash
     npm install
     npx prisma generate
     npx prisma migrate deploy
     ```

## 🎨 Paso 3: Desplegar el Frontend en Render

1. En Render, click en "New" → "Web Service"
2. Conecta tu repositorio de GitHub (el mismo repositorio)
3. Configura:
   - **Name**: `autocrm-frontend`
   - **Root Directory**: `./` (raíz del proyecto, déjalo vacío)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. En "Environment Variables", agrega:
   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://autocrm-backend.onrender.com/api
   ```
   (Reemplaza con la URL de tu backend)
5. Click en "Create Web Service"
6. Espera a que el build termine (puede tardar 5-10 minutos)
7. Una vez completado, Render te dará una URL como: `https://autocrm-frontend.onrender.com`

## ⚙️ Configuración Alternativa con render.yaml

Si prefieres usar el archivo `render.yaml` incluido:

1. El archivo `render.yaml` ya está configurado en la raíz del proyecto
2. En Render, cuando crees el servicio, selecciona "Apply render.yaml"
3. Solo necesitarás agregar la variable de entorno `NEXT_PUBLIC_API_URL` manualmente

## ✅ Paso 4: Verificar el Despliegue

1. Visita la URL de tu frontend en Render
2. Intenta registrarte como nuevo usuario
3. Verifica que puedas hacer login
4. Prueba crear un vehículo, cliente, etc.

## 🔧 Configuración Adicional

### Variables de Entorno en Render

Puedes agregar más variables de entorno en Render:
- Ve a tu servicio en Render
- Settings → Environment
- Agrega cualquier variable que necesites

### Dominio Personalizado (Opcional)

1. En Render, ve a tu servicio → Settings → Custom Domains
2. Agrega tu dominio personalizado
3. Sigue las instrucciones para configurar DNS

### Auto-Deploy

Render tiene auto-deploy habilitado por defecto:
- Cada push a la rama `main` o `master` desplegará automáticamente
- Puedes deshabilitarlo en Settings → Auto-Deploy

## 🐛 Troubleshooting

### Error: "Cannot connect to API"

- Verifica que `NEXT_PUBLIC_API_URL` esté correctamente configurado en Render
- Asegúrate de que el backend esté corriendo y accesible
- Verifica que la URL del backend termine en `/api` si es necesario
- Verifica que ambos servicios estén en el mismo plan (free tier puede tener limitaciones)

### Error: "Database connection failed"

- Verifica que `DATABASE_URL` esté correctamente configurado en Render
- Asegúrate de que la base de datos esté accesible desde internet
- Verifica que las migraciones de Prisma se hayan ejecutado

### Error: "Prisma Client not generated"

En Render, ve a tu servicio backend → Shell y ejecuta:
```bash
npm install
npx prisma generate
npx prisma migrate deploy
```

### Error: "Html should not be imported outside of pages/_document"

Este error ocurre cuando Next.js intenta hacer pre-render. La configuración actual debería resolverlo:
- `output: 'standalone'` en `next.config.js`
- `export const dynamic = 'force-dynamic'` en `app/layout.tsx`
- Páginas de error explícitas (`app/error.tsx` y `app/not-found.tsx`)

Si persiste, verifica que:
- El build command sea: `npm install && npm run build`
- El start command sea: `npm start`
- No estés usando `next export` (solo para static sites)

### Build falla en Render

- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que el Node.js version sea compatible (Render usa Node 18 por defecto)
- Revisa los logs en Render para ver el error específico
- Puede tomar más tiempo en el plan gratuito (hasta 10 minutos)

### Imágenes no se cargan

- Verifica que `next.config.js` tenga los `remotePatterns` correctos
- Asegúrate de que las imágenes estén siendo servidas correctamente desde el backend
- En producción, las imágenes pueden necesitar ser optimizadas

## 📝 Checklist de Despliegue

- [ ] Base de datos PostgreSQL creada y accesible
- [ ] Backend desplegado en Render
- [ ] Migraciones de Prisma ejecutadas
- [ ] Variables de entorno del backend configuradas
- [ ] Frontend desplegado en Render
- [ ] `NEXT_PUBLIC_API_URL` configurado en Render
- [ ] Probar registro de usuario
- [ ] Probar login
- [ ] Probar creación de vehículo
- [ ] Probar creación de cliente
- [ ] Probar creación de venta

## 💡 Tips para Render

1. **Plan Gratuito**: Render ofrece un plan gratuito, pero los servicios se "duermen" después de 15 minutos de inactividad. La primera petición puede tardar ~30 segundos en despertar.

2. **Build Time**: Los builds pueden tardar 5-10 minutos en el plan gratuito. Sé paciente.

3. **Logs**: Siempre revisa los logs en Render si algo falla. Son muy útiles para debugging.

4. **Environment Variables**: Asegúrate de que todas las variables de entorno estén configuradas antes del primer deploy.

5. **Database**: Si usas Neon o Supabase, asegúrate de que la connection string incluya `?sslmode=require` para conexiones seguras.

## 🎉 ¡Listo!

Tu aplicación debería estar funcionando en producción. Si encuentras algún problema, revisa los logs en:
- Render: Tu Servicio → Logs
