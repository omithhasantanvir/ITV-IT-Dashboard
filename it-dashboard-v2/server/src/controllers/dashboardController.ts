import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { ComputerStatus, ServerStatus } from '@prisma/client';

export const getDashboardSummary = async (_req: Request, res: Response) => {
  try {
    const [
      totalEmployees,
      activeEmployees,
      formerEmployees,
      itTeamMembers,
      totalComputers,
      assignedComputers,
      availableComputers,
      repairComputers,
      totalExtensions,
      assignedExtensions,
      servers,
      itTeam,
      recentEmployees,
      recentActivities,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { employmentStatus: 'Active' } }),
      prisma.user.count({ where: { employmentStatus: 'Former Employee' } }),
      prisma.user.count({ where: { isITTeam: true, employmentStatus: 'Active' } }),
      prisma.computer.count(),
      prisma.computer.count({ where: { status: ComputerStatus.ASSIGNED } }),
      prisma.computer.count({ where: { status: ComputerStatus.AVAILABLE } }),
      prisma.computer.count({ where: { status: ComputerStatus.REPAIR } }),
      prisma.extension.count(),
      prisma.extension.count({ where: { status: 'ASSIGNED' } }),
      prisma.server.findMany({ orderBy: { serverName: 'asc' } }),
      prisma.user.findMany({
        where: { isITTeam: true },
        select: {
          id: true,
          name: true,
          designation: true,
          email: true,
          phone: true,
          extensionNumber: true,
          itStatus: true,
          profilePhoto: true,
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          department: true,
          designation: true,
          employmentStatus: true,
          joiningDate: true,
        },
      }),
      prisma.activityLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
      }),
    ]);

    const onlineServers = servers.filter((s) => s.status === ServerStatus.ONLINE).length;
    const offlineServers = servers.filter((s) => s.status === ServerStatus.OFFLINE).length;
    const warningServers = servers.filter((s) => s.status === ServerStatus.WARNING).length;

    const utilizationPercent =
      totalComputers > 0 ? Math.round((assignedComputers / totalComputers) * 100) : 0;

    return res.json({
      success: true,
      stats: {
        totalEmployees,
        activeEmployees,
        formerEmployees,
        itTeamMembers,
        totalComputers,
        assignedComputers,
        availableComputers,
        repairComputers,
        totalExtensions,
        assignedExtensions,
        totalServers: servers.length,
        onlineServers,
        offlineServers,
        warningServers,
      },
      summary: {
        computerStatus: {
          total: totalComputers,
          assigned: assignedComputers,
          available: availableComputers,
          repair: repairComputers,
          utilizationPercent,
        },
        serverStatus: servers,
        itTeam,
        recentEmployees,
        recentActivities,
      },
    });
  } catch (error: any) {
    console.error('getDashboardSummary error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve dashboard summary.' });
  }
};
