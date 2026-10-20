import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { ExtensionStatus } from '@prisma/client';
import { fallbackExtensions, fallbackUsers, saveFallbackData } from '../lib/fallbackData';

export const getExtensions = async (req: Request, res: Response) => {
  try {
    const { status, department, search } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status as ExtensionStatus;
    }
    if (department && typeof department === 'string') {
      where.department = { contains: department, mode: 'insensitive' };
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { extensionNumber: { contains: search, mode: 'insensitive' } },
        { holderName: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
        { customEmployeeId: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { deskRoom: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
      ];
    }

    try {
      const extensions = await prisma.extension.findMany({
        where,
        orderBy: { extensionNumber: 'asc' },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              employeeId: true,
              email: true,
              department: true,
              designation: true,
            },
          },
        },
      });

      return res.json({ success: true, count: extensions.length, data: extensions });
    } catch (dbError: any) {
      console.warn('getExtensions prisma error, serving fallback:', dbError.message);
      let filtered = [...fallbackExtensions];

      if (status && typeof status === 'string') {
        filtered = filtered.filter((e) => e.status === status);
      }
      if (department && typeof department === 'string') {
        filtered = filtered.filter((e) => (e.department || '').toLowerCase().includes(department.toLowerCase()));
      }
      if (search && typeof search === 'string') {
        const s = search.toLowerCase();
        filtered = filtered.filter((e) =>
          (e.extensionNumber || '').toLowerCase().includes(s) ||
          (e.holderName || '').toLowerCase().includes(s) ||
          (e.designation || '').toLowerCase().includes(s) ||
          (e.customEmployeeId || '').toLowerCase().includes(s) ||
          (e.mobile || '').toLowerCase().includes(s) ||
          (e.deskRoom || '').toLowerCase().includes(s) ||
          (e.department || '').toLowerCase().includes(s) ||
          (e.employee?.name || '').toLowerCase().includes(s) ||
          (e.employee?.employeeId || '').toLowerCase().includes(s)
        );
      }
      return res.json({ success: true, count: filtered.length, data: filtered, isFallback: true });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch extensions.' });
  }
};

