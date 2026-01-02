import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Limpiar la base de datos (en orden por dependencias)
  console.log('🧹 Limpiando base de datos...');
  await prisma.notification.deleteMany();
  await prisma.testDrive.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.vehicleProperty.deleteMany();
  await prisma.vehicleDocument.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.client.deleteMany();
  await prisma.vehiclePropertyField.deleteMany();
  await prisma.documentTemplate.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.user.deleteMany();

  // Crear usuarios de prueba
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@autocrm.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });

  const vendedor = await prisma.user.create({
    data: {
      email: 'vendedor@autocrm.com',
      password: hashedPassword,
      name: 'Juan Pérez',
      role: 'VENDEDOR',
    },
  });

  const vendedor2 = await prisma.user.create({
    data: {
      email: 'maria@autocrm.com',
      password: hashedPassword,
      name: 'María González',
      role: 'VENDEDOR',
    },
  });

  const asistente = await prisma.user.create({
    data: {
      email: 'asistente@autocrm.com',
      password: hashedPassword,
      name: 'Carlos López',
      role: 'ASISTENTE',
    },
  });

  // Crear métodos de pago
  await prisma.paymentMethod.createMany({
    data: [
      { nombre: 'Efectivo', activo: true },
      { nombre: 'Transferencia Bancaria', activo: true },
      { nombre: 'Financiación', activo: true },
      { nombre: 'Tarjeta de Crédito', activo: true },
      { nombre: 'Cheque', activo: true },
    ],
  });

  // Crear vehículos con datos más realistas (Uruguay)
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        marca: 'Toyota',
        modelo: 'Corolla XEI',
        ano: 2023,
        precio: 32000,
        moneda: 'USD',
        kilometraje: 12000,
        estado: 'DISPONIBLE',
        descripcion: 'Sedan familiar en excelente estado. Único dueño, service oficial al día. Incluye cámara de retroceso, sensor de estacionamiento y climatizador automático.',
        createdById: admin.id,
      },
    }),
    prisma.vehicle.create({
      data: {
        marca: 'Volkswagen',
        modelo: 'Polo Comfortline',
        ano: 2022,
        precio: 22500,
        moneda: 'USD',
        kilometraje: 28000,
        estado: 'DISPONIBLE',
        descripcion: 'Compacto muy económico. Motor 1.6 MSI. Excelente para ciudad. Aire acondicionado, dirección asistida, cierre centralizado.',
        createdById: vendedor.id,
      },
    }),
    prisma.vehicle.create({
      data: {
        marca: 'Chevrolet',
        modelo: 'Onix LTZ',
        ano: 2024,
        precio: 25000,
        moneda: 'USD',
        kilometraje: 5000,
        estado: 'DISPONIBLE',
        descripcion: 'Prácticamente nuevo, modelo 2024. Pantalla táctil 8", Android Auto y Apple CarPlay. Garantía de fábrica vigente.',
        createdById: vendedor.id,
      },
    }),
    prisma.vehicle.create({
      data: {
        marca: 'Ford',
        modelo: 'Ranger XLT',
        ano: 2022,
        precio: 45000,
        moneda: 'USD',
        kilometraje: 45000,
        estado: 'RESERVADO',
        descripcion: 'Pickup doble cabina 4x4. Motor 3.2 diesel. Cubrecaja, estribos, faros antiniebla. Ideal para trabajo y uso diario.',
        createdById: admin.id,
      },
    }),
    prisma.vehicle.create({
      data: {
        marca: 'Fiat',
        modelo: 'Cronos Drive',
        ano: 2023,
        precio: 19500,
        moneda: 'USD',
        kilometraje: 18000,
        estado: 'DISPONIBLE',
        descripcion: 'Sedan compacto muy económico. Motor 1.3 Firefly. Bajo consumo de combustible. Excelente relación precio-calidad.',
        createdById: vendedor2.id,
      },
    }),
    prisma.vehicle.create({
      data: {
        marca: 'Renault',
        modelo: 'Duster Iconic',
        ano: 2021,
        precio: 28000,
        moneda: 'USD',
        kilometraje: 52000,
        estado: 'DISPONIBLE',
        descripcion: 'SUV espaciosa con excelente altura del piso. Motor 1.6. Climatizador, cámara trasera, control crucero.',
        createdById: vendedor.id,
      },
    }),
    prisma.vehicle.create({
      data: {
        marca: 'Peugeot',
        modelo: '208 Allure',
        ano: 2023,
        precio: 24000,
        moneda: 'USD',
        kilometraje: 8000,
        estado: 'DISPONIBLE',
        descripcion: 'Diseño moderno y deportivo. Motor 1.2 PureTech turbo. i-Cockpit 3D, cámara 180°, sensores delanteros y traseros.',
        createdById: vendedor2.id,
      },
    }),
    prisma.vehicle.create({
      data: {
        marca: 'Nissan',
        modelo: 'Kicks Exclusive',
        ano: 2022,
        precio: 29500,
        moneda: 'USD',
        kilometraje: 35000,
        estado: 'MANTENIMIENTO',
        descripcion: 'SUV compacta premium. Techo panorámico, asientos de cuero, pantalla 8". En mantenimiento preventivo de 30.000 km.',
        createdById: admin.id,
      },
    }),
    prisma.vehicle.create({
      data: {
        marca: 'Toyota',
        modelo: 'Hilux SRV',
        ano: 2020,
        precio: 42000,
        moneda: 'USD',
        kilometraje: 78000,
        estado: 'VENDIDO',
        descripcion: 'Pickup referencia del mercado. Motor 2.8 diesel, caja automática. Cubierta rígida, cámara de retroceso.',
        createdById: vendedor.id,
      },
    }),
    prisma.vehicle.create({
      data: {
        marca: 'Honda',
        modelo: 'HR-V EXL',
        ano: 2023,
        precio: 35000,
        moneda: 'USD',
        kilometraje: 15000,
        estado: 'DISPONIBLE',
        descripcion: 'SUV premium japonesa. Motor 1.5 turbo CVT. Cuero, sunroof, Honda Sensing completo. Garantía vigente.',
        createdById: vendedor2.id,
      },
    }),
  ]);

  // Crear clientes con datos uruguayos
  const clientes = await Promise.all([
    prisma.client.create({
      data: {
        nombre: 'Martín Rodríguez',
        email: 'martin.rodriguez@gmail.com',
        telefono: '099 123 456',
        direccion: 'Av. 18 de Julio 1234, Montevideo',
        interes: 'SUV',
        notas: 'Busca vehículo familiar. Presupuesto hasta USD 35.000. Interesado en financiación.',
        createdById: vendedor.id,
      },
    }),
    prisma.client.create({
      data: {
        nombre: 'Laura Fernández',
        email: 'laura.fernandez@hotmail.com',
        telefono: '098 456 789',
        direccion: 'Rambla República de México 5678, Pocitos',
        interes: 'Sedan',
        notas: 'Primera compra. Busca auto económico para trabajo. Prefiere automático.',
        createdById: vendedor.id,
      },
    }),
    prisma.client.create({
      data: {
        nombre: 'Diego Martínez',
        email: 'diego.m@empresa.com.uy',
        telefono: '091 234 567',
        direccion: 'Calle Colonia 890, Centro',
        interes: 'Pickup',
        notas: 'Empresario, necesita pickup para trabajo. Puede pagar al contado.',
        createdById: vendedor2.id,
      },
    }),
    prisma.client.create({
      data: {
        nombre: 'Carolina Silva',
        email: 'caro.silva@gmail.com',
        telefono: '094 567 890',
        direccion: 'Av. Rivera 2345, Carrasco',
        interes: 'Hatchback',
        notas: 'Busca segundo auto para la familia. Quiere algo compacto y moderno.',
        createdById: asistente.id,
      },
    }),
    prisma.client.create({
      data: {
        nombre: 'Alejandro Gómez',
        email: 'agomez@yahoo.com',
        telefono: '095 678 901',
        direccion: 'Bulevar Artigas 567, Tres Cruces',
        interes: 'SUV',
        notas: 'Tiene permuta. Honda CRV 2018. Interesado en upgrade.',
        createdById: vendedor.id,
      },
    }),
  ]);

  // Crear ventas en diferentes etapas
  await prisma.sale.create({
    data: {
      etapa: 'INTERESADO',
      precioFinal: vehicles[2].precio,
      notas: 'Cliente consultó por WhatsApp. Agendamos visita para ver el vehículo.',
      vehicleId: vehicles[2].id,
      clientId: clientes[1].id,
      vendedorId: vendedor.id,
    },
  });

  await prisma.sale.create({
    data: {
      etapa: 'NEGOCIACION',
      precioFinal: 30000,
      notas: 'Cliente ofreció USD 30.000. Estamos negociando precio final.',
      vehicleId: vehicles[0].id,
      clientId: clientes[0].id,
      vendedorId: vendedor.id,
    },
  });

  await prisma.sale.create({
    data: {
      etapa: 'PRUEBA',
      precioFinal: 44000,
      notas: 'Cliente realizó test drive. Muy interesado, preparando documentación.',
      vehicleId: vehicles[3].id,
      clientId: clientes[2].id,
      vendedorId: vendedor2.id,
    },
  });

  await prisma.sale.create({
    data: {
      etapa: 'VENDIDO',
      precioFinal: 40000,
      notas: 'Venta completada. Cliente muy satisfecho.',
      vehicleId: vehicles[8].id, // Toyota Hilux (VENDIDO)
      clientId: clientes[4].id,
      vendedorId: vendedor.id,
    },
  });

  // Crear test drives
  const today = new Date();
  await prisma.testDrive.create({
    data: {
      fecha: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), // mañana
      hora: '10:00',
      estado: 'CONFIRMADO',
      notas: 'Cliente viene con su esposa. Tiene 30 minutos disponibles.',
      vehicleId: vehicles[5].id, // Renault Duster
      clientId: clientes[0].id,
      vendedorId: vendedor.id,
    },
  });

  await prisma.testDrive.create({
    data: {
      fecha: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // pasado mañana
      hora: '15:30',
      estado: 'PENDIENTE',
      notas: 'Primera visita del cliente. Mostrar también otros modelos similares.',
      vehicleId: vehicles[9].id, // Honda HR-V
      clientId: clientes[3].id,
      vendedorId: vendedor2.id,
    },
  });

  await prisma.testDrive.create({
    data: {
      fecha: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
      hora: '11:00',
      estado: 'CONFIRMADO',
      notas: 'Segundo test drive. Ya probó el Polo, ahora quiere probar el Cronos.',
      vehicleId: vehicles[4].id, // Fiat Cronos
      clientId: clientes[1].id,
      vendedorId: vendedor.id,
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
    { nombre: 'Aire Acondicionado', tipo: 'BOOLEAN', orden: 9 },
    { nombre: 'Dirección Asistida', tipo: 'BOOLEAN', orden: 10 },
  ];

  for (const prop of propiedadesPredefinidas) {
    await prisma.vehiclePropertyField.create({
      data: {
        nombre: prop.nombre,
        tipo: prop.tipo,
        esPredefinida: true,
        orden: prop.orden,
        activa: true,
      },
    });
  }

  // Agregar algunas propiedades a vehículos
  const propFields = await prisma.vehiclePropertyField.findMany();
  const patenteField = propFields.find(f => f.nombre === 'Patente');
  const colorField = propFields.find(f => f.nombre === 'Color');
  const combustibleField = propFields.find(f => f.nombre === 'Combustible');
  const transmisionField = propFields.find(f => f.nombre === 'Transmisión');

  if (patenteField && colorField && combustibleField && transmisionField) {
    // Toyota Corolla
    await prisma.vehicleProperty.createMany({
      data: [
        { vehicleId: vehicles[0].id, fieldId: patenteField.id, valor: 'ABC 1234' },
        { vehicleId: vehicles[0].id, fieldId: colorField.id, valor: 'Gris Plata' },
        { vehicleId: vehicles[0].id, fieldId: combustibleField.id, valor: 'Nafta' },
        { vehicleId: vehicles[0].id, fieldId: transmisionField.id, valor: 'Automática CVT' },
      ],
    });

    // VW Polo
    await prisma.vehicleProperty.createMany({
      data: [
        { vehicleId: vehicles[1].id, fieldId: patenteField.id, valor: 'DEF 5678' },
        { vehicleId: vehicles[1].id, fieldId: colorField.id, valor: 'Blanco Candy' },
        { vehicleId: vehicles[1].id, fieldId: combustibleField.id, valor: 'Nafta' },
        { vehicleId: vehicles[1].id, fieldId: transmisionField.id, valor: 'Manual 5 velocidades' },
      ],
    });

    // Ford Ranger
    await prisma.vehicleProperty.createMany({
      data: [
        { vehicleId: vehicles[3].id, fieldId: patenteField.id, valor: 'GHI 9012' },
        { vehicleId: vehicles[3].id, fieldId: colorField.id, valor: 'Negro Ébano' },
        { vehicleId: vehicles[3].id, fieldId: combustibleField.id, valor: 'Diesel' },
        { vehicleId: vehicles[3].id, fieldId: transmisionField.id, valor: 'Automática 6 velocidades' },
      ],
    });
  }

  // Crear notificaciones
  await prisma.notification.createMany({
    data: [
      {
        titulo: 'Bienvenido a AutoCRM',
        mensaje: 'Sistema configurado correctamente. Comienza a gestionar tu concesionaria.',
        tipo: 'SUCCESS',
        userId: admin.id,
      },
      {
        titulo: 'Nueva consulta recibida',
        mensaje: 'Martín Rodríguez consultó por el Toyota Corolla XEI.',
        tipo: 'INFO',
        userId: vendedor.id,
      },
      {
        titulo: 'Test drive confirmado',
        mensaje: 'El test drive de mañana a las 10:00 ha sido confirmado.',
        tipo: 'INFO',
        userId: vendedor.id,
      },
      {
        titulo: 'Venta próxima a cerrar',
        mensaje: 'La venta de la Ford Ranger está en etapa de documentación.',
        tipo: 'WARNING',
        userId: vendedor2.id,
      },
    ],
  });

  console.log('✅ Seed completado exitosamente!');
  console.log('\n📋 Usuarios creados:');
  console.log('   👤 Admin:');
  console.log('      Email: admin@autocrm.com');
  console.log('      Password: password123');
  console.log('   👤 Vendedor 1:');
  console.log('      Email: vendedor@autocrm.com');
  console.log('      Password: password123');
  console.log('   👤 Vendedor 2:');
  console.log('      Email: maria@autocrm.com');
  console.log('      Password: password123');
  console.log('   👤 Asistente:');
  console.log('      Email: asistente@autocrm.com');
  console.log('      Password: password123');
  console.log('\n📦 Datos de ejemplo creados:');
  console.log('   - 10 vehículos (varios estados)');
  console.log('   - 5 clientes');
  console.log('   - 4 ventas (diferentes etapas)');
  console.log('   - 3 test drives agendados');
  console.log('   - 10 propiedades de vehículo predefinidas');
  console.log('   - 5 métodos de pago');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
