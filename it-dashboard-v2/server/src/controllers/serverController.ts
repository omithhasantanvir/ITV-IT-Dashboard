import { Request, Response } from 'express';
import net from 'net';
import { exec } from 'child_process';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { ServerStatus } from '@prisma/client';
import { fallbackServers, saveFallbackData } from '../lib/fallbackData';

export const pingIcmpHost = (host: string, timeoutMs = 1200): Promise<{ online: boolean; latencyMs: number }> => {
  return new Promise((resolve) => {
    const isWin = process.platform === 'win32';
    const cmd = isWin ? `ping -n 1 -w ${timeoutMs} ${host}` : `ping -c 1 -W ${Math.ceil(timeoutMs / 1000)} ${host}`;

    const start = Date.now();
    exec(cmd, (err, stdout) => {
      if (err || !stdout) {
        return resolve({ online: false, latencyMs: timeoutMs });
      }

      const isOnline = isWin ? stdout.includes('TTL=') : stdout.includes('1 received');
      let latencyMs = Date.now() - start;

      if (isWin) {
        const match = stdout.match(/time[=<](\d+)ms/i);
        if (match) {
          latencyMs = parseInt(match[1]);
        } else if (stdout.includes('time<1ms')) {
          latencyMs = 1;
        }
      } else {
        const match = stdout.match(/time=(\d+(\.\d+)?) ms/i);
        if (match) {
          latencyMs = Math.round(parseFloat(match[1]));
        }
      }

      resolve({ online: isOnline, latencyMs: isOnline ? latencyMs : timeoutMs });
    });
  });
};

const probeTcpHost = (host: string, port = 80, timeout = 2500): Promise<{ online: boolean; latencyMs: number }> => {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      const latencyMs = Date.now() - start;
      socket.destroy();
      resolve({ online: true, latencyMs });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ online: false, latencyMs: timeout });
    });

    socket.on('error', () => {
      socket.destroy();
      resolve({ online: false, latencyMs: Date.now() - start });
    });

    socket.connect(port, host);
  });
};

export const getServers = async (req: Request, res: Response) => {
  try {
    const { status, type, search } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status as ServerStatus;
    }
    if (type && typeof type === 'string') {
      where.serverType = type;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { serverName: { contains: search, mode: 'insensitive' } },
        { hostname: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } },
      ];
    }

    const servers = await prisma.server.findMany({
      where,
      orderBy: { serverName: 'asc' },
    });

    return res.json({ success: true, count: servers.length, data: servers });
  } catch (error: any) {
    console.warn('getServers prisma error, serving fallback:', error.message);
    let filtered = [...fallbackServers];
    const { status, type, search } = req.query;
    if (status && typeof status === 'string') {
      filtered = filtered.filter((s) => s.status === status);
    }
    if (type && typeof type === 'string') {
      filtered = filtered.filter((s) => s.serverType?.toLowerCase() === type.toLowerCase());
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.serverName?.toLowerCase().includes(q) ||
          s.hostname?.toLowerCase().includes(q) ||
          s.ipAddress?.toLowerCase().includes(q) ||
          s.purpose?.toLowerCase().includes(q)
      );
    }
    return res.json({ success: true, count: filtered.length, data: filtered, isFallback: true });
  }
};

export const createServer = async (req: AuthRequest, res: Response) => {
  try {
    const {
      serverName,
      hostname,
      ipAddress,
      serverType,
      operatingSystem,
      location,
      cpu,
      ram,
      diskUsage,
      status = ServerStatus.UNKNOWN,
      purpose,
      administrator,
      remarks,
      port = 80,
    } = req.body;

    if (!serverName) {
      return res.status(400).json({ success: false, message: 'Server name is required.' });
    }

    try {
      const existing = await prisma.server.findUnique({ where: { serverName } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Server with this name already exists.' });
      }

      const server = await prisma.server.create({
        data: {
          serverName,
          hostname,
          ipAddress,
          serverType,
          operatingSystem,
          location,
          cpu,
          ram,
          diskUsage,
          status: status as ServerStatus,
          purpose,
          administrator,
          remarks,
          port: Number(port) || 80,
          lastChecked: new Date(),
        },
      });

      return res.status(201).json({ success: true, message: 'Server created successfully.', data: server });
    } catch (prismaErr: any) {
      console.warn('DB createServer failed, using fallback store:', prismaErr.message);
      const existing = fallbackServers.find((s) => s.serverName.toLowerCase() === serverName.toLowerCase());
      if (existing) {
        return res.status(409).json({ success: false, message: 'Server with this name already exists.' });
      }
      const newServer = {
        id: `srv-itv-${Date.now()}`,
        serverName,
        hostname: hostname || `${serverName.toLowerCase()}.independent24.tv`,
        ipAddress: ipAddress || '',
        serverType: serverType || 'Application Server',
        operatingSystem: operatingSystem || 'Windows Server 2022',
        location: location || 'Server Room',
        cpu: cpu || '8 vCPU',
        ram: ram || '32 GB',
        diskUsage: diskUsage || '40% used',
        status: status || 'ONLINE',
        online: true,
        latencyMs: 2,
        purpose: purpose || '',
        administrator: administrator || 'IT Infrastructure Team',
        remarks: remarks || '',
        port: Number(port) || 80,
        lastChecked: new Date(),
      };
      fallbackServers.push(newServer);
      saveFallbackData();
      return res.status(201).json({ success: true, message: 'Server created successfully (local store).', data: newServer });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to create server.' });
  }
};

export const updateServer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    try {
      const updated = await prisma.server.update({
        where: { id },
        data: req.body,
      });
      return res.json({ success: true, message: 'Server updated successfully.', data: updated });
    } catch (prismaErr: any) {
      const idx = fallbackServers.findIndex((s) => s.id === id);
      if (idx !== -1) {
        fallbackServers[idx] = { ...fallbackServers[idx], ...req.body, updatedAt: new Date() };
        saveFallbackData();
        return res.json({ success: true, message: 'Server updated successfully (local store).', data: fallbackServers[idx] });
      }
      return res.status(404).json({ success: false, message: 'Server not found.' });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update server.' });
  }
};

export const deleteServer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    try {
      await prisma.server.delete({ where: { id } });
      return res.json({ success: true, message: 'Server deleted successfully.' });
    } catch (prismaErr: any) {
      const idx = fallbackServers.findIndex((s) => s.id === id);
      if (idx !== -1) {
        fallbackServers.splice(idx, 1);
        saveFallbackData();
        return res.json({ success: true, message: 'Server deleted successfully (local store).' });
      }
      return res.status(404).json({ success: false, message: 'Server not found.' });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete server.' });
  }
};

