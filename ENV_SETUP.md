# Configuración de Variables de Entorno

## Backend (server/.env)

Crea un archivo `.env` en la carpeta `server/` con el siguiente contenido:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/autocrm?schema=public"

# JWT Secret Key (change this to a secure random string in production)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server Port
PORT=5000

# Node Environment
NODE_ENV=development
```

### Instrucciones:
1. Copia el contenido de arriba
2. Crea el archivo `server/.env`
3. Reemplaza `user`, `password`, y `localhost:5432` con tus credenciales de PostgreSQL
4. Genera un JWT_SECRET seguro (puedes usar: `openssl rand -base64 32`)

## Frontend (.env)

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# API URL (Backend)
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Node Environment
NODE_ENV=development
```

### Instrucciones:
1. Copia el contenido de arriba
2. Crea el archivo `.env` en la raíz del proyecto
3. Si tu backend corre en otro puerto, actualiza `NEXT_PUBLIC_API_URL`

## Comandos rápidos

### Crear archivos .env desde los ejemplos:

**Backend:**
```bash
cd server
cp env.example .env
# Luego edita .env con tus credenciales
```

**Frontend:**
```bash
cp env.example .env
# Edita si necesitas cambiar la URL de la API
```

