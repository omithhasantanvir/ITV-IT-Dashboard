import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { SlipStatus } from '@prisma/client';

export const getSlips = async (req: Request, res: Response) => {
  try {
    const { employeeId, search } = req.query;

    const where: any = {};
    if (employeeId && typeof employeeId === 'string') {
      where.employeeId = employeeId;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { slipNumber: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { issuedBy: { contains: search, mode: 'insensitive' } },
      ];
    }

    const slips = await prisma.userSlip.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: { id: true, name: true, employeeId: true, department: true },
        },
        computer: {
          select: { id: true, assetId: true, brand: true, model: true },
        },
      },
    });

    return res.json({ success: true, count: slips.length, data: slips });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve slips.' });
  }
};

export const createSlip = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, computerId, accessories = [], department, designation, extensionNumber, joiningDate } = req.body;

    const slipCount = await prisma.userSlip.count();
    const slipNumber = `SLIP-${String(slipCount + 1).padStart(5, '0')}`;

    const slip = await prisma.userSlip.create({
      data: {
        slipNumber,
        employeeId: employeeId || null,
        computerId: computerId || null,
        accessories: Array.isArray(accessories) ? accessories : [],
        department,
        designation,
        extensionNumber,
        joiningDate: joiningDate ? new Date(joiningDate) : null,
        issuedBy: req.user?.name || 'IT Admin',
        status: SlipStatus.ISSUED,
      },
      include: {
        employee: true,
        computer: true,
      },
    });

    return res.status(201).json({ success: true, message: 'Requisition slip generated.', data: slip });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to create slip.' });
  }
};
