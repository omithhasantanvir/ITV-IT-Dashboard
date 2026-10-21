import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { fallbackActivityLogs } from '../lib/fallbackData';

export const getActivityLogs = async (req: Request, res: Response) => {
  const { module, action, limit = 50 } = req.query;
  try {
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
    let filtered = [...fallbackActivityLogs];
    if (module && typeof module === 'string') {
      filtered = filtered.filter((l) => l.module === module);
    }
    if (action && typeof action === 'string') {
      filtered = filtered.filter((l) => l.action === action);
    }
    return res.json({ success: true, count: filtered.length, data: filtered, isFallback: true });
  }
};
