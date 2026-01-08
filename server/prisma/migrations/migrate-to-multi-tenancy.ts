/**
 * Migration script for converting existing single-tenant data to multi-tenancy.
 *
 * This script:
 * 1. Creates a default tenant for all existing data
 * 2. Creates a super admin account
 * 3. Updates all existing records with the default tenant ID
 *
 * Run with: npx ts-node prisma/migrations/migrate-to-multi-tenancy.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_TENANT_SUBDOMAIN = 'main';
const DEFAULT_TENANT_NAME = 'Default Company';

const SUPER_ADMIN_EMAIL = 'superadmin@autocrm.com';
const SUPER_ADMIN_PASSWORD = 'changeme123'; // CHANGE THIS!
const SUPER_ADMIN_NAME = 'Super Admin';

async function main() {
  console.log('Starting multi-tenancy migration...\n');

  // Check if migration has already been run
  const existingTenant = await prisma.tenant.findFirst();
  if (existingTenant) {
    console.log('Migration already completed. Tenants exist in the database.');
    console.log(`Found tenant: ${existingTenant.name} (${existingTenant.subdomain})`);
    return;
  }

  // Step 1: Create default tenant
  console.log('Step 1: Creating default tenant...');
  const defaultTenant = await prisma.tenant.create({
    data: {
      name: DEFAULT_TENANT_NAME,
      subdomain: DEFAULT_TENANT_SUBDOMAIN,
      email: 'admin@autocrm.com',
      status: 'ACTIVE',
      plan: 'ENTERPRISE',
      maxUsers: 100,
      maxVehicles: 10000,
      approvedAt: new Date(),
    },
  });
  console.log(`  Created tenant: ${defaultTenant.name} (${defaultTenant.subdomain})`);
  console.log(`  Tenant ID: ${defaultTenant.id}\n`);

  // Step 2: Create super admin
  console.log('Step 2: Creating super admin account...');
  const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
  const superAdmin = await prisma.superAdmin.create({
    data: {
      email: SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      name: SUPER_ADMIN_NAME,
    },
  });
  console.log(`  Created super admin: ${superAdmin.email}`);
  console.log(`  ⚠️  IMPORTANT: Change the default password!\n`);

  // Step 3: Update all existing records with tenant ID
  console.log('Step 3: Migrating existing data to default tenant...');

  // Update Users
  const usersUpdated = await prisma.user.updateMany({
    where: { tenantId: null },
    data: { tenantId: defaultTenant.id },
  });
  console.log(`  Updated ${usersUpdated.count} users`);

  // Update Vehicles
  const vehiclesUpdated = await prisma.vehicle.updateMany({
    where: { tenantId: null },
    data: { tenantId: defaultTenant.id },
  });
  console.log(`  Updated ${vehiclesUpdated.count} vehicles`);

  // Update Clients
  const clientsUpdated = await prisma.client.updateMany({
    where: { tenantId: null },
    data: { tenantId: defaultTenant.id },
  });
  console.log(`  Updated ${clientsUpdated.count} clients`);

  // Update Sales
  const salesUpdated = await prisma.sale.updateMany({
    where: { tenantId: null },
    data: { tenantId: defaultTenant.id },
  });
  console.log(`  Updated ${salesUpdated.count} sales`);

  // Update TestDrives
  const testDrivesUpdated = await prisma.testDrive.updateMany({
    where: { tenantId: null },
    data: { tenantId: defaultTenant.id },
  });
  console.log(`  Updated ${testDrivesUpdated.count} test drives`);

  // Update Notifications
  const notificationsUpdated = await prisma.notification.updateMany({
    where: { tenantId: null },
    data: { tenantId: defaultTenant.id },
  });
  console.log(`  Updated ${notificationsUpdated.count} notifications`);

  // Update DocumentTemplates
  const templatesUpdated = await prisma.documentTemplate.updateMany({
    where: { tenantId: null },
    data: { tenantId: defaultTenant.id },
  });
  console.log(`  Updated ${templatesUpdated.count} document templates`);

  // Update PaymentMethods
  const paymentMethodsUpdated = await prisma.paymentMethod.updateMany({
    where: { tenantId: null },
    data: { tenantId: defaultTenant.id },
  });
  console.log(`  Updated ${paymentMethodsUpdated.count} payment methods`);

  // Update VehiclePropertyFields
  const propertyFieldsUpdated = await prisma.vehiclePropertyField.updateMany({
    where: { tenantId: null },
    data: { tenantId: defaultTenant.id },
  });
  console.log(`  Updated ${propertyFieldsUpdated.count} vehicle property fields`);

  // Update AppConfig
  const appConfigUpdated = await prisma.appConfig.updateMany({
    where: { tenantId: null },
    data: { tenantId: defaultTenant.id },
  });
  console.log(`  Updated ${appConfigUpdated.count} app configs`);

  console.log('\n✅ Migration completed successfully!\n');
  console.log('Summary:');
  console.log(`  Default Tenant: ${defaultTenant.name}`);
  console.log(`  Subdomain: ${defaultTenant.subdomain}.autocrm.com`);
  console.log(`  Super Admin: ${superAdmin.email}`);
  console.log('\nNext steps:');
  console.log('  1. Change the super admin password');
  console.log('  2. Update environment variables for subdomain routing');
  console.log('  3. Test the multi-tenancy setup');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
