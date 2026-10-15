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
} from 'lucide-react';
import api from '@/lib/api';
import { formatNumber, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

  const stats = data?.stats || {};
  const summary = data?.summary || {};

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. Page Header                                           */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <span>IT Operations Control</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase tracking-wider">
              ITV Central
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time infrastructure monitoring, asset allocations &amp; live transmission.
          </p>
        </div>

        <button
          onClick={() => fetchSummary(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition shadow-xs w-fit"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-primary' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. Primary KPI Metric Cards (4 Columns)                 */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="p-4 rounded-2xl border border-border bg-card/70 backdrop-blur-sm relative overflow-hidden group hover:border-primary/40 transition shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Staff</span>
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-foreground mt-2">
            {loading ? '...' : formatNumber(stats.totalEmployees)}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>{formatNumber(stats.activeEmployees)} Active &bull; {formatNumber(stats.formerEmployees)} Former</span>
          </p>
        </div>

        {/* IT Operations Team */}
        <div className="p-4 rounded-2xl border border-border bg-card/70 backdrop-blur-sm relative overflow-hidden group hover:border-primary/40 transition shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">IT Operations Team</span>
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-foreground mt-2">
            {loading ? '...' : formatNumber(stats.itTeamMembers)}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1">
            Engineers &amp; Administrators on duty
          </p>
        </div>

        {/* Hardware Assets */}
        <div className="p-4 rounded-2xl border border-border bg-card/70 backdrop-blur-sm relative overflow-hidden group hover:border-primary/40 transition shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Hardware Assets</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Computer className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-foreground mt-2">
            {loading ? '...' : formatNumber(stats.totalComputers)}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
            <span className="text-emerald-500 font-semibold">{formatNumber(stats.assignedComputers)} Assigned</span>
            &bull;
            <span>{formatNumber(stats.availableComputers)} Available</span>
          </p>
        </div>

        {/* Servers Status */}
        <div className="p-4 rounded-2xl border border-border bg-card/70 backdrop-blur-sm relative overflow-hidden group hover:border-primary/40 transition shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Servers Status</span>
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Server className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-foreground mt-2">
            {loading ? '...' : `${formatNumber(stats.onlineServers)} / ${formatNumber(stats.totalServers)}`}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{formatNumber(stats.onlineServers)} Online Node(s)</span>
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. Main Dashboard Grid (8 Cols Left, 4 Cols Right)       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ====================================================== */}
        {/* LEFT COLUMN (8 Columns): Infrastructure & Recent Feed  */}
        {/* ====================================================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* Infrastructure Nodes Grid */}
          <div className="p-5 sm:p-6 rounded-3xl border border-border bg-card/70 backdrop-blur-md shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Server className="h-4 w-4 text-primary" />
                  <span>Infrastructure Nodes</span>
                </h3>
                <p className="text-xs text-muted-foreground">Monitored corporate servers &amp; core broadcast services</p>
              </div>
              <Link
                href="/servers"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                View All <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {summary.serverStatus?.length > 0 ? (
                summary.serverStatus.map((srv: any) => (
                  <div
                    key={srv.id}
                    className="p-3.5 rounded-2xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                          srv.status === 'ONLINE'
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                            : srv.status === 'WARNING'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                      />
                      <div className="truncate">
                        <p className="text-xs font-bold text-foreground truncate">{srv.serverName}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">
                          {srv.ipAddress || srv.hostname}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-extrabold font-mono px-2 py-0.5 rounded-md shrink-0 uppercase ${
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
                  No server telemetry data recorded.
                </p>
              )}
            </div>
          </div>

          {/* Subgrid: Recent Staff & Activity Logs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Employees */}
            <div className="p-5 rounded-3xl border border-border bg-card/70 backdrop-blur-md shadow-xs">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span>Recently Added Staff</span>
                </h3>
                <Link href="/employees" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  View <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {summary.recentEmployees?.length > 0 ? (
                  summary.recentEmployees.slice(0, 4).map((emp: any) => (
                    <div
                      key={emp.id}
                      className="p-2.5 rounded-2xl border border-border/70 bg-muted/20 flex items-center justify-between text-xs"
                    >
                      <div className="truncate">
                        <p className="font-bold text-foreground truncate">{emp.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {emp.designation} &bull; {emp.department}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0 ml-2">
                        {formatDate(emp.joiningDate)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No employees found.</p>
                )}
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="p-5 rounded-3xl border border-border bg-card/70 backdrop-blur-md shadow-xs">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                  <span>Live Activity Feed</span>
                </h3>
                <Link href="/activity" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  Audit <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {summary.recentActivities?.length > 0 ? (
                  summary.recentActivities.slice(0, 4).map((act: any) => (
                    <div
                      key={act.id}
                      className="p-2.5 rounded-2xl border border-border/70 bg-muted/20 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-foreground truncate">
                            <span className="text-primary font-bold">{act.user || 'System'}</span>: {act.action}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">Module: {act.module}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap shrink-0 ml-2">
                        {formatDate(act.timestamp)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No recent activity logs.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================== */}
        {/* RIGHT COLUMN (4 Columns): Live TV, Duty Roster, Hub    */}
        {/* ====================================================== */}
        <div className="lg:col-span-4 space-y-6">
          {/* Compact Live Broadcast TV Player Card */}
          <div className="p-4 rounded-3xl border border-border bg-card/70 backdrop-blur-md shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                </span>
                <span className="font-bold text-foreground tracking-wide flex items-center gap-1.5">
                  <Tv className="h-3.5 w-3.5 text-red-500" />
                  <span>ITV Live Broadcast</span>
                </span>
              </div>

              <div className="flex items-center gap-1 text-[10px] font-mono">
                <Link
                  href="/live"
                  className="px-2 py-0.5 rounded-md hover:bg-muted text-primary hover:underline font-bold transition flex items-center gap-1"
                >
                  <Maximize2 className="h-3 w-3" />
                  <span>Theater</span>
                </Link>
                <a
                  href="https://www.youtube.com/watch?v=iWq2kH0iq2Q"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition"
                  title="Watch on YouTube"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Video Player Frame */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-border/80 bg-black shadow-inner">
              <iframe
                src="https://www.youtube-nocookie.com/embed/iWq2kH0iq2Q?autoplay=1&mute=1&playsinline=1&controls=1&rel=0&modestbranding=1"
                title="Independent Television YouTube Live"
                className="w-full h-full border-0 absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
              <span className="flex items-center gap-1 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                BS-1 Satellite &bull; 1080p
              </span>
              <span className="font-mono text-muted-foreground">24/7 Autoplay Feed</span>
            </div>
          </div>

          {/* IT Duty Roster Team */}
          <div className="p-5 rounded-3xl border border-border bg-card/70 backdrop-blur-md shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">IT Duty Roster</h3>
                <p className="text-[11px] text-muted-foreground">Engineers currently on duty</p>
              </div>
              <Link href="/roster" className="text-xs font-semibold text-primary hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2">
              {summary.itTeam?.length > 0 ? (
                summary.itTeam.slice(0, 4).map((mem: any) => (
                  <div
                    key={mem.id}
                    className="p-2.5 rounded-2xl border border-border/70 bg-muted/20 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="h-7 w-7 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {mem.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-foreground truncate">{mem.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{mem.designation}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
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
                <p className="text-xs text-muted-foreground text-center py-4">No IT staff logged on duty.</p>
              )}
            </div>
          </div>

          {/* Operations Quick Shortcuts */}
          <div className="p-4 rounded-3xl border border-border bg-card/50 shadow-xs space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
              Quick Operations Access
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <Link
                href="/slips"
                className="p-2.5 rounded-xl border border-border bg-muted/20 hover:bg-muted text-center text-foreground transition flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-primary" />
                <span>Employee Slips</span>
              </Link>
              <Link
                href="/computers"
                className="p-2.5 rounded-xl border border-border bg-muted/20 hover:bg-muted text-center text-foreground transition flex items-center justify-center gap-1.5"
              >
                <Computer className="h-3.5 w-3.5 text-emerald-500" />
                <span>Hardware Assets</span>
              </Link>
              <Link
                href="/extensions"
                className="p-2.5 rounded-xl border border-border bg-muted/20 hover:bg-muted text-center text-foreground transition flex items-center justify-center gap-1.5"
              >
                <PhoneCall className="h-3.5 w-3.5 text-blue-500" />
                <span>PABX Phone</span>
              </Link>
              <Link
                href="/servers"
                className="p-2.5 rounded-xl border border-border bg-muted/20 hover:bg-muted text-center text-foreground transition flex items-center justify-center gap-1.5"
              >
                <Server className="h-3.5 w-3.5 text-purple-500" />
                <span>Datacenter</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
