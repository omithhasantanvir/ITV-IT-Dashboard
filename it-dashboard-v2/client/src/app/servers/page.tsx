'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Server,
  Activity,
  RefreshCw,
  Cpu,
  HardDrive,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertOctagon,
  Radio,
  Copy,
  Check,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Search,
  Layers,
  LayoutGrid,
  Zap,
  Lock,
  Unlock,
  Key,
  Cable,
  Plug,
  Fingerprint,
  CreditCard,
  ShieldCheck,
  Hash,
  Delete,
  CornerDownLeft,
  X,
  Eye,
  Settings2,
  Box,
} from 'lucide-react';
import api from '@/lib/api';
import { AccessGuard } from '@/components/AccessGuard';
import { useAuth } from '@/context/AuthContext';
import { BrandLoading } from '@/components/BrandLoading';
import { showErrorAlert, showSuccessAlert } from '@/lib/sweetalert';
import Swal from 'sweetalert2';
import { StructuredCablingBay } from '@/components/servers/StructuredCablingBay';
import { SupremaAccessModal } from '@/components/servers/SupremaAccessModal';
import { SupremaRackTerminal } from '@/components/servers/SupremaRackTerminal';

export interface ServerNode {
  id: string;
  serverName: string;
  hostname?: string | null;
  ipAddress?: string | null;
  serverType?: string | null;
  operatingSystem?: string | null;
  location?: string | null;
  cpu?: string | null;
  ram?: string | null;
  diskUsage?: string | null;
  uptime?: string | null;
  lastChecked?: string | null;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING' | 'MAINTENANCE' | 'UNKNOWN';
  purpose?: string | null;
  administrator?: string | null;
  remarks?: string | null;
  port?: number;
  online?: boolean;
  latencyMs?: number;
}

// Synthesize pleasant sci-fi, datacenter, and Suprema access control audio via Web Audio API
export type SoundType = 'beep' | 'alert' | 'slide' | 'door' | 'key' | 'grant' | 'deny';

const playSound = (type: SoundType) => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'key') {
      // Suprema capacitive touch keypad electronic click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1450, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.035);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'grant') {
      // Suprema signature ascending melodic access granted chime (C6 -> E6 -> G6)
      // Tone 1: C6 (1046.5 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.5, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.13);

      // Tone 2: E6 (1318.5 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.5, now + 0.09);
      gain2.gain.setValueAtTime(0.15, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.36);
    } else if (type === 'deny') {
      // Suprema double low buzzer for access denied
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(170, now);
      osc.frequency.setValueAtTime(140, now + 0.13);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.setValueAtTime(0.16, now + 0.13);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.33);
    } else if (type === 'door') {
      // Mechanical latch release / magnetic solenoid click sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.18);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    } else if (type === 'slide') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } else if (type === 'alert') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.setValueAtTime(780, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    }
  } catch {
    // Audio context may be restricted by browser policy
  }
};

