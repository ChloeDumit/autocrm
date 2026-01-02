import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard metrics
router.get('/metrics', authenticate, async (req: AuthRequest, res) => {
  try {
    const [
      totalVehicles,
      availableVehicles,
      scheduledTestDrives,
      closedSales,
      salesThisMonth,
      salesByStage,
    ] = await Promise.all([
      // Total vehicles
      prisma.vehicle.count(),
      
      // Available vehicles
      prisma.vehicle.count({
        where: { estado: 'DISPONIBLE' },
      }),
      
      // Scheduled test drives (upcoming)
      prisma.testDrive.count({
        where: {
          fecha: { gte: new Date() },
          estado: { in: ['PENDIENTE', 'CONFIRMADO'] },
        },
      }),
      
      // Closed sales
      prisma.sale.count({
        where: { etapa: 'VENDIDO' },
      }),
      
      // Sales this month
      prisma.sale.count({
        where: {
          etapa: 'VENDIDO',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      
      // Sales by stage
      prisma.sale.groupBy({
        by: ['etapa'],
        _count: true,
      }),
    ]);

    // Calculate revenue
    const sales = await prisma.sale.findMany({
      where: { etapa: 'VENDIDO' },
      select: { precioFinal: true, createdAt: true },
    });
    
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.precioFinal || 0), 0);
    const monthlyRevenue = sales
      .filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate.getMonth() === new Date().getMonth() &&
               saleDate.getFullYear() === new Date().getFullYear();
      })
      .reduce((sum, sale) => sum + (sale.precioFinal || 0), 0);

    res.json({
      vehicles: {
        total: totalVehicles,
        available: availableVehicles,
      },
      testDrives: {
        scheduled: scheduledTestDrives,
      },
      sales: {
        total: closedSales,
        thisMonth: salesThisMonth,
        byStage: salesByStage.map(s => ({ stage: s.etapa, count: s._count })),
        revenue: {
          total: totalRevenue,
          thisMonth: monthlyRevenue,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Error fetching dashboard metrics' });
  }
});

// Get recent activity
router.get('/activity', authenticate, async (req: AuthRequest, res) => {
  try {
    const [recentSales, recentTestDrives, recentVehicles] = await Promise.all([
      prisma.sale.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: { select: { marca: true, modelo: true } },
          client: { select: { nombre: true } },
        },
      }),
      prisma.testDrive.findMany({
        take: 5,
        orderBy: { fecha: 'desc' },
        include: {
          vehicle: { select: { marca: true, modelo: true } },
          client: { select: { nombre: true } },
        },
      }),
      prisma.vehicle.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          marca: true,
          modelo: true,
          ano: true,
          precio: true,
          estado: true,
        },
      }),
    ]);

    res.json({
      sales: recentSales,
      testDrives: recentTestDrives,
      vehicles: recentVehicles,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching activity' });
  }
});

export default router;

