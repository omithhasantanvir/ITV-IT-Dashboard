'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, PieChart, Layers, Users, Computer } from 'lucide-react';
import api from '@/lib/api';
import { AccessGuard } from '@/components/AccessGuard';
import { BrandLoading } from '@/components/BrandLoading';

export default function ReportsPage() {
  const [invData, setInvData] = useState<any>(null);
  const [empData, setEmpData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [invRes, empRes] = await Promise.all([
          api.get('/api/reports/inventory'),
          api.get('/api/reports/employees'),
        ]);
        setInvData(invRes.data?.data);
        setEmpData(empRes.data?.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <AccessGuard module="reports">
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <BrandLoading size="inline" text="Generating Analytics & Reports..." />
        </div>
      ) : (
      <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics & Inventory Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Asset allocations, hardware lifecycle distribution, and departmental staffing metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hardware Status Breakdown */}
        <div className="p-6 rounded-2xl border border-border bg-card/70 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Computer className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Computers by Status</h3>
              <p className="text-[11px] text-muted-foreground">Allocation state of workstations</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {invData?.byStatus?.map((item: any) => (
              <div key={item.status} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">{item.status}</span>
                  <span className="font-bold text-foreground">{item._count?.status || 0} unit(s)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((item._count?.status || 1) * 20, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff by Department */}
        <div className="p-6 rounded-2xl border border-border bg-card/70 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Staff by Department</h3>
              <p className="text-[11px] text-muted-foreground">Headcount distribution across divisions</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {empData?.byDepartment?.map((item: any) => (
              <div key={item.department || 'Unassigned'} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">{item.department || 'General'}</span>
                  <span className="font-bold text-foreground">{item._count?.department || 0} person(s)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((item._count?.department || 1) * 25, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
    </AccessGuard>
  );
}
