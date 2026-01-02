# Solución de Problemas - Login

## Problemas Comunes y Soluciones

### 1. Error: "No se pudo conectar con el servidor"

**Causa:** El backend no está corriendo o la URL de la API está mal configurada.

**Solución:**
1. Verifica que el servidor esté corriendo:
```bash
cd server
npm run dev
```

Deberías ver: `🚀 Server running on port 8000`

2. Verifica que el archivo `.env` en la raíz del proyecto tenga:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

3. Verifica que el servidor responda:
```bash
curl http://localhost:8000/api/health
```

Deberías recibir: `{"status":"ok","message":"AutoCRM API is running"}`

### 2. Error: "Invalid credentials"

**Causa:** Las credenciales son incorrectas o el usuario no existe.

**Solución:**
1. Ejecuta el seed para crear usuarios de prueba:
```bash
cd server
npm run prisma:seed
```

2. Usa estas credenciales:
- Email: `admin@autocrm.com`
- Password: `password123`

### 3. Error: "Error 500" o errores del servidor

**Causa:** Problemas con la base de datos o configuración del servidor.

**Solución:**
1. Verifica que la base de datos esté configurada:
```bash
cd server
# Verifica que .env tenga DATABASE_URL correcta
cat .env
```

2. Ejecuta las migraciones:
```bash
npm run prisma:generate
npm run prisma:migrate
```

3. Verifica los logs del servidor para ver el error específico.

### 4. Error de CORS

**Causa:** El servidor no permite peticiones desde el frontend.

**Solución:**
El servidor ya está configurado para permitir CORS desde `http://localhost:3000`. Si usas otro puerto, actualiza `server/src/index.ts` o agrega `FRONTEND_URL` al `.env` del servidor.

### 5. Verificar que todo esté funcionando

**Checklist:**
- [ ] Backend corriendo en puerto 8000
- [ ] Frontend corriendo en puerto 3000
- [ ] Base de datos conectada
- [ ] Migraciones ejecutadas
- [ ] Seed ejecutado (usuarios creados)
- [ ] Archivo `.env` en la raíz con `NEXT_PUBLIC_API_URL`
- [ ] Archivo `server/.env` con `DATABASE_URL` y `JWT_SECRET`

### 6. Debug en el navegador

Abre la consola del navegador (F12) y verifica:
1. Errores en la consola
2. Pestaña Network para ver las peticiones HTTP
3. Si la petición a `/api/auth/login` se está haciendo
4. La respuesta del servidor

### 7. Probar la API directamente

```bash
# Probar login directamente
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@autocrm.com","password":"password123"}'
```

Deberías recibir un JSON con `user` y `token`.

