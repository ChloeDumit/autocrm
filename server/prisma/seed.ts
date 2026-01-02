import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Crear usuarios de prueba
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@autocrm.com' },
    update: {},
    create: {
      email: 'admin@autocrm.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });

  const vendedor = await prisma.user.upsert({
    where: { email: 'vendedor@autocrm.com' },
    update: {},
    create: {
      email: 'vendedor@autocrm.com',
      password: hashedPassword,
      name: 'Juan Vendedor',
      role: 'VENDEDOR',
    },
  });

  const asistente = await prisma.user.upsert({
    where: { email: 'asistente@autocrm.com' },
    update: {},
    create: {
      email: 'asistente@autocrm.com',
      password: hashedPassword,
      name: 'María Asistente',
      role: 'ASISTENTE',
    },
  });

  // Crear algunos vehículos de ejemplo
  const vehiculo1 = await prisma.vehicle.upsert({
    where: { id: 'veh-1' },
    update: {},
    create: {
      id: 'veh-1',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2023,
      precio: 25000,
      kilometraje: 15000,
      estado: 'DISPONIBLE',
      descripcion: 'Vehículo en excelente estado, único dueño',
      createdById: admin.id,
    },
  });

  const vehiculo2 = await prisma.vehicle.upsert({
    where: { id: 'veh-2' },
    update: {},
    create: {
      id: 'veh-2',
      marca: 'Honda',
      modelo: 'Civic',
      ano: 2022,
      precio: 22000,
      kilometraje: 20000,
      estado: 'DISPONIBLE',
      descripcion: 'Bien mantenido, revisado por mecánico',
      createdById: vendedor.id,
    },
  });

  const vehiculo3 = await prisma.vehicle.upsert({
    where: { id: 'veh-3' },
    update: {},
    create: {
      id: 'veh-3',
      marca: 'Ford',
      modelo: 'F-150',
      ano: 2021,
      precio: 35000,
      kilometraje: 30000,
      estado: 'RESERVADO',
      descripcion: 'Pickup en perfecto estado',
      createdById: admin.id,
    },
  });

  // Crear algunos clientes de ejemplo
  const cliente1 = await prisma.client.upsert({
    where: { id: 'cli-1' },
    update: {},
    create: {
      id: 'cli-1',
      nombre: 'Carlos Pérez',
      email: 'carlos.perez@email.com',
      telefono: '+1234567890',
      direccion: 'Calle Principal 123',
      interes: 'SUV',
      notas: 'Cliente interesado en vehículos familiares',
      createdById: vendedor.id,
    },
  });

  const cliente2 = await prisma.client.upsert({
    where: { id: 'cli-2' },
    update: {},
    create: {
      id: 'cli-2',
      nombre: 'Ana García',
      email: 'ana.garcia@email.com',
      telefono: '+0987654321',
      direccion: 'Avenida Central 456',
      interes: 'Sedán',
      notas: 'Primera compra, necesita financiamiento',
      createdById: asistente.id,
    },
  });

  // Crear una venta de ejemplo
  const venta1 = await prisma.sale.create({
    data: {
      etapa: 'NEGOCIACION',
      precioFinal: 24000,
      notas: 'Cliente interesado, negociando precio final',
      vehicleId: vehiculo1.id,
      clientId: cliente1.id,
      vendedorId: vendedor.id,
    },
  });

  // Crear un test drive de ejemplo
  const testDrive1 = await prisma.testDrive.create({
    data: {
      fecha: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 días desde ahora
      hora: '10:00',
      estado: 'CONFIRMADO',
      notas: 'Cliente confirmó asistencia',
      vehicleId: vehiculo2.id,
      clientId: cliente2.id,
      vendedorId: vendedor.id,
    },
  });

  // Crear una notificación de ejemplo
  await prisma.notification.create({
    data: {
      titulo: 'Bienvenido a AutoCRM',
      mensaje: 'Sistema configurado correctamente. Puedes comenzar a gestionar tu concesionaria.',
      tipo: 'SUCCESS',
      userId: admin.id,
    },
  });

  // Crear propiedades predefinidas para vehículos
  const propiedadesPredefinidas = [
    { nombre: 'Patente', tipo: 'TEXT', orden: 1 },
    { nombre: 'Número de Chasis', tipo: 'TEXT', orden: 2 },
    { nombre: 'Número de Motor', tipo: 'TEXT', orden: 3 },
    { nombre: 'Color', tipo: 'TEXT', orden: 4 },
    { nombre: 'Combustible', tipo: 'TEXT', orden: 5 },
    { nombre: 'Transmisión', tipo: 'TEXT', orden: 6 },
    { nombre: 'Cantidad de Puertas', tipo: 'NUMBER', orden: 7 },
    { nombre: 'Fecha de Primera Matriculación', tipo: 'DATE', orden: 8 },
  ];

  for (const prop of propiedadesPredefinidas) {
    // Verificar si ya existe
    const existing = await prisma.vehiclePropertyField.findFirst({
      where: { nombre: prop.nombre, esPredefinida: true },
    });

    if (!existing) {
      await prisma.vehiclePropertyField.create({
        data: {
          nombre: prop.nombre,
          tipo: prop.tipo as any,
          esPredefinida: true,
          orden: prop.orden,
          activa: true,
        },
      });
    }
  }

  console.log('✅ Seed completado exitosamente!');
  console.log('\n📋 Usuarios creados:');
  console.log('   👤 Admin:');
  console.log('      Email: admin@autocrm.com');
  console.log('      Password: password123');
  console.log('   👤 Vendedor:');
  console.log('      Email: vendedor@autocrm.com');
  console.log('      Password: password123');
  console.log('   👤 Asistente:');
  console.log('      Email: asistente@autocrm.com');
  console.log('      Password: password123');
  console.log('\n📦 Datos de ejemplo creados:');
  console.log('   - 3 vehículos');
  console.log('   - 2 clientes');
  console.log('   - 1 venta en proceso');
  console.log('   - 1 test drive agendado');
  console.log('   - 1 notificación');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

