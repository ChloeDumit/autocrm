# AutoCRM - Sistema de Gestión para Automotoras

Sistema CRM completo desarrollado para gestionar vehículos, clientes, ventas y test drives en concesionarias y automotoras.

## Stack Tecnológico

### Frontend
- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **TailwindCSS** - Estilos utilitarios
- **ShadCN/UI** - Componentes UI modernos
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **Prisma** - ORM para base de datos
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación con tokens
- **bcryptjs** - Encriptación de contraseñas

## Características

### Autenticación y Roles
- ✅ Login y registro de usuarios
- ✅ Sistema de roles: Admin, Vendedor, Asistente
- ✅ Autenticación JWT

### Dashboard
- ✅ Métricas en tiempo real
- ✅ Vehículos disponibles
- ✅ Test drives agendados
- ✅ Ventas cerradas
- ✅ Ingresos totales

### Gestión de Vehículos
- ✅ CRUD completo de vehículos
- ✅ Filtros por estado y búsqueda
- ✅ Estados: Disponible, Reservado, Vendido, Mantenimiento
- ✅ Información: marca, modelo, año, precio, kilometraje

### Gestión de Clientes
- ✅ CRUD completo de clientes
- ✅ Búsqueda por nombre, email o teléfono
- ✅ Historial de compras y test drives
- ✅ Notas e intereses

### Pipeline de Ventas
- ✅ Etapas: Interesado → Prueba → Negociación → Vendido
- ✅ Seguimiento de ventas por etapa
- ✅ Precio final negociado
- ✅ Notas y comentarios

### Test Drives
- ✅ Agendamiento de test drives
- ✅ Filtros por fecha
- ✅ Estados: Pendiente, Confirmado, Completado, Cancelado
- ✅ Asignación de vendedor

### Notificaciones
- ✅ Sistema de notificaciones internas
- ✅ Contador de no leídas
- ✅ Diferentes tipos: Info, Warning, Success, Error

### Plantillas de Documentos
- ✅ Creación de plantillas personalizadas
- ✅ Placeholders dinámicos
- ✅ Generación de documentos desde ventas
- ✅ Sistema de activación/desactivación

## Instalación

### Prerrequisitos
- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

### Configuración del Backend