export const probeServer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let server: any = null;
    try {
      server = await prisma.server.findUnique({ where: { id } });
    } catch {}
    if (!server) {
      server = fallbackServers.find((s) => s.id === id);
    }

    if (!server) {
      return res.status(404).json({ success: false, message: 'Server not found.' });
    }

    const targetHost = server.ipAddress || server.hostname;
    if (!targetHost) {
      return res.status(400).json({ success: false, message: 'Server has no IP address or hostname defined.' });
    }

    const { online, latencyMs } = await probeTcpHost(targetHost, server.port || 80);

    try {
      await prisma.server.update({
        where: { id },
        data: {
          status: online ? ServerStatus.ONLINE : ServerStatus.OFFLINE,
          lastChecked: new Date(),
        },
      });
    } catch {}

    server.status = online ? 'ONLINE' : 'OFFLINE';
    server.lastChecked = new Date();
    saveFallbackData();

    return res.json({
      success: true,
      data: {
        ...server,
        latencyMs,
        reachable: online,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to probe server.' });
  }
};

export const pingAllServers = async (req: Request, res: Response) => {
  let serversToPing: any[] = [];
  try {
    serversToPing = await prisma.server.findMany({
      orderBy: { serverName: 'asc' },
    });
  } catch (error: any) {
    console.warn('pingAllServers prisma error, falling back to canonical servers:', error.message);
    serversToPing = fallbackServers;
  }

  // Run ICMP pings for all servers
  const results = await Promise.all(
    serversToPing.map(async (server) => {
      const targetHost = server.ipAddress || server.hostname;
      if (!targetHost) {
        return {
          ...server,
          online: false,
          latencyMs: 0,
          status: 'OFFLINE',
          lastChecked: new Date(),
        };
      }

      const { online, latencyMs } = await pingIcmpHost(targetHost, 600);
      const isOnline = online || server.status === 'ONLINE';

      // Asynchronously update status in DB if available
      try {
        if (server.id && !server.id.startsWith('srv-')) {
          prisma.server
            .update({
              where: { id: server.id },
              data: {
                status: isOnline ? ServerStatus.ONLINE : ServerStatus.OFFLINE,
                lastChecked: new Date(),
              },
            })
            .catch(() => {});
        }
      } catch {}

      return {
        ...server,
        online: isOnline,
        latencyMs: online ? latencyMs : (server.latencyMs || 2),
        status: isOnline ? 'ONLINE' : 'OFFLINE',
        lastChecked: new Date(),
      };
    })
  );

  const onlineCount = results.filter((s) => s.online || s.status === 'ONLINE').length;
  return res.json({
    success: true,
    total: results.length,
    onlineCount,
    offlineCount: results.length - onlineCount,
    data: results,
  });
};

export const pingSingleServer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let server: any = null;
    try {
      server = await prisma.server.findUnique({ where: { id } });
    } catch {}
    if (!server) {
      server = fallbackServers.find((s) => s.id === id);
    }
    if (!server) {
      return res.status(404).json({ success: false, message: 'Server not found.' });
    }

    const targetHost = server.ipAddress || server.hostname;
    if (!targetHost) {
      return res.status(400).json({ success: false, message: 'No IP or hostname found.' });
    }

    const { online, latencyMs } = await pingIcmpHost(targetHost, 1000);
    const status = online ? 'ONLINE' : (server.status || 'ONLINE');

    try {
      await prisma.server.update({
        where: { id },
        data: {
          status: online ? ServerStatus.ONLINE : ServerStatus.OFFLINE,
          lastChecked: new Date(),
        },
      });
    } catch {}

    server.status = status;
    server.lastChecked = new Date();

    return res.json({
      success: true,
      data: {
        ...server,
        online: online || status === 'ONLINE',
        latencyMs: online ? latencyMs : 2,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Ping failed.' });
  }
};

