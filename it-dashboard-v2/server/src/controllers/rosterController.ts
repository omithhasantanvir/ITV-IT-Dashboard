import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { ShiftType, RosterStatus } from '@prisma/client';
import {
  sendRosterNotificationEmail,
  sendDutySwapNotificationEmail,
} from '../services/mailService';

export const getRosters = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, shift, employeeId, status, date } = req.query;

    const where: any = {};

    if (employeeId && typeof employeeId === 'string') {
      where.employeeId = employeeId;
    }

    if (shift && typeof shift === 'string' && Object.values(ShiftType).includes(shift as ShiftType)) {
      where.shift = shift as ShiftType;
    }

    if (status && typeof status === 'string' && Object.values(RosterStatus).includes(status as RosterStatus)) {
      where.status = status as RosterStatus;
    }

    if (date && typeof date === 'string') {
      const d = new Date(date);
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));
      where.date = { gte: startOfDay, lte: endOfDay };
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate && typeof startDate === 'string') {
        where.date.gte = new Date(new Date(startDate).setHours(0, 0, 0, 0));
      }
      if (endDate && typeof endDate === 'string') {
        where.date.lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      }
    }

    const rosters = await prisma.dutyRoster.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            username: true,
            email: true,
            designation: true,
            phone: true,
            extensionNumber: true,
            profilePhoto: true,
            role: true,
            itStatus: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'desc' }],
    });

    // Compute metrics
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const todayRosters = rosters.filter((r) => {
      const rd = new Date(r.date);
      return rd >= todayStart && rd <= todayEnd;
    });

    const shiftCounts = {
      MORNING: rosters.filter((r) => r.shift === 'MORNING').length,
      EVENING: rosters.filter((r) => r.shift === 'EVENING').length,
      NIGHT: rosters.filter((r) => r.shift === 'NIGHT').length,
      GENERAL: rosters.filter((r) => r.shift === 'GENERAL').length,
      ON_CALL: rosters.filter((r) => r.shift === 'ON_CALL').length,
      WEEKEND_DUTY: rosters.filter((r) => r.shift === 'WEEKEND_DUTY').length,
    };

    return res.json({
      success: true,
      data: rosters,
      metrics: {
        total: rosters.length,
        todayCount: todayRosters.length,
        onDutyToday: todayRosters.filter((r) => r.status === 'ON_DUTY' || r.status === 'SCHEDULED').length,
        completedToday: todayRosters.filter((r) => r.status === 'COMPLETED').length,
        emergencyCount: rosters.filter((r) => r.isEmergency).length,
        shiftCounts,
      },
    });
  } catch (error: any) {
    console.warn('getRosters query failed, returning fallback empty state:', error.message);
    return res.json({
      success: true,
      data: [],
      isFallback: true,
      metrics: {
        total: 0,
        todayCount: 0,
        onDutyToday: 0,
        completedToday: 0,
        emergencyCount: 0,
        shiftCounts: {
          MORNING: 0,
          EVENING: 0,
          NIGHT: 0,
          GENERAL: 0,
          ON_CALL: 0,
          WEEKEND_DUTY: 0,
        },
      },
    });
  }
};

export const getRosterById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roster = await prisma.dutyRoster.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            email: true,
            designation: true,
            phone: true,
            extensionNumber: true,
            profilePhoto: true,
            role: true,
          },
        },
      },
    });

    if (!roster) {
      return res.status(404).json({ success: false, message: 'Duty roster entry not found.' });
    }

    return res.json({ success: true, data: roster });
  } catch (error: any) {
    console.error('getRosterById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve roster entry.' });
  }
};

