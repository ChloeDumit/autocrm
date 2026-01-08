import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

const router = express.Router();
const prisma = new PrismaClient();

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// Get all notifications for current user
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const { leida } = req.query;

    const where: any = {
      userId: req.userId,
      tenantId: req.tenantId,
    };
    if (leida !== undefined) {
      where.leida = leida === 'true';
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Error fetching notifications' });
  }
});

// Get unread count
router.get('/unread-count', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const count = await prisma.notification.count({
      where: {
        userId: req.userId,
        tenantId: req.tenantId,
        leida: false,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Error fetching unread count' });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify notification belongs to tenant and user
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
        tenantId: req.tenantId,
      },
    });

    if (!existingNotification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { leida: true },
    });

    res.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: 'Error updating notification' });
  }
});

// Mark all as read
router.put('/read-all', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    await prisma.notification.updateMany({
      where: {
        userId: req.userId,
        tenantId: req.tenantId,
        leida: false,
      },
      data: { leida: true },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ error: 'Error updating notifications' });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    // Verify notification belongs to tenant and user
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
        tenantId: req.tenantId,
      },
    });

    if (!existingNotification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Error deleting notification' });
  }
});

export default router;
