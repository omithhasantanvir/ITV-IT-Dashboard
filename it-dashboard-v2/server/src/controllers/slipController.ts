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
        { name: { contains: search, mode: 'insensitive' } },
        { pin: { contains: search, mode: 'insensitive' } },
        { emailId: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
        { issuedBy: { contains: search, mode: 'insensitive' } },
        { createdBy: { contains: search, mode: 'insensitive' } },
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
    const {
      date,
      employeeType = 'Permanent',
      pin,
      name,
      designation,
      department,
      emailId,
      emailPassword = 'Itv4312',
      domainId,
      domainPassword = 'Itv4312',
      hrmsUsername,
      hrmsPassword,
      foodUsername,
      foodPassword = '123456',
      createdBy,
      creatorDesignation,
      employeeId,
      computerId,
      accessories = [],
      extensionNumber,
      joiningDate,
    } = req.body;

    const slipCount = await prisma.userSlip.count();
    const slipNumber = `ITV-SLIP-${String(slipCount + 1).padStart(5, '0')}`;

    const parsedDate = date ? new Date(date) : new Date();

    const slip = await prisma.userSlip.create({
      data: {
        slipNumber,
        employeeType: employeeType || 'Permanent',
        pin: pin ? String(pin).trim() : null,
        name: name ? String(name).trim() : null,
        designation: designation ? String(designation).trim() : null,
        department: department ? String(department).trim() : null,
        emailId: emailId ? String(emailId).trim() : null,
        emailPassword: emailPassword || 'Itv4312',
        domainId: domainId ? String(domainId).trim() : null,
        domainPassword: domainPassword || 'Itv4312',
        hrmsUsername: hrmsUsername || pin || null,
        hrmsPassword: hrmsPassword || pin || null,
        foodUsername: foodUsername || emailId || null,
        foodPassword: foodPassword || '123456',
        createdBy: createdBy || req.user?.name || 'IT Engineer',
        creatorDesignation: creatorDesignation || 'IT Support Engineer',
        issuedBy: createdBy || req.user?.name || 'IT Admin',
        employeeId: employeeId || null,
        computerId: computerId || null,
        accessories: Array.isArray(accessories) ? accessories : [],
        extensionNumber: extensionNumber || null,
        joiningDate: joiningDate ? new Date(joiningDate) : null,
        issueDate: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
        status: SlipStatus.ISSUED,
      },
      include: {
        employee: true,
        computer: true,
      },
    });

    return res.status(201).json({ success: true, message: 'Employee registration slip generated.', data: slip });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to create slip.' });
  }
};

export const deleteSlip = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.userSlip.delete({ where: { id } });
    return res.json({ success: true, message: 'Slip deleted successfully.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete slip.' });
  }
};