export const createRoster = async (req: AuthRequest, res: Response) => {
  try {
    const {
      employeeId,
      date,
      shift = 'GENERAL',
      startTime,
      endTime,
      location = 'HQ Floor 4 / Server Room',
      tasks,
      status = 'SCHEDULED',
      isEmergency = false,
      notes,
    } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required.' });
    }

    let defaultStartTime = startTime;
    let defaultEndTime = endTime;

    if (!defaultStartTime || !defaultEndTime) {
      switch (shift) {
        case 'MORNING':
          defaultStartTime = defaultStartTime || '08:00 AM';
          defaultEndTime = defaultEndTime || '04:00 PM';
          break;
        case 'EVENING':
          defaultStartTime = defaultStartTime || '02:00 PM';
          defaultEndTime = defaultEndTime || '10:00 PM';
          break;
        case 'NIGHT':
          defaultStartTime = defaultStartTime || '10:00 PM';
          defaultEndTime = defaultEndTime || '06:00 AM';
          break;
        case 'ON_CALL':
          defaultStartTime = defaultStartTime || '08:00 AM';
          defaultEndTime = defaultEndTime || '08:00 AM (+1)';
          break;
        case 'WEEKEND_DUTY':
          defaultStartTime = defaultStartTime || '10:00 AM';
          defaultEndTime = defaultEndTime || '06:00 PM';
          break;
        default:
          defaultStartTime = defaultStartTime || '09:00 AM';
          defaultEndTime = defaultEndTime || '06:00 PM';
      }
    }

    const newRoster = await prisma.dutyRoster.create({
      data: {
        date: new Date(date),
        shift: shift as ShiftType,
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        location,
        tasks,
        status: status as RosterStatus,
        isEmergency: Boolean(isEmergency),
        notes,
        employeeId: employeeId || null,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            designation: true,
            profilePhoto: true,
          },
        },
      },
    });

    try {
      await prisma.activityLog.create({
        data: {
          user: req.user?.name || 'System',
          action: 'CREATE_ROSTER',
          module: 'ROSTER',
          recordId: newRoster.id,
          newData: {
            employee: newRoster.employee?.name || 'Unassigned',
            date: newRoster.date,
            shift: newRoster.shift,
          },
        },
      });
    } catch {}

    return res.status(201).json({
      success: true,
      message: 'Duty roster entry created successfully.',
      data: newRoster,
    });
  } catch (error: any) {
    console.error('createRoster error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create roster entry.' });
  }
};

export const updateRoster = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      employeeId,
      date,
      shift,
      startTime,
      endTime,
      location,
      tasks,
      status,
      isEmergency,
      notes,
    } = req.body;

    const dataToUpdate: any = {};
    if (employeeId !== undefined) dataToUpdate.employeeId = employeeId || null;
    if (date) dataToUpdate.date = new Date(date);
    if (shift) dataToUpdate.shift = shift as ShiftType;
    if (startTime !== undefined) dataToUpdate.startTime = startTime;
    if (endTime !== undefined) dataToUpdate.endTime = endTime;
    if (location !== undefined) dataToUpdate.location = location;
    if (tasks !== undefined) dataToUpdate.tasks = tasks;
    if (status) dataToUpdate.status = status as RosterStatus;
    if (isEmergency !== undefined) dataToUpdate.isEmergency = Boolean(isEmergency);
    if (notes !== undefined) dataToUpdate.notes = notes;

    const updated = await prisma.dutyRoster.update({
      where: { id },
      data: dataToUpdate,
      include: {
        employee: {
          select: {
            id: true,
            employeeId: true,
            name: true,
            designation: true,
            profilePhoto: true,
          },
        },
      },
    });

    try {
      await prisma.activityLog.create({
        data: {
          user: req.user?.name || 'System',
          action: 'UPDATE_ROSTER',
          module: 'ROSTER',
          recordId: updated.id,
          newData: {
            employee: updated.employee?.name || 'Unassigned',
            shift: updated.shift,
            status: updated.status,
          },
        },
      });
    } catch {}

    return res.json({
      success: true,
      message: 'Duty roster updated successfully.',
      data: updated,
    });
  } catch (error: any) {
    console.error('updateRoster error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update roster entry.' });
  }
};

export const updateRosterStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !Object.values(RosterStatus).includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid roster status.' });
    }

    const updated = await prisma.dutyRoster.update({
      where: { id },
      data: { status },
      include: {
        employee: {
          select: { id: true, name: true, employeeId: true },
        },
      },
    });

    return res.json({
      success: true,
      message: `Status updated to ${status}.`,
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update roster status.' });
  }
};