export default function ServersPage() {
  const [servers, setServers] = useState<ServerNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState(false);
  const [autoPing, setAutoPing] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<'rack' | 'grid'>('rack');
  const [masterRackView, setMasterRackView] = useState<'blades' | 'cabling'>('blades');
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [hoveredServerId, setHoveredServerId] = useState<string | null>(null);
  const [lockedServerId, setLockedServerId] = useState<string | null>(null);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [lastPingTime, setLastPingTime] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(6);

  // Keep track of previous online statuses to detect drop-offs
  const prevStatusRef = useRef<Record<string, boolean>>({});
  const hasInitializedRef = useRef(false);

  // Fetch all servers and live ping them
  const triggerPingAll = async (isManual = false) => {
    setPinging(true);
    try {
      const res = await api.get('/api/servers/ping-all');
      const data: ServerNode[] = res.data?.data || [];
      setServers(data);
      setLastPingTime(new Date());

      // Check for transitions into OFFLINE
      if (hasInitializedRef.current) {
        data.forEach((srv) => {
          const wasOnline = prevStatusRef.current[srv.id];
          const isNowOnline = srv.status === 'ONLINE' || srv.online === true;

          // If was previously online and now dropped offline
          if (wasOnline === true && !isNowOnline) {
            handleServerOfflineAlert(srv);
          }
        });
      }

      // Update status map
      const newStatusMap: Record<string, boolean> = {};
      data.forEach((srv) => {
        newStatusMap[srv.id] = srv.status === 'ONLINE' || srv.online === true;
      });
      prevStatusRef.current = newStatusMap;
      hasInitializedRef.current = true;

      if (isManual && soundEnabled) {
        playSound('beep');
      }
    } catch (err: any) {
      console.error('Failed to ping servers:', err);
    } finally {
      setPinging(false);
      setLoading(false);
      setCountdown(6);
    }
  };

  // Popup modal when a server goes offline
  const handleServerOfflineAlert = (srv: ServerNode) => {
    if (soundEnabled) playSound('alert');

    Swal.fire({
      icon: 'error',
      title: '🚨 Server Offline Alert!',
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.6;">
          <p style="margin-bottom: 8px;">
            <strong style="color: #ef4444; font-size: 15px;">${srv.serverName}</strong> (${srv.ipAddress || 'No IP'})
            <strong style="color: #ef4444;">is now Offline (Connection Timed Out)!</strong>
          </p>
          <div style="padding: 10px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; font-family: monospace;">
            <div>• Host: ${srv.hostname || srv.ipAddress}</div>
            <div>• Purpose: ${srv.purpose || 'Production System'}</div>
            <div>• Status: Ping Request Timed Out (0% Response)</div>
          </div>
          <p style="margin-top: 8px; color: #888; font-size: 11px;">
            Please inspect datacenter power, switch port, or network interface immediately.
          </p>
        </div>
      `,
      confirmButtonText: 'Acknowledge',
      confirmButtonColor: '#ef4444',
      showCancelButton: true,
      cancelButtonText: 'Dismiss',
      cancelButtonColor: '#27272a',
      background: '#18181b',
      color: '#f4f4f5',
    });
  };

  // Simulate offline for testing popup
  const handleSimulateOffline = (srv: ServerNode) => {
    handleServerOfflineAlert(srv);
  };

  // Ping a single server on demand
  const handlePingSingle = async (srv: ServerNode) => {
    try {
      if (soundEnabled) playSound('beep');
      const res = await api.post(`/api/servers/${srv.id}/ping`);
      if (res.data?.data) {
        setServers((prev) =>
          prev.map((s) => (s.id === srv.id ? { ...s, ...res.data.data } : s))
        );
        showSuccessAlert(`${srv.serverName} ping: ${res.data.data.latencyMs}ms (${res.data.data.status})`);
      }
    } catch (err: any) {
      showErrorAlert(`Failed to ping ${srv.serverName}`);
    }
  };

  // Copy IP to clipboard
  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    if (soundEnabled) playSound('beep');
    setTimeout(() => setCopiedIp(null), 1800);
  };

  // Initial load
  useEffect(() => {
    triggerPingAll();
  }, []);

  // Real-time background ping loop (Runs every 6 seconds)
  useEffect(() => {
    if (!autoPing) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          triggerPingAll();
          return 6;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoPing]);

  // Divide into 2 compact racks: Rack 01 (7 Servers) and Rack 02 (7 Servers)
  const { rack1, rack2 } = useMemo(() => {
    const rack1Names = ['DC-1', 'DC-2', 'DSE', 'SQL', 'FTP', 'Dashboard', 'Octopus X'];
    const rack2Names = ['GV Core', 'GV FSM-1', 'GV FSM-2', 'GV FTP', 'GV RE-1', 'GV RE-2', 'GV XRE'];

    const filterFn = (s: ServerNode) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        s.serverName.toLowerCase().includes(q) ||
        (s.ipAddress && s.ipAddress.toLowerCase().includes(q)) ||
        (s.purpose && s.purpose.toLowerCase().includes(q)) ||
        (s.serverType && s.serverType.toLowerCase().includes(q))
      );
    };

    const r1: ServerNode[] = [];
    const r2: ServerNode[] = [];

    // Order r1 strictly
    rack1Names.forEach((name) => {
      const match = servers.find((s) => s.serverName.toUpperCase() === name.toUpperCase());
      if (match && filterFn(match)) r1.push(match);
    });

    // Order r2 strictly
    rack2Names.forEach((name) => {
      const match = servers.find((s) => s.serverName.toUpperCase() === name.toUpperCase());
      if (match && filterFn(match)) r2.push(match);
    });

    // Catch any remaining servers that might exist
    servers.forEach((s) => {
      if (
        !rack1Names.some((n) => n.toUpperCase() === s.serverName.toUpperCase()) &&
        !rack2Names.some((n) => n.toUpperCase() === s.serverName.toUpperCase()) &&
        filterFn(s)
      ) {
        if (r1.length <= r2.length) r1.push(s);
        else r2.push(s);
      }
    });

    return { rack1: r1, rack2: r2 };
  }, [servers, search]);

  const stats = useMemo(() => {
    const total = servers.length;
    const online = servers.filter((s) => s.status === 'ONLINE' || s.online === true).length;
    const offline = total - online;
    const avgLatency =
      online > 0
        ? Math.round(
            servers
              .filter((s) => (s.status === 'ONLINE' || s.online === true) && s.latencyMs)
              .reduce((acc, s) => acc + (s.latencyMs || 0), 0) / (online || 1)
          )
        : 0;
    return { total, online, offline, avgLatency };
  }, [servers]);

  return (
    <AccessGuard module="servers">
      <div className="space-y-6">
        {/* Top Header & Interactive Telemetry Dashboard */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-zinc-700/80 flex items-center justify-center text-emerald-400 shadow-xl shadow-black/60">
                <Server className="h-6 w-6 stroke-[2]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  Datacenter Server Racks & Live Telemetry
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Dual R.F. Mote enclosure simulation with uniform standardized 2U server blades & slide-out telemetry.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-muted/40 border border-border">
              <button
                onClick={() => setViewMode('rack')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'rack'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Dual Rack View
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'grid'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Grid Cards
              </button>
            </div>

            {/* Cabling vs Blades Toggle (Visible in Rack View) */}
            {viewMode === 'rack' && (
              <div className="flex items-center p-1 rounded-xl bg-muted/40 border border-border">
                <button
                  onClick={() => setMasterRackView('blades')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    masterRackView === 'blades'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="View standardized 2U server blades"
                >
                  <Server className="h-3.5 w-3.5" />
                  Front Blades
                </button>
                <button
                  onClick={() => setMasterRackView('cabling')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    masterRackView === 'cabling'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="View high-density photo-accurate combed structured cabling bay (Blue/Yellow/Red/Aqua)"
                >
                  <Cable className="h-3.5 w-3.5 text-cyan-400" />
                  Structured Cabling (Photo)
                </button>
              </div>
            )}

            {/* 3D Datacenter Perspective Toggle (Visible in Rack View) */}
            {viewMode === 'rack' && (
              <button
                onClick={() => setIs3DMode(!is3DMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                  is3DMode
                    ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
                title={is3DMode ? 'Switch to 2D Flat Ortho View' : 'Switch to 3D Isometric Datacenter View'}
              >
                <Box className={`h-3.5 w-3.5 ${is3DMode ? 'text-cyan-400 animate-pulse' : ''}`} />
                <span>3D Datacenter: {is3DMode ? 'ON' : '2D'}</span>
              </button>
            )}

            {/* Auto Ping Toggle */}
            <button
              onClick={() => setAutoPing(!autoPing)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                autoPing
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-border bg-card text-muted-foreground'
              }`}
              title={autoPing ? 'Live auto-pinging active' : 'Auto-ping paused'}
            >
              {autoPing ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5" />}
              <span>Auto Ping ({autoPing ? `${countdown}s` : 'Off'})</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border text-xs transition ${
                soundEnabled
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground'
              }`}
              title={soundEnabled ? 'Audio alerts on' : 'Audio alerts muted'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* Ping All Now */}
            <button
              onClick={() => triggerPingAll(true)}
              disabled={pinging}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 hover:opacity-90 active:scale-95 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${pinging ? 'animate-spin' : ''}`} />
              Ping All Now
            </button>
          </div>
        </div>

        {/* Quick KPI Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Dual Racks</p>
              <p className="text-xl font-bold text-foreground">2 Racks / {stats.total} Nodes</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Online Nodes</p>
              <p className="text-xl font-bold text-emerald-500">{stats.online} Nodes</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold ${
                stats.offline > 0 ? 'bg-rose-500/10 text-rose-500 animate-pulse' : 'bg-muted text-muted-foreground'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Timed Out / Down</p>
              <p className={`text-xl font-bold ${stats.offline > 0 ? 'text-rose-500' : 'text-foreground'}`}>
                {stats.offline} Nodes
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Mean Latency</p>
              <p className="text-xl font-bold font-mono text-foreground">
                {stats.avgLatency > 0 ? `${stats.avgLatency} ms` : '< 1 ms'}
              </p>
            </div>
          </div>
        </div>

        {/* Offline Warning Alert Bar */}
        {stats.offline > 0 && (
          <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 backdrop-blur-md flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                <AlertOctagon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-400">
                  Critical Warning: {stats.offline} Server Node(s) Ping Timed Out!
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {servers
                    .filter((s) => s.status === 'OFFLINE' || s.online === false)
                    .map((s) => `${s.serverName} (${s.ipAddress})`)
                    .join(', ')}
                </p>
              </div>
            </div>
            <button
              onClick={() => triggerPingAll(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-semibold shadow hover:bg-rose-600 transition shrink-0"
            >
              Re-Ping Now
            </button>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3.5 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search servers by name (DC-1, GV Core, Octopus X), IP address (172.19.4.x, 10.1.2.x), or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-sm"
            />
          </div>
          {lastPingTime && (
            <div className="text-[11px] text-muted-foreground hidden sm:flex items-center gap-1.5 font-mono">
              <Radio className={`h-3 w-3 ${pinging ? 'text-primary animate-ping' : 'text-emerald-500'}`} />
              <span>Last ping: {lastPingTime.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* =========================================================================
            MAIN VIEW: 2 SIDE-BY-SIDE STANDARDIZED PHOTO RACKS (7 SERVERS EACH)
            ========================================================================= */}
        {viewMode === 'rack' ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-6 items-start max-w-[860px] mx-auto px-2 sm:px-3">
            {/* RACK 01: Core Enterprise & Newsroom Rack (7 Servers) */}
            <UniformServerRack
              rackNumber="01"
              rackTitle="RACK 01 • CORE ENTERPRISE & NEWSROOM"
              rackSub="Subnet: 172.19.4.x / 172.19.8.x • Power: 2.2 kW"
              servers={rack1}
              hoveredServerId={hoveredServerId}
              lockedServerId={lockedServerId}
              onHoverServer={(id) => {
                setHoveredServerId(id);
                if (id && soundEnabled) playSound('slide');
              }}
              onLockServer={(id) => setLockedServerId(lockedServerId === id ? null : id)}
              onPingSingle={handlePingSingle}
              onCopyIp={handleCopyIp}
              copiedIp={copiedIp}
              onSimulateOffline={handleSimulateOffline}
              loading={loading}
              soundEnabled={soundEnabled}
              onPlaySound={playSound}
              defaultView={masterRackView}
              is3DMode={is3DMode}
            />

            {/* RACK 02: Grass Valley Broadcast & Playout (7 Servers) */}
            <UniformServerRack
              rackNumber="02"
              rackTitle="RACK 02 • GRASS VALLEY BROADCAST SYSTEM"
              rackSub="Subnet: 10.1.2.x / 10.1.4.x • Power: 3.1 kW"
              servers={rack2}
              hoveredServerId={hoveredServerId}
              lockedServerId={lockedServerId}
              onHoverServer={(id) => {
                setHoveredServerId(id);
                if (id && soundEnabled) playSound('slide');
              }}
              onLockServer={(id) => setLockedServerId(lockedServerId === id ? null : id)}
              onPingSingle={handlePingSingle}
              onCopyIp={handleCopyIp}
              copiedIp={copiedIp}
              onSimulateOffline={handleSimulateOffline}
              loading={loading}
              soundEnabled={soundEnabled}
              onPlaySound={playSound}
              defaultView={masterRackView}
              is3DMode={is3DMode}
            />
          </div>
        ) : (
          /* =========================================================================
             GRID VIEW: 14 CARDS AS IN SCREENSHOT WITH LIVE TELEMETRY
             ========================================================================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {servers.map((srv) => {
              const isOnline = srv.status === 'ONLINE' || srv.online === true;
              return (
                <div
                  key={srv.id}
                  className={`p-6 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${
                    isOnline
                      ? 'border-border bg-card/80 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10'
                      : 'border-rose-500/40 bg-rose-500/5 shadow-lg shadow-rose-500/10'
                  }`}
                >
                  <div className="text-center space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-foreground tracking-tight">{srv.serverName}</h3>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">{srv.ipAddress || '0.0.0.0'}</p>
                    </div>

                    <div className="flex flex-col items-center justify-center py-2">
                      <div
                        className={`h-11 w-11 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                          isOnline
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-rose-500/15 text-rose-500 animate-pulse'
                        }`}
                      >
                        {isOnline ? (
                          <CheckCircle2 className="h-6 w-6 stroke-[2.5]" />
                        ) : (
                          <XCircle className="h-6 w-6 stroke-[2.5]" />
                        )}
                      </div>
                      <span
                        className={`text-xs font-bold mt-2 ${
                          isOnline ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {isOnline ? 'Online' : 'Offline (Timed Out)'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Latency:</span>
                      <span className="font-mono font-bold text-foreground">
                        {isOnline ? `${srv.latencyMs || 1} ms` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AccessGuard>
  );
}

// ------------------------------------------------------------------------------------------------
// UNIFORM PHOTO-ACCURATE SERVER RACK WITH 3D TINTED GLASS DOOR & MECHANICAL LOCK
// ------------------------------------------------------------------------------------------------
interface RackProps {
  rackNumber: string;
  rackTitle: string;
  rackSub: string;
  servers: ServerNode[];
  hoveredServerId: string | null;
  lockedServerId: string | null;
  onHoverServer: (id: string | null) => void;
  onLockServer: (id: string) => void;
  onPingSingle: (srv: ServerNode) => void;
  onCopyIp: (ip: string) => void;
  copiedIp: string | null;
  onSimulateOffline: (srv: ServerNode) => void;
  loading?: boolean;
  soundEnabled?: boolean;
  onPlaySound?: (type: SoundType) => void;
  defaultView?: 'blades' | 'cabling';
  is3DMode?: boolean;
}

// Independent Television (ITV) Official Brand Logo Component (Using exact uploaded logo)
function ITVBrandLogo() {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {/* Exact Official Independent TV "I" Logo */}
      <div className="h-5 w-4 flex items-center justify-center shrink-0">
        <img
          src="/itv-logo.png"
          alt="Independent TV Logo"
          className="h-5 w-auto object-contain drop-shadow-[0_0_8px_rgba(225,29,72,0.85)] select-none"
        />
      </div>

      <div className="flex flex-col leading-none hidden sm:flex">
        <span className="font-black text-[9px] tracking-tight text-white font-sans">
          INDEPENDENT
        </span>
        <span className="text-[6.5px] tracking-[0.18em] text-zinc-400 uppercase font-mono font-bold">
          TELEVISION
        </span>
      </div>
    </div>
  );
}

function UniformServerRack({
  rackNumber,
  rackTitle,
  rackSub,
  servers,
  hoveredServerId,
  lockedServerId,
  onHoverServer,
  onLockServer,
  onPingSingle,
  onCopyIp,
  copiedIp,
  onSimulateOffline,
  loading,
  soundEnabled,
  onPlaySound,
  defaultView,
  is3DMode = true,
}: RackProps) {
  // Front Glass Door State (Starts Closed with Lock)
  const [doorOpen, setDoorOpen] = useState(false);
  // View mode within rack: 'blades' (7U servers) or 'cabling' (structured cabling bay)
  const [rackView, setRackView] = useState<'blades' | 'cabling'>(defaultView || 'blades');
  // Suprema Access Modal State
  const [isSupremaOpen, setIsSupremaOpen] = useState(false);

  // Sync with defaultView prop
  useEffect(() => {
    if (defaultView) {
      setRackView(defaultView);
    }
  }, [defaultView]);

  // Request to open or close door
  const handleOpenDoorRequested = () => {
    if (doorOpen) {
      // Close & Lock cabinet
      setDoorOpen(false);
      if (onPlaySound && soundEnabled) onPlaySound('door');
    } else {
      // Must authenticate via Suprema with Employee ID!
      setIsSupremaOpen(true);
    }
  };

  const handleAccessGranted = () => {
    setDoorOpen(true);
  };

  const handleLockCabinet = () => {
    setDoorOpen(false);
    if (onPlaySound && soundEnabled) onPlaySound('door');
  };

  const isRack1 = rackNumber === '01';

  return (
    <div className="w-full max-w-[400px] mx-auto relative group/rack">
      {/* Datacenter Cabinet Enclosure */}
      <div className="w-full font-mono relative">
        {/* -------------------------------------------------------------
            3D TOP ROOF CANOPY & EXHAUST COOLING FANS (When 3D Mode is Active)
            ------------------------------------------------------------- */}
        {is3DMode && (
          <div className="relative z-30 mb-[-1px]">
            {/* Top Roof Angled Lid Plate */}
            <div className="mx-2 h-5 rounded-t-xl bg-gradient-to-b from-[#2a2d39] via-[#1a1b24] to-[#0f1017] border-t border-x border-zinc-700/70 shadow-[inset_0_2px_4px_rgba(255,255,255,0.15),0_-4px_12px_rgba(0,0,0,0.7)] px-2.5 flex items-center justify-between">
              {/* Dual Exhaust Fan 1 (Left) */}
              <div className="flex items-center gap-1">
                <div className="relative h-3.5 w-3.5 rounded-full border border-cyan-500/40 bg-zinc-950/80 p-0.5 flex items-center justify-center shadow-[0_0_6px_rgba(6,182,212,0.35)] overflow-hidden">
                  <svg
                    className="h-full w-full text-cyan-400 animate-spin"
                    style={{ animationDuration: '2.4s' }}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 12c-2.2 0-4-1.8-4-4 0-3.3 4-7 4-7s4 3.7 4 7c0 2.2-1.8 4-4 4zm0 0c0-2.2 1.8-4 4-4 3.3 0 7 4 7 4s-3.7 4-7 4c-2.2 0-4-1.8-4-4zm0 0c2.2 0 4 1.8 4 4 0 3.3-4 7-4 7s-4-3.7-4-7c0-2.2 1.8-4 4-4zm0 0c0 2.2-1.8 4-4 4-3.3 0-7-4-7-4s3.7-4 7-4c2.2 0 4 1.8 4 4z" />
                    <circle cx="12" cy="12" r="2" fill="#090a0f" stroke="#06b6d4" strokeWidth="1" />
                  </svg>
                  <div className="absolute inset-0 bg-cyan-400/10 pointer-events-none rounded-full" />
                </div>
                <div className="hidden sm:flex flex-col text-[5.5px] leading-tight text-zinc-400 font-mono">
                  <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                    <span className="h-0.5 w-0.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                    FAN 1
                  </span>
                  <span>2450 RPM</span>
                </div>
              </div>

              {/* Cable Pass-Through Chimney / Center Badge */}
              <div className="px-2 py-0.2 rounded-full bg-zinc-950/90 border border-zinc-800 text-[6.5px] font-mono text-zinc-400 font-bold tracking-wider flex items-center gap-1 shadow-inner">
                <span className="h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
                <span>42U • {isRack1 ? 'MCR-A' : 'MCR-B'}</span>
              </div>

              {/* Dual Exhaust Fan 2 (Right) */}
              <div className="flex items-center gap-1">
                <div className="hidden sm:flex flex-col items-end text-[5.5px] leading-tight text-zinc-400 font-mono">
                  <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                    FAN 2
                    <span className="h-0.5 w-0.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                  </span>
                  <span>2480 RPM</span>
                </div>
                <div className="relative h-3.5 w-3.5 rounded-full border border-cyan-500/40 bg-zinc-950/80 p-0.5 flex items-center justify-center shadow-[0_0_6px_rgba(6,182,212,0.35)] overflow-hidden">
                  <svg
                    className="h-full w-full text-cyan-400 animate-spin"
                    style={{ animationDuration: '2.2s' }}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 12c-2.2 0-4-1.8-4-4 0-3.3 4-7 4-7s4 3.7 4 7c0 2.2-1.8 4-4 4zm0 0c0-2.2 1.8-4 4-4 3.3 0 7 4 7 4s-3.7 4-7 4c-2.2 0-4-1.8-4-4zm0 0c2.2 0 4 1.8 4 4 0 3.3-4 7-4 7s-4-3.7-4-7c0-2.2 1.8-4 4-4zm0 0c0 2.2-1.8 4-4 4-3.3 0-7-4-7-4s3.7-4 7-4c2.2 0 4 1.8 4 4z" />
                    <circle cx="12" cy="12" r="2" fill="#090a0f" stroke="#06b6d4" strokeWidth="1" />
                  </svg>
                  <div className="absolute inset-0 bg-cyan-400/10 pointer-events-none rounded-full" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Cabinet Chassis Frame */}
        <div className={`w-full rounded-2xl border-[3px] border-zinc-900 bg-[#090a0d] shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-visible relative ${is3DMode ? 'rounded-t-none border-t-0' : ''}`}>
          {/* Side Metal Bezel Pillars with EIA 19" Rack Rails */}
          <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-zinc-700 via-zinc-850 to-black border-r border-zinc-800 z-20 pointer-events-none flex flex-col justify-between py-12 items-center opacity-80">
            {['42U', '36U', '28U', '20U', '14U', '7U', '1U'].map((ru) => (
              <span key={ru} className="text-[5px] font-mono font-bold text-zinc-500 scale-75 select-none -rotate-90">
                {ru}
              </span>
            ))}
          </div>
          <div className="absolute inset-y-0 right-0 w-2.5 bg-gradient-to-l from-zinc-700 via-zinc-850 to-black border-l border-zinc-800 z-20 pointer-events-none flex flex-col justify-between py-12 items-center opacity-80">
            {['42U', '36U', '28U', '20U', '14U', '7U', '1U'].map((ru) => (
              <span key={ru} className="text-[5px] font-mono font-bold text-zinc-500 scale-75 select-none rotate-90">
                {ru}
              </span>
            ))}
          </div>

      {/* -------------------------------------------------------------
          1. TOP ITV RACK HEADER (INDEPENDENT TV LOGO & "ITV Rack 01 / 02")
          ------------------------------------------------------------- */}
      <div className="px-2.5 py-1.5 bg-gradient-to-b from-[#1b1c26] via-[#111219] to-[#0a0b0e] border-b border-zinc-800 flex items-center justify-between gap-1.5 relative z-30 rounded-t-xl">
        {/* Left: Independent Television Logo & "ITV Rack 01 / 02" */}
        <div className="flex items-center gap-2">
          {/* ITV Brand Logo */}
          <ITVBrandLogo />

          {/* Divider */}
          <div className="h-5 w-px bg-zinc-700/80 hidden sm:block" />

          {/* ITV Rack 01 / 02 Header Title */}
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-mono font-black text-xs sm:text-sm tracking-wider text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                ITV Rack {rackNumber}
              </h2>
              <span className="text-[7px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 border border-red-500/40">
                ACTIVE
              </span>
            </div>
            <p className="text-[7.5px] text-zinc-400 font-mono tracking-wide font-semibold mt-0.5">
              {rackNumber === '01' ? 'CORE ENTERPRISE & NEWSROOM' : 'GRASS VALLEY BROADCAST SYSTEM'}
            </p>
          </div>
        </div>

        {/* Center: Quick Rack View Switcher (Blades vs Cabling) */}
        <div className="flex items-center p-0.5 rounded-lg bg-black/70 border border-zinc-800">
          <button
            onClick={() => setRackView('blades')}
            className={`px-1.5 py-0.5 rounded text-[7px] font-mono font-bold transition ${
              rackView === 'blades'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Blades
          </button>
          <button
            onClick={() => setRackView('cabling')}
            className={`px-1.5 py-0.5 rounded text-[7px] font-mono font-bold transition flex items-center gap-1 ${
              rackView === 'cabling'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Cable className="h-2 w-2 text-cyan-400" />
            Cabling
          </button>
        </div>

        {/* Right: Suprema Door Status Lock Button & Hardware Marker */}
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          {/* Interactive Door Lock/Unlock Toggle with Suprema Status */}
          <button
            onClick={handleOpenDoorRequested}
            className={`px-1.5 py-0.5 rounded-full text-[7px] font-mono font-bold flex items-center gap-1 border transition-all duration-200 cursor-pointer ${
              doorOpen
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30 shadow-[0_0_6px_rgba(16,185,129,0.25)]'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30 shadow-[0_0_6px_rgba(6,182,212,0.25)]'
            }`}
            title={doorOpen ? "Click to close and lock glass door" : "Click to enter Employee ID via Suprema and open door"}
          >
            {doorOpen ? (
              <>
                <Unlock className="h-2 w-2 text-emerald-400 animate-pulse" />
                <span>OPEN</span>
              </>
            ) : (
              <>
                <Fingerprint className="h-2 w-2 text-cyan-400 animate-pulse" />
                <span>LOCKED</span>
              </>
            )}
          </button>

          <div className="text-[7px] font-mono text-zinc-400 flex items-center gap-1">
            <span className="text-zinc-300 font-semibold">{rackNumber === '01' ? '172.19.4.x' : '10.1.2.x'}</span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          RACK EQUIPMENT CHAMBER + 3D TINTED GLASS FRONT DOOR
          ------------------------------------------------------------- */}
      <div className="relative" style={{ perspective: '1400px' }}>
        {/* =========================================================
            VERTICAL CABLE BUNDLE RUNS (LEFT & RIGHT RACK INTERNAL CHANNELS)
            ========================================================= */}
        {/* Left Side: Cat6A Ethernet & OM4 Fiber Optic Trunk with Velcro Straps */}
        <div className="absolute inset-y-10 left-1 w-1.5 pointer-events-none flex flex-col justify-around opacity-80 z-20">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-0.5 items-center">
              <div className="w-1 h-3 rounded-full bg-cyan-400 shadow-[0_0_4px_#22d3ee]" />
              <div className="w-1 h-3 rounded-full bg-blue-500 shadow-[0_0_4px_#3b82f6]" />
              <div className="w-1.5 h-1 bg-amber-400 rounded-sm shadow-sm" /> {/* Yellow Velcro strap */}
            </div>
          ))}
        </div>

        {/* Right Side: Heavy AC Power Cables (Feed A/B) running to CyberPower PDU */}
        <div className="absolute inset-y-10 right-1 w-1.5 pointer-events-none flex flex-col justify-around opacity-80 z-20">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-0.5 items-center">
              <div className="w-1 h-3.5 rounded-full bg-red-500 shadow-[0_0_4px_#ef4444]" />
              <div className="w-1 h-3.5 rounded-full bg-zinc-700 border border-zinc-500" />
              <div className="w-1.5 h-1 bg-amber-400 rounded-sm shadow-sm" /> {/* Yellow Velcro strap */}
            </div>
          ))}
        </div>

        {/* =========================================================
            INSIDE EQUIPMENT (SWITCHED BETWEEN CABLING BAY & SERVER BLADES)
            ========================================================= */}
        {rackView === 'cabling' ? (
          <StructuredCablingBay
            rackNumber={rackNumber}
            soundEnabled={soundEnabled}
            onPlaySound={onPlaySound}
          />
        ) : (
          <div>
            {/* 2. CISCO 48G SWITCH WITH DRAPED FIBER OPTIC PATCH CABLES */}
            <div className="p-1.5 sm:p-2 bg-[#0a0b0e] border-b border-zinc-800/90 relative">
              <div className="relative h-6 sm:h-6.5 bg-[#111218] rounded border border-zinc-800 px-1.5 py-0.5 flex items-center justify-between overflow-hidden">
                {/* Left Switch Ports */}
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-0.5 w-0.5 sm:h-1 sm:w-1 rounded-sm ${
                            i % 3 === 0 ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-500/70'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-0.5 w-0.5 sm:h-1 sm:w-1 rounded-sm ${
                            i % 2 === 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500/80'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[7px] font-mono text-zinc-400 font-bold ml-0.5 hidden sm:inline">
                    CISCO 48G
                  </span>
                </div>

                {/* Draped Fiber Cable Vector Overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                  <path
                    d="M 45,5 C 80,-6 115,18 150,8 C 185,-2 220,18 260,10"
                    fill="none"
                    stroke="#2dd4bf"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.95"
                  />
                  <path
                    d="M 110,6 C 145,-4 175,22 215,11"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    opacity="0.95"
                  />
                </svg>

                {/* Right SFP+ Optical Uplink */}
                <div className="flex items-center gap-1 relative z-10">
                  <span className="text-[7px] font-mono text-emerald-400 font-bold hidden sm:inline">10G SFP+</span>
                  <div className="h-2 w-4 rounded bg-black border border-zinc-700 flex items-center justify-around px-0.5">
                    <div className="h-0.5 w-0.5 rounded-full bg-cyan-400 animate-pulse" />
                    <div className="h-0.5 w-0.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. CYBERPOWER 1U PDU POWER BAR */}
            <div className="px-2 py-0.5 bg-gradient-to-r from-zinc-900 via-black to-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-1">
                {/* Rocker Switch with Red Guard */}
                <div className="h-2.5 w-4 rounded bg-[#7f1d1d] border border-red-500 flex items-center justify-center">
                  <div className="h-0.5 w-1.5 bg-red-500 rounded-sm" />
                </div>
                <div className="flex items-center gap-0.5">
                  <div className="h-0.5 w-0.5 rounded-full bg-black border border-zinc-700" />
                  <div className="h-0.5 w-0.5 rounded-full bg-black border border-zinc-700" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[7px]">
                  <span className="flex items-center gap-0.5 text-zinc-400">
                    <span className="h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
                    Power
                  </span>
                  <span className="flex items-center gap-0.5 text-zinc-400">
                    <span className="h-1 w-1 rounded-full bg-amber-400 shadow-[0_0_4px_#fbbf24]" />
                    Surge
                  </span>
                </div>
                <span className="font-bold tracking-wider text-zinc-200 uppercase text-[7.5px]">
                  CyberPower <span className="text-[6.5px] text-zinc-400 font-normal">PDU</span>
                </span>
              </div>
            </div>

            {/* 4. STANDARDIZED 2U SERVERS STACK */}
            <div className="p-1.5 sm:p-2 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#12131a] via-[#090a0d] to-black space-y-1 relative">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 space-y-2">
                  <BrandLoading
                    size="inline"
                    text="Syncing rack telemetry..."
                  />
                </div>
              ) : servers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-xs font-mono">
                  No servers assigned.
                </div>
              ) : (
                servers.map((srv, idx) => {
                  const isHovered = hoveredServerId === srv.id;
                  const isLocked = lockedServerId === srv.id;
                  const isExtracted = isHovered || isLocked;
                  const isOnline = srv.status === 'ONLINE' || srv.online === true;
                  const uSlot = `U${String((idx + 1) * 2).padStart(2, '0')}`;

                  return (
                    <div
                      key={srv.id}
                      onMouseEnter={() => {
                        if (doorOpen) onHoverServer(srv.id);
                      }}
                      onMouseLeave={() => {
                        if (doorOpen) onHoverServer(null);
                      }}
                      onClick={() => {
                        if (!doorOpen) {
                          handleOpenDoorRequested();
                        } else {
                          onLockServer(srv.id);
                        }
                      }}
                      className={`relative transition-all duration-300 ease-out ${
                        isExtracted && doorOpen
                          ? 'z-40 translate-x-2 sm:translate-x-4 scale-[1.01] [transform:translateZ(26px)] shadow-[0_15px_30px_rgba(0,0,0,0.95),0_0_20px_rgba(6,182,212,0.3)]'
                          : 'z-10 translate-x-0 [transform:translateZ(0px)]'
                      }`}
                    >
                      {/* Telescoping Stainless Steel Ball-Bearing Slide Rail */}
                      <div
                        className={`absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 h-2.5 server-steel-rail rounded-l border border-zinc-400 transition-all duration-300 pointer-events-none ${
                          isExtracted && doorOpen ? 'w-3 sm:w-4 opacity-100 shadow-[0_3px_8px_rgba(0,0,0,0.8)]' : 'w-0 opacity-0'
                        }`}
                      >
                        <div className="h-full flex items-center justify-around px-0.5">
                          <div className="h-0.5 w-0.5 rounded-full bg-zinc-300 border border-zinc-600" />
                          <div className="h-0.5 w-0.5 rounded-full bg-zinc-300 border border-zinc-600" />
                        </div>
                      </div>

                      {/* 2U Server Chassis Faceplate */}
                      <div
                        className={`rounded border transition-all duration-300 cursor-pointer relative overflow-hidden ${
                          isExtracted && doorOpen
                            ? isOnline
                              ? 'border-emerald-400 bg-[#161720] shadow-[0_10px_25px_rgba(16,185,129,0.22)]'
                              : 'border-rose-500 bg-[#181114] shadow-[0_10px_25px_rgba(244,63,94,0.3)]'
                            : isOnline
                            ? 'border-zinc-800 bg-[#101116] hover:border-zinc-700'
                            : 'border-rose-900/80 bg-[#190c10]'
                        }`}
                      >
                        {/* Front Panel Grid */}
                        <div className="p-0.5 sm:p-1 flex items-center justify-between gap-1">
                          {/* Left Heavy Brushed Silver Handle */}
                          <div className="w-1.5 sm:w-2 h-6 sm:h-6.5 server-handle-silver rounded-sm shrink-0 flex flex-col justify-between py-0.5 px-0.5">
                            <div className="h-0.5 w-full rounded-full bg-zinc-600" />
                            <div className="h-0.5 w-full rounded-full bg-zinc-600" />
                          </div>

                          {/* Left Status Ear: Slot Badge + Power & NIC Activity LEDs */}
                          <div className="w-6 sm:w-7 h-6 sm:h-6.5 bg-[#13141b] rounded border border-zinc-800 p-0.5 flex flex-col justify-between shrink-0">
                            <span className="text-[6px] font-mono text-zinc-500 font-bold">{uSlot}</span>
                            <div className="flex items-center gap-1">
                              {/* Power LED */}
                              <div
                                className={`h-1 w-1 rounded-full ${
                                  isOnline
                                    ? 'bg-emerald-400 shadow-[0_0_5px_#34d399] animate-pulse'
                                    : 'bg-rose-500 shadow-[0_0_5px_#f43f5e] animate-ping'
                                }`}
                              />
                              {/* NIC Traffic LED */}
                              <div className="h-0.5 w-0.5 rounded-full bg-amber-400 animate-nic-flicker" />
                            </div>
                          </div>

                          {/* Center: Dual Honeycomb Ventilation Grilles with Green Label Tape */}
                          <div className="flex-1 h-6 sm:h-6.5 server-honeycomb-grill rounded border border-zinc-800 relative flex items-center justify-center px-1 overflow-hidden">
                            <div className="server-tape-label px-1.5 py-0.2 text-[7.5px] sm:text-[8px] truncate">
                              {srv.serverName} - {srv.ipAddress || 'DHCP'}
                            </div>
                          </div>

                          {/* Right: 4x 3.5" Drive Bays with Signature Blue Release Latches */}
                          <div className="flex items-center gap-0.5 shrink-0 bg-[#0d0e12] p-0.5 rounded border border-zinc-800">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <div
                                key={i}
                                className="w-1 sm:w-1.5 h-5.5 sm:h-6 bg-[#171822] rounded-sm border border-zinc-700 flex flex-col justify-between py-0.5 px-0.5"
                              >
                                {/* Signature Blue Release Latch */}
                                <div className="h-1 w-full server-caddy-latch-blue rounded-[1px]" />
                                {/* Drive Activity LED */}
                                <div className="h-0.5 w-full bg-zinc-600 rounded-[1px] animate-drive-flicker" />
                                <div className="h-0.5 w-full bg-zinc-800 rounded-[1px]" />
                              </div>
                            ))}
                          </div>

                          {/* Right Heavy Brushed Silver Handle */}
                          <div className="w-1.5 sm:w-2 h-6 sm:h-6.5 server-handle-silver rounded-sm shrink-0 flex flex-col justify-between py-0.5 px-0.5">
                            <div className="h-0.5 w-full rounded-full bg-zinc-600" />
                            <div className="h-0.5 w-full rounded-full bg-zinc-600" />
                          </div>
                        </div>

                        {/* -------------------------------------------------------------
                            SLIDE-OUT EXPANDED TELEMETRY DRAWER (ON HOVER / EXTRACT)
                            ------------------------------------------------------------- */}
                        {isExtracted && doorOpen && (
                          <div className="p-2.5 bg-black/95 border-t border-zinc-800 space-y-2 font-mono animate-in fade-in slide-in-from-top-1 duration-150">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs">
                              {/* Specs */}
                              <div className="p-1.5 rounded-md bg-zinc-950 border border-zinc-800 space-y-0.5">
                                <span className="text-[8.5px] text-zinc-400 uppercase flex items-center gap-1 font-bold">
                                  <Cpu className="h-2.5 w-2.5 text-cyan-400" /> Computing Profile
                                </span>
                                <p className="font-semibold text-zinc-200 text-[10.5px]">
                                  {srv.cpu || '16 vCPU'} • {srv.ram || '32 GB'}
                                </p>
                                <p className="text-[8.5px] text-zinc-400">{srv.diskUsage || 'Storage: 45%'}</p>
                              </div>

                              {/* OS & Hostname */}
                              <div className="p-1.5 rounded-md bg-zinc-950 border border-zinc-800 space-y-0.5">
                                <span className="text-[8.5px] text-zinc-400 uppercase flex items-center gap-1 font-bold">
                                  <Shield className="h-2.5 w-2.5 text-emerald-400" /> OS & Hostname
                                </span>
                                <p className="font-semibold text-zinc-200 text-[10.5px] truncate">{srv.operatingSystem || 'Enterprise OS'}</p>
                                <p className="text-[8.5px] text-zinc-400 truncate">{srv.hostname || srv.ipAddress}</p>
                              </div>

                              {/* Ping Telemetry */}
                              <div className="p-1.5 rounded-md bg-zinc-950 border border-zinc-800 space-y-0.5">
                                <span className="text-[8.5px] text-zinc-400 uppercase flex items-center gap-1 font-bold">
                                  <Activity className="h-2.5 w-2.5 text-emerald-400" /> Ping ICMP
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`text-xs font-bold ${
                                      isOnline ? 'text-emerald-400' : 'text-rose-500'
                                    }`}
                                  >
                                    {isOnline ? `${srv.latencyMs || 1} ms` : 'TIMED OUT'}
                                  </span>
                                  {isOnline && (
                                    <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                                      0% Loss
                                    </span>
                                  )}
                                </div>
                                <p className="text-[8px] text-zinc-500">
                                  Port: {srv.port || 80}
                                </p>
                              </div>
                            </div>

                            {/* REAR CABLING & POWER HARNESS SUMMARY */}
                            <div className="p-1.5 rounded-md bg-zinc-950 border border-zinc-800 flex items-center justify-between text-[8px] font-mono">
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-400 uppercase font-bold flex items-center gap-1">
                                  <Cable className="h-2.5 w-2.5 text-cyan-400" /> Rear Cabling:
                                </span>
                                <span className="text-cyan-300 font-semibold flex items-center gap-0.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> 10G OM4 Fiber
                                </span>
                                <span className="text-blue-300 font-semibold flex items-center gap-0.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Cat6A Eth
                                </span>
                                <span className="text-red-300 font-semibold flex items-center gap-0.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Dual AC C13
                                </span>
                              </div>
                              <span className="text-emerald-400 font-bold hidden sm:inline">
                                CMA Carrier Tension: Optimal
                              </span>
                            </div>

                            {/* Action Bar */}
                            <div className="flex items-center justify-between pt-0.5">
                              <span className="text-[8.5px] text-zinc-400 truncate max-w-[180px]">
                                {srv.remarks || 'ITV Production Server'}
                              </span>

                              <div className="flex items-center gap-1.5">
                                {/* Copy IP */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (srv.ipAddress) onCopyIp(srv.ipAddress);
                                  }}
                                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[9.5px] flex items-center gap-1 border border-zinc-600 transition"
                                >
                                  {copiedIp === srv.ipAddress ? (
                                    <>
                                      <Check className="h-2.5 w-2.5 text-emerald-400" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-2.5 w-2.5" />
                                      <span>Copy IP</span>
                                    </>
                                  )}
                                </button>

                                {/* Ping Single */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onPingSingle(srv);
                                  }}
                                  className="px-2 py-0.5 rounded bg-primary hover:bg-primary/90 text-primary-foreground text-[9.5px] font-bold flex items-center gap-1 transition"
                                >
                                  <Activity className="h-2.5 w-2.5" />
                                  <span>Ping</span>
                                </button>

                                {/* Test Alert Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSimulateOffline(srv);
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[8.5px] border border-rose-500/30 transition"
                                  title="Test offline popup alert"
                                >
                                  Test Alert
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* -------------------------------------------------------------
                          REAR CABLE MANAGEMENT ARM (CMA) - EXTENDS BEHIND EXTRACTED BLADE
                          ------------------------------------------------------------- */}
                      {isExtracted && doorOpen && (
                        <div className="relative -mt-1 mb-1.5 p-2 bg-[#090a0f] rounded-b-lg border-x border-b border-cyan-500/30 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="flex items-center justify-between text-[8px] font-mono text-zinc-400 mb-1.5 pb-1 border-b border-zinc-800">
                            <span className="flex items-center gap-1 font-bold text-cyan-300">
                              <Cable className="h-2.5 w-2.5 text-cyan-400" /> REAR CABLE MANAGEMENT ARM (CMA) • ITV MCR
                            </span>
                            <span className="text-[7.5px] font-mono text-emerald-400 font-bold">
                              ● TELESCOPING CARRIER EXTENDED
                            </span>
                          </div>

                          {/* Articulated Folding Cable Arm Graphic (SVG) */}
                          <div className="relative h-12 bg-black/80 rounded border border-zinc-800 p-1 flex items-center justify-between overflow-hidden">
                            {/* Rack Rear Mounting Rail Bracket */}
                            <div className="h-full w-5 bg-zinc-900 border-r border-zinc-700 flex flex-col justify-around py-1 px-0.5 shrink-0">
                              <div className="h-1 w-full bg-zinc-600 rounded-sm" />
                              <div className="h-1 w-full bg-zinc-600 rounded-sm" />
                            </div>

                            {/* SVG Articulated Snake Folding Arm + Dual Power, Fiber & Cat6A Cables */}
                            <svg className="w-full h-full flex-1 mx-1.5" viewBox="0 0 360 48" preserveAspectRatio="none">
                              {/* Steel Arm Folding Segments */}
                              <path
                                d="M 10,24 L 90,8 L 180,38 L 270,12 L 350,24"
                                fill="none"
                                stroke="#3f3f46"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              {/* Arm Steel Bearings */}
                              <circle cx="90" cy="8" r="4" fill="#a1a1aa" stroke="#27272a" strokeWidth="1.5" />
                              <circle cx="180" cy="38" r="4" fill="#a1a1aa" stroke="#27272a" strokeWidth="1.5" />
                              <circle cx="270" cy="12" r="4" fill="#a1a1aa" stroke="#27272a" strokeWidth="1.5" />

                              {/* C13 Power Cables (Red & Black) */}
                              <path
                                d="M 10,21 Q 90,4 180,34 T 350,21"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                opacity="0.95"
                              />
                              <path
                                d="M 10,26 Q 90,11 180,41 T 350,26"
                                fill="none"
                                stroke="#18181b"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                              />

                              {/* Cat6A Gigabit Ethernet Cable (Royal Blue) */}
                              <path
                                d="M 10,18 Q 90,2 180,32 T 350,18"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                              />

                              {/* 10G OM4 Fiber Optic Twin Zip Cable (Bright Aqua Cyan) */}
                              <path
                                d="M 10,15 Q 90,-1 180,29 T 350,15"
                                fill="none"
                                stroke="#06b6d4"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                              />

                              {/* Management / iLO Cable (Bright Amber/Yellow) */}
                              <path
                                d="M 10,28 Q 90,14 180,44 T 350,28"
                                fill="none"
                                stroke="#eab308"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />

                              {/* Velcro Cable Straps along the arm */}
                              <rect x="85" y="4" width="8" height="8" rx="1.5" fill="#f59e0b" />
                              <rect x="175" y="34" width="8" height="8" rx="1.5" fill="#f59e0b" />
                              <rect x="265" y="8" width="8" height="8" rx="1.5" fill="#f59e0b" />
                            </svg>

                            {/* Rear Server I/O Chassis Connector Plugs */}
                            <div className="h-full bg-zinc-900 border-l border-zinc-700 px-1.5 flex flex-col justify-around shrink-0 text-[7px] font-mono text-zinc-300">
                              <div className="flex items-center gap-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_#34d399]" />
                                <span>PSU 1+2 OK</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee] animate-pulse" />
                                <span>10G SFP+ ACT</span>
                              </div>
                            </div>
                          </div>

                          {/* Cable Harness Breakdown Legend */}
                          <div className="grid grid-cols-4 gap-1 mt-1 text-[7px] font-mono">
                            <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                              <div className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_3px_#ef4444]" />
                              <span className="text-zinc-300 truncate">PWR C13 220V</span>
                            </div>
                            <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_3px_#22d3ee]" />
                              <span className="text-zinc-300 truncate">OM4 10G Fiber</span>
                            </div>
                            <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_3px_#3b82f6]" />
                              <span className="text-zinc-300 truncate">Cat6A Eth #1</span>
                            </div>
                            <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                              <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_3px_#fbbf24]" />
                              <span className="text-zinc-300 truncate">iLO / Mgt IPMI</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* 5. BOTTOM 2x CYBERPOWER UPS BATTERY TOWERS */}
            <div className="p-2 bg-gradient-to-t from-black via-[#0d0e12] to-[#121319] border-t border-zinc-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] font-mono text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Zap className="h-2.5 w-2.5 text-amber-400" /> CYBERPOWER UPS BACKUP
                </span>
                <span className="text-[7.5px] font-mono text-zinc-500">Dual Battery Bank</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                {Array.from({ length: 2 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-9 sm:h-10 rounded-md bg-gradient-to-b from-[#181920] to-[#0a0b0e] border border-zinc-700/80 p-1.5 flex items-center justify-between shadow-[inset_0_1px_2px_rgba(255,255,255,0.06),0_2px_4px_rgba(0,0,0,0.8)]"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-cyan-400/20 border border-cyan-400 flex items-center justify-center">
                        <div className="h-1 w-1 rounded-full bg-cyan-400 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[7.5px] font-mono text-zinc-400 block font-bold leading-tight">
                          CyberPower #{idx + 1}
                        </span>
                        <span className="text-[7px] font-mono text-emerald-400">220V ONLINE</span>
                      </div>
                    </div>

                    <div className="w-12 bg-zinc-800 h-1.5 rounded overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded" style={{ width: '85%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            FRONT TEMPERED GLASS DOOR WITH INTEGRATED SUPREMA LOCK
            - CLOSED (!doorOpen): Tinted glass covers the full rack front; Suprema & lock handle on right edge (fixed top-20)
            - OPEN (doorOpen): Door stands open to the LEFT with rack frame; Suprema & lock handle remain ON THE DOOR at the left (fixed top-20)
            - Fixed top-20 coordinate PREVENTS ANY DANCING when servers expand or collapse
            ========================================================= */}
        {!doorOpen ? (
          /* CLOSED DOOR: Full glass cover across rack with Suprema & Lock Handle on right */
          <div
            onClick={handleOpenDoorRequested}
            className="absolute inset-0 z-30 transition-all duration-500 pointer-events-auto cursor-pointer"
          >
            {/* Glass Door Outer Steel Bezel & Polished Glass Surface */}
            <div className="w-full h-full relative overflow-hidden transition-all duration-500 border-2 sm:border-[2.5px] border-cyan-400/50 bg-gradient-to-br from-cyan-400/[0.08] via-sky-300/[0.04] to-cyan-500/[0.09] backdrop-blur-[1.5px] shadow-[inset_0_0_35px_rgba(34,211,238,0.22),inset_0_1.5px_3px_rgba(255,255,255,0.7),0_20px_50px_rgba(0,0,0,0.85)]">
              {/* 1. Dramatic Diagonal Specular Light Glare Reflections across the Glass */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(125deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 16%, transparent 34%, rgba(255,255,255,0.2) 58%, rgba(255,255,255,0.05) 72%, transparent 88%)',
                }}
              />

              {/* Secondary Glass Edge Sheens */}
              <div className="absolute top-0 right-0 w-28 h-full bg-gradient-to-l from-white/[0.08] via-cyan-400/[0.04] to-transparent pointer-events-none" />
              <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-white/[0.06] to-transparent pointer-events-none" />

              {/* Glass Polished Bevel Inner Border */}
              <div className="absolute inset-1.5 border border-white/20 rounded-sm pointer-events-none" />

              {/* 4x Heavy-Duty Metallic Screw Studs at the Corners */}
              <div className="absolute top-2.5 left-2.5 w-3 h-3 rounded-full bg-gradient-to-br from-zinc-200 via-zinc-400 to-zinc-600 border border-zinc-700 shadow flex items-center justify-center pointer-events-none">
                <div className="w-1 h-1 rounded-sm bg-zinc-800" />
              </div>
              <div className="absolute top-2.5 right-2.5 w-3 h-3 rounded-full bg-gradient-to-br from-zinc-200 via-zinc-400 to-zinc-600 border border-zinc-700 shadow flex items-center justify-center pointer-events-none">
                <div className="w-1 h-1 rounded-sm bg-zinc-800" />
              </div>
              <div className="absolute bottom-2.5 left-2.5 w-3 h-3 rounded-full bg-gradient-to-br from-zinc-200 via-zinc-400 to-zinc-600 border border-zinc-700 shadow flex items-center justify-center pointer-events-none">
                <div className="w-1 h-1 rounded-sm bg-zinc-800" />
              </div>
              <div className="absolute bottom-2.5 right-2.5 w-3 h-3 rounded-full bg-gradient-to-br from-zinc-200 via-zinc-400 to-zinc-600 border border-zinc-700 shadow flex items-center justify-center pointer-events-none">
                <div className="w-1 h-1 rounded-sm bg-zinc-800" />
              </div>

              {/* Left Heavy-Duty Stainless Steel Hinges */}
              <div className="absolute left-0 top-8 w-3 h-8 bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-500 rounded-r border-y border-r border-zinc-600 shadow-md flex flex-col justify-between py-1">
                <div className="h-0.5 w-1.5 bg-zinc-700 mx-auto rounded-full" />
                <div className="h-0.5 w-1.5 bg-zinc-700 mx-auto rounded-full" />
              </div>
              <div className="absolute left-0 bottom-8 w-3 h-8 bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-500 rounded-r border-y border-r border-zinc-600 shadow-md flex flex-col justify-between py-1">
                <div className="h-0.5 w-1.5 bg-zinc-700 mx-auto rounded-full" />
                <div className="h-0.5 w-1.5 bg-zinc-700 mx-auto rounded-full" />
              </div>

              {/* Right Mechanical Glass Strike Plate */}
              <div className="absolute right-1 top-20 w-2 h-16 rounded-l bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-500 border-l border-y border-zinc-600 shadow flex flex-col justify-between py-1 pointer-events-none">
                <div className="h-1 w-1 bg-zinc-800 rounded-full mx-auto" />
                <div className="h-2 w-1 bg-zinc-900 rounded-sm mx-auto" />
                <div className="h-1 w-1 bg-zinc-800 rounded-full mx-auto" />
              </div>

              {/* Suprema BioStation Terminal (Mounted on Door at Right Edge, fixed top-20) */}
              <div
                className="absolute right-2.5 top-20 pointer-events-auto z-40 select-none"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDoorRequested();
                }}
              >
                <SupremaRackTerminal
                  doorOpen={false}
                  onOpenTerminal={() => setIsSupremaOpen(true)}
                  onLockDoor={handleLockCabinet}
                  soundEnabled={soundEnabled}
                  onPlaySound={onPlaySound}
                />
              </div>

              {/* Etched Glass Safety Label */}
              <div className="absolute bottom-3 left-4 text-[7px] font-mono text-cyan-200/80 uppercase tracking-widest flex items-center gap-1.5 select-none pointer-events-none drop-shadow">
                <span className="text-[9px]">⛊</span>
                <span>TEMPERED SAFETY GLASS</span>
                <span>•</span>
                <span>BS EN 12150</span>
                <span>•</span>
                <span>R.F. MOTE MCR-42U</span>
              </div>
            </div>
          </div>
        ) : (
          /* OPEN DOOR: Swung open OUTSIDE to the LEFT of the rack (in user's marked area), attached via heavy-duty steel hinges */
          <>
            {/* Open Tempered Glass Door Wing positioned in user-marked area to the left of the rack (Slim profile) */}
            <div
              className="absolute right-full mr-1.5 top-0 bottom-0 w-20 sm:w-24 z-40 pointer-events-auto select-none transition-all duration-300"
              style={{
                perspective: '900px',
              }}
            >
              {/* Heavy-Duty Stainless Steel Pivot Hinges physically connecting Door to the Rack's Left Frame */}
              <div className="absolute -right-2 top-8 w-2.5 h-7 bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-500 rounded-sm border border-zinc-600 shadow-md flex flex-col justify-between py-1 z-50">
                <div className="h-0.5 w-1 bg-zinc-700 mx-auto rounded-full" />
                <div className="h-0.5 w-1 bg-zinc-700 mx-auto rounded-full" />
              </div>
              <div className="absolute -right-2 bottom-8 w-2.5 h-7 bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-500 rounded-sm border border-zinc-600 shadow-md flex flex-col justify-between py-1 z-50">
                <div className="h-0.5 w-1 bg-zinc-700 mx-auto rounded-full" />
                <div className="h-0.5 w-1 bg-zinc-700 mx-auto rounded-full" />
              </div>

              {/* 3D-angled Open Glass Door Panel (Slim Profile) */}
              <div
                className="w-full h-full relative border-2 border-cyan-400/80 bg-gradient-to-r from-cyan-950/90 via-cyan-900/40 to-cyan-500/10 rounded-l-2xl backdrop-blur-[2px] shadow-[-8px_0_30px_rgba(6,182,212,0.35)] flex flex-col justify-between py-3 px-1 overflow-hidden cursor-pointer"
                onClick={handleLockCabinet}
                title="Click anywhere on the open glass door to swing shut and lock cabinet"
              >
                {/* Diagonal Specular Reflection across Open Glass Door */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 40%, rgba(34,211,238,0.15) 70%, transparent 100%)',
                  }}
                />

                {/* Top Status Header on the Open Door */}
                <div className="px-1 pt-0.5 border-b border-cyan-500/30 pb-1.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-[7px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>OPEN</span>
                  </div>
                  <span className="text-[5.5px] font-mono text-zinc-400 block mt-0.5 truncate">
                    HINGED LEFT
                  </span>
                </div>

                {/* Suprema BioStation Terminal (Mounted ON THE OPEN DOOR in marked area, perfectly centered, fixed top-20) */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-20 z-50 select-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLockCabinet();
                  }}
                >
                  <SupremaRackTerminal
                    doorOpen={true}
                    onOpenTerminal={() => setIsSupremaOpen(true)}
                    onLockDoor={handleLockCabinet}
                    soundEnabled={soundEnabled}
                    onPlaySound={onPlaySound}
                  />
                </div>
              </div>
            </div>

            {/* Right Solenoid Strike Plate on Rack Frame (Showing Door Open / Ready to Receive Latch) */}
            <div className="absolute right-1 top-20 w-2 h-16 rounded-l bg-gradient-to-r from-zinc-700 via-zinc-800 to-black border-l border-y border-zinc-700 shadow flex flex-col justify-between py-1 pointer-events-none opacity-60">
              <div className="h-1 w-1 bg-zinc-600 rounded-full mx-auto" />
              <div className="h-2 w-1 bg-emerald-400/80 rounded-sm mx-auto shadow-[0_0_4px_#34d399]" />
              <div className="h-1 w-1 bg-zinc-600 rounded-full mx-auto" />
            </div>
          </>
        )}
      </div>

          {/* Rack Base Plinth */}
          <div className="py-1 px-3 bg-black text-center text-[7.5px] font-mono text-zinc-500 border-t border-zinc-900 rounded-b-xl flex items-center justify-between">
            <span className="text-[6.5px] text-zinc-600 flex items-center gap-1 font-mono">
              <span className="h-1 w-1 rounded-full bg-emerald-500 inline-block" />
              EARTH BONDED
            </span>
            <span>INDEPENDENT TELEVISION MCR • ITV RACK {rackNumber}</span>
            <span className="text-[6.5px] text-zinc-600 font-mono">EIA-310-D STD</span>
          </div>

          {/* Suprema Access Control Keypad Modal */}
          <SupremaAccessModal
            isOpen={isSupremaOpen}
            onClose={() => setIsSupremaOpen(false)}
            onAccessGranted={handleAccessGranted}
            rackNumber={rackNumber}
            soundEnabled={soundEnabled}
            onPlaySound={onPlaySound}
          />
        </div>

        {/* 3D Bottom Leveling Feet Plinth & Floor Shadow */}
        {is3DMode && (
          <div className="relative pt-1">
            {/* 4 Heavy-Duty M16 Leveling Studs / Seismic Mounting Feet */}
            <div className="mx-4 flex items-center justify-between px-2">
              {/* Left Foot */}
              <div className="flex flex-col items-center">
                <div className="w-4 h-1.5 bg-zinc-600 rounded-t border-t border-x border-zinc-500 shadow-sm" />
                <div className="w-1.5 h-1.5 bg-zinc-400 border-x border-zinc-500" />
                <div className="w-6 h-2 bg-gradient-to-b from-zinc-800 to-zinc-950 rounded-b-md border border-zinc-700 shadow-lg" />
              </div>

              {/* Center Anti-Tip Floor Bracket */}
              <div className="px-3 py-0.5 rounded bg-zinc-950/80 border border-zinc-800/80 text-[6.5px] text-zinc-500 font-mono uppercase tracking-widest">
                HEAVY-DUTY CASTER • SEISMIC FLOOR ANCHOR
              </div>

              {/* Right Foot */}
              <div className="flex flex-col items-center">
                <div className="w-4 h-1.5 bg-zinc-600 rounded-t border-t border-x border-zinc-500 shadow-sm" />
                <div className="w-1.5 h-1.5 bg-zinc-400 border-x border-zinc-500" />
                <div className="w-6 h-2 bg-gradient-to-b from-zinc-800 to-zinc-950 rounded-b-md border border-zinc-700 shadow-lg" />
              </div>
            </div>

            {/* Ambient Floor Shadow / Ambient Occlusion */}
            <div className="mx-auto mt-1 w-[85%] h-4 bg-gradient-to-r from-transparent via-black/80 to-transparent blur-md rounded-full pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  );
}
