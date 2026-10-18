'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  History,
  Activity,
  ShieldCheck,
  User,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Layers,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldAlert,
  KeyRound,
  Trash2,
  PlusCircle,
  Pencil,
  LogIn,
} from 'lucide-react';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { AccessGuard } from '@/components/AccessGuard';
import { BrandLoading } from '@/components/BrandLoading';

interface ActivityLogItem {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  ipAddress?: string;
  details?: string;
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const fetchLogs = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const params: any = { limit: 100 };
      if (selectedModule) params.module = selectedModule;
      if (selectedAction) params.action = selectedAction;

      const res = await api.get('/api/activity-logs', { params });
      setLogs(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedModule, selectedAction]);

  // Client search filtering
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        log.user?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.module?.toLowerCase().includes(q) ||
        log.ipAddress?.toLowerCase().includes(q) ||
        log.details?.toLowerCase().includes(q)
      );
    });
  }, [logs, search]);

  // Derived stats
  const totalEvents = logs.length;
  const authEvents = logs.filter((l) => l.action?.includes('LOGIN') || l.module === 'auth').length;
  const mutateEvents = logs.filter((l) => l.action === 'CREATE' || l.action === 'UPDATE').length;
  const deleteEvents = logs.filter((l) => l.action === 'DELETE' || l.action?.includes('REMOVE')).length;

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  return (
    <AccessGuard module="activity">
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>System Activity & Audit Log</span>
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase tracking-wider">
                COMPLIANCE TRAIL
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Independent Television &bull; Immutable event logs, authentication history, hardware mutations, and access telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchLogs(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition shadow-2xs"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin text-primary')} />
              <span>{refreshing ? 'Syncing...' : 'Refresh Logs'}</span>
            </button>
          </div>
        </div>

        {/* Audit Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <History className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Trail</p>
              <p className="text-xl font-bold font-mono text-foreground">{totalEvents}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
              <LogIn className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Auth Events</p>
              <p className="text-xl font-bold font-mono text-foreground">{authEvents}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Mutations</p>
              <p className="text-xl font-bold font-mono text-foreground">{mutateEvents}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-card shadow-2xs flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Critical Actions</p>
              <p className="text-xl font-bold font-mono text-foreground">{deleteEvents}</p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="h-3.5 w-3.5 absolute left-3.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search audit trail by user, IP address, module, action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-2xs placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full sm:w-40 px-3 py-2 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            >
              <option value="">All Modules</option>
              <option value="computers">Computers</option>
              <option value="employees">Employees</option>
              <option value="extensions">Extensions</option>
              <option value="servers">Servers</option>
              <option value="slips">Slips</option>
              <option value="roster">Roster</option>
              <option value="auth">Auth / Security</option>
              <option value="settings">Settings</option>
            </select>

            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full sm:w-36 px-3 py-2 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
            >
              <option value="">All Actions</option>
              <option value="LOGIN">LOGIN</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </div>

        {/* Activity Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Timestamp (BST)</th>
                  <th className="px-4 py-3">Operator / User</th>
                  <th className="px-4 py-3">Action Type</th>
                  <th className="px-4 py-3">Target Module</th>
                  <th className="px-4 py-3">Origin IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      <BrandLoading size="inline" text="Loading security audit records..." />
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-muted-foreground">
                      <p className="font-semibold text-foreground">No matching audit events</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Adjust your search query or reset filter dropdowns to inspect historical events.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => {
                    const isDelete = log.action === 'DELETE' || log.action?.includes('REMOVE');
                    const isCreate = log.action === 'CREATE' || log.action?.includes('ADD');
                    const isUpdate = log.action === 'UPDATE' || log.action?.includes('EDIT');

                    return (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('en-GB', {
                            year: 'numeric',
                            month: 'short',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true,
                          })}
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-md bg-muted text-muted-foreground flex items-center justify-center font-bold text-[10px]">
                              {log.user ? log.user.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <span className="truncate max-w-[140px]">{log.user || 'System'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border',
                              isDelete
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : isCreate
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : isUpdate
                                ? 'bg-sky-500/10 text-sky-500 border-sky-500/20'
                                : 'bg-muted text-muted-foreground border-border'
                            )}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[11px] text-muted-foreground capitalize">
                            {log.module}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredLogs.length > pageSize && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <div>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} events
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 font-mono text-[11px]">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AccessGuard>
  );
}