export const deleteRoster = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.dutyRoster.delete({ where: { id } });

    try {
      await prisma.activityLog.create({
        data: {
          user: req.user?.name || 'System',
          action: 'DELETE_ROSTER',
          module: 'ROSTER',
          recordId: id,
        },
      });
    } catch {}

    return res.json({ success: true, message: 'Duty roster entry deleted successfully.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete roster entry.' });
  }
};

// Auto-generate weekly roster from active IT members
export const generateWeeklyRoster = async (req: AuthRequest, res: Response) => {
  try {
    const { weekStartDate } = req.body;
    if (!weekStartDate) {
      return res.status(400).json({ success: false, message: 'weekStartDate is required.' });
    }

    // Get active IT employees
    const itStaff = await prisma.user.findMany({
      where: {
        isITTeam: true,
        employmentStatus: 'Active',
      },
      select: { id: true, name: true, designation: true },
    });

    if (itStaff.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active IT employees found to assign rosters.',
      });
    }

    const start = new Date(weekStartDate);
    start.setHours(0, 0, 0, 0);

    const shiftTemplates: { shift: ShiftType; startTime: string; endTime: string; tasks: string }[] = [
      { shift: ShiftType.MORNING, startTime: '08:00 AM', endTime: '04:00 PM', tasks: 'Morning Floor Support & Network Check' },
      { shift: ShiftType.GENERAL, startTime: '09:00 AM', endTime: '06:00 PM', tasks: 'General IT Operations & User Requests' },
      { shift: ShiftType.EVENING, startTime: '02:00 PM', endTime: '10:00 PM', tasks: 'Evening Incident Monitoring & Server Backup' },
      { shift: ShiftType.NIGHT, startTime: '10:00 PM', endTime: '06:00 AM', tasks: 'Night Server Maintenance & Off-peak Tasks' },
    ];

    const createdEntries = [];

    // Schedule for 7 days
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + dayIndex);

      const isWeekend = currentDate.getDay() === 5 || currentDate.getDay() === 6; // Friday / Saturday or Sat / Sun

      if (isWeekend) {
        // Assign 1 or 2 on-call / weekend duty
        const staff = itStaff[dayIndex % itStaff.length];
        const entry = await prisma.dutyRoster.create({
          data: {
            date: currentDate,
            shift: ShiftType.WEEKEND_DUTY,
            startTime: '10:00 AM',
            endTime: '06:00 PM',
            location: 'HQ Server Room / Remote On-Call',
            tasks: 'Weekend Emergency Standby & Infrastructure Monitoring',
            status: RosterStatus.SCHEDULED,
            employeeId: staff.id,
          },
        });
        createdEntries.push(entry);
      } else {
        // Weekday shifts
        for (let shiftIdx = 0; shiftIdx < Math.min(shiftTemplates.length, itStaff.length); shiftIdx++) {
          const template = shiftTemplates[shiftIdx];
          const staff = itStaff[(dayIndex + shiftIdx) % itStaff.length];

          const entry = await prisma.dutyRoster.create({
            data: {
              date: currentDate,
              shift: template.shift,
              startTime: template.startTime,
              endTime: template.endTime,
              location: 'HQ Floor 4 / Server Room',
              tasks: template.tasks,
              status: RosterStatus.SCHEDULED,
              employeeId: staff.id,
            },
          });
          createdEntries.push(entry);
        }
      }
    }

    try {
      await prisma.activityLog.create({
        data: {
          user: req.user?.name || 'System',
          action: 'GENERATE_WEEKLY_ROSTER',
          module: 'ROSTER',
          newData: { totalCreated: createdEntries.length, weekStartDate },
        },
      });
    } catch {}

    return res.status(201).json({
      success: true,
      message: `Successfully generated ${createdEntries.length} roster assignments for the week!`,
      count: createdEntries.length,
    });
  } catch (error: any) {
    console.error('generateWeeklyRoster error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to generate weekly roster.' });
  }
};

