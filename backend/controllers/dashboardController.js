import ActivityLog from '../models/ActivityLog.js';
import Computer from '../models/Computer.js';
import Extension from '../models/Extension.js';
import Server from '../models/Server.js';
import SSD from '../models/SSD.js';
import User from '../models/User.js';
import { getServerOverview } from '../services/serverMonitor.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (value) => String(value).padStart(2, '0');

// Renders a Date as "30 Sep 2026 15:20" without relying on locale settings.
export const formatTimestamp = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${pad(date.getDate())} ${MONTHS[date.getMonth()]} ${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const percentOf = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0);

export const getDashboardSummary = async (req, res, next) => {
  try {
    const [
      totalEmployees,
      activeEmployees,
      formerEmployees,
      itTeamMembers,
      totalComputers,
      assignedComputers,
      availableComputers,
      computersUnderRepair,
      totalSSDs,
      availableSSDs,
      totalServers,
      onlineServers,
      offlineServers,
      totalExtensions,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ employmentStatus: 'Active' }),
      User.countDocuments({ employmentStatus: 'Former Employee' }),
      User.countDocuments({ isITTeam: true }),
      Computer.countDocuments({}),
      Computer.countDocuments({ status: 'Assigned' }),
      Computer.countDocuments({ status: 'Available' }),
      Computer.countDocuments({ status: 'Repair' }),
      SSD.countDocuments({}),
      SSD.countDocuments({ status: 'Available' }),
      Server.countDocuments({}),
      Server.countDocuments({ status: 'Online' }),
      Server.countDocuments({ status: 'Offline' }),
      Extension.countDocuments({}),
    ]);

    const [servers, itTeam, recentEmployees, recentActivity] = await Promise.all([
      Server.find().select('serverName status ipAddress location').sort({ serverName: 1 }).limit(6).lean(),
      User.find({ isITTeam: true }).select('name designation itStatus').sort({ name: 1 }).limit(6).lean(),
      User.find()
        .select('employeeId name department designation joiningDate')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      ActivityLog.find().sort({ timestamp: -1 }).limit(5).lean(),
    ]);

    // Live ping results are shared with /api/servers/overview. If the probe
    // round fails for any reason the dashboard falls back to the stored status.
    const overview = await getServerOverview().catch(() => null);

    res.json({
      success: true,
      data: {
        stats: {
          totalEmployees,
          activeEmployees,
          formerEmployees,
          itTeamMembers,
          totalComputers,
          assignedComputers,
          availableComputers,
          computersUnderRepair,
          totalSSDs,
          availableSSDs,
          // Live ping results win; the stored counters stay as a fallback when
          // the probe round could not run.
          totalServers: overview?.summary.total ?? totalServers,
          onlineServers: overview?.summary.online ?? onlineServers,
          offlineServers: overview?.summary.offline ?? offlineServers,
          totalExtensions,
        },
        computerStatus: {
          total: totalComputers,
          assigned: assignedComputers,
          available: availableComputers,
          repair: computersUnderRepair,
          utilizationPercent: percentOf(assignedComputers, totalComputers),
        },
        // Live ping results when available, otherwise the stored rows.
        serverStatus: (overview?.servers ?? servers)
          .slice(0, 6)
          .map((server) => ({
            id: server._id ?? server.id ?? server.serverName,
            serverName: server.serverName,
            status: server.status,
            ipAddress: server.ipAddress,
            location: server.location,
          })),
        itTeam: itTeam.map((member) => ({
          id: member._id,
          name: member.name,
          designation: member.designation || 'IT Team',
          itStatus: member.itStatus || 'Available',
        })),
        recentEmployees: recentEmployees.map((employee) => ({
          id: employee._id,
          employeeId: employee.employeeId,
          name: employee.name,
          department: employee.department || 'Unassigned',
          designation: employee.designation,
          joiningDate: employee.joiningDate || null,
        })),
        recentActivity: recentActivity.map((entry) => ({
          id: entry._id,
          action: entry.action,
          module: entry.module,
          user: entry.user,
          time: formatTimestamp(entry.timestamp),
        })),
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
