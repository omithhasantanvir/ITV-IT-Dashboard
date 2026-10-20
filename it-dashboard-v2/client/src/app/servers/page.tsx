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
} from 'lucide-react';
import api from '@/lib/api';
import { AccessGuard } from '@/components/AccessGuard';
import { BrandLoading } from '@/components/BrandLoading';
import { showErrorAlert, showSuccessAlert } from '@/lib/sweetalert';
import Swal from 'sweetalert2';
import { ServerRack } from '@/components/servers/rack/ServerRack';
import { RACK_01_EQUIPMENT, RACK_02_EQUIPMENT } from '@/components/servers/rack/RackData';
import { RackEquipment, ServerNode, SoundType } from '@/components/servers/rack/RackTypes';

// Synthesize physical datacenter audio effects (relay click, rail slide, door, chime, alert)
const playSound = (type: 'beep' | 'alert' | 'slide' | 'door' | 'key' | 'grant' | 'deny' | 'click') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'slide') {
      // Mechanical ball-bearing telescopic rail slide friction whoosh
      const bufferSize = ctx.sampleRate * 0.18;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.06));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(450, now + 0.16);
      filter.Q.value = 3.5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } else if (type === 'door') {
      // Heavy cabinet door magnetic latch / latch lock click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } else if (type === 'key' || type === 'click') {
      // Tactile relay switch click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1450, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.035);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'alert') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.setValueAtTime(780, now + 0.15);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } else {
      // Clean high-tech status chirp
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
    // Audio context may be restricted by browser autoplay policy
  }
};

export default function ServersPage() {
  const [servers, setServers] = useState<ServerNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState(false);
  const [autoPing, setAutoPing] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<'rack' | 'grid'>('rack');
  const [search, setSearch] = useState('');

  // Equipment selection and pull-out state
  const [selectedEquipmentR1, setSelectedEquipmentR1] = useState<RackEquipment | null>(null);
  const [selectedEquipmentR2, setSelectedEquipmentR2] = useState<RackEquipment | null>(null);
  const [hoveredEquipmentId, setHoveredEquipmentId] = useState<string | null>(null);
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

  // Background ping loop (Runs every 6 seconds)
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

  // Global Escape key handler to retract any pulled-out server
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedEquipmentR1) {
          playSound('slide');
          setSelectedEquipmentR1(null);
        }
        if (selectedEquipmentR2) {
          playSound('slide');
          setSelectedEquipmentR2(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEquipmentR1, selectedEquipmentR2]);

  // Telemetry KPIs
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

  // Filtered servers for grid view
  const filteredServers = useMemo(() => {
    if (!search.trim()) return servers;
    const q = search.toLowerCase();
    return servers.filter(
      (s) =>
        s.serverName.toLowerCase().includes(q) ||
        (s.ipAddress && s.ipAddress.toLowerCase().includes(q)) ||
        (s.purpose && s.purpose.toLowerCase().includes(q)) ||
        (s.serverType && s.serverType.toLowerCase().includes(q))
    );
  }, [servers, search]);

  return (
    <AccessGuard module="servers">
      <div className="space-y-6">
        {/* =========================================================================
            TOP HEADER: INDEPENDENT TELEVISION BROADCAST DATACENTER
            ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-zinc-800 to-black border border-zinc-700/80 flex items-center justify-center text-cyan-400 shadow-xl shadow-black/60 shrink-0">
                <Server className="h-6 w-6 stroke-[2]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  Datacenter Server Racks & Infrastructure Telemetry
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enterprise Server Cabinets with physical slide-out rails, live ICMP latency, and power distribution.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Switcher: Dual Rack View vs Grid Cards */}
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

        {/* =========================================================================
            KPI OVERVIEW CARDS
            ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Dual Server Racks</p>
              <p className="text-xl font-bold text-foreground">2 Racks / {stats.total} Nodes</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Online Nodes</p>
              <p className="text-xl font-bold text-emerald-500">{stats.online} Active</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm shadow-sm flex items-center gap-3">
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

          <div className="p-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold">
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
          <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 backdrop-blur-md flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
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
            MAIN VIEW: DUAL PHYSICAL SERVER CABINETS (SIDE-BY-SIDE)
            ========================================================================= */}
        {viewMode === 'rack' ? (
          loading ? (
            <div className="flex flex-col items-center justify-center h-80 space-y-3">
              <BrandLoading size="md" text="Syncing Datacenter Server Racks..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-start max-w-[1360px] mx-auto px-2 sm:px-4">
              {/* ITV RACK 01: Core Enterprise & Newsroom */}
              <div className={`transition-opacity duration-300 w-full flex justify-center ${selectedEquipmentR2 ? 'opacity-35 pointer-events-none' : 'opacity-100'}`}>
                <ServerRack
                  rackNumber="01"
                  rackTitle="ITV RACK 01 • CORE ENTERPRISE & NEWSROOM"
                  rackSub="Subnet: 172.19.4.x / 172.19.8.x • Power: 2.4 kW"
                  equipmentList={RACK_01_EQUIPMENT}
                  servers={servers}
                  selectedEquipment={selectedEquipmentR1}
                  onSelectEquipment={(eq) => {
                    setSelectedEquipmentR1(eq);
                    if (eq) setSelectedEquipmentR2(null);
                  }}
                  hoveredEquipmentId={hoveredEquipmentId}
                  onHoverEquipment={setHoveredEquipmentId}
                  onPingSingle={handlePingSingle}
                  onCopyIp={handleCopyIp}
                  copiedIp={copiedIp}
                  soundEnabled={soundEnabled}
                  onPlaySound={playSound}
                />
              </div>

              {/* ITV RACK 02: Grass Valley Broadcast System */}
              <div className={`transition-opacity duration-300 w-full flex justify-center ${selectedEquipmentR1 ? 'opacity-35 pointer-events-none' : 'opacity-100'}`}>
                <ServerRack
                  rackNumber="02"
                  rackTitle="ITV RACK 02 • GRASS VALLEY BROADCAST SYSTEM"
                  rackSub="Subnet: 10.1.2.x / 10.1.4.x • Power: 3.1 kW"
                  equipmentList={RACK_02_EQUIPMENT}
                  servers={servers}
                  selectedEquipment={selectedEquipmentR2}
                  onSelectEquipment={(eq) => {
                    setSelectedEquipmentR2(eq);
                    if (eq) setSelectedEquipmentR1(null);
                  }}
                  hoveredEquipmentId={hoveredEquipmentId}
                  onHoverEquipment={setHoveredEquipmentId}
                  onPingSingle={handlePingSingle}
                  onCopyIp={handleCopyIp}
                  copiedIp={copiedIp}
                  soundEnabled={soundEnabled}
                  onPlaySound={playSound}
                />
              </div>
            </div>
          )
        ) : (
          /* =========================================================================
             GRID VIEW: 14 SERVER CARDS WITH LIVE TELEMETRY
             ========================================================================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredServers.map((srv) => {
              const isOnline = srv.status === 'ONLINE' || srv.online === true;
              return (
                <div
                  key={srv.id}
                  className={`p-5 rounded-xl border transition-all duration-300 relative group overflow-hidden ${
                    isOnline
                      ? 'border-border bg-card/80 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10'
                      : 'border-rose-500/40 bg-rose-500/5 shadow-lg shadow-rose-500/10'
                  }`}
                >
                  <div className="text-center space-y-3 font-mono">
                    <div>
                      <h3 className="text-base font-bold text-foreground tracking-tight">{srv.serverName}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{srv.ipAddress || '0.0.0.0'}</p>
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
                      <span className="font-bold text-foreground">
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
