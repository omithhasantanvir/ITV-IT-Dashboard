import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    const { module, action, limit = 50 } = req.query;

    const where: any = {};
    if (module && typeof module === 'string') {
      where.module = module;
    }
    if (action && typeof action === 'string') {
      where.action = action;
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: Math.min(Number(limit) || 50, 100),
    });

    return res.json({ success: true, count: logs.length, data: logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve activity logs.' });
  }
};
