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
  HardDrive,
  CheckCircle2,
  AlertTriangle,
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
    <div className="space-y-8">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">IT Operations Control</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time infrastructure monitoring, asset tracking, and staff allocations.
          </p>
        </div>

        <button
          onClick={() => fetchSummary(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition shadow-sm w-fit"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl border border-border bg-card/70 backdrop-blur-sm relative overflow-hidden group hover:border-primary/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Staff</span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-foreground mt-3">
            {loading ? '...' : formatNumber(stats.totalEmployees)}
          </h3>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {formatNumber(stats.activeEmployees)} Active &bull; {formatNumber(stats.formerEmployees)} Former
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card/70 backdrop-blur-sm relative overflow-hidden group hover:border-primary/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">IT Operations Team</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-foreground mt-3">
            {loading ? '...' : formatNumber(stats.itTeamMembers)}
          </h3>
          <p className="text-xs text-muted-foreground mt-2">
            Engineers & Administrators on duty
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card/70 backdrop-blur-sm relative overflow-hidden group hover:border-primary/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hardware Assets</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Computer className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-foreground mt-3">
            {loading ? '...' : formatNumber(stats.totalComputers)}
          </h3>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
            <span className="text-emerald-500 font-semibold">{formatNumber(stats.assignedComputers)} Assigned</span>
            &bull;
            <span>{formatNumber(stats.availableComputers)} Available</span>
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-card/70 backdrop-blur-sm relative overflow-hidden group hover:border-primary/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Servers Status</span>
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Server className="h-4 w-4" />
            </div>
          </div>
          <h3 className="text-3xl font-extrabold text-foreground mt-3">
            {loading ? '...' : `${formatNumber(stats.onlineServers)} / ${formatNumber(stats.totalServers)}`}
          </h3>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{formatNumber(stats.onlineServers)} Online Node(s)</span>
          </p>
        </div>
      </div>

      {/* Grid: Server Health & IT Members Duty Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Servers Grid */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-md">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-foreground">Infrastructure Nodes</h3>
              <p className="text-xs text-muted-foreground">Monitored corporate servers & services</p>
            </div>
            <Link
              href="/servers"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {summary.serverStatus?.length > 0 ? (
              summary.serverStatus.map((srv: any) => (
                <div
                  key={srv.id}
                  className="p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        srv.status === 'ONLINE'
                          ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                          : srv.status === 'WARNING'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    <div>
                      <p className="text-xs font-bold text-foreground">{srv.serverName}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {srv.ipAddress || srv.hostname}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      srv.status === 'ONLINE'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-rose-500/10 text-rose-500'
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

        {/* IT Team On-Duty */}
        <div className="p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-md">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-foreground">IT Duty Roster</h3>
              <p className="text-xs text-muted-foreground">Team availability & intercoms</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {summary.itTeam?.length > 0 ? (
              summary.itTeam.map((mem: any) => (
                <div
                  key={mem.id}
                  className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      {mem.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{mem.name}</p>
                      <p className="text-[11px] text-muted-foreground">{mem.designation}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        mem.itStatus === 'AVAILABLE'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : mem.itStatus === 'BUSY'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-slate-500/10 text-slate-500'
                      }`}
                    >
                      {mem.itStatus}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                      Ext: {mem.extensionNumber || 'N/A'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">No IT team members recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Staff & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Employees */}
        <div className="p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-foreground">Recently Added Staff</h3>
            <Link href="/employees" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {summary.recentEmployees?.length > 0 ? (
              summary.recentEmployees.map((emp: any) => (
                <div
                  key={emp.id}
                  className="p-3 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-foreground">{emp.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {emp.designation} &bull; {emp.department}
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Joined {formatDate(emp.joiningDate)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">No employees found.</p>
            )}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="p-6 rounded-2xl border border-border bg-card/60 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-foreground">Live Activity Feed</h3>
            <Link href="/activity" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              Audit Logs <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {summary.recentActivities?.length > 0 ? (
              summary.recentActivities.map((act: any) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl border border-border/80 bg-muted/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className="h-3.5 w-3.5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        <span className="text-primary font-bold">{act.user || 'System'}</span> &bull; {act.action}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">Module: {act.module}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
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
  );
}
