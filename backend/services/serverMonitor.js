import { execFile } from 'node:child_process';
import net from 'node:net';

import DEFAULT_SERVERS from '../config/defaultServers.js';

const ICMP_TIMEOUT_MS = 1500;
const TCP_TIMEOUT_MS = 900;
// One probe round is shared between the Servers page and the dashboard, so the
// LAN is never hammered with duplicate pings.
const CACHE_TTL_MS = 10000;
// Extra ports to try when ICMP is blocked. Windows servers usually answer on
// 445/135/3389, appliances and Linux boxes on 80/443/22.
const FALLBACK_PORTS = [445, 135, 80, 443, 3389];

// How many probe rounds are kept per host. The overview exposes this as a small
// uptime strip so the UI can show "how has this host been behaving", not just
// the current colour.
const HISTORY_LIMIT = 12;

// Server type -> icon key. The client maps these keys onto lucide icons, which
// keeps the icon choice a UI concern while the category stays data driven.
const ICON_BY_TYPE = {
  'Domain Controller': 'shield',
  'Database Server': 'database',
  'File Server': 'hard-drive',
  'Web Server': 'globe',
  'Application Server': 'layers',
  'Mail Server': 'mail',
  'Backup Server': 'archive',
  'Network Device': 'network',
  'Print Server': 'printer',
};

// Probe outcomes per IP, oldest first. In-memory on purpose: this is an
// operational live view, not a historical SLA store.
const probeHistory = new Map();

const recordOutcome = (ipAddress, sample) => {
  const samples = probeHistory.get(ipAddress) ?? [];
  samples.push(sample);
  while (samples.length > HISTORY_LIMIT) samples.shift();
  probeHistory.set(ipAddress, samples);
  return samples;
};

const uptimePercent = (samples) =>
  samples.length === 0 ? null : Math.round((samples.filter((sample) => sample.online).length / samples.length) * 100);

const averageLatency = (samples) => {
  const values = samples.filter((sample) => sample.online && sample.latencyMs != null).map((sample) => sample.latencyMs);
  if (values.length === 0) return null;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
};

// When the host was last reachable, and since when it has been failing.
const lastSeenAt = (samples) => {
  for (let index = samples.length - 1; index >= 0; index -= 1) {
    if (samples[index].online) return samples[index].checkedAt;
  }
  return null;
};

const downSince = (samples) => {
  let earliest = null;
  for (let index = samples.length - 1; index >= 0; index -= 1) {
    if (samples[index].online) break;
    earliest = samples[index].checkedAt;
  }
  return earliest;
};

const pingArgs = (host) =>
  process.platform === 'win32'
    ? ['-n', '1', '-w', String(ICMP_TIMEOUT_MS), host]
    : ['-c', '1', '-W', '2', host];

// ICMP echo through the OS `ping` binary. Raw sockets would need root/Admin
// rights, and the platform binary is what an admin would use by hand anyway.
export const pingIcmp = (host) =>
  new Promise((resolve) => {
    execFile('ping', pingArgs(host), { timeout: ICMP_TIMEOUT_MS + 2000, windowsHide: true }, (error, stdout) => {
      // The reply text is localised, so the exit code is the source of truth and
      // the latency is parsed opportunistically.
      const match = /time[=<]\s*([\d.]+)\s*ms/i.exec(stdout || '');
      resolve({
        online: !error,
        latencyMs: match ? Math.round(Number(match[1])) : null,
      });
    });
  });

// TCP connect probe used when ICMP is filtered by a firewall.
export const probeTcp = (host, port, timeout = TCP_TIMEOUT_MS) =>
  new Promise((resolve) => {
    const socket = new net.Socket();
    const finish = (online) => {
      socket.destroy();
      resolve(online);
    };
    socket.setTimeout(timeout);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });

const shape = (server, result) => ({
  id: server._id ? String(server._id) : server.serverName,
  serverName: server.serverName,
  ipAddress: server.ipAddress,
  serverType: server.serverType || 'Other',
  port: server.port || 80,
  status: result.status,
  isOnline: result.status === 'Online',
  method: result.method,
  latencyMs: result.latencyMs,
  checkedAt: new Date().toISOString(),
});

// History + derived stats + the icon hint the UI needs for a per-host card.
const decorate = (server, result) => {
  const samples = recordOutcome(server.ipAddress, {
    online: result.isOnline,
    latencyMs: result.latencyMs,
    checkedAt: result.checkedAt,
    method: result.method,
  });

  return {
    ...result,
    iconKey: ICON_BY_TYPE[server.serverType] ?? 'server',
    history: samples.map((sample) => ({ ...sample })),
    uptimePercent: uptimePercent(samples),
    avgLatencyMs: averageLatency(samples),
    lastSeenAt: lastSeenAt(samples),
    downSince: downSince(samples),
  };
};