// In-memory swap logs store (also synced to ActivityLog)
export interface SwapRecord {
  id: string;
  createdAt: string;
  day: string;
  staffA: string;
  staffAEmail?: string;
  shiftAOriginal: string;
  shiftANew: string;
  staffB: string;
  staffBEmail?: string;
  shiftBOriginal: string;
  shiftBNew: string;
  reason?: string;
  status: 'APPROVED' | 'ACTIVE' | 'REVERTED';
}

const swapLogsStore: SwapRecord[] = [
  {
    id: 'swap-001',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    day: 'Tuesday',
    staffA: 'Ashraful',
    staffAEmail: 'ashraful@company.local',
    shiftAOriginal: 'Off',
    shiftANew: '11am-09pm',
    staffB: 'Shishir',
    staffBEmail: 'shishir@company.local',
    shiftBOriginal: '07am-05pm',
    shiftBNew: 'Off',
    reason: 'Emergency server room coverage / handover',
    status: 'ACTIVE',
  },
];

// Get Duty Swap logs
export const getSwapLogs = async (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: swapLogsStore,
  });
};

// Execute Duty Swap between two members
export const swapDuties = async (req: AuthRequest, res: Response) => {
  try {
    const {
      day,
      staffA,
      staffAEmail,
      shiftAOriginal,
      staffB,
      staffBEmail,
      shiftBOriginal,
      reason,
    } = req.body;

    if (!staffA || !staffB || !day) {
      return res.status(400).json({ success: false, message: 'day, staffA, and staffB are required.' });
    }

    // New shifts: staffA gets shiftBOriginal, staffB gets shiftAOriginal
    const shiftANew = shiftBOriginal || 'Off';
    const shiftBNew = shiftAOriginal || 'Off';

    const newRecord: SwapRecord = {
      id: `swap-${Date.now()}`,
      createdAt: new Date().toISOString(),
      day,
      staffA,
      staffAEmail,
      shiftAOriginal: shiftAOriginal || 'Unassigned',
      shiftANew,
      staffB,
      staffBEmail,
      shiftBOriginal: shiftBOriginal || 'Unassigned',
      shiftBNew,
      reason: reason || 'Personal arrangement / Operations coverage',
      status: 'ACTIVE',
    };

    swapLogsStore.unshift(newRecord);

    // Send email notifications to both staff members via Nodemailer
    try {
      await sendDutySwapNotificationEmail({
        staffA: {
          name: staffA,
          email: staffAEmail || `${staffA.toLowerCase()}@company.local`,
          originalShift: shiftAOriginal,
          newShift: shiftANew,
          day,
        },
        staffB: {
          name: staffB,
          email: staffBEmail || `${staffB.toLowerCase()}@company.local`,
          originalShift: shiftBOriginal,
          newShift: shiftBNew,
          day,
        },
        reason,
      });
    } catch (mailErr) {
      console.warn('Mail send notice:', mailErr);
    }

    try {
      await prisma.activityLog.create({
        data: {
          user: req.user?.name || 'System',
          action: 'DUTY_SWAP',
          module: 'ROSTER',
          newData: { staffA, staffB, day, shiftANew, shiftBNew, reason },
        },
      });
    } catch {}

    return res.json({
      success: true,
      message: `Duty shift successfully swapped between ${staffA} and ${staffB} on ${day}!`,
      data: newRecord,
    });
  } catch (error: any) {
    console.error('swapDuties error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to process duty swap.' });
  }
};

// Send email notification for an assigned roster
export const notifyRosterEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { staffName, staffEmail, day, dateStr, shift, timeRange, location, tasks } = req.body;

    if (!staffName || !shift) {
      return res.status(400).json({ success: false, message: 'staffName and shift are required.' });
    }

    const result = await sendRosterNotificationEmail({
      staffName,
      staffEmail,
      day: day || 'Scheduled Duty',
      dateStr,
      shift,
      timeRange: timeRange || '09:00 AM - 06:00 PM',
      location,
      tasks,
    });

    return res.json({
      success: true,
      message: `Notification email dispatched to ${staffName}!`,
      mailResult: result,
    });
  } catch (error: any) {
    console.error('notifyRosterEmail error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to send notification email.' });
  }
};
