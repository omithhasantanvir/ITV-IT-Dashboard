'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  Computer,
  Server,
  RefreshCw,
  ArrowUpRight,
  Clock,
  Activity,
  AlertTriangle,
  Radio,
  Tv,
  Maximize2,
  ExternalLink,
  FileSpreadsheet,
  Layers,
  PhoneCall,
  Calendar,
  CheckCircle2,
  Wrench,
  QrCode,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import api from '@/lib/api';
import { formatNumber, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scheduled maintenance tasks from storage
  const [scheduledTasks, setScheduledTasks] = useState<any[]>([]);

  const fetchSummary = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await api.get('/api/dashboard/summary');
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();

    // Read scheduled tasks
    try {
      const stored = localStorage.getItem('itv_scheduled_maintenance_tasks_v2');
      if (stored) {
        setScheduledTasks(JSON.parse(stored));
      }
    } catch {
      // fallback
    }
  }, []);

  const stats = data?.stats || {};
  const summary = data?.summary || {};

  const pendingSchedules = scheduledTasks.filter((t) => t.status === 'Pending');
  const completedSchedules = scheduledTasks.filter((t) => t.status === 'Completed');
  const nextPendingSchedule = pendingSchedules[0] || null;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ======================================================== */}
      {/* 1. Page Header with Operational Subtext                  */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span>IT Operations Control Center</span>
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase tracking-wider">
              CENTRAL OPS
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Independent Television &bull; Unified broadcast infrastructure telemetry, assets, and engineering schedules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/live"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 text-xs font-semibold transition-colors"
          >
            <Tv className="h-3.5 w-3.5" />
            <span>Watch Live Transmission</span>
          </Link>

          <button
            onClick={() => fetchSummary(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition shadow-2xs w-fit"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-primary' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. Executive Overview Metrics Grid (5 Columns on Desktop) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Staff */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Staff</span>
            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-2 font-mono">
            {loading ? '...' : formatNumber(stats.totalEmployees)}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>{formatNumber(stats.activeEmployees)} Active &bull; {formatNumber(stats.formerEmployees)} Former</span>
          </p>
        </div>

        {/* IT Operations Team */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">IT Operations</span>
            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-2 font-mono">
            {loading ? '...' : formatNumber(stats.itTeamMembers)}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1">
            Engineers &amp; Admins on duty
          </p>
        </div>

        {/* Hardware Assets */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hardware Assets</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Computer className="h-3.5 w-3.5" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-2 font-mono">
            {loading ? '...' : formatNumber(stats.totalComputers)}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
            <span className="text-emerald-500 font-semibold">{formatNumber(stats.assignedComputers)} Assigned</span>
            &bull;
            <span>{formatNumber(stats.availableComputers)} Spare</span>
          </p>
        </div>

        {/* Datacenter Fleet */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Datacenter Fleet</span>
            <div className="h-7 w-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <Server className="h-3.5 w-3.5" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-2 font-mono">
            {loading ? '...' : `${formatNumber(stats.onlineServers)} / ${formatNumber(stats.totalServers)}`}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>{formatNumber(stats.onlineServers)} Online Monitored</span>
          </p>
        </div>

        {/* Scheduled Maintenance */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Maintenance Schedule</span>
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Wrench className="h-3.5 w-3.5" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-2 font-mono">
            {pendingSchedules.length} Pending
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1">
            {completedSchedules.length} Completed cycles
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. Main Dashboard 2-Column Grid (8 Left, 4 Right)         */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ====================================================== */}
        {/* LEFT COLUMN (8 Cols): Datacenter Nodes & Schedule Feed */}
        {/* ====================================================== */}
        <div className="lg:col-span-8 space-y-5">
          {/* Datacenter Infrastructure Server Nodes */}
          <div className="p-4 sm:p-5 rounded-xl border border-border bg-card shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Server className="h-4 w-4 text-primary" />
                  <span>Monitored Datacenter &amp; Broadcast Servers</span>
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Core broadcast rundown, playout engines, and domain controllers
                </p>
              </div>
              <Link
                href="/servers"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Full Telemetry</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {summary.serverStatus?.length > 0 ? (
                summary.serverStatus.map((srv: any) => (
                  <div
                    key={srv.id}
                    className="p-3 rounded-lg border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 truncate mr-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                          srv.status === 'ONLINE'
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                            : srv.status === 'WARNING'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                      />
                      <div className="truncate">
                        <p className="text-xs font-bold text-foreground truncate">{srv.serverName}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">
                          {srv.ipAddress || srv.hostname} &bull; {srv.serverType || 'Server'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded shrink-0 uppercase ${
                        srv.status === 'ONLINE'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}
                    >
                      {srv.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground col-span-2 text-center py-6">
                  No monitored servers recorded.
                </p>
              )}
            </div>
          </div>

          {/* Upcoming Scheduled Maintenance Spotlight */}
          {nextPendingSchedule && (
            <div className="p-4 sm:p-5 rounded-xl border border-border bg-card shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-foreground">Upcoming Scheduled Maintenance</h3>
                </div>
                <Link
                  href="/maintenance/task-submission"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Open Schedule</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="p-3.5 rounded-lg bg-muted/30 border border-border space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {nextPendingSchedule.scheduledTask}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ffc107] text-black">
                      Pending
                    </span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground font-semibold">
                    {nextPendingSchedule.date} ({nextPendingSchedule.dayOfWeek})
                  </span>
                </div>

                <div className="whitespace-pre-line text-xs text-foreground/80 font-sans leading-relaxed pt-1">
                  {nextPendingSchedule.task}
                </div>
              </div>
            </div>
          )}

          {/* Subgrid: Recent Staff Onboarding & Audit Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Recent Employees */}
            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span>Recently Added Staff</span>
                </h3>
                <Link href="/employees" className="text-xs font-semibold text-primary hover:underline">
                  View All
                </Link>
              </div>

              <div className="space-y-2">
                {summary.recentEmployees?.length > 0 ? (
                  summary.recentEmployees.slice(0, 4).map((emp: any) => (
                    <div
                      key={emp.id}
                      className="p-2.5 rounded-lg border border-border/80 bg-muted/20 flex items-center justify-between text-xs"
                    >
                      <div className="truncate mr-2">
                        <p className="font-bold text-foreground truncate">{emp.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {emp.designation} &bull; {emp.department}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                        {formatDate(emp.joiningDate)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No employees found.</p>
                )}
              </div>
            </div>

            {/* Recent Activity Audit */}
            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  <span>Operations Audit Log</span>
                </h3>
                <Link href="/activity" className="text-xs font-semibold text-primary hover:underline">
                  Audit View
                </Link>
              </div>

              <div className="space-y-2">
                {summary.recentActivities?.length > 0 ? (
                  summary.recentActivities.slice(0, 4).map((act: any) => (
                    <div
                      key={act.id}
                      className="p-2.5 rounded-lg border border-border/80 bg-muted/20 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate mr-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-foreground truncate">
                            <span className="text-primary font-bold">{act.user || 'Admin'}</span>: {act.action}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">Module: {act.module}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                        {formatDate(act.timestamp)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No audit entries.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================== */}
        {/* RIGHT COLUMN (4 Cols): Live Broadcast, Roster, Actions */}
        {/* ====================================================== */}
        <div className="lg:col-span-4 space-y-5">
          {/* Live Broadcast Television Feed */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                </span>
                <span className="font-bold text-foreground tracking-wide flex items-center gap-1.5">
                  <Tv className="h-3.5 w-3.5 text-red-500" />
                  <span>ITV Live Playout</span>
                </span>
              </div>

              <div className="flex items-center gap-1 text-[10px] font-mono">
                <Link
                  href="/live"
                  className="px-2 py-0.5 rounded hover:bg-muted text-primary hover:underline font-bold transition flex items-center gap-1"
                >
                  <Maximize2 className="h-3 w-3" />
                  <span>Theater</span>
                </Link>
                <a
                  href="https://www.youtube.com/watch?v=iWq2kH0iq2Q"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition"
                  title="Watch on YouTube"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border bg-black shadow-inner">
              <iframe
                src="https://www.youtube-nocookie.com/embed/iWq2kH0iq2Q?autoplay=1&mute=1&playsinline=1&controls=1&rel=0&modestbranding=1"
                title="Independent Television YouTube Live"
                className="w-full h-full border-0 absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-0.5">
              <span className="flex items-center gap-1 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                BS-1 Satellite &bull; 1080p 50Hz
              </span>
              <span className="font-mono text-muted-foreground">Transmission Active</span>
            </div>
          </div>

          {/* IT Duty Roster Team on Duty */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">IT Duty Roster</h3>
                <p className="text-[10px] text-muted-foreground">Engineers on shift today</p>
              </div>
              <Link href="/roster" className="text-xs font-semibold text-primary hover:underline">
                View Roster
              </Link>
            </div>

            <div className="space-y-2">
              {summary.itTeam?.length > 0 ? (
                summary.itTeam.slice(0, 4).map((mem: any) => (
                  <div
                    key={mem.id}
                    className="p-2.5 rounded-lg border border-border/80 bg-muted/20 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate mr-2">
                      <div className="h-7 w-7 rounded-md bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {mem.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-foreground truncate">{mem.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{mem.designation}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          mem.itStatus === 'AVAILABLE'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}
                      >
                        {mem.itStatus || 'ON DUTY'}
                      </span>
                      <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
                        Ext: {mem.extensionNumber || '—'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No roster active.</p>
              )}
            </div>
          </div>

          {/* Core Operations Quick Shortcuts */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Core Operations Shortcuts
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <Link
                href="/slips"
                className="p-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted text-center text-foreground transition-colors flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                <span>Employee Slip</span>
              </Link>
              <Link
                href="/maintenance/task-submission"
                className="p-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted text-center text-foreground transition-colors flex items-center justify-center gap-1.5"
              >
                <Wrench className="h-3.5 w-3.5 text-amber-500" />
                <span>Schedule Task</span>
              </Link>
              <Link
                href="/qrcode"
                className="p-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted text-center text-foreground transition-colors flex items-center justify-center gap-1.5"
              >
                <QrCode className="h-3.5 w-3.5 text-blue-500" />
                <span>QR Generator</span>
              </Link>
              <Link
                href="/servers"
                className="p-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted text-center text-foreground transition-colors flex items-center justify-center gap-1.5"
              >
                <Server className="h-3.5 w-3.5 text-purple-500" />
                <span>Datacenter Rack</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
