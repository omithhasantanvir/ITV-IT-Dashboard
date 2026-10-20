import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { ComputerStatus, ComputerCondition } from '@prisma/client';
import { fallbackComputers, fallbackUsers, saveFallbackData } from '../lib/fallbackData';

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
        { assignedTo: { contains: search, mode: 'insensitive' } },
        { graphicsCard: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
      ];
    }

    try {
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
    } catch (dbError: any) {
      console.warn('getComputers prisma error, serving fallback:', dbError.message);
      let filtered = [...fallbackComputers];

      if (status && typeof status === 'string') {
        filtered = filtered.filter((c) => c.status === status);
      }
      if (condition && typeof condition === 'string') {
        filtered = filtered.filter((c) => c.condition === condition);
      }
      if (type && typeof type === 'string') {
        filtered = filtered.filter((c) => (c.computerType || 'Desktop').toLowerCase() === type.toLowerCase());
      }
      if (department && typeof department === 'string') {
        filtered = filtered.filter((c) => (c.department || '').toLowerCase().includes(department.toLowerCase()));
      }
      if (search && typeof search === 'string') {
        const s = search.toLowerCase();
        filtered = filtered.filter((c) =>
          (c.assetId || '').toLowerCase().includes(s) ||
          (c.assignedTo || '').toLowerCase().includes(s) ||
          (c.brand || '').toLowerCase().includes(s) ||
          (c.model || '').toLowerCase().includes(s) ||
          (c.serialNumber || '').toLowerCase().includes(s) ||
          (c.ipAddress || '').toLowerCase().includes(s)
        );
      }
      return res.json({ success: true, count: filtered.length, data: filtered, isFallback: true });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch computers.' });
  }
};

