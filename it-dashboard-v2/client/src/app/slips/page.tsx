'use client';

import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, Plus, Printer, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { AccessGuard } from '@/components/AccessGuard';

export default function SlipsPage() {
  const [slips, setSlips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlips = async () => {
      try {
        const res = await api.get('/api/slips');
        setSlips(res.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSlips();
  }, []);

  return (
    <AccessGuard module="slips">
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Asset Handover & Requisition Slips</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Official IT asset allocation documents, equipment sign-off sheets, and delivery receipts.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="p-4">Slip Number</th>
                <th className="p-4">Assigned Staff</th>
                <th className="p-4">Equipment / Asset</th>
                <th className="p-4">Issued By</th>
                <th className="p-4">Issue Date</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Loading requisition slips...
                  </td>
                </tr>
              ) : slips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No requisition slips generated yet.
                  </td>
                </tr>
              ) : (
                slips.map((slip) => (
                  <tr key={slip.id} className="hover:bg-muted/30 transition">
                    <td className="p-4 font-mono font-bold text-foreground">
                      {slip.slipNumber}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-foreground">{slip.employee?.name || 'Staff'}</p>
                      <p className="text-[10px] text-muted-foreground">{slip.department || slip.employee?.department}</p>
                    </td>
                    <td className="p-4">
                      {slip.computer ? (
                        <span className="font-mono text-[11px] font-semibold text-primary">
                          {slip.computer.assetId} ({slip.computer.brand} {slip.computer.model})
                        </span>
                      ) : (
                        <span className="text-muted-foreground">General Accessories</span>
                      )}
                    </td>
                    <td className="p-4 text-[11px] text-muted-foreground">
                      {slip.issuedBy || 'IT Admin'}
                    </td>
                    <td className="p-4 text-[11px] text-muted-foreground">
                      {formatDate(slip.issueDate)}
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {slip.status}
                      </span>
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
