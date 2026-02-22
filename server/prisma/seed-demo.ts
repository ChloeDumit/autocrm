import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🎬 Setting up DEMO tenant...\n');

  const hashedPassword = await bcrypt.hash('demo1234', 10);

  // ============================================
  // Clean existing demo tenant if exists
  // ============================================
  const existingTenant = await prisma.tenant.findUnique({
    where: { subdomain: 'demo' },
  });

  if (existingTenant) {
    console.log('🧹 Removing existing demo tenant...');
    await prisma.tenant.delete({ where: { id: existingTenant.id } });
  }

  // ============================================
  // Create Demo Tenant
  // ============================================
  console.log('🏢 Creating demo tenant...');
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Sur Automotora',
      subdomain: 'demo',
      email: 'info@surautomotora.com.uy',
      phone: '+598 2 901 2345',
      status: 'ACTIVE',
      plan: 'PROFESSIONAL',
      maxUsers: 10,
      maxVehicles: 200,
      approvedAt: new Date(),
    },
  });

  // ============================================
  // App Config (branding)
  // ============================================
  console.log('🎨 Setting up branding...');
  await prisma.appConfig.create({
    data: {
      nombreEmpresa: 'Sur Automotora',
      colorPrimario: '#1e3a5f',
      colorSecundario: '#0f766e',
      tenantId: tenant.id,
    },
  });

  // ============================================
  // Users
  // ============================================
  console.log('👤 Creating users...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@surautomotora.com',
      password: hashedPassword,
      name: 'Gonzalo Méndez',
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });

  const vendedor1 = await prisma.user.create({
    data: {
      email: 'santiago@surautomotora.com',
      password: hashedPassword,
      name: 'Santiago Acosta',
      role: 'VENDEDOR',
      tenantId: tenant.id,
    },
  });

  const vendedor2 = await prisma.user.create({
    data: {
      email: 'valentina@surautomotora.com',
      password: hashedPassword,
      name: 'Valentina Rodríguez',
      role: 'VENDEDOR',
      tenantId: tenant.id,
    },
  });

  const asistente = await prisma.user.create({
    data: {
      email: 'lucia@surautomotora.com',
      password: hashedPassword,
      name: 'Lucía Fernández',
      role: 'ASISTENTE',
      tenantId: tenant.id,
    },
  });

  // ============================================
  // Payment Methods
  // ============================================
  console.log('💳 Creating payment methods...');
  const paymentMethods = await Promise.all([
    prisma.paymentMethod.create({
      data: { nombre: 'Efectivo', descripcion: 'Pago en efectivo (USD o UYU)', activo: true, tenantId: tenant.id },
    }),
    prisma.paymentMethod.create({
      data: { nombre: 'Transferencia Bancaria', descripcion: 'BROU, Itaú, Santander, Scotiabank', activo: true, tenantId: tenant.id },
    }),
    prisma.paymentMethod.create({
      data: { nombre: 'Financiación Propia', descripcion: 'Hasta 36 cuotas en USD', activo: true, tenantId: tenant.id },
    }),
    prisma.paymentMethod.create({
      data: { nombre: 'Tarjeta de Crédito', descripcion: 'Visa, Mastercard, OCA', activo: true, tenantId: tenant.id },
    }),
    prisma.paymentMethod.create({
      data: { nombre: 'Permuta', descripcion: 'Tomamos tu vehículo como parte de pago', activo: true, tenantId: tenant.id },
    }),
  ]);

  // ============================================
  // Vehicle Property Fields
  // ============================================
  console.log('📋 Creating vehicle property fields...');
  const propFields = [
    { nombre: 'Patente', tipo: 'TEXT', orden: 1 },
    { nombre: 'Número de Chasis', tipo: 'TEXT', orden: 2 },
    { nombre: 'Número de Motor', tipo: 'TEXT', orden: 3 },
    { nombre: 'Color', tipo: 'TEXT', orden: 4 },
    { nombre: 'Combustible', tipo: 'TEXT', orden: 5 },
    { nombre: 'Transmisión', tipo: 'TEXT', orden: 6 },
    { nombre: 'Cantidad de Puertas', tipo: 'NUMBER', orden: 7 },
    { nombre: 'Aire Acondicionado', tipo: 'BOOLEAN', orden: 8 },
  ];

  for (const prop of propFields) {
    await prisma.vehiclePropertyField.create({
      data: {
        nombre: prop.nombre,
        tipo: prop.tipo,
        esPredefinida: true,
        orden: prop.orden,
        activa: true,
        tenantId: tenant.id,
      },
    });
  }

  // ============================================
  // Vehicles (12 vehicles - realistic Uruguayan market)
  // ============================================
  console.log('🚗 Creating vehicles...');
  const vehicles = await Promise.all([
    // DISPONIBLE vehicles (7)
    prisma.vehicle.create({
      data: {
        marca: 'Toyota', modelo: 'Corolla XEI', ano: 2023, precio: 32000, moneda: 'USD',
        kilometraje: 14000, estado: 'DISPONIBLE',
        descripcion: 'Sedan familiar en excelente estado. Único dueño, service oficial Toyota al día. Cámara de retroceso, sensores de estacionamiento, pantalla táctil.',
        createdById: vendedor1.id, tenantId: tenant.id,
      },
    }),
    prisma.vehicle.create({
      data: {
        marca: 'Volkswagen', modelo: 'T-Cross Highline', ano: 2024, precio: 29500, moneda: 'USD',
        kilometraje: 6000, estado: 'DISPONIBLE',
        descripcion: 'SUV compacto prácticamente nuevo. Motor 1.0 TSI turbo. Techo panorámico, ACC, asistente de carril.',
        createdById: vendedor1.id, tenantId: tenant.id,
      },
    }),
    prisma.vehicle.create({
      data: {
        marca: 'Chevrolet', modelo: 'Tracker Premier', ano: 2023, precio: 27000, moneda: 'USD',
        kilometraje: 22000, estado: 'DISPONIBLE',
        descripcion: 'SUV con motor turbo 1.2. Pantalla de 8 pulgadas, Apple CarPlay, Android Auto. Muy económica en combustible.',
        createdById: vendedor2.id, tenantId: tenant.id,
      },
    }),
    prisma.vehicle.create({
      data: {
        marca: 'Toyota', modelo: 'Hilux SRV 4x4', ano: 2022, precio: 45000, moneda: 'USD',
        kilometraje: 48000, estado: 'DISPONIBLE',
        descripcion: 'Pickup referencia del mercado uruguayo. Motor 2.8 diesel 204 CV. Automática, cuero, navegador GPS.',
        createdById: admin.id, tenantId: tenant.id,
      },
    }),
    prisma.vehicle.create({
      data: {
        marca: 'Fiat', modelo: 'Cronos Drive', ano: 2024, precio: 19800, moneda: 'USD',
        kilometraje: 3500, estado: 'DISPONIBLE',
        descripcion: 'Sedan compacto ideal para ciudad. Motor 1.3 Firefly. Bajo consumo, excelente relación precio-calidad.',
        createdById: vendedor1.id, tenantId: tenant.id,
      },
    }),
    prisma.vehicle.create({
      data: {
        marca: 'Honda', modelo: 'HR-V EXL', ano: 2023, precio: 34500, moneda: 'USD',
        kilometraje: 16000, estado: 'DISPONIBLE',
        descripcion: 'SUV premium japonesa. Motor 1.5 turbo CVT. Interior amplio, baúl enorme, excelente valor de reventa.',
        createdById: vendedor2.id, tenantId: tenant.id,
      },
    }),
    prisma.vehicle.create({
      data: {
        marca: 'Renault', modelo: 'Duster Iconic 4x4', ano: 2023, precio: 28500, moneda: 'USD',
        kilometraje: 19000, estado: 'DISPONIBLE',
        descripcion: 'SUV con tracción integral. Ideal para campo y ciudad. Cámara 360°, pantalla multimedia.',
        createdById: vendedor1.id, tenantId: tenant.id,
      },
    }),
    // RESERVADO (2)
    prisma.vehicle.create({
      data: {
        marca: 'Ford', modelo: 'Ranger XLT 4x4', ano: 2023, precio: 42000, moneda: 'USD',
        kilometraje: 32000, estado: 'RESERVADO',
        descripcion: 'Pickup doble cabina diesel. Motor 3.0 V6 turbo. Seña recibida, entrega pendiente.',
        createdById: admin.id, tenantId: tenant.id,
      },
    }),
    prisma.vehicle.create({
      data: {
        marca: 'Volkswagen', modelo: 'Polo Comfortline', ano: 2023, precio: 22500, moneda: 'USD',
        kilometraje: 18000, estado: 'RESERVADO',
        descripcion: 'Hatchback deportivo y económico. Motor 1.6 MSI. Aire acondicionado, dirección asistida.',
        createdById: vendedor2.id, tenantId: tenant.id,
      },
    }),
    // VENDIDO (2)
    prisma.vehicle.create({
      data: {
        marca: 'Toyota', modelo: 'Yaris XS', ano: 2022, precio: 21000, moneda: 'USD',
        kilometraje: 35000, estado: 'VENDIDO',
        descripcion: 'Hatchback confiable y económico. Ideal primer auto. Vendido en febrero 2025.',
        createdById: vendedor1.id, tenantId: tenant.id,
      },
    }),
    prisma.vehicle.create({
      data: {
        marca: 'Chevrolet', modelo: 'Onix LTZ', ano: 2023, precio: 23500, moneda: 'USD',
        kilometraje: 12000, estado: 'VENDIDO',
        descripcion: 'Sedan con excelente equipamiento. Vendido con financiación propia.',
        createdById: vendedor2.id, tenantId: tenant.id,
      },
    }),
    // MANTENIMIENTO (1)
    prisma.vehicle.create({
      data: {
        marca: 'Peugeot', modelo: '208 Allure', ano: 2022, precio: 23000, moneda: 'USD',
        kilometraje: 28000, estado: 'MANTENIMIENTO',
        descripcion: 'En taller para service de 30.000 km. Disponible la semana próxima.',
        createdById: admin.id, tenantId: tenant.id,
      },
    }),
  ]);

  // ============================================
  // Clients (10 clients)
  // ============================================
  console.log('👥 Creating clients...');
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        nombre: 'Martín Rodríguez', email: 'martin.rodriguez@gmail.com', telefono: '099 123 456',
        direccion: 'Av. 18 de Julio 1234, Montevideo', interes: 'SUV',
        notas: 'Busca vehículo familiar. Presupuesto hasta USD 35.000. Prefiere Toyota o Honda.',
        createdById: vendedor1.id, tenantId: tenant.id,
      },
    }),
    prisma.client.create({
      data: {
        nombre: 'Laura Fernández', email: 'laura.fernandez@hotmail.com', telefono: '098 456 789',
        direccion: 'Rambla República de México 5678, Pocitos', interes: 'Sedan',
        notas: 'Primera compra. Busca auto económico para ir al trabajo. Interesada en financiación.',
        createdById: vendedor1.id, tenantId: tenant.id,
      },
    }),
    prisma.client.create({
      data: {
        nombre: 'Diego Martínez', email: 'diego.m@empresa.com.uy', telefono: '091 234 567',
        direccion: 'Ruta 1 km 25, Ciudad de la Costa', interes: 'Pickup',
        notas: 'Empresario agropecuario. Necesita pickup 4x4 para campo. Paga de contado.',
        createdById: vendedor2.id, tenantId: tenant.id,
      },
    }),
    prisma.client.create({
      data: {
        nombre: 'Carolina Silva', email: 'caro.silva@gmail.com', telefono: '094 567 890',
        direccion: 'Av. Rivera 2345, Carrasco', interes: 'Hatchback',
        notas: 'Busca segundo auto para la familia. Prefiere algo compacto y económico.',
        createdById: vendedor2.id, tenantId: tenant.id,
      },
    }),
    prisma.client.create({
      data: {
        nombre: 'Alejandro Gómez', email: 'agomez@yahoo.com', telefono: '095 678 901',
        direccion: 'Bulevar Artigas 567, Tres Cruces', interes: 'SUV',
        notas: 'Tiene Honda CRV 2018 para permutar. Busca algo más nuevo.',
        createdById: vendedor1.id, tenantId: tenant.id,
      },
    }),
    prisma.client.create({
      data: {
        nombre: 'Florencia Acuña', email: 'flor.acuna@outlook.com', telefono: '092 345 678',
        direccion: 'Calle Colonia 890, Centro', interes: 'Sedan',
        notas: 'Profesional joven. Busca auto con buen equipamiento y bajo consumo.',
        createdById: vendedor1.id, tenantId: tenant.id,
      },
    }),
    prisma.client.create({
      data: {
        nombre: 'Roberto Pereira', email: 'rpereira@adinet.com.uy', telefono: '099 876 543',
        direccion: 'Av. Italia 4567, Malvín', interes: 'Pickup',
        notas: 'Busca pickup para trabajo y familia. Interesado en Ranger o Hilux.',
        createdById: vendedor2.id, tenantId: tenant.id,
      },
    }),
    prisma.client.create({
      data: {
        nombre: 'Ana Belén Torres', email: 'anabelen.t@gmail.com', telefono: '098 234 567',
        direccion: 'José Ellauri 1234, Pocitos', interes: 'SUV',
        notas: 'Madre de 3 hijos. Necesita SUV espaciosa. Presupuesto flexible.',
        createdById: vendedor1.id, tenantId: tenant.id,
      },
    }),
    prisma.client.create({
      data: {
        nombre: 'Fernando Ibáñez', email: 'fibañez@gmail.com', telefono: '091 567 890',
        direccion: 'Rambla Costanera, Punta Carretas', interes: 'Hatchback',
        notas: 'Vendió su auto anterior. Busca reemplazo urgente.',
        createdById: vendedor2.id, tenantId: tenant.id,
      },
    }),
    prisma.client.create({
      data: {
        nombre: 'Camila Rodríguez', email: 'camila.rdz@outlook.com', telefono: '094 890 123',
        direccion: 'Av. Millán 3456, Prado', interes: 'Sedan',
        notas: 'Recién recibida. Quiere comprar su primer auto. Padre la acompaña.',
        createdById: vendedor1.id, tenantId: tenant.id,
      },
    }),
  ]);

  // ============================================
  // Sales (8 sales across all stages for nice pipeline)
  // ============================================
  console.log('💰 Creating sales...');

  // INTERESADO (2)
  const sale1 = await prisma.sale.create({
    data: {
      etapa: 'INTERESADO', precioFinal: 29500,
      notas: 'Cliente consultó por Instagram. Quiere venir a ver la T-Cross el fin de semana.',
      vehicleId: vehicles[1].id, clientId: clients[4].id, vendedorId: vendedor1.id, tenantId: tenant.id,
    },
  });

  const sale2 = await prisma.sale.create({
    data: {
      etapa: 'INTERESADO', precioFinal: 19800,
      notas: 'Llamó por teléfono. Interesada en el Cronos por el precio. Agendamos visita.',
      vehicleId: vehicles[4].id, clientId: clients[9].id, vendedorId: vendedor1.id, tenantId: tenant.id,
    },
  });

  // PRUEBA (2)
  const sale3 = await prisma.sale.create({
    data: {
      etapa: 'PRUEBA', precioFinal: 34500,
      notas: 'Realizó test drive ayer. Muy entusiasmada con el espacio del baúl. Va a consultarlo con el marido.',
      vehicleId: vehicles[5].id, clientId: clients[7].id, vendedorId: vendedor2.id, tenantId: tenant.id,
    },
  });

  const sale4 = await prisma.sale.create({
    data: {
      etapa: 'PRUEBA', precioFinal: 45000,
      notas: 'Test drive realizado en zona rural. Cliente confirmó que la potencia es la que necesita.',
      vehicleId: vehicles[3].id, clientId: clients[2].id, vendedorId: vendedor2.id, tenantId: tenant.id,
    },
  });

  // NEGOCIACION (2)
  const sale5 = await prisma.sale.create({
    data: {
      etapa: 'NEGOCIACION', precioFinal: 40000,
      notas: 'Ofreció USD 40.000 con permuta de su Ranger 2019. Evaluando la permuta.',
      vehicleId: vehicles[7].id, clientId: clients[6].id, vendedorId: vendedor1.id, tenantId: tenant.id,
    },
  });

  const sale6 = await prisma.sale.create({
    data: {
      etapa: 'NEGOCIACION', precioFinal: 21500,
      notas: 'Negociando financiación. Cliente quiere 24 cuotas. Evaluando con administración.',
      vehicleId: vehicles[8].id, clientId: clients[3].id, vendedorId: vendedor2.id, tenantId: tenant.id,
    },
  });

  // VENDIDO (2) - these should match the VENDIDO vehicles
  const sale7 = await prisma.sale.create({
    data: {
      etapa: 'VENDIDO', precioFinal: 20500,
      notas: 'Venta cerrada. Pago con transferencia bancaria. Cliente muy satisfecho.',
      vehicleId: vehicles[9].id, clientId: clients[5].id, vendedorId: vendedor1.id, tenantId: tenant.id,
    },
  });

  const sale8 = await prisma.sale.create({
    data: {
      etapa: 'VENDIDO', precioFinal: 23000,
      notas: 'Venta con financiación propia a 12 cuotas. Entrega realizada.',
      vehicleId: vehicles[10].id, clientId: clients[1].id, vendedorId: vendedor2.id, tenantId: tenant.id,
    },
  });

  // ============================================
  // Test Drives (4 - mix of states)
  // ============================================
  console.log('🚙 Creating test drives...');
  const today = new Date();

  await Promise.all([
    prisma.testDrive.create({
      data: {
        fecha: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), hora: '10:00',
        estado: 'CONFIRMADO', notas: 'Cliente viene con su esposa. Quieren probar la T-Cross.',
        vehicleId: vehicles[1].id, clientId: clients[4].id, vendedorId: vendedor1.id, tenantId: tenant.id,
      },
    }),
    prisma.testDrive.create({
      data: {
        fecha: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), hora: '15:30',
        estado: 'PENDIENTE', notas: 'Primera visita. Viene a conocer la camioneta.',
        vehicleId: vehicles[3].id, clientId: clients[6].id, vendedorId: vendedor2.id, tenantId: tenant.id,
      },
    }),
    prisma.testDrive.create({
      data: {
        fecha: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), hora: '11:00',
        estado: 'PENDIENTE', notas: 'Quiere probar la Duster en ruta. Coordinar recorrido.',
        vehicleId: vehicles[6].id, clientId: clients[0].id, vendedorId: vendedor1.id, tenantId: tenant.id,
      },
    }),
    prisma.testDrive.create({
      data: {
        fecha: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), hora: '14:00',
        estado: 'COMPLETADO', notas: 'Test drive completado. Cliente quedó muy conforme.',
        vehicleId: vehicles[5].id, clientId: clients[7].id, vendedorId: vendedor2.id, tenantId: tenant.id,
      },
    }),
  ]);

  // ============================================
  // Document Templates (3 realistic templates)
  // ============================================
  console.log('📄 Creating document templates...');
  await Promise.all([
    prisma.documentTemplate.create({
      data: {
        nombre: 'Contrato de Compraventa',
        descripcion: 'Contrato estándar para la venta de vehículos usados',
        activo: true,
        contenido: `CONTRATO DE COMPRAVENTA DE VEHÍCULO

En la ciudad de Montevideo, a los {{fecha_actual}} días, entre:

VENDEDOR: Sur Automotora
Dirección: Av. Rivera 5678, Montevideo

COMPRADOR: {{cliente_nombre}}
Teléfono: {{cliente_telefono}}
Dirección: {{cliente_direccion}}

Se acuerda la compraventa del siguiente vehículo:

Marca: {{vehiculo_marca}}
Modelo: {{vehiculo_modelo}}
Año: {{vehiculo_ano}}
Kilometraje: {{vehiculo_kilometraje}} km

PRECIO PACTADO: USD {{precio_final}}

El comprador declara conocer el estado actual del vehículo, habiendo realizado las verificaciones que consideró pertinentes.

Vendedor asignado: {{vendedor_nombre}}

_________________________          _________________________
     Sur Automotora                     {{cliente_nombre}}`,
        tenantId: tenant.id,
      },
    }),
    prisma.documentTemplate.create({
      data: {
        nombre: 'Recibo de Seña',
        descripcion: 'Comprobante de pago de seña para reserva de vehículo',
        activo: true,
        contenido: `RECIBO DE SEÑA

Fecha: {{fecha_actual}}

Recibimos de {{cliente_nombre}} la cantidad de USD _________ (_________ dólares americanos) en concepto de SEÑA por la reserva del siguiente vehículo:

Marca: {{vehiculo_marca}}
Modelo: {{vehiculo_modelo}}
Año: {{vehiculo_ano}}
Precio total acordado: USD {{precio_final}}

Saldo pendiente: USD _________

La presente seña es a cuenta del precio total. En caso de desistimiento por parte del comprador, la seña quedará a favor de Sur Automotora.

Vendedor: {{vendedor_nombre}}

_________________________
     Sur Automotora`,
        tenantId: tenant.id,
      },
    }),
    prisma.documentTemplate.create({
      data: {
        nombre: 'Acta de Entrega',
        descripcion: 'Documento de entrega del vehículo al comprador',
        activo: true,
        contenido: `ACTA DE ENTREGA DE VEHÍCULO

Fecha de entrega: {{fecha_actual}}

Se hace constar que Sur Automotora entrega a {{cliente_nombre}} el vehículo detallado a continuación:

Marca: {{vehiculo_marca}}
Modelo: {{vehiculo_modelo}}
Año: {{vehiculo_ano}}
Kilometraje al momento de entrega: {{vehiculo_kilometraje}} km

El comprador declara recibir el vehículo en conformidad, verificando:
☐ Estado general del vehículo
☐ Documentación al día
☐ Llaves (juego principal y copia)
☐ Manual del propietario
☐ Herramientas y rueda de auxilio

Vendedor responsable: {{vendedor_nombre}}

_________________________          _________________________
     Sur Automotora                     {{cliente_nombre}}`,
        tenantId: tenant.id,
      },
    }),
  ]);

  // ============================================
  // Notifications
  // ============================================
  console.log('🔔 Creating notifications...');
  await prisma.notification.createMany({
    data: [
      {
        titulo: 'Bienvenido a Rodar',
        mensaje: 'Tu cuenta de Sur Automotora está configurada y lista para usar.',
        tipo: 'SUCCESS', userId: admin.id, tenantId: tenant.id,
      },
      {
        titulo: 'Nuevo lead recibido',
        mensaje: 'Alejandro Gómez consultó por la Volkswagen T-Cross Highline.',
        tipo: 'INFO', userId: vendedor1.id, tenantId: tenant.id,
      },
      {
        titulo: 'Test drive confirmado',
        mensaje: 'Test drive de mañana a las 10:00 con Alejandro Gómez confirmado.',
        tipo: 'INFO', userId: vendedor1.id, tenantId: tenant.id,
      },
      {
        titulo: 'Venta cerrada',
        mensaje: 'Florencia Acuña completó la compra del Toyota Yaris XS. ¡Felicitaciones!',
        tipo: 'SUCCESS', userId: vendedor1.id, tenantId: tenant.id,
      },
      {
        titulo: 'Negociación en curso',
        mensaje: 'Roberto Pereira ofreció USD 40.000 por la Ford Ranger XLT.',
        tipo: 'WARNING', userId: vendedor1.id, tenantId: tenant.id,
      },
      {
        titulo: 'Vehículo en mantenimiento',
        mensaje: 'El Peugeot 208 Allure ingresó a taller para service de 30.000 km.',
        tipo: 'INFO', userId: admin.id, tenantId: tenant.id,
      },
    ],
  });

  // ============================================
  // Summary
  // ============================================
  console.log('\n✅ Demo tenant created successfully!\n');
  console.log('════════════════════════════════════════════════════════════');
  console.log('                   DEMO TENANT: Sur Automotora');
  console.log('════════════════════════════════════════════════════════════');
  console.log('   URL: demo.localhost:3000');
  console.log('   Status: ACTIVE | Plan: PROFESSIONAL');
  console.log('');
  console.log('   👤 Admin:');
  console.log('      Email: admin@surautomotora.com');
  console.log('      Password: demo1234');
  console.log('');
  console.log('   👤 Vendedor 1:');
  console.log('      Email: santiago@surautomotora.com');
  console.log('      Password: demo1234');
  console.log('');
  console.log('   👤 Vendedor 2:');
  console.log('      Email: valentina@surautomotora.com');
  console.log('      Password: demo1234');
  console.log('');
  console.log('   👤 Asistente:');
  console.log('      Email: lucia@surautomotora.com');
  console.log('      Password: demo1234');
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('                         DATA SUMMARY');
  console.log('════════════════════════════════════════════════════════════');
  console.log('   🚗 12 vehicles (7 available, 2 reserved, 2 sold, 1 maintenance)');
  console.log('   👥 10 clients with realistic data');
  console.log('   💰 8 sales (2 interested, 2 test drive, 2 negotiating, 2 sold)');
  console.log('   🚙 4 test drives (1 confirmed, 2 pending, 1 completed)');
  console.log('   📄 3 document templates (contract, deposit receipt, delivery)');
  console.log('   💳 5 payment methods');
  console.log('   🔔 6 notifications');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
