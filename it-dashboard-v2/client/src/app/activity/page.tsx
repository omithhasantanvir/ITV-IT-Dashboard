'use client';

import React, { useEffect, useState } from 'react';
import { History, Activity, ShieldCheck, User } from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { AccessGuard } from '@/components/AccessGuard';
import { BrandLoading } from '@/components/BrandLoading';

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/api/activity-logs');
        setLogs(res.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <AccessGuard module="activity">
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">System Activity & Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Immutable event trails, authentication events, inventory modifications, and access history.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">User</th>
                <th className="p-4">Action</th>
                <th className="p-4">Module</th>
                <th className="p-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    <BrandLoading
                      size="inline"
                      text="Loading activity timeline..."
                    />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition">
                    <td className="p-4 font-mono text-[11px] text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 font-semibold text-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary" />
                      {log.user || 'System'}
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-muted-foreground">
                      {log.module}
                    </td>
                    <td className="p-4 font-mono text-[11px] text-muted-foreground">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AccessGuard>
);
}
