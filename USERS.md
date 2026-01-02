# Usuarios de Prueba

Después de ejecutar el seed, puedes usar estos usuarios para probar el sistema:

## 👤 Administrador
- **Email:** `admin@autocrm.com`
- **Password:** `password123`
- **Rol:** ADMIN
- **Permisos:** Acceso completo a todas las funcionalidades

## 👤 Vendedor
- **Email:** `vendedor@autocrm.com`
- **Password:** `password123`
- **Rol:** VENDEDOR
- **Permisos:** Puede crear y editar vehículos, clientes, ventas y test drives

## 👤 Asistente
- **Email:** `asistente@autocrm.com`
- **Password:** `password123`
- **Rol:** ASISTENTE
- **Permisos:** Puede ver y crear clientes, ver vehículos y test drives

---

## 📝 Para ejecutar el seed:

```bash
cd server
npm run prisma:seed
```

O después de las migraciones:

```bash
npm run prisma:migrate
# El seed se ejecutará automáticamente después de la migración
```

## 🔐 Cambiar contraseñas

**IMPORTANTE:** En producción, cambia estas contraseñas inmediatamente después de la instalación.