1. Navega a la carpeta del servidor:
```bash
cd server
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:
```
DATABASE_URL="postgresql://user:password@localhost:5432/autocrm?schema=public"
JWT_SECRET="tu-secret-key-super-segura"
PORT=8000
```

4. Genera el cliente de Prisma:
```bash
npm run prisma:generate
```

5. Ejecuta las migraciones:
```bash
npm run prisma:migrate
```

6. Inicia el servidor:
```bash
npm run dev
```

### Configuración del Frontend

1. En la raíz del proyecto, instala las dependencias:
```bash
npm install
```

2. Inicia el servidor de desarrollo:
```bash
npm run dev
```

3. Abre [http://localhost:3000](http://localhost:3000) en tu navegador

## Uso

### Primer Usuario

1. Regístrate en `/register` como Administrador
2. Inicia sesión en `/login`
3. Comienza a gestionar tu concesionaria desde el dashboard

### Flujo de Trabajo Típico

1. **Agregar Vehículos**: Ve a Vehículos → Nuevo Vehículo
2. **Registrar Clientes**: Ve a Clientes → Nuevo Cliente
3. **Crear Venta**: Ve a Ventas → Nueva Venta
4. **Agendar Test Drive**: Ve a Test Drives → Agendar Test Drive
5. **Generar Documentos**: Desde una venta, usa las plantillas para generar documentos

## Estructura del Proyecto

```
AutoCrm/
├── app/                    # Páginas Next.js
│   ├── dashboard/          # Dashboard principal
│   ├── vehicles/          # Gestión de vehículos
│   ├── clients/           # Gestión de clientes
│   ├── sales/             # Pipeline de ventas
│   ├── test-drives/       # Test drives
│   └── templates/         # Plantillas de documentos
├── components/            # Componentes React
│   ├── ui/               # Componentes ShadCN/UI
│   ├── layout/           # Layout y navegación
│   └── ...               # Componentes específicos
├── lib/                  # Utilidades y configuraciones
├── server/               # Backend Express
│   ├── src/
│   │   ├── routes/      # Rutas de la API
│   │   ├── middleware/  # Middleware de autenticación
│   │   └── index.ts     # Punto de entrada
│   └── prisma/          # Schema de Prisma
└── package.json
```

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Vehículos
- `GET /api/vehicles` - Listar vehículos
- `GET /api/vehicles/:id` - Obtener vehículo
- `POST /api/vehicles` - Crear vehículo
- `PUT /api/vehicles/:id` - Actualizar vehículo
- `DELETE /api/vehicles/:id` - Eliminar vehículo

### Clientes
- `GET /api/clients` - Listar clientes
- `GET /api/clients/:id` - Obtener cliente
- `POST /api/clients` - Crear cliente
- `PUT /api/clients/:id` - Actualizar cliente
- `DELETE /api/clients/:id` - Eliminar cliente

### Ventas
- `GET /api/sales` - Listar ventas
- `GET /api/sales/:id` - Obtener venta
- `POST /api/sales` - Crear venta
- `PUT /api/sales/:id` - Actualizar venta
- `DELETE /api/sales/:id` - Eliminar venta

### Test Drives
- `GET /api/test-drives` - Listar test drives
- `POST /api/test-drives` - Agendar test drive
- `PUT /api/test-drives/:id` - Actualizar test drive
- `DELETE /api/test-drives/:id` - Eliminar test drive

### Notificaciones
- `GET /api/notifications` - Listar notificaciones
- `GET /api/notifications/unread-count` - Contador de no leídas
- `PUT /api/notifications/:id/read` - Marcar como leída
- `PUT /api/notifications/read-all` - Marcar todas como leídas

### Plantillas
- `GET /api/document-templates` - Listar plantillas
- `POST /api/document-templates` - Crear plantilla
- `PUT /api/document-templates/:id` - Actualizar plantilla
- `DELETE /api/document-templates/:id` - Eliminar plantilla
- `POST /api/document-templates/:id/generate` - Generar documento

### Dashboard
- `GET /api/dashboard/metrics` - Métricas del dashboard
- `GET /api/dashboard/activity` - Actividad reciente

## Placeholders para Plantillas

Al crear plantillas de documentos, puedes usar los siguientes placeholders:

- `{{cliente_nombre}}` - Nombre del cliente
- `{{cliente_email}}` - Email del cliente
- `{{cliente_telefono}}` - Teléfono del cliente
- `{{cliente_direccion}}` - Dirección del cliente
- `{{vehiculo_marca}}` - Marca del vehículo
- `{{vehiculo_modelo}}` - Modelo del vehículo
- `{{vehiculo_ano}}` - Año del vehículo
- `{{vehiculo_precio}}` - Precio del vehículo
- `{{vehiculo_kilometraje}}` - Kilometraje del vehículo
- `{{precio_final}}` - Precio final de la venta
- `{{vendedor_nombre}}` - Nombre del vendedor
- `{{fecha_venta}}` - Fecha de la venta
- `{{fecha_actual}}` - Fecha actual

## Desarrollo

### Scripts Disponibles

**Frontend:**
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run start` - Servidor de producción

**Backend:**
- `npm run dev` - Servidor de desarrollo (con hot reload)
- `npm run build` - Compilar TypeScript
- `npm run start` - Servidor de producción
- `npm run prisma:generate` - Generar cliente Prisma
- `npm run prisma:migrate` - Ejecutar migraciones
- `npm run prisma:studio` - Abrir Prisma Studio

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## Soporte

Para soporte, por favor abre un issue en el repositorio del proyecto.

