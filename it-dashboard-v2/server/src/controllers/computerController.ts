import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { ComputerStatus, ComputerCondition } from '@prisma/client';

export const getComputers = async (req: Request, res: Response) => {
  try {
    const { status, type, department, search, condition } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status as ComputerStatus;
    }
    if (condition && typeof condition === 'string') {
      where.condition = condition as ComputerCondition;
    }
    if (type && typeof type === 'string') {
      where.computerType = type;
    }
    if (department && typeof department === 'string') {
      where.department = { contains: department, mode: 'insensitive' };
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { assetId: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
      ];
    }

    const computers = await prisma.computer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            email: true,
            department: true,
            designation: true,
          },
        },
        ssds: true,
      },
    });

    return res.json({ success: true, count: computers.length, data: computers });
  } catch (error: any) {
    console.error('getComputers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch computers.' });
  }
};

export const getComputerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const computer = await prisma.computer.findUnique({
      where: { id },
      include: {
        assignedUser: true,
        ssds: true,
        userSlips: true,
      },
    });

    if (!computer) {
      return res.status(404).json({ success: false, message: 'Computer not found.' });
    }

    return res.json({ success: true, data: computer });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch computer.' });
  }
};

export const createComputer = async (req: AuthRequest, res: Response) => {
  try {
    const {
      assetId,
      barcode,
      computerType = 'Desktop',
      brand,
      model,
      serialNumber,
      processor,
      ram,
      storage,
      ssd,
      monitor,
      operatingSystem,
      macAddress,
      ipAddress,
      purchaseDate,
      warranty,
      location,
      department,
      status = ComputerStatus.AVAILABLE,
      condition = ComputerCondition.GOOD,
      remarks,
      assignedUserId,
    } = req.body;

    if (!assetId) {
      return res.status(400).json({ success: false, message: 'Asset ID is required.' });
    }

    const existing = await prisma.computer.findFirst({
      where: {
        OR: [
          { assetId },
          ...(serialNumber ? [{ serialNumber }] : []),
          ...(barcode ? [{ barcode }] : []),
        ],
      },
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Computer with this Asset ID, Barcode, or Serial Number already exists.' });
    }

    const computer = await prisma.computer.create({
      data: {
        assetId,
        barcode,
        computerType,
        brand,
        model,
        serialNumber,
        processor,
        ram,
        storage,
        ssd,
        monitor,
        operatingSystem,
        macAddress,
        ipAddress,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warranty,
        location,
        department,
        status: assignedUserId ? ComputerStatus.ASSIGNED : (status as ComputerStatus),
        condition: condition as ComputerCondition,
        remarks,
        assignedUserId: assignedUserId || null,
      },
      include: { assignedUser: true },
    });

    await prisma.activityLog.create({
      data: {
        user: req.user?.name || 'System',
        action: 'CREATE_COMPUTER',
        module: 'COMPUTERS',
        recordId: computer.id,
        newData: { assetId, brand, model },
      },
    });

    return res.status(201).json({ success: true, message: 'Computer created successfully.', data: computer });
  } catch (error: any) {
    console.error('createComputer error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create computer.' });
  }
};

export const updateComputer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.purchaseDate) {
      updateData.purchaseDate = new Date(updateData.purchaseDate);
    }
    if (updateData.assignedUserId === '') {
      updateData.assignedUserId = null;
    }

    const updated = await prisma.computer.update({
      where: { id },
      data: updateData,
      include: { assignedUser: true },
    });

    await prisma.activityLog.create({
      data: {
        user: req.user?.name || 'System',
        action: 'UPDATE_COMPUTER',
        module: 'COMPUTERS',
        recordId: id,
        newData: updateData,
      },
    });

    return res.json({ success: true, message: 'Computer updated successfully.', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update computer.' });
  }
};

export const deleteComputer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.computer.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        user: req.user?.name || 'System',
        action: 'DELETE_COMPUTER',
        module: 'COMPUTERS',
        recordId: id,
      },
    });

    return res.json({ success: true, message: 'Computer deleted successfully.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete computer.' });
  }
};

export const assignComputer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const computer = await prisma.computer.update({
      where: { id },
      data: {
        assignedUserId: userId || null,
        status: userId ? ComputerStatus.ASSIGNED : ComputerStatus.AVAILABLE,
      },
      include: { assignedUser: true },
    });

    return res.json({ success: true, message: 'Computer assignment updated.', data: computer });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to assign computer.' });
  }
};
