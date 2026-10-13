import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getInventoryReport = async (_req: Request, res: Response) => {
  try {
    const [computersByStatus, computersByType, computersByDept] = await Promise.all([
      prisma.computer.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.computer.groupBy({
        by: ['computerType'],
        _count: { computerType: true },
      }),
      prisma.computer.groupBy({
        by: ['department'],
        _count: { department: true },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        byStatus: computersByStatus,
        byType: computersByType,
        byDepartment: computersByDept,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to generate inventory report.' });
  }
};

export const getEmployeesReport = async (_req: Request, res: Response) => {
  try {
    const [byDept, byStatus, byRole] = await Promise.all([
      prisma.user.groupBy({
        by: ['department'],
        _count: { department: true },
      }),
      prisma.user.groupBy({
        by: ['employmentStatus'],
        _count: { employmentStatus: true },
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        byDepartment: byDept,
        byStatus,
        byRole,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to generate employees report.' });
  }
};
