import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...\n');

  // Clean the database (in dependency order)
  console.log('🧹 Cleaning database...');
  await prisma.notification.deleteMany();
  await prisma.salePaymentMethod.deleteMany();
  await prisma.saleDocument.deleteMany();
  await prisma.testDrive.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.vehicleProperty.deleteMany();
  await prisma.vehicleDocument.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.client.deleteMany();
  await prisma.vehiclePropertyField.deleteMany();
  await prisma.documentTemplate.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.appConfig.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenantRegistration.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.superAdmin.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);
  const superAdminPassword = await bcrypt.hash('superadmin123', 10);

  // ============================================
  // Create Super Admin
  // ============================================
  console.log('👑 Creating Super Admin...');
  const superAdmin = await prisma.superAdmin.create({
    data: {
      email: 'superadmin@autocrm.com',
      password: superAdminPassword,
      name: 'Super Administrator',
    },
  });

  // ============================================
  // Create Tenants
  // ============================================
  console.log('🏢 Creating Tenants...');

  // Tenant 1: Autos del Norte
  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'Autos del Norte',
      subdomain: 'autosdelnorte',
      email: 'info@autosdelnorte.com',
      phone: '+598 99 123 456',
      status: 'ACTIVE',
      plan: 'PROFESSIONAL',
      maxUsers: 10,
      maxVehicles: 200,
      approvedAt: new Date(),
    },
  });

  // Tenant 2: Montevideo Motors
  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'Montevideo Motors',
      subdomain: 'montevideomotors',
      email: 'ventas@montevideomotors.com',
      phone: '+598 98 456 789',
      status: 'ACTIVE',
      plan: 'STARTER',
      maxUsers: 5,
      maxVehicles: 100,
      approvedAt: new Date(),
    },
  });

  // Tenant 3: Premium Cars (pending)
  const tenant3 = await prisma.tenant.create({
    data: {
      name: 'Premium Cars',
      subdomain: 'premiumcars',
      email: 'contact@premiumcars.com',
      status: 'PENDING',
      plan: 'FREE',
      maxUsers: 5,
      maxVehicles: 100,
    },
  });

  // ============================================
  // Create App Configs for each tenant
  // ============================================
  console.log('⚙️  Creating App Configs...');

  await prisma.appConfig.create({
    data: {
      nombreEmpresa: 'Autos del Norte',
      colorPrimario: '#2563eb',
      colorSecundario: '#1e40af',
      tenantId: tenant1.id,
    },
  });

  await prisma.appConfig.create({
    data: {
      nombreEmpresa: 'Montevideo Motors',
      colorPrimario: '#059669',
      colorSecundario: '#047857',
      tenantId: tenant2.id,
    },
  });

  // ============================================
  // Create Users for Tenant 1 (Autos del Norte)
  // ============================================
  console.log('👤 Creating users for Autos del Norte...');

  const admin1 = await prisma.user.create({
    data: {
      email: 'admin@autosdelnorte.com',
      password: hashedPassword,
      name: 'Carlos Administrador',
      role: 'ADMIN',
      tenantId: tenant1.id,
    },
  });

  const vendedor1 = await prisma.user.create({
    data: {
      email: 'juan@autosdelnorte.com',
      password: hashedPassword,
      name: 'Juan Pérez',
      role: 'VENDEDOR',
      tenantId: tenant1.id,
    },
  });

  const vendedor2 = await prisma.user.create({
    data: {
      email: 'maria@autosdelnorte.com',
      password: hashedPassword,
      name: 'María González',
      role: 'VENDEDOR',
      tenantId: tenant1.id,
    },
  });

  const asistente1 = await prisma.user.create({
    data: {
      email: 'asistente@autosdelnorte.com',
      password: hashedPassword,
      name: 'Pedro López',
      role: 'ASISTENTE',
      tenantId: tenant1.id,
    },
  });

  // ============================================
  // Create Users for Tenant 2 (Montevideo Motors)
  // ============================================
  console.log('👤 Creating users for Montevideo Motors...');

  const admin2 = await prisma.user.create({
    data: {
      email: 'admin@montevideomotors.com',
      password: hashedPassword,
      name: 'Ana Directora',
      role: 'ADMIN',
      tenantId: tenant2.id,
    },
  });

  const vendedor3 = await prisma.user.create({
    data: {
      email: 'ventas@montevideomotors.com',
      password: hashedPassword,
      name: 'Roberto Vendedor',
      role: 'VENDEDOR',
      tenantId: tenant2.id,
    },
  });

  // ============================================
  // Create Payment Methods for each tenant
  // ============================================
  console.log('💳 Creating payment methods...');

  await prisma.paymentMethod.createMany({
    data: [
      { nombre: 'Efectivo', activo: true, tenantId: tenant1.id },
      { nombre: 'Transferencia Bancaria', activo: true, tenantId: tenant1.id },
      { nombre: 'Financiación', activo: true, tenantId: tenant1.id },
      { nombre: 'Tarjeta de Crédito', activo: true, tenantId: tenant1.id },
      { nombre: 'Cheque', activo: true, tenantId: tenant1.id },
    ],
  });

  await prisma.paymentMethod.createMany({
    data: [
      { nombre: 'Efectivo', activo: true, tenantId: tenant2.id },
      { nombre: 'Transferencia', activo: true, tenantId: tenant2.id },
      { nombre: 'Financiamiento Propio', activo: true, tenantId: tenant2.id },
    ],
  });

  // ============================================
  // Create Vehicles for Tenant 1
  // ============================================
  console.log('🚗 Creating vehicles for Autos del Norte...');

  const vehiclesT1 = await Promise.all([
    prisma.vehicle.create({
      data: {
        marca: 'Toyota',
        modelo: 'Corolla XEI',
        ano: 2023,
        precio: 32000,
        moneda: 'USD',
        kilometraje: 12000,
        estado: 'DISPONIBLE',
        descripcion: 'Sedan familiar en excelente estado. Único dueño, service oficial al día.',
        createdById: admin1.id,
        tenantId: tenant1.id,
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
        descripcion: 'Compacto muy económico. Motor 1.6 MSI.',
        createdById: vendedor1.id,
        tenantId: tenant1.id,
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
        descripcion: 'Prácticamente nuevo, modelo 2024. Garantía de fábrica vigente.',
        createdById: vendedor1.id,
        tenantId: tenant1.id,
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
        descripcion: 'Pickup doble cabina 4x4. Motor 3.2 diesel.',
        createdById: admin1.id,
        tenantId: tenant1.id,
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
        descripcion: 'SUV premium japonesa. Motor 1.5 turbo CVT.',
        createdById: vendedor2.id,
        tenantId: tenant1.id,
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
        descripcion: 'Pickup referencia del mercado. Motor 2.8 diesel.',
        createdById: vendedor1.id,
        tenantId: tenant1.id,
      },
    }),
  ]);

  // ============================================
  // Create Vehicles for Tenant 2
  // ============================================
  console.log('🚗 Creating vehicles for Montevideo Motors...');

  const vehiclesT2 = await Promise.all([
    prisma.vehicle.create({
      data: {
        marca: 'Fiat',
        modelo: 'Cronos Drive',
        ano: 2023,
        precio: 19500,
        moneda: 'USD',
        kilometraje: 18000,
        estado: 'DISPONIBLE',
        descripcion: 'Sedan compacto muy económico.',
        createdById: admin2.id,
        tenantId: tenant2.id,
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
        descripcion: 'SUV espaciosa con excelente altura del piso.',
        createdById: vendedor3.id,
        tenantId: tenant2.id,
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
        descripcion: 'Diseño moderno y deportivo. Motor 1.2 PureTech turbo.',
        createdById: vendedor3.id,
        tenantId: tenant2.id,
      },
    }),
  ]);

  // ============================================
  // Create Clients for Tenant 1
  // ============================================
  console.log('👥 Creating clients for Autos del Norte...');

  const clientsT1 = await Promise.all([
    prisma.client.create({
      data: {
        nombre: 'Martín Rodríguez',
        email: 'martin.rodriguez@gmail.com',
        telefono: '099 123 456',
        direccion: 'Av. 18 de Julio 1234, Montevideo',
        interes: 'SUV',
        notas: 'Busca vehículo familiar. Presupuesto hasta USD 35.000.',
        createdById: vendedor1.id,
        tenantId: tenant1.id,
      },
    }),
    prisma.client.create({
      data: {
        nombre: 'Laura Fernández',
        email: 'laura.fernandez@hotmail.com',
        telefono: '098 456 789',
        direccion: 'Rambla República de México 5678, Pocitos',
        interes: 'Sedan',
        notas: 'Primera compra. Busca auto económico.',
        createdById: vendedor1.id,
        tenantId: tenant1.id,
      },
    }),
    prisma.client.create({
      data: {
        nombre: 'Diego Martínez',
        email: 'diego.m@empresa.com.uy',
        telefono: '091 234 567',
        direccion: 'Calle Colonia 890, Centro',
        interes: 'Pickup',
        notas: 'Empresario, necesita pickup para trabajo.',
        createdById: vendedor2.id,
        tenantId: tenant1.id,
      },
    }),
  ]);

  // ============================================
  // Create Clients for Tenant 2
  // ============================================
  console.log('👥 Creating clients for Montevideo Motors...');

  const clientsT2 = await Promise.all([
    prisma.client.create({
      data: {
        nombre: 'Carolina Silva',
        email: 'caro.silva@gmail.com',
        telefono: '094 567 890',
        direccion: 'Av. Rivera 2345, Carrasco',
        interes: 'Hatchback',
        notas: 'Busca segundo auto para la familia.',
        createdById: vendedor3.id,
        tenantId: tenant2.id,
      },
    }),
    prisma.client.create({
      data: {
        nombre: 'Alejandro Gómez',
        email: 'agomez@yahoo.com',
        telefono: '095 678 901',
        direccion: 'Bulevar Artigas 567, Tres Cruces',
        interes: 'SUV',
        notas: 'Tiene permuta. Honda CRV 2018.',
        createdById: admin2.id,
        tenantId: tenant2.id,
      },
    }),
  ]);

  // ============================================
  // Create Sales for Tenant 1
  // ============================================
  console.log('💰 Creating sales for Autos del Norte...');

  await prisma.sale.create({
    data: {
      etapa: 'INTERESADO',
      precioFinal: vehiclesT1[2].precio,
      notas: 'Cliente consultó por WhatsApp. Agendamos visita.',
      vehicleId: vehiclesT1[2].id,
      clientId: clientsT1[1].id,
      vendedorId: vendedor1.id,
      tenantId: tenant1.id,
    },
  });

  await prisma.sale.create({
    data: {
      etapa: 'NEGOCIACION',
      precioFinal: 30000,
      notas: 'Cliente ofreció USD 30.000. Negociando precio final.',
      vehicleId: vehiclesT1[0].id,
      clientId: clientsT1[0].id,
      vendedorId: vendedor1.id,
      tenantId: tenant1.id,
    },
  });

  await prisma.sale.create({
    data: {
      etapa: 'PRUEBA',
      precioFinal: 44000,
      notas: 'Cliente realizó test drive. Muy interesado.',
      vehicleId: vehiclesT1[3].id,
      clientId: clientsT1[2].id,
      vendedorId: vendedor2.id,
      tenantId: tenant1.id,
    },
  });

  await prisma.sale.create({
    data: {
      etapa: 'VENDIDO',
      precioFinal: 40000,
      notas: 'Venta completada. Cliente muy satisfecho.',
      vehicleId: vehiclesT1[5].id,
      clientId: clientsT1[2].id,
      vendedorId: vendedor1.id,
      tenantId: tenant1.id,
    },
  });

  // ============================================
  // Create Sales for Tenant 2
  // ============================================
  console.log('💰 Creating sales for Montevideo Motors...');

  await prisma.sale.create({
    data: {
      etapa: 'INTERESADO',
      precioFinal: vehiclesT2[1].precio,
      notas: 'Cliente interesado en la Duster.',
      vehicleId: vehiclesT2[1].id,
      clientId: clientsT2[1].id,
      vendedorId: vendedor3.id,
      tenantId: tenant2.id,
    },
  });

  // ============================================
  // Create Test Drives
  // ============================================
  console.log('🚙 Creating test drives...');
  const today = new Date();

  await prisma.testDrive.create({
    data: {
      fecha: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000),
      hora: '10:00',
      estado: 'CONFIRMADO',
      notas: 'Cliente viene con su esposa.',
      vehicleId: vehiclesT1[4].id,
      clientId: clientsT1[0].id,
      vendedorId: vendedor1.id,
      tenantId: tenant1.id,
    },
  });

  await prisma.testDrive.create({
    data: {
      fecha: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      hora: '15:30',
      estado: 'PENDIENTE',
      notas: 'Primera visita del cliente.',
      vehicleId: vehiclesT2[2].id,
      clientId: clientsT2[0].id,
      vendedorId: vendedor3.id,
      tenantId: tenant2.id,
    },
  });

  // ============================================
  // Create Vehicle Property Fields for each tenant
  // ============================================
  console.log('📋 Creating vehicle property fields...');

  const propiedadesPredefinidas = [
    { nombre: 'Patente', tipo: 'TEXT', orden: 1 },
    { nombre: 'Número de Chasis', tipo: 'TEXT', orden: 2 },
    { nombre: 'Número de Motor', tipo: 'TEXT', orden: 3 },
    { nombre: 'Color', tipo: 'TEXT', orden: 4 },
    { nombre: 'Combustible', tipo: 'TEXT', orden: 5 },
    { nombre: 'Transmisión', tipo: 'TEXT', orden: 6 },
    { nombre: 'Cantidad de Puertas', tipo: 'NUMBER', orden: 7 },
    { nombre: 'Aire Acondicionado', tipo: 'BOOLEAN', orden: 8 },
  ];

  // Create for tenant 1
  for (const prop of propiedadesPredefinidas) {
    await prisma.vehiclePropertyField.create({
      data: {
        nombre: prop.nombre,
        tipo: prop.tipo,
        esPredefinida: true,
        orden: prop.orden,
        activa: true,
        tenantId: tenant1.id,
      },
    });
  }

  // Create for tenant 2
  for (const prop of propiedadesPredefinidas) {
    await prisma.vehiclePropertyField.create({
      data: {
        nombre: prop.nombre,
        tipo: prop.tipo,
        esPredefinida: true,
        orden: prop.orden,
        activa: true,
        tenantId: tenant2.id,
      },
    });
  }

  // ============================================
  // Create Notifications
  // ============================================
  console.log('🔔 Creating notifications...');

  await prisma.notification.createMany({
    data: [
      {
        titulo: 'Bienvenido a AutoCRM',
        mensaje: 'Tu cuenta de Autos del Norte está lista.',
        tipo: 'SUCCESS',
        userId: admin1.id,
        tenantId: tenant1.id,
      },
      {
        titulo: 'Nueva consulta recibida',
        mensaje: 'Martín Rodríguez consultó por el Toyota Corolla.',
        tipo: 'INFO',
        userId: vendedor1.id,
        tenantId: tenant1.id,
      },
      {
        titulo: 'Test drive confirmado',
        mensaje: 'El test drive de mañana a las 10:00 ha sido confirmado.',
        tipo: 'INFO',
        userId: vendedor1.id,
        tenantId: tenant1.id,
      },
      {
        titulo: 'Bienvenido a AutoCRM',
        mensaje: 'Tu cuenta de Montevideo Motors está lista.',
        tipo: 'SUCCESS',
        userId: admin2.id,
        tenantId: tenant2.id,
      },
    ],
  });

  // ============================================
  // Create a pending registration
  // ============================================
  console.log('📝 Creating pending registration...');

  await prisma.tenantRegistration.create({
    data: {
      companyName: 'Carros Express',
      subdomain: 'carrosexpress',
      email: 'info@carrosexpress.com',
      phone: '+598 97 111 222',
      userName: 'Fernando Rojas',
      password: hashedPassword,
      status: 'PENDING',
    },
  });

  // ============================================
  // Summary
  // ============================================
  console.log('\n✅ Seed completed successfully!\n');
  console.log('════════════════════════════════════════════════════════════');
  console.log('                        SUPER ADMIN');
  console.log('════════════════════════════════════════════════════════════');
  console.log('   Email: superadmin@autocrm.com');
  console.log('   Password: superadmin123');
  console.log('   Access: /super-admin');
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('                    TENANT 1: Autos del Norte');
  console.log('════════════════════════════════════════════════════════════');
  console.log('   Subdomain: autosdelnorte.localhost:3000');
  console.log('   Status: ACTIVE | Plan: PROFESSIONAL');
  console.log('   ');
  console.log('   👤 Admin:');
  console.log('      Email: admin@autosdelnorte.com');
  console.log('      Password: password123');
  console.log('   ');
  console.log('   👤 Vendedor:');
  console.log('      Email: juan@autosdelnorte.com');
  console.log('      Password: password123');
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('                  TENANT 2: Montevideo Motors');
  console.log('════════════════════════════════════════════════════════════');
  console.log('   Subdomain: montevideomotors.localhost:3000');
  console.log('   Status: ACTIVE | Plan: STARTER');
  console.log('   ');
  console.log('   👤 Admin:');
  console.log('      Email: admin@montevideomotors.com');
  console.log('      Password: password123');
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('                      PENDING ITEMS');
  console.log('════════════════════════════════════════════════════════════');
  console.log('   📌 1 pending tenant (Premium Cars)');
  console.log('   📌 1 pending registration (Carros Express)');
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('                      DATA SUMMARY');
  console.log('════════════════════════════════════════════════════════════');
  console.log('   Tenant 1: 6 vehicles, 3 clients, 4 sales, 1 test drive');
  console.log('   Tenant 2: 3 vehicles, 2 clients, 1 sale, 1 test drive');
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