export const createExtension = async (req: AuthRequest, res: Response) => {
  try {
    const {
      extensionNumber,
      holderName,
      designation,
      customEmployeeId,
      mobile,
      department,
      location,
      deskRoom,
      status = ExtensionStatus.AVAILABLE,
      remarks,
      employeeId,
    } = req.body;

    if (!extensionNumber) {
      return res.status(400).json({ success: false, message: 'Extension number is required.' });
    }

    const cleanExtNumber = String(extensionNumber).trim();
    let finalHolderName = holderName;
    let finalDesignation = designation;
    let finalDepartment = department;
    let finalMobile = mobile;
    let finalEmployeeId: string | null = null;
    let finalCustomEmpId: string | null = customEmployeeId ? String(customEmployeeId).trim() : null;

    try {
      const existing = await prisma.extension.findUnique({
        where: { extensionNumber: cleanExtNumber },
      });

      if (existing) {
        return res.status(409).json({ success: false, message: 'Extension number already exists.' });
      }

      const empIdentifier = finalCustomEmpId || (employeeId ? String(employeeId).trim() : null);
      if (empIdentifier) {
        const emp = await prisma.user.findFirst({
          where: {
            OR: [
              { employeeId: empIdentifier },
              { id: empIdentifier },
            ],
          },
        });
        if (emp) {
          finalEmployeeId = emp.id;
          finalCustomEmpId = emp.employeeId;
          if (!finalHolderName) finalHolderName = emp.name;
          if (!finalDesignation) finalDesignation = emp.designation || undefined;
          if (!finalDepartment) finalDepartment = emp.department || undefined;
          if (!finalMobile) finalMobile = emp.phone || undefined;
          await prisma.user.update({
            where: { id: emp.id },
            data: { extensionNumber: cleanExtNumber },
          }).catch(() => {});
        } else {
          finalCustomEmpId = empIdentifier;
        }
      }

      const extension = await prisma.extension.create({
        data: {
          extensionNumber: cleanExtNumber,
          holderName: finalHolderName,
          designation: finalDesignation,
          customEmployeeId: finalCustomEmpId,
          mobile: finalMobile,
          department: finalDepartment,
          location,
          deskRoom,
          status: finalEmployeeId || finalHolderName || finalCustomEmpId ? ExtensionStatus.ASSIGNED : (status as ExtensionStatus),
          remarks,
          employeeId: finalEmployeeId,
        },
        include: { employee: true },
      });

      // Mirror to fallback
      fallbackExtensions.unshift(extension);
      saveFallbackData();

      return res.status(201).json({ success: true, message: 'Extension created successfully.', data: extension });
    } catch (dbError) {
      // In-memory fallback creation
      const existing = fallbackExtensions.find((e) => String(e.extensionNumber).trim() === cleanExtNumber);
      if (existing) {
        return res.status(409).json({ success: false, message: 'Extension number already exists.' });
      }

      let empObj = null;
      const empIdentifier = finalCustomEmpId || (employeeId ? String(employeeId).trim() : null);
      if (empIdentifier) {
        const emp = fallbackUsers.find((u) => u.employeeId === empIdentifier || u.id === empIdentifier);
        if (emp) {
          finalEmployeeId = emp.id;
          finalCustomEmpId = emp.employeeId;
          if (!finalHolderName) finalHolderName = emp.name;
          if (!finalDesignation) finalDesignation = emp.designation;
          if (!finalDepartment) finalDepartment = emp.department;
          if (!finalMobile) finalMobile = emp.phone;
          empObj = {
            id: emp.id,
            name: emp.name,
            employeeId: emp.employeeId,
            email: emp.email,
            department: emp.department,
            designation: emp.designation,
          };
          emp.extensionNumber = cleanExtNumber;
        }
      }

      const newExt: any = {
        id: `ext-${Date.now()}`,
        extensionNumber: cleanExtNumber,
        holderName: finalHolderName || '',
        designation: finalDesignation || '',
        customEmployeeId: finalCustomEmpId || null,
        mobile: finalMobile || '',
        department: finalDepartment || '',
        location: location || '',
        deskRoom: deskRoom || '',
        status: finalEmployeeId || finalHolderName || finalCustomEmpId ? 'ASSIGNED' : status,
        remarks: remarks || '',
        employeeId: finalEmployeeId,
        employee: empObj,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      fallbackExtensions.unshift(newExt);
      saveFallbackData();

      return res.status(201).json({ success: true, message: 'Extension created successfully.', data: newExt });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to create extension.' });
  }
};

export const updateExtension = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const empIdentifier = updateData.customEmployeeId !== undefined
      ? (updateData.customEmployeeId ? String(updateData.customEmployeeId).trim() : null)
      : (updateData.employeeId ? String(updateData.employeeId).trim() : null);

    try {
      if (empIdentifier) {
        const emp = await prisma.user.findFirst({
          where: {
            OR: [
              { employeeId: empIdentifier },
              { id: empIdentifier },
            ],
          },
        });
        if (emp) {
          updateData.employeeId = emp.id;
          updateData.customEmployeeId = emp.employeeId;
        } else {
          updateData.employeeId = null;
          updateData.customEmployeeId = empIdentifier;
        }
      } else if (updateData.customEmployeeId === '' || updateData.employeeId === '') {
        updateData.employeeId = null;
        updateData.customEmployeeId = null;
      }

      const prev = await prisma.extension.findUnique({ where: { id } });

      const updated = await prisma.extension.update({
        where: { id },
        data: updateData,
        include: { employee: true },
      });

      if (updateData.employeeId && updateData.employeeId !== prev?.employeeId) {
        if (prev?.employeeId) {
          await prisma.user.update({
            where: { id: prev.employeeId },
            data: { extensionNumber: null },
          }).catch(() => {});
        }
        await prisma.user.update({
          where: { id: updateData.employeeId },
          data: { extensionNumber: updated.extensionNumber },
        }).catch(() => {});
      } else if (updateData.employeeId === null && prev?.employeeId) {
        await prisma.user.update({
          where: { id: prev.employeeId },
          data: { extensionNumber: null },
        }).catch(() => {});
      }

      // Sync to fallback
      const idx = fallbackExtensions.findIndex((e) => e.id === id || e.extensionNumber === updated.extensionNumber);
      if (idx !== -1) {
        fallbackExtensions[idx] = { ...fallbackExtensions[idx], ...updated };
        saveFallbackData();
      }

      return res.json({ success: true, message: 'Extension updated successfully.', data: updated });
    } catch (dbError) {
      // In-memory fallback update
      const idx = fallbackExtensions.findIndex((e) => e.id === id || e.extensionNumber === id);
      if (idx !== -1) {
        let empObj = fallbackExtensions[idx].employee || null;
        if (empIdentifier) {
          const emp = fallbackUsers.find((u) => u.employeeId === empIdentifier || u.id === empIdentifier);
          if (emp) {
            updateData.employeeId = emp.id;
            updateData.customEmployeeId = emp.employeeId;
            empObj = {
              id: emp.id,
              name: emp.name,
              employeeId: emp.employeeId,
              email: emp.email,
              department: emp.department,
              designation: emp.designation,
            };
            emp.extensionNumber = updateData.extensionNumber || fallbackExtensions[idx].extensionNumber;
          }
        } else if (updateData.customEmployeeId === '' || updateData.employeeId === '') {
          updateData.employeeId = null;
          updateData.customEmployeeId = null;
          empObj = null;
        }

        fallbackExtensions[idx] = {
          ...fallbackExtensions[idx],
          ...updateData,
          employee: empObj,
          updatedAt: new Date(),
        };
        saveFallbackData();
        return res.json({ success: true, message: 'Extension updated successfully.', data: fallbackExtensions[idx] });
      }
      return res.status(404).json({ success: false, message: 'Extension not found.' });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update extension.' });
  }
};

export const deleteExtension = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    let targetExt: any = null;
    try {
      targetExt = await prisma.extension.findFirst({
        where: {
          OR: [{ id }, { extensionNumber: id }],
        },
      });
    } catch {
      targetExt = fallbackExtensions.find((e) => e.id === id || e.extensionNumber === id);
    }
    if (!targetExt) {
      targetExt = fallbackExtensions.find((e) => e.id === id || e.extensionNumber === id);
    }

    if (!targetExt) {
      return res.status(404).json({ success: false, message: 'Extension not found.' });
    }

    try {
      if (targetExt.employeeId) {
        await prisma.user.update({
          where: { id: targetExt.employeeId },
          data: { extensionNumber: null },
        }).catch(() => {});
      }
      await prisma.extension.delete({ where: { id: targetExt.id } });
    } catch (dbError) {
      const idx = fallbackExtensions.findIndex((e) => e.id === targetExt.id || e.extensionNumber === targetExt.extensionNumber);
      if (idx !== -1) {
        fallbackExtensions.splice(idx, 1);
        saveFallbackData();
      }
    }

    // Always ensure removed from in-memory fallback list
    const idx = fallbackExtensions.findIndex((e) => e.id === targetExt.id || e.extensionNumber === targetExt.extensionNumber);
    if (idx !== -1) {
      fallbackExtensions.splice(idx, 1);
      saveFallbackData();
    }

    // If attached to a fallback user, clear extensionNumber on that user
    if (targetExt.employeeId || targetExt.customEmployeeId) {
      const u = fallbackUsers.find((user) => user.id === targetExt.employeeId || user.employeeId === targetExt.customEmployeeId);
      if (u) {
        u.extensionNumber = null as any;
        saveFallbackData();
      }
    }

    try {
      await prisma.activityLog.create({
        data: {
          user: req.user?.name || 'System',
          action: 'DELETE_EXTENSION',
          module: 'EXTENSIONS',
          recordId: targetExt.id,
          oldData: { extensionNumber: targetExt.extensionNumber, holderName: targetExt.holderName },
        },
      }).catch(() => {});
    } catch {}

    return res.json({ success: true, message: `Extension "${targetExt.extensionNumber}" deleted successfully.` });
  } catch (error: any) {
    console.error('deleteExtension error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete extension.' });
  }
};
