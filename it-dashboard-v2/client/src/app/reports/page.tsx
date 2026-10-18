'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  Layers,
  Users,
  Computer,
  ShieldCheck,
  Building2,
  Printer,
  RefreshCw,
  HardDrive,
  Laptop,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  Sparkles,
} from 'lucide-react';
import api from '@/lib/api';
import { AccessGuard } from '@/components/AccessGuard';
import { BrandLoading } from '@/components/BrandLoading';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const [invData, setInvData] = useState<any>(null);
  const [empData, setEmpData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const [invRes, empRes] = await Promise.all([
        api.get('/api/reports/inventory'),
        api.get('/api/reports/employees'),
      ]);
      setInvData(invRes.data?.data || null);
      setEmpData(empRes.data?.data || null);
    } catch (err) {
      console.error('Failed to load reports data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Compute Total Computers
  const totalComputers = useMemo(() => {
    if (!invData?.byStatus) return 0;
    return invData.byStatus.reduce((acc: number, item: any) => acc + (item._count?.status || 0), 0);
  }, [invData]);

  // Compute Total Employees
  const totalEmployees = useMemo(() => {
    if (!empData?.byStatus) return 0;
    return empData.byStatus.reduce((acc: number, item: any) => acc + (item._count?.employmentStatus || 0), 0);
  }, [empData]);

  // Assigned vs Available
  const assignedComputers = useMemo(() => {
    const item = invData?.byStatus?.find((s: any) => s.status === 'ASSIGNED');
    return item ? item._count?.status : 0;
  }, [invData]);

  const activeEmployees = useMemo(() => {
    const item = empData?.byStatus?.find((s: any) => s.employmentStatus === 'Active');
    return item ? item._count?.employmentStatus : 0;
  }, [empData]);

  const utilizationRate = totalComputers > 0 ? Math.round((assignedComputers / totalComputers) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AccessGuard module="reports">
      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <BrandLoading size="inline" text="Generating Executive Operations Intelligence..." />
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <span>Operations Intelligence & Analytics</span>
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase tracking-wider">
                  TELEMETRY AUDIT
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Independent Television &bull; Hardware lifecycle allocation, staffing distribution, and operational metrics.
              </p>
            </div>

            <div className="flex items-center gap-2.5 print:hidden">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition shadow-2xs"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Executive Report</span>
              </button>

              <button
                onClick={() => fetchReports(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition shadow-2xs"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
                <span>{refreshing ? 'Updating...' : 'Refresh Metrics'}</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Workstation Fleet
                </span>
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Computer className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-foreground mt-2">{totalComputers}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {assignedComputers} allocated ({utilizationRate}% deployment)
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  IT Deployment Rate
                </span>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-emerald-500 mt-2">{utilizationRate}%</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {totalComputers - assignedComputers} spares in storage
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Corporate Staff
                </span>
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-foreground mt-2">{totalEmployees}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {activeEmployees} active on duty &bull; {totalEmployees - activeEmployees} former
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Divisions Recorded
                </span>
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Building2 className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-foreground mt-2">
                {empData?.byDepartment?.length || 0}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">ITV functional broadcast units</p>
            </div>
          </div>

          {/* 2x2 Detailed Telemetry Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1. Workstation Status Allocation */}
            <div className="p-5 rounded-xl border border-border bg-card shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <Computer className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Workstations by Operational Status
                    </h3>
                    <p className="text-[10px] text-muted-foreground">Allocation and lifecycle state of PC inventory</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-muted-foreground">{totalComputers} Units</span>
              </div>

              <div className="space-y-3">
                {invData?.byStatus && invData.byStatus.length > 0 ? (
                  invData.byStatus.map((item: any) => {
                    const count = item._count?.status || 0;
                    const pct = totalComputers > 0 ? Math.round((count / totalComputers) * 100) : 0;
                    const isAssigned = item.status === 'ASSIGNED';
                    const isAvailable = item.status === 'AVAILABLE';
                    const isRepair = item.status === 'REPAIR' || item.status === 'MAINTENANCE';

                    return (
                      <div key={item.status} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <span
                              className={cn(
                                'h-2 w-2 rounded-full',
                                isAssigned
                                  ? 'bg-emerald-500'
                                  : isAvailable
                                  ? 'bg-primary'
                                  : isRepair
                                  ? 'bg-amber-500'
                                  : 'bg-muted-foreground'
                              )}
                            />
                            <span>{item.status}</span>
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            <strong className="text-foreground">{count}</strong> ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              isAssigned
                                ? 'bg-emerald-500'
                                : isAvailable
                                ? 'bg-primary'
                                : isRepair
                                ? 'bg-amber-500'
                                : 'bg-muted-foreground'
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">No computer status records found.</p>
                )}
              </div>
            </div>

            {/* 2. Computers by Form Factor / Type */}
            <div className="p-5 rounded-xl border border-border bg-card shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <Laptop className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Hardware Form Factor Distribution
                    </h3>
                    <p className="text-[10px] text-muted-foreground">Hardware classification and chassis profile</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-muted-foreground">{invData?.byType?.length || 0} Classes</span>
              </div>

              <div className="space-y-3">
                {invData?.byType && invData.byType.length > 0 ? (
                  invData.byType.map((item: any) => {
                    const count = item._count?.computerType || 0;
                    const pct = totalComputers > 0 ? Math.round((count / totalComputers) * 100) : 0;

                    return (
                      <div key={item.computerType} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <HardDrive className="h-3 w-3 text-muted-foreground" />
                            <span>{item.computerType || 'Standard Desktop'}</span>
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            <strong className="text-foreground">{count}</strong> ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">No hardware class records found.</p>
                )}
              </div>
            </div>

            {/* 3. Staff Distribution by Department */}
            <div className="p-5 rounded-xl border border-border bg-card shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Staff Headcount by Department
                    </h3>
                    <p className="text-[10px] text-muted-foreground">Personnel allocation across broadcast departments</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-muted-foreground">{totalEmployees} Total Staff</span>
              </div>

              <div className="space-y-3">
                {empData?.byDepartment && empData.byDepartment.length > 0 ? (
                  empData.byDepartment.map((item: any) => {
                    const count = item._count?.department || 0;
                    const pct = totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0;

                    return (
                      <div key={item.department || 'General'} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground">
                            {item.department || 'Unassigned / General'}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            <strong className="text-foreground">{count}</strong> ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                          <div
                            className="h-full bg-primary/80 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">No department records found.</p>
                )}
              </div>
            </div>

            {/* 4. Staff by Security Role / RBAC Privilege */}
            <div className="p-5 rounded-xl border border-border bg-card shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Access Privileges & Security Roles
                    </h3>
                    <p className="text-[10px] text-muted-foreground">Role-based access hierarchy across platform</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold text-muted-foreground">{empData?.byRole?.length || 0} Roles</span>
              </div>

              <div className="space-y-3">
                {empData?.byRole && empData.byRole.length > 0 ? (
                  empData.byRole.map((item: any) => {
                    const count = item._count?.role || 0;
                    const pct = totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0;
                    const isSuper = item.role === 'SUPER_ADMIN';

                    return (
                      <div key={item.role} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            {isSuper && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                            <span>{item.role.replace('_', ' ')}</span>
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            <strong className="text-foreground">{count}</strong> ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-500', isSuper ? 'bg-primary' : 'bg-muted-foreground')}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">No role records found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AccessGuard>
  );
}
