import { PrismaClient, Prisma } from '@prisma/client';

// Global prisma instance
const globalPrisma = new PrismaClient();

/**
 * Models that require tenant scoping
 */
const TENANT_SCOPED_MODELS = [
  'user',
  'vehicle',
  'client',
  'sale',
  'testDrive',
  'notification',
  'documentTemplate',
  'paymentMethod',
  'vehiclePropertyField',
  'appConfig',
] as const;

type TenantScopedModel = typeof TENANT_SCOPED_MODELS[number];

/**
 * Creates a tenant-scoped Prisma client that automatically filters queries by tenantId
 * This ensures that all database operations are isolated to the current tenant
 */
export function createTenantPrismaClient(tenantId: string) {
  return globalPrisma.$extends({
    name: 'tenantScope',
    query: {
      // User
      user: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findUnique({ args, query }) {
          // For findUnique, we need to verify the result belongs to the tenant
          const result = await query(args);
          if (result && (result as any).tenantId !== tenantId) {
            return null;
          }
          return result;
        },
        async create({ args, query }) {
          args.data = { ...args.data, tenantId };
          return query(args);
        },
        async update({ args, query }) {
          // Verify the record belongs to the tenant before updating
          const existing = await globalPrisma.user.findUnique({
            where: args.where,
            select: { tenantId: true },
          });
          if (!existing || existing.tenantId !== tenantId) {
            throw new Error('Record not found or access denied');
          }
          return query(args);
        },
        async delete({ args, query }) {
          const existing = await globalPrisma.user.findUnique({
            where: args.where,
            select: { tenantId: true },
          });
          if (!existing || existing.tenantId !== tenantId) {
            throw new Error('Record not found or access denied');
          }
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
      },
      // Vehicle
      vehicle: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findUnique({ args, query }) {
          const result = await query(args);
          if (result && (result as any).tenantId !== tenantId) {
            return null;
          }
          return result;
        },
        async create({ args, query }) {
          args.data = { ...args.data, tenantId };
          return query(args);
        },
        async update({ args, query }) {
          const existing = await globalPrisma.vehicle.findUnique({
            where: args.where,
            select: { tenantId: true },
          });
          if (!existing || existing.tenantId !== tenantId) {
            throw new Error('Record not found or access denied');
          }
          return query(args);
        },
        async delete({ args, query }) {
          const existing = await globalPrisma.vehicle.findUnique({
            where: args.where,
            select: { tenantId: true },
          });
          if (!existing || existing.tenantId !== tenantId) {
            throw new Error('Record not found or access denied');
          }
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
      },
      // Client
      client: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findUnique({ args, query }) {
          const result = await query(args);
          if (result && (result as any).tenantId !== tenantId) {
            return null;
          }
          return result;
        },
        async create({ args, query }) {
          args.data = { ...args.data, tenantId };
          return query(args);
        },
        async update({ args, query }) {
          const existing = await globalPrisma.client.findUnique({
            where: args.where,
            select: { tenantId: true },
          });
          if (!existing || existing.tenantId !== tenantId) {
            throw new Error('Record not found or access denied');
          }
          return query(args);
        },
        async delete({ args, query }) {
          const existing = await globalPrisma.client.findUnique({
            where: args.where,
            select: { tenantId: true },
          });
          if (!existing || existing.tenantId !== tenantId) {
            throw new Error('Record not found or access denied');
          }
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
      },
      // Sale
      sale: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findUnique({ args, query }) {
          const result = await query(args);
          if (result && (result as any).tenantId !== tenantId) {
            return null;
          }
          return result;
        },
        async create({ args, query }) {
          args.data = { ...args.data, tenantId };
          return query(args);
        },
        async update({ args, query }) {
          const existing = await globalPrisma.sale.findUnique({
            where: args.where,
            select: { tenantId: true },
          });
          if (!existing || existing.tenantId !== tenantId) {
            throw new Error('Record not found or access denied');
          }
          return query(args);
        },
        async delete({ args, query }) {
          const existing = await globalPrisma.sale.findUnique({
            where: args.where,
            select: { tenantId: true },
          });
          if (!existing || existing.tenantId !== tenantId) {
            throw new Error('Record not found or access denied');
          }
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
      },
      // TestDrive
      testDrive: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findUnique({ args, query }) {
          const result = await query(args);
          if (result && (result as any).tenantId !== tenantId) {
            return null;
          }
          return result;
        },
        async create({ args, query }) {
          args.data = { ...args.data, tenantId };
          return query(args);
        },
        async update({ args, query }) {
          const existing = await globalPrisma.testDrive.findUnique({
            where: args.where,
            select: { tenantId: true },
          });
          if (!existing || existing.tenantId !== tenantId) {
            throw new Error('Record not found or access denied');
          }
          return query(args);
        },
        async delete({ args, query }) {
          const existing = await globalPrisma.testDrive.findUnique({
            where: args.where,
            select: { tenantId: true },
          });
          if (!existing || existing.tenantId !== tenantId) {
            throw new Error('Record not found or access denied');
          }
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
      },
      // Notification
      notification: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findUnique({ args, query }) {
          const result = await query(args);
          if (result && (result as any).tenantId !== tenantId) {
            return null;
          }
          return result;
        },
        async create({ args, query }) {
          args.data = { ...args.data, tenantId };
          return query(args);
        },
        async update({ args, query }) {
          const existing = await globalPrisma.notification.findUnique({
            where: args.where,
            select: { tenantId: true },
          });
          if (!existing || existing.tenantId !== tenantId) {
            throw new Error('Record not found or access denied');
          }
          return query(args);
        },
        async delete({ args, query }) {
          const existing = await globalPrisma.notification.findUnique({
            where: args.where,
            select: { tenantId: true },
          });
          if (!existing || existing.tenantId !== tenantId) {
            throw new Error('Record not found or access denied');
          }
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
      },
      // DocumentTemplate
      documentTemplate: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findUnique({ args, query }) {
          const result = await query(args);
          if (result && (result as any).tenantId !== tenantId) {
            return null;
          }
          return result;
        },
        async create({ args, query }) {
          args.data = { ...args.data, tenantId };
          return query(args);
        },
        async update({ args, query }) {
          const existing = await globalPrisma.documentTemplate.findUnique({
            where: args.where,
            select: { tenantId: true },
          });
          if (!existing || existing.tenantId !== tenantId) {
            throw new Error('Record not found or access denied');
          }
          return query(args);
        },
        async delete({ args, query }) {
          const existing = await globalPrisma.documentTemplate.findUnique({
            where: args.where,
            select: { tenantId: true },
          });
          if (!existing || existing.tenantId !== tenantId) {
            throw new Error('Record not found or access denied');
          }
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
      },
      // PaymentMethod
      paymentMethod: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findUnique({ args, query }) {
          const result = await query(args);
          if (result && (result as any).tenantId !== tenantId) {
            return null;
          }
          return result;
        },
        async create({ args, query }) {
          args.data = { ...args.data, tenantId };
          return query(args);
        },
        async update({ args, query }) {
          const existing = await globalPrisma.paymentMethod.findUnique({
            where: args.where,
            select: { tenantId: true },
          });
          if (!existing || existing.tenantId !== tenantId) {
            throw new Error('Record not found or access denied');
          }
          return query(args);
        },
        async delete({ args, query }) {
          const existing = await globalPrisma.paymentMethod.findUnique({
            where: args.where,
            select: { tenantId: true },
          });
          if (!existing || existing.tenantId !== tenantId) {
            throw new Error('Record not found or access denied');
          }
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
      },
      // VehiclePropertyField
      vehiclePropertyField: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findUnique({ args, query }) {
          const result = await query(args);
          if (result && (result as any).tenantId !== tenantId) {
            return null;
          }
          return result;
        },
        async create({ args, query }) {
          args.data = { ...args.data, tenantId };
          return query(args);
        },
        async update({ args, query }) {
          const existing = await globalPrisma.vehiclePropertyField.findUnique({
            where: args.where,
            select: { tenantId: true },
          });
          if (!existing || existing.tenantId !== tenantId) {
            throw new Error('Record not found or access denied');
          }
          return query(args);
        },
        async delete({ args, query }) {
          const existing = await globalPrisma.vehiclePropertyField.findUnique({
            where: args.where,
            select: { tenantId: true },
          });
          if (!existing || existing.tenantId !== tenantId) {
            throw new Error('Record not found or access denied');
          }
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
      },
      // AppConfig - special case: one per tenant
      appConfig: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findUnique({ args, query }) {
          const result = await query(args);
          if (result && (result as any).tenantId !== tenantId) {
            return null;
          }
          return result;
        },
        async create({ args, query }) {
          args.data = { ...args.data, tenantId };
          return query(args);
        },
        async upsert({ args, query }) {
          args.where = { ...args.where, tenantId };
          args.create = { ...args.create, tenantId };
          return query(args);
        },
        async update({ args, query }) {
          const existing = await globalPrisma.appConfig.findUnique({
            where: args.where,
            select: { tenantId: true },
          });
          if (!existing || existing.tenantId !== tenantId) {
            throw new Error('Record not found or access denied');
          }
          return query(args);
        },
        async delete({ args, query }) {
          const existing = await globalPrisma.appConfig.findUnique({
            where: args.where,
            select: { tenantId: true },
          });
          if (!existing || existing.tenantId !== tenantId) {
            throw new Error('Record not found or access denied');
          }
          return query(args);
        },
      },
    },
  });
}

// Export the global prisma for non-tenant-scoped operations (e.g., super admin)
export { globalPrisma };

// Type for the tenant-scoped prisma client
export type TenantPrismaClient = ReturnType<typeof createTenantPrismaClient>;
