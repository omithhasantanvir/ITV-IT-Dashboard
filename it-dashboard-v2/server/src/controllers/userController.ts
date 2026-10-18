import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { ITStatus, Role } from '@prisma/client';
import { fallbackUsers } from '../lib/fallbackData';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { department, role, search, status, itTeam } = req.query;

    const where: any = {};

    if (department && typeof department === 'string') {
      where.department = { contains: department, mode: 'insensitive' };
    }
    if (status && typeof status === 'string') {
      if (status === 'Active') {
        where.employmentStatus = 'Active';
      } else if (status === 'Former' || status === 'EX') {
        where.employmentStatus = { not: 'Active' };
      } else {
        where.employmentStatus = status;
      }
    }
    if (role && typeof role === 'string') {
      where.role = role as Role;
    }
    if (itTeam === 'true') {
      where.isITTeam = true;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
        { extensionNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    try {
      const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          employeeId: true,
          name: true,
          username: true,
          email: true,
          department: true,
          designation: true,
          extensionNumber: true,
          phone: true,
          profilePhoto: true,
          joiningDate: true,
          leavingDate: true,
          employmentStatus: true,
          role: true,
          isITTeam: true,
          itStatus: true,
          officeLocation: true,
          remarks: true,
          customPermissions: true,
          computers: {
            select: {
              id: true,
              assetId: true,
              model: true,
              brand: true,
              status: true,
            },
          },
          extensions: {
            select: {
              id: true,
              extensionNumber: true,
              status: true,
            },
          },
          createdAt: true,
        },
      });

      return res.json({ success: true, count: users.length, data: users });
    } catch (dbError) {
      // In-memory fallback if database server is offline
      console.warn('Prisma query failed, serving from fallback store:', (dbError as any).message);
      let filtered = [...fallbackUsers];

      if (itTeam === 'true') {
        filtered = filtered.filter((u) => u.isITTeam === true);
      }
      if (status && typeof status === 'string') {
        if (status === 'Active') {
          filtered = filtered.filter((u) => u.employmentStatus === 'Active');
        } else if (status === 'Former' || status === 'EX') {
          filtered = filtered.filter((u) => u.employmentStatus !== 'Active');
        } else {
          filtered = filtered.filter((u) => u.employmentStatus === status);
        }
      }
      if (department && typeof department === 'string') {
        filtered = filtered.filter((u) => u.department?.toLowerCase().includes(department.toLowerCase()));
      }
      if (role && typeof role === 'string') {
        filtered = filtered.filter((u) => u.role === role);
      }
      if (search && typeof search === 'string') {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.name?.toLowerCase().includes(s) ||
            u.employeeId?.toLowerCase().includes(s) ||
            u.email?.toLowerCase().includes(s) ||
            u.designation?.toLowerCase().includes(s) ||
            u.extensionNumber?.toLowerCase().includes(s)
        );
      }

      return res.json({ success: true, count: filtered.length, data: filtered });
    }
  } catch (error: any) {
    console.error('getUsers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          computers: true,
          extensions: true,
          userSlips: true,
        },
      });

      if (user) {
        const { password: _, ...userSafe } = user;
        return res.json({ success: true, data: userSafe });
      }
    } catch (dbErr) {
      // Fallback
      const fbUser = fallbackUsers.find((u) => u.id === id || u.employeeId === id);
      if (fbUser) {
        return res.json({ success: true, data: fbUser });
      }
    }

    const fallbackMatch = fallbackUsers.find((u) => u.id === id || u.employeeId === id);
    if (fallbackMatch) {
      return res.json({ success: true, data: fallbackMatch });
    }

    return res.status(404).json({ success: false, message: 'User not found.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user details.' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    let {
      employeeId,
      name,
      username,
      password,
      email,
      department = 'Information Technology',
      designation,
      extensionNumber,
      phone,
      profilePhoto = '',
      role = Role.VIEWER,
      isITTeam = true,
      itStatus = ITStatus.AVAILABLE,
      officeLocation,
      employmentStatus = 'Active',
      joiningDate,
      leavingDate,
      remarks,
    } = req.body;

    const isEx = employmentStatus && employmentStatus !== 'Active';

    if (!name || !name.trim()) {
      if (isEx) {
        name = 'Former IT Member';
      } else {
        return res.status(400).json({ success: false, message: 'Employee ID and Name are required.' });
      }
    }

    if (!employeeId || !employeeId.trim()) {
      if (isEx) {
        employeeId = `EX-${Math.floor(10000 + Math.random() * 90000)}`;
      } else {
        return res.status(400).json({ success: false, message: 'Employee ID and Name are required.' });
      }
    }

    if (!username) {
      username = (name.toLowerCase().replace(/[^a-z0-9]/g, '.') || 'ex.user') + Math.floor(100 + Math.random() * 900);
    }
    if (!email) {
      email = `${username}@${isEx ? 'ex.independent24.tv' : 'company.local'}`;
    }
    if (!password) {
      password = 'Welcome@123';
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const safeUserData = {
      id: `usr-${Date.now()}`,
      employeeId,
      name,
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      department: department || 'Information Technology',
      designation: designation || (isEx ? 'Former IT Staff' : (isITTeam ? 'IT Support Engineer' : 'Staff')),
      extensionNumber: isEx ? null : (extensionNumber || null),
      phone: phone || null,
      profilePhoto: profilePhoto || '',
      role: (isEx ? Role.VIEWER : (role as Role)),
      isITTeam: Boolean(isITTeam),
      itStatus: isEx ? ITStatus.OFFLINE : ((itStatus as ITStatus) || ITStatus.AVAILABLE),
      officeLocation: isEx ? null : (officeLocation || null),
      employmentStatus: employmentStatus || 'Active',
      joiningDate: joiningDate ? new Date(joiningDate) : (isEx ? null : new Date()),
      leavingDate: (isEx && leavingDate) ? new Date(leavingDate) : null,
      remarks: remarks || (isEx ? 'Former IT Employee' : null),
      computers: [],
      extensions: extensionNumber ? [{ id: `ext-${Date.now()}`, extensionNumber, status: 'ASSIGNED' }] : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ employeeId }, { username }, { email }],
        },
      });

      if (existing) {
        return res.status(409).json({ success: false, message: 'User with same employeeId, username, or email already exists.' });
      }

      const newUser = await prisma.user.create({
        data: {
          employeeId,
          name,
          username: username.toLowerCase().trim(),
          password: hashedPassword,
          email: email.toLowerCase().trim(),
          department: safeUserData.department,
          designation: safeUserData.designation,
          extensionNumber: safeUserData.extensionNumber,
          phone: safeUserData.phone,
          profilePhoto: safeUserData.profilePhoto,
          role: role as Role,
          isITTeam: Boolean(isITTeam),
          itStatus: safeUserData.itStatus,
          officeLocation: safeUserData.officeLocation,
          employmentStatus: safeUserData.employmentStatus,
          joiningDate: safeUserData.joiningDate,
          leavingDate: safeUserData.leavingDate,
          remarks: safeUserData.remarks,
        },
      });

      try {
        await prisma.activityLog.create({
          data: {
            user: req.user?.name || 'System',
            action: 'CREATE_USER',
            module: 'USERS',
            recordId: newUser.id,
            newData: { employeeId, name, email, department },
          },
        });
      } catch (actErr) {
        // ignore activity log write error
      }

      // Keep in-memory cache in sync
      fallbackUsers.unshift(safeUserData);

      const { password: _, ...userSafe } = newUser;
      return res.status(201).json({ success: true, message: 'User created successfully.', data: userSafe });
    } catch (dbError) {
      // Offline DB fallback
      console.warn('Database error during createUser, persisting to fallback store:', (dbError as any).message);

      const duplicate = fallbackUsers.find(
        (u) => u.employeeId === employeeId || u.username === username || u.email === email
      );
      if (duplicate) {
        return res.status(409).json({ success: false, message: 'User with same employeeId, username, or email already exists.' });
      }

      fallbackUsers.unshift(safeUserData);
      return res.status(201).json({
        success: true,
        message: 'Employee created successfully.',
        data: safeUserData,
      });
    }
  } catch (error: any) {
    console.error('createUser error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create user.' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { password, ...updateData } = req.body;

    // Find target user first
    let targetUser: any = null;
    try {
      targetUser = await prisma.user.findFirst({
        where: {
          OR: [{ id }, { employeeId: id }, { username: id }],
        },
      });
    } catch {
      targetUser = fallbackUsers.find((u) => u.id === id || u.employeeId === id || u.username === id);
    }
    if (!targetUser) {
      targetUser = fallbackUsers.find((u) => u.id === id || u.employeeId === id || u.username === id);
    }

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isTargetSuperAdmin =
      targetUser.role === Role.SUPER_ADMIN ||
      targetUser.role === 'SUPER_ADMIN' ||
      targetUser.username === 'omith.hasan';

    // Only a Super Admin can edit another Super Admin account
    if (isTargetSuperAdmin && req.user?.role !== Role.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. Only Super Admin can edit Super Admin accounts.',
      });
    }

    // Protect Super Admin role from being demoted
    if (isTargetSuperAdmin && updateData.role && updateData.role !== Role.SUPER_ADMIN && updateData.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Security Alert: Super Admin role cannot be demoted.',
      });
    }

    const dataToUpdate: any = { ...updateData };
    if (password && password.trim().length >= 6) {
      if (req.user?.role !== Role.SUPER_ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Security Alert: Only Super Admin has permission to modify user passwords.',
        });
      }
      dataToUpdate.password = await bcrypt.hash(password.trim(), 10);
    }
    if (dataToUpdate.joiningDate) {
      dataToUpdate.joiningDate = new Date(dataToUpdate.joiningDate);
    } else if (dataToUpdate.joiningDate === '' || dataToUpdate.joiningDate === null) {
      dataToUpdate.joiningDate = null;
    }
    if (dataToUpdate.leavingDate) {
      dataToUpdate.leavingDate = new Date(dataToUpdate.leavingDate);
    } else if (dataToUpdate.leavingDate === '' || dataToUpdate.leavingDate === null) {
      dataToUpdate.leavingDate = null;
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: targetUser.id },
        data: dataToUpdate,
      });

      try {
        await prisma.activityLog.create({
          data: {
            user: req.user?.name || 'System',
            action: 'UPDATE_USER',
            module: 'USERS',
            recordId: targetUser.id,
            newData: { name: updatedUser.name, role: updatedUser.role, department: updatedUser.department },
          },
        });
      } catch (actErr) {
        // ignore log error
      }

      const { password: _, ...userSafe } = updatedUser;
      return res.json({ success: true, message: 'User updated successfully.', data: userSafe });
    } catch (dbError) {
      const idx = fallbackUsers.findIndex((u) => u.id === targetUser.id || u.employeeId === targetUser.id);
      if (idx !== -1) {
        fallbackUsers[idx] = { ...fallbackUsers[idx], ...dataToUpdate, updatedAt: new Date() };
        return res.json({ success: true, message: 'User updated successfully.', data: fallbackUsers[idx] });
      }
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
  } catch (error: any) {
    console.error('updateUser error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Find target user first
    let targetUser: any = null;
    try {
      targetUser = await prisma.user.findFirst({
        where: {
          OR: [{ id }, { employeeId: id }, { username: id }],
        },
      });
    } catch {
      targetUser = fallbackUsers.find((u) => u.id === id || u.employeeId === id || u.username === id);
    }
    if (!targetUser) {
      targetUser = fallbackUsers.find((u) => u.id === id || u.employeeId === id || u.username === id);
    }

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Protection rule 1: Super Admin accounts can NEVER be deleted by anyone!
    if (
      targetUser.role === Role.SUPER_ADMIN ||
      targetUser.role === 'SUPER_ADMIN' ||
      targetUser.username === 'omith.hasan'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Security Alert: Super Admin accounts are protected by system policy and cannot be deleted.',
      });
    }

    // Protection rule 2: Users cannot delete their own account
    if (req.user?.id === targetUser.id || req.user?.username === targetUser.username) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.',
      });
    }

    // Protection rule 3: Only Super Admin can delete other users
    if (req.user?.role !== Role.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied. Only Super Admin has authorization to delete users.',
      });
    }

    try {
      await prisma.user.delete({ where: { id: targetUser.id } });
    } catch (dbError) {
      const idx = fallbackUsers.findIndex((u) => u.id === targetUser.id || u.employeeId === targetUser.id);
      if (idx !== -1) {
        fallbackUsers.splice(idx, 1);
      }
    }

    try {
      await prisma.activityLog.create({
        data: {
          user: req.user?.name || 'System',
          action: 'DELETE_USER',
          module: 'USERS',
          recordId: targetUser.id,
          oldData: { employeeId: targetUser.employeeId, name: targetUser.name, role: targetUser.role },
        },
      });
    } catch (actErr) {
      // ignore log error
    }

    return res.json({ success: true, message: `User "${targetUser.name}" deleted successfully.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete user.' });
  }
};

export const updateITStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { itStatus } = req.body;

    if (!itStatus || !Object.values(ITStatus).includes(itStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid IT status value.' });
    }

    try {
      const updated = await prisma.user.update({
        where: { id },
        data: { itStatus },
        select: { id: true, name: true, itStatus: true },
      });
      return res.json({ success: true, message: 'IT status updated.', data: updated });
    } catch (dbError) {
      const u = fallbackUsers.find((x) => x.id === id || x.employeeId === id);
      if (u) {
        u.itStatus = itStatus;
        return res.json({ success: true, message: 'IT status updated.', data: { id: u.id, name: u.name, itStatus } });
      }
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update IT status.' });
  }
};

export const resetUserPassword = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== Role.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Security Alert: Only Super Admin can reset user passwords.',
      });
    }

    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    let targetUser: any = null;
    try {
      targetUser = await prisma.user.findFirst({
        where: { OR: [{ id }, { employeeId: id }, { username: id }] },
      });
    } catch {
      targetUser = fallbackUsers.find((u) => u.id === id || u.employeeId === id || u.username === id);
    }
    if (!targetUser) {
      targetUser = fallbackUsers.find((u) => u.id === id || u.employeeId === id || u.username === id);
    }

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target employee not found.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    try {
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { password: hashedPassword },
      });
    } catch {
      const idx = fallbackUsers.findIndex((u) => u.id === targetUser.id || u.employeeId === targetUser.id);
      if (idx !== -1) {
        fallbackUsers[idx].password = hashedPassword;
      }
    }

    try {
      await prisma.activityLog.create({
        data: {
          user: req.user?.name || 'Super Admin',
          action: 'ADMIN_RESET_PASSWORD',
          module: 'USERS',
          recordId: targetUser.id,
          newData: { targetUser: targetUser.name, employeeId: targetUser.employeeId },
        },
      });
    } catch { }

    return res.json({
      success: true,
      message: `Password successfully reset for ${targetUser.name} (${targetUser.username}).`,
    });
  } catch (error: any) {
    console.error('resetUserPassword error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to reset password.' });
  }
};
