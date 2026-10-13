import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const ticketSchema = z.object({
  subject: z.string().trim().min(3).max(150),
  description: z.string().trim().min(10).max(5000),
}).strict();

export class SupportController {
  public static async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const tickets = await prisma.supportTicket.findMany({
        where: { customerId: req.user!.id },
        select: {
          id: true, ticketNumber: true, subject: true, description: true,
          status: true, createdAt: true, updatedAt: true,
          messages: {
            select: { id: true, message: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: tickets });
    } catch (error) { next(error); }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = ticketSchema.parse(req.body);
      const ticket = await prisma.supportTicket.create({ data: {
        ticketNumber: `P2B-SUP-${randomUUID().slice(0, 8).toUpperCase()}`,
        customerId: req.user!.id,
        subject: data.subject,
        description: data.description,
        category: 'OTHER',
      } });
      res.status(201).json({ success: true, data: {
        id: ticket.id, ticketNumber: ticket.ticketNumber, subject: ticket.subject,
        description: ticket.description, status: ticket.status, createdAt: ticket.createdAt,
        messages: [],
      } });
    } catch (error) { next(error); }
  }
}
