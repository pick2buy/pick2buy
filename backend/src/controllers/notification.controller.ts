import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export class NotificationController {
  public static async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
      res.json({ success: true, data: notifications });
    } catch (error) { next(error); }
  }

  public static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { notificationId } = req.params;
      await prisma.notification.updateMany({
        where: { id: notificationId, userId: req.user!.id },
        data: { isRead: true },
      });
      res.json({ success: true });
    } catch (error) { next(error); }
  }

  public static async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user!.id, isRead: false },
        data: { isRead: true },
      });
      res.json({ success: true });
    } catch (error) { next(error); }
  }
}
