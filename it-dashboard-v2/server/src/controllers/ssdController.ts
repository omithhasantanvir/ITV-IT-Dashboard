import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { SSDStatus } from '@prisma/client';
import { fallbackSSDs, fallbackComputers, saveFallbackData } from '../lib/fallbackData';

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

    try {
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
    } catch (dbError: any) {
      console.warn('getSSDs prisma error, serving fallback:', dbError.message);
      let filtered = [...fallbackSSDs];

      if (status && typeof status === 'string') {
        filtered = filtered.filter((s) => s.status === status);
      }
      if (brand && typeof brand === 'string') {
        filtered = filtered.filter((s) => (s.brand || '').toLowerCase().includes(brand.toLowerCase()));
      }
      if (computerId && typeof computerId === 'string') {
        filtered = filtered.filter((s) => s.assignedComputerId === computerId);
      }
      if (search && typeof search === 'string') {
        const s = search.toLowerCase();
        filtered = filtered.filter((item) =>
          (item.ssdId || '').toLowerCase().includes(s) ||
          (item.serialNumber || '').toLowerCase().includes(s) ||
          (item.brand || '').toLowerCase().includes(s) ||
          (item.model || '').toLowerCase().includes(s) ||
          (item.capacity || '').toLowerCase().includes(s) ||
          (item.location || '').toLowerCase().includes(s) ||
          (item.installedBy || '').toLowerCase().includes(s)
        );
      }

      return res.json({ success: true, count: filtered.length, data: filtered, isFallback: true });
    }
  } catch (error: any) {
    console.error('getSSDs error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch SSDs.' });
  }
};

