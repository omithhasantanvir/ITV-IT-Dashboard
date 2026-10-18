import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { ExtensionStatus } from '@prisma/client';
import { fallbackExtensions } from '../lib/fallbackData';

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
  } catch (error: any) {
    console.warn('getExtensions prisma error, serving fallback:', error.message);
    return res.json({ success: true, count: fallbackExtensions.length, data: fallbackExtensions, isFallback: true });
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

    const existing = await prisma.extension.findUnique({
      where: { extensionNumber },
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Extension number already exists.' });
    }

    let finalHolderName = holderName;
    let finalDesignation = designation;
    let finalDepartment = department;
    let finalMobile = mobile;
    let finalEmployeeId: string | null = null;
    let finalCustomEmpId: string | null = customEmployeeId ? String(customEmployeeId).trim() : null;

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
          data: { extensionNumber },
        }).catch(() => {});
      } else {
        finalCustomEmpId = empIdentifier;
      }
    }

    const extension = await prisma.extension.create({
      data: {
        extensionNumber,
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

    return res.status(201).json({ success: true, message: 'Extension created successfully.', data: extension });
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

    return res.json({ success: true, message: 'Extension updated successfully.', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update extension.' });
  }
};

export const deleteExtension = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ext = await prisma.extension.findUnique({ where: { id } });
    if (ext?.employeeId) {
      await prisma.user.update({
        where: { id: ext.employeeId },
        data: { extensionNumber: null },
      }).catch(() => {});
    }
    await prisma.extension.delete({ where: { id } });
    return res.json({ success: true, message: 'Extension deleted successfully.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete extension.' });
  }
};