// A host counts as online when ICMP answers, or when any candidate TCP port
// accepts a connection. Everything else is red.
export const checkHost = async (server) => {
  const startedAt = Date.now();
  const icmp = await pingIcmp(server.ipAddress);
  if (icmp.online) {
    return decorate(
      server,
      shape(server, { status: 'Online', method: 'icmp', latencyMs: icmp.latencyMs ?? Date.now() - startedAt })
    );
  }

  const ports = [...new Set([server.port, ...FALLBACK_PORTS].filter(Boolean))];
  const reachable = await Promise.all(ports.map((port) => probeTcp(server.ipAddress, port)));
  const openIndex = reachable.findIndex(Boolean);
  if (openIndex !== -1) {
    return decorate(
      server,
      shape(server, { status: 'Online', method: 'tcp', latencyMs: Date.now() - startedAt, port: ports[openIndex] })
    );
  }

  return decorate(server, shape(server, { status: 'Offline', method: 'none', latencyMs: null }));
};

// ---------------------------------------------------------------------------
// Single host probing
// ---------------------------------------------------------------------------
// The Servers page probes one host per card so each tile can animate its own
// "pinging…" state and flip green/red the moment its answer arrives. Without
// this the whole grid would have to wait for one big round.
const HOST_CACHE_TTL_MS = 8000;
const hostProbes = new Map();

// Accepts a server name or an IP address (case/space insensitive) so the UI can
// ask for "GV FSM-1" or "10.1.2.4" interchangeably.
export const resolveHost = (reference) => {
  if (!reference) return null;
  const needle = String(reference).trim().toLowerCase();
  if (!needle) return null;
  return (
    DEFAULT_SERVERS.find(
      (server) =>
        server.serverName.toLowerCase() === needle ||
        server.ipAddress.toLowerCase() === needle ||
        server.serverName.toLowerCase().replace(/\s+/g, '') === needle.replace(/\s+/g, ''),
    ) || null
  );
};

// Probes a single host with per-host single-flight + a short cache, so a double
// click or two browsers on the LAN never start duplicate pings to one box.
export const probeSingle = (reference, { force = false } = {}) => {
  const server = resolveHost(reference);
  if (!server) return Promise.resolve(null);

  const key = server.ipAddress;
  const entry = hostProbes.get(key);
  if (!force && entry?.promise) return entry.promise;
  if (!force && entry?.result && Date.now() < entry.expiresAt) return Promise.resolve(entry.result);

  const promise = checkHost(server)
    .then((result) => {
      hostProbes.set(key, { result, expiresAt: Date.now() + HOST_CACHE_TTL_MS, promise: null });
      return result;
    })
    .catch((error) => {
      hostProbes.set(key, { result: entry?.result ?? null, expiresAt: 0, promise: null });
      throw error;
    });

  hostProbes.set(key, { result: entry?.result ?? null, expiresAt: entry?.expiresAt ?? 0, promise });
  return promise;
};

let cache = { expiresAt: 0, payload: null };
let inFlight = null;

const probeAll = async () => {
  const startedAt = Date.now();
  // Go through probeSingle so the per-host cache is warm: a page that bootstraps
  // with this overview and then animates each card one by one gets an instant,
  // identical answer instead of a second ping to every box.
  const servers = await Promise.all(DEFAULT_SERVERS.map((server) => probeSingle(server.serverName)));
  const online = servers.filter((server) => server.isOnline).length;
  const offline = servers.length - online;
  return {
    servers,
    summary: {
      total: servers.length,
      online,
      offline,
      onlinePercent: servers.length > 0 ? Math.round((online / servers.length) * 100) : 0,
    },
    durationMs: Date.now() - startedAt,
    generatedAt: new Date().toISOString(),
  };
};

// Cached overview with single-flight behaviour: concurrent callers (Servers
// page + dashboard) join the same probe round instead of starting their own.
export const getServerOverview = async ({ force = false } = {}) => {
  if (!force && cache.payload && Date.now() < cache.expiresAt) return cache.payload;
  if (inFlight) return inFlight;

  inFlight = probeAll()
    .then((payload) => {
      cache = { expiresAt: Date.now() + CACHE_TTL_MS, payload };
      return payload;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
};

export default getServerOverview;