export const getSSDById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    try {
      const ssd = await prisma.sSD.findUnique({
        where: { id },
        include: {
          assignedComputer: {
            include: { assignedUser: true },
          },
        },
      });

      if (ssd) {
        return res.json({ success: true, data: ssd });
      }
    } catch (dbError) {
      // fallback
    }

    const fallbackItem = fallbackSSDs.find((s) => s.id === id || s.ssdId === id);
    if (!fallbackItem) {
      return res.status(404).json({ success: false, message: 'SSD not found.' });
    }

    return res.json({ success: true, data: fallbackItem, isFallback: true });
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

    const effectiveSsdId = (ssdId && ssdId.trim()) || `SSD-${Date.now().toString().slice(-6)}`;

    if (!serialNumber) {
      return res.status(400).json({ success: false, message: 'Serial Number is required.' });
    }

    try {
      const existing = await prisma.sSD.findFirst({
        where: {
          OR: [{ ssdId: effectiveSsdId }, { serialNumber }],
        },
      });

      if (existing) {
        return res.status(409).json({ success: false, message: 'SSD with this Serial Number or ID already exists.' });
      }

      const ssd = await prisma.sSD.create({
        data: {
          ssdId: effectiveSsdId,
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

      try {
        await prisma.activityLog.create({
          data: {
            user: req.user?.name || 'System',
            action: 'CREATE_SSD',
            module: 'COMPUTERS',
            recordId: ssd.id,
            newData: { ssdId, serialNumber, brand, capacity },
          },
        });
      } catch {}

      return res.status(201).json({ success: true, message: 'SSD created successfully.', data: ssd });
    } catch (dbError) {
      // In-memory fallback
      const duplicate = fallbackSSDs.find(
        (s) => s.serialNumber.toLowerCase() === serialNumber.trim().toLowerCase() || s.ssdId.toLowerCase() === effectiveSsdId.toLowerCase()
      );
      if (duplicate) {
        return res.status(409).json({ success: false, message: 'SSD with this Serial Number or ID already exists.' });
      }

      let compObj = null;
      if (assignedComputerId) {
        const c = fallbackComputers.find((pc) => pc.id === assignedComputerId || pc.assetId === assignedComputerId);
        if (c) {
          compObj = {
            id: c.id,
            assetId: c.assetId,
            brand: c.brand,
            model: c.model,
            computerType: c.computerType,
            location: c.location,
            assignedTo: c.assignedTo,
            assignedUser: c.assignedUser,
          };
        }
      }

      const newSSD: any = {
        id: `ssd-${Date.now()}`,
        ssdId: effectiveSsdId,
        serialNumber: serialNumber.trim(),
        brand: brand || 'Samsung',
        model: model || '',
        capacity: capacity || '512GB',
        interface: ssdInterface || 'M.2 NVMe PCIe 4.0',
        health: health || '100% Healthy',
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        installedDate: installedDate ? new Date(installedDate) : null,
        installedBy: installedBy || '',
        warranty: warranty || '3 Years',
        location: location || 'IT Store',
        status: assignedComputerId ? 'INSTALLED' : status,
        remarks: remarks || '',
        assignedComputerId: assignedComputerId || null,
        assignedComputer: compObj,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      fallbackSSDs.unshift(newSSD);
      saveFallbackData();

      return res.status(201).json({ success: true, message: 'SSD created successfully.', data: newSSD });
    }
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

    if (updateData.assignedComputerId) {
      updateData.status = SSDStatus.INSTALLED;
    }

    try {
      const updated = await prisma.sSD.update({
        where: { id },
        data: updateData,
        include: { assignedComputer: true },
      });

      try {
        await prisma.activityLog.create({
          data: {
            user: req.user?.name || 'System',
            action: 'UPDATE_SSD',
            module: 'COMPUTERS',
            recordId: id,
            newData: updateData,
          },
        });
      } catch {}

      return res.json({ success: true, message: 'SSD updated successfully.', data: updated });
    } catch (dbError) {
      const idx = fallbackSSDs.findIndex((s) => s.id === id || s.ssdId === id);
      if (idx !== -1) {
        let compObj = fallbackSSDs[idx].assignedComputer;
        if (updateData.assignedComputerId) {
          const c = fallbackComputers.find((pc) => pc.id === updateData.assignedComputerId || pc.assetId === updateData.assignedComputerId);
          if (c) {
            compObj = {
              id: c.id,
              assetId: c.assetId,
              brand: c.brand,
              model: c.model,
              computerType: c.computerType,
              location: c.location,
              assignedTo: c.assignedTo,
              assignedUser: c.assignedUser,
            };
          }
        } else if (updateData.assignedComputerId === null) {
          compObj = null;
        }

        fallbackSSDs[idx] = {
          ...fallbackSSDs[idx],
          ...updateData,
          assignedComputer: compObj,
          updatedAt: new Date(),
        };
        saveFallbackData();
        return res.json({ success: true, message: 'SSD updated successfully.', data: fallbackSSDs[idx] });
      }
      return res.status(404).json({ success: false, message: 'SSD not found.' });
    }
  } catch (error: any) {
    console.error('updateSSD error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update SSD.' });
  }
};

export const deleteSSD = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    let targetSSD: any = null;
    try {
      targetSSD = await prisma.sSD.findFirst({
        where: {
          OR: [{ id }, { ssdId: id }],
        },
      });
    } catch {
      targetSSD = fallbackSSDs.find((s) => s.id === id || s.ssdId === id);
    }
    if (!targetSSD) {
      targetSSD = fallbackSSDs.find((s) => s.id === id || s.ssdId === id);
    }

    if (!targetSSD) {
      return res.status(404).json({ success: false, message: 'SSD not found.' });
    }

    try {
      await prisma.sSD.delete({ where: { id: targetSSD.id } });
    } catch (dbError) {
      const idx = fallbackSSDs.findIndex((s) => s.id === targetSSD.id || s.ssdId === targetSSD.ssdId);
      if (idx !== -1) {
        fallbackSSDs.splice(idx, 1);
        saveFallbackData();
      }
    }

    // Also ensure removed from in-memory fallback list
    const idx = fallbackSSDs.findIndex((s) => s.id === targetSSD.id || s.ssdId === targetSSD.ssdId);
    if (idx !== -1) {
      fallbackSSDs.splice(idx, 1);
      saveFallbackData();
    }

    try {
      await prisma.activityLog.create({
        data: {
          user: req.user?.name || 'System',
          action: 'DELETE_SSD',
          module: 'COMPUTERS',
          recordId: targetSSD.id,
        },
      });
    } catch {}

    return res.json({ success: true, message: `SSD "${targetSSD.ssdId || targetSSD.serialNumber}" deleted successfully.` });
  } catch (error: any) {
    console.error('deleteSSD error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete SSD.' });
  }
};
