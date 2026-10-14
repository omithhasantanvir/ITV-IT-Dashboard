import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { SSDStatus } from '@prisma/client';

export const getSSDs = async (req: Request, res: Response) => {
  try {
    const { status, brand, search, computerId } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status as SSDStatus;
    }
    if (brand && typeof brand === 'string') {
      where.brand = { contains: brand, mode: 'insensitive' };
    }
    if (computerId && typeof computerId === 'string') {
      where.assignedComputerId = computerId;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { ssdId: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { capacity: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { installedBy: { contains: search, mode: 'insensitive' } },
      ];
    }

    const ssds = await prisma.sSD.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedComputer: {
          select: {
            id: true,
            assetId: true,
            brand: true,
            model: true,
            computerType: true,
            location: true,
            assignedUser: {
              select: {
                name: true,
                employeeId: true,
                department: true,
              },
            },
          },
        },
      },
    });

    return res.json({ success: true, count: ssds.length, data: ssds });
  } catch (error: any) {
    console.error('getSSDs error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch SSDs.' });
  }
};

export const getSSDById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ssd = await prisma.sSD.findUnique({
      where: { id },
      include: {
        assignedComputer: {
          include: { assignedUser: true },
        },
      },
    });

    if (!ssd) {
      return res.status(404).json({ success: false, message: 'SSD not found.' });
    }

    return res.json({ success: true, data: ssd });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch SSD.' });
  }
};

export const createSSD = async (req: AuthRequest, res: Response) => {
  try {
    const {
      ssdId,
      serialNumber,
      brand,
      model,
      capacity,
      interface: ssdInterface,
      health = '100%',
      purchaseDate,
      installedDate,
      installedBy,
      warranty,
      location,
      status = SSDStatus.AVAILABLE,
      remarks,
      assignedComputerId,
    } = req.body;

    if (!ssdId || !serialNumber) {
      return res.status(400).json({ success: false, message: 'SSD ID and Serial Number are required.' });
    }

    const existing = await prisma.sSD.findFirst({
      where: {
        OR: [{ ssdId }, { serialNumber }],
      },
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'SSD with this ID or Serial Number already exists.' });
    }

    const ssd = await prisma.sSD.create({
      data: {
        ssdId,
        serialNumber,
        brand,
        model,
        capacity,
        interface: ssdInterface,
        health,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        installedDate: installedDate ? new Date(installedDate) : null,
        installedBy: installedBy && installedBy.trim() ? installedBy.trim() : null,
        warranty,
        location,
        status: assignedComputerId ? SSDStatus.INSTALLED : (status as SSDStatus),
        remarks,
        assignedComputerId: assignedComputerId || null,
      },
      include: {
        assignedComputer: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        user: req.user?.name || 'System',
        action: 'CREATE_SSD',
        module: 'COMPUTERS',
        recordId: ssd.id,
        newData: { ssdId, serialNumber, brand, capacity },
      },
    });

    return res.status(201).json({ success: true, message: 'SSD created successfully.', data: ssd });
  } catch (error: any) {
    console.error('createSSD error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create SSD.' });
  }
};

export const updateSSD = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.purchaseDate) {
      updateData.purchaseDate = new Date(updateData.purchaseDate);
    } else if (updateData.purchaseDate === '' || updateData.purchaseDate === null) {
      updateData.purchaseDate = null;
    }
    if (updateData.installedDate) {
      updateData.installedDate = new Date(updateData.installedDate);
    } else if (updateData.installedDate === '' || updateData.installedDate === null) {
      updateData.installedDate = null;
    }
    if (updateData.assignedComputerId === '') {
      updateData.assignedComputerId = null;
    }
    if (updateData.interface) {
      // mapping
      updateData.interface = updateData.interface;
    }

    // Auto-update status if assigned
    if (updateData.assignedComputerId) {
      updateData.status = SSDStatus.INSTALLED;
    }

    const updated = await prisma.sSD.update({
      where: { id },
      data: updateData,
      include: { assignedComputer: true },
    });

    await prisma.activityLog.create({
      data: {
        user: req.user?.name || 'System',
        action: 'UPDATE_SSD',
        module: 'COMPUTERS',
        recordId: id,
        newData: updateData,
      },
    });

    return res.json({ success: true, message: 'SSD updated successfully.', data: updated });
  } catch (error: any) {
    console.error('updateSSD error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update SSD.' });
  }
};

export const deleteSSD = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.sSD.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        user: req.user?.name || 'System',
        action: 'DELETE_SSD',
        module: 'COMPUTERS',
        recordId: id,
      },
    });

    return res.json({ success: true, message: 'SSD deleted successfully.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete SSD.' });
  }
};