export const getComputerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    try {
      const computer = await prisma.computer.findUnique({
        where: { id },
        include: {
          assignedUser: true,
          ssds: true,
          userSlips: true,
        },
      });

      if (computer) {
        return res.json({ success: true, data: computer });
      }
    } catch (dbError) {
      // fallback
    }

    const fallbackComp = fallbackComputers.find((c) => c.id === id || c.assetId === id);
    if (!fallbackComp) {
      return res.status(404).json({ success: false, message: 'Computer not found.' });
    }

    return res.json({ success: true, data: fallbackComp, isFallback: true });
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
      graphicsCard,
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
      pcUsage,
      internetAccess,
      remarks,
      assignedTo,
      assignedUserId,
    } = req.body;

    if (!assetId || !assetId.trim()) {
      return res.status(400).json({ success: false, message: 'Host Name is required.' });
    }

    const cleanHostName = assetId.trim();

    try {
      const existing = await prisma.computer.findFirst({
        where: {
          OR: [
            { assetId: cleanHostName },
            ...(serialNumber && serialNumber.trim() ? [{ serialNumber: serialNumber.trim() }] : []),
            ...(barcode && barcode.trim() ? [{ barcode: barcode.trim() }] : []),
          ],
        },
      });

      if (existing) {
        return res.status(409).json({ success: false, message: 'Computer with this Host Name or Serial Number already exists.' });
      }

      const computer = await prisma.computer.create({
        data: {
          assetId: cleanHostName,
          barcode: barcode && barcode.trim() ? barcode.trim() : null,
          computerType,
          brand,
          model,
          serialNumber: serialNumber && serialNumber.trim() ? serialNumber.trim() : null,
          processor,
          ram,
          storage,
          graphicsCard: graphicsCard || null,
          ssd,
          monitor,
          operatingSystem,
          macAddress,
          ipAddress,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          warranty,
          location,
          department,
          status: (assignedUserId || (assignedTo && assignedTo.trim())) ? ComputerStatus.ASSIGNED : (status as ComputerStatus),
          condition: condition as ComputerCondition,
          pcUsage: pcUsage || null,
          internetAccess: internetAccess || null,
          remarks: remarks || null,
          assignedTo: assignedTo && assignedTo.trim() ? assignedTo.trim() : null,
          assignedUserId: assignedUserId || null,
        },
        include: { assignedUser: true },
      });

      try {
        await prisma.activityLog.create({
          data: {
            user: req.user?.name || 'System',
            action: 'CREATE_COMPUTER',
            module: 'COMPUTERS',
            recordId: computer.id,
            newData: { assetId, brand, model },
          },
        });
      } catch {}

      return res.status(201).json({ success: true, message: 'Computer created successfully.', data: computer });
    } catch (dbError) {
      // In-memory fallback
      const duplicate = fallbackComputers.find(
        (c) =>
          c.assetId.toLowerCase() === cleanHostName.toLowerCase() ||
          (serialNumber && c.serialNumber && c.serialNumber.toLowerCase() === serialNumber.trim().toLowerCase())
      );
      if (duplicate) {
        return res.status(409).json({ success: false, message: 'Computer with this Host Name or Serial Number already exists.' });
      }

      let assignedUserObj = null;
      if (assignedUserId) {
        const u = fallbackUsers.find((user) => user.id === assignedUserId);
        if (u) {
          assignedUserObj = {
            id: u.id,
            name: u.name,
            employeeId: u.employeeId,
            email: u.email,
            department: u.department,
            designation: u.designation,
          };
        }
      }

      const newComputer: any = {
        id: `comp-${Date.now()}`,
        assetId: cleanHostName,
        barcode: barcode && barcode.trim() ? barcode.trim() : `BC-${cleanHostName}`,
        computerType,
        brand: brand || '',
        model: model || '',
        serialNumber: serialNumber && serialNumber.trim() ? serialNumber.trim() : `SN-${Date.now().toString().slice(-6)}`,
        processor: processor || '',
        ram: ram || '',
        storage: storage || '',
        graphicsCard: graphicsCard || '',
        ssd: ssd || '',
        monitor: monitor || '',
        operatingSystem: operatingSystem || 'Windows 11 Pro',
        macAddress: macAddress || '',
        ipAddress: ipAddress || '',
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warranty: warranty || '',
        location: location || '',
        department: department || '',
        status: (assignedUserId || (assignedTo && assignedTo.trim())) ? 'ASSIGNED' : status,
        condition: condition || 'GOOD',
        pcUsage: pcUsage || '',
        internetAccess: internetAccess || '',
        remarks: remarks || '',
        assignedTo: assignedTo && assignedTo.trim() ? assignedTo.trim() : (assignedUserObj ? assignedUserObj.name : ''),
        assignedUserId: assignedUserId || null,
        assignedUser: assignedUserObj,
        ssds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      fallbackComputers.unshift(newComputer);
      saveFallbackData();

      return res.status(201).json({ success: true, message: 'Computer created successfully.', data: newComputer });
    }
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
    } else if (updateData.purchaseDate === '' || updateData.purchaseDate === null) {
      updateData.purchaseDate = null;
    }
    if (updateData.assignedUserId === '') {
      updateData.assignedUserId = null;
    }
    if (updateData.barcode === '') {
      updateData.barcode = null;
    }
    if (updateData.serialNumber === '') {
      updateData.serialNumber = null;
    }
    if (updateData.assignedTo && updateData.assignedTo.trim()) {
      if (!updateData.status || updateData.status === 'AVAILABLE') {
        updateData.status = ComputerStatus.ASSIGNED;
      }
    }

    try {
      const updated = await prisma.computer.update({
        where: { id },
        data: updateData,
        include: { assignedUser: true },
      });

      try {
        await prisma.activityLog.create({
          data: {
            user: req.user?.name || 'System',
            action: 'UPDATE_COMPUTER',
            module: 'COMPUTERS',
            recordId: id,
            newData: updateData,
          },
        });
      } catch {}

      return res.json({ success: true, message: 'Computer updated successfully.', data: updated });
    } catch (dbError) {
      const idx = fallbackComputers.findIndex((c) => c.id === id || c.assetId === id);
      if (idx !== -1) {
        let assignedUserObj = fallbackComputers[idx].assignedUser;
        if (updateData.assignedUserId) {
          const u = fallbackUsers.find((user) => user.id === updateData.assignedUserId);
          if (u) {
            assignedUserObj = {
              id: u.id,
              name: u.name,
              employeeId: u.employeeId,
              email: u.email,
              department: u.department,
              designation: u.designation,
            };
          }
        } else if (updateData.assignedUserId === null) {
          assignedUserObj = null;
        }

        fallbackComputers[idx] = {
          ...fallbackComputers[idx],
          ...updateData,
          assignedUser: assignedUserObj,
          updatedAt: new Date(),
        };
        saveFallbackData();
        return res.json({ success: true, message: 'Computer updated successfully.', data: fallbackComputers[idx] });
      }
      return res.status(404).json({ success: false, message: 'Computer not found.' });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update computer.' });
  }
};

export const deleteComputer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Find target computer first
    let targetComp: any = null;
    try {
      targetComp = await prisma.computer.findFirst({
        where: {
          OR: [{ id }, { assetId: id }],
        },
      });
    } catch {
      targetComp = fallbackComputers.find((c) => c.id === id || c.assetId === id);
    }
    if (!targetComp) {
      targetComp = fallbackComputers.find((c) => c.id === id || c.assetId === id);
    }

    if (!targetComp) {
      return res.status(404).json({ success: false, message: 'Computer not found.' });
    }

    try {
      await prisma.computer.delete({ where: { id: targetComp.id } });
    } catch (dbError) {
      // In-memory fallback deletion
      const idx = fallbackComputers.findIndex((c) => c.id === targetComp.id || c.assetId === targetComp.assetId);
      if (idx !== -1) {
        fallbackComputers.splice(idx, 1);
        saveFallbackData();
      }
    }

    // Also ensure removed from fallback list if it was mirrored there
    const idx = fallbackComputers.findIndex((c) => c.id === targetComp.id || c.assetId === targetComp.assetId);
    if (idx !== -1) {
      fallbackComputers.splice(idx, 1);
      saveFallbackData();
    }

    try {
      await prisma.activityLog.create({
        data: {
          user: req.user?.name || 'System',
          action: 'DELETE_COMPUTER',
          module: 'COMPUTERS',
          recordId: targetComp.id,
          oldData: { assetId: targetComp.assetId, brand: targetComp.brand, model: targetComp.model },
        },
      });
    } catch {}

    return res.json({ success: true, message: `Computer "${targetComp.assetId}" deleted successfully.` });
  } catch (error: any) {
    console.error('deleteComputer error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete computer.' });
  }
};

export const assignComputer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    try {
      const computer = await prisma.computer.update({
        where: { id },
        data: {
          assignedUserId: userId || null,
          status: userId ? ComputerStatus.ASSIGNED : ComputerStatus.AVAILABLE,
        },
        include: { assignedUser: true },
      });

      return res.json({ success: true, message: 'Computer assignment updated.', data: computer });
    } catch (dbError) {
      const idx = fallbackComputers.findIndex((c) => c.id === id || c.assetId === id);
      if (idx !== -1) {
        let assignedUserObj = null;
        let assignedName = null;
        if (userId) {
          const u = fallbackUsers.find((user) => user.id === userId);
          if (u) {
            assignedUserObj = {
              id: u.id,
              name: u.name,
              employeeId: u.employeeId,
              email: u.email,
              department: u.department,
              designation: u.designation,
            };
            assignedName = u.name;
          }
        }

        fallbackComputers[idx] = {
          ...fallbackComputers[idx],
          assignedUserId: userId || null,
          assignedUser: assignedUserObj,
          assignedTo: assignedName,
          status: userId ? 'ASSIGNED' : 'AVAILABLE',
          updatedAt: new Date(),
        };
        saveFallbackData();
        return res.json({ success: true, message: 'Computer assignment updated.', data: fallbackComputers[idx] });
      }
      return res.status(404).json({ success: false, message: 'Computer not found.' });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to assign computer.' });
  }
};
