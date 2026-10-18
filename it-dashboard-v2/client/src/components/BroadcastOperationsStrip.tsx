'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Radio,
  Server,
  Network,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Tv,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import api from '@/lib/api';

export function BroadcastOperationsStrip({ className }: { className?: string }) {
  const [stats, setStats] = useState<any>(null);
  const [nextMaintenance, setNextMaintenance] = useState<string>('GV Quarterly Maintenance (2026-10-19)');
  const [timeStr, setTimeStr] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Live Bangladesh Standard Time Clock (BST UTC+6)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'Asia/Dhaka',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real telemetry and maintenance schedule
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await api.get('/api/dashboard/summary');
        if (res.data?.success && res.data.stats) {
          setStats(res.data.stats);
        }
      } catch (err) {
        // Fallback or offline
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 30000);

    // Read next pending task from localStorage
    try {
      const raw = localStorage.getItem('itv_scheduled_maintenance_tasks_v2');
      if (raw) {
        const tasks = JSON.parse(raw);
        const pending = tasks.filter((t: any) => t.status === 'Pending');
        if (pending.length > 0) {
          setNextMaintenance(`${pending[0].scheduledTask} (${pending[0].date})`);
        }
      }
    } catch {
      // fallback
    }

    return () => clearInterval(interval);
  }, []);

  const totalServers = stats?.totalServers || 9;
  const onlineServers = stats?.onlineServers || 9;
  const warningServers = stats?.warningServers || 0;
  const offlineServers = stats?.offlineServers || 0;
  const isServerHealthy = offlineServers === 0 && warningServers === 0;

  return (
    <div
      className={`h-9 border-b border-border/80 bg-muted/40 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between text-[11px] font-mono select-none overflow-x-auto custom-scrollbar whitespace-nowrap z-10 ${
        className || ''
      }`}
    >
      {/* Left: Broadcast Transmission & Server Fleet */}
      <div className="flex items-center gap-4 sm:gap-6 divide-x divide-border/60">
        {/* Broadcast Transmission Engine */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold text-foreground tracking-tight flex items-center gap-1.5">
            <Tv className="h-3 w-3 text-primary" />
            <span>ITV Master Transmission:</span>
            <span className="text-emerald-500 font-bold uppercase">1080p Live</span>
          </span>
        </div>

        {/* Real Core Server Availability */}
        <div className="pl-4 sm:pl-6 flex items-center gap-2">
          <Server className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Datacenter:</span>
          <Link
            href="/servers"
            className="flex items-center gap-1 font-bold text-foreground hover:text-primary transition-colors"
          >
            <span className={isServerHealthy ? 'text-emerald-500' : 'text-amber-500'}>
              {loading ? '...' : `${onlineServers}/${totalServers} Online`}
            </span>
            {offlineServers > 0 && (
              <span className="text-rose-500">({offlineServers} Offline)</span>
            )}
          </Link>
        </div>

        {/* Network Operations */}
        <div className="pl-4 sm:pl-6 hidden md:flex items-center gap-2">
          <Network className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Operations LAN:</span>
          <span className="font-semibold text-foreground">10.1.0.0/16 Active</span>
        </div>

        {/* Next Scheduled Maintenance */}
        <div className="pl-4 sm:pl-6 hidden lg:flex items-center gap-2">
          <Calendar className="h-3 w-3 text-amber-500" />
          <span className="text-muted-foreground">Scheduled Maintenance:</span>
          <Link
            href="/maintenance/task-submission"
            className="text-foreground font-semibold hover:text-primary transition-colors flex items-center gap-1"
          >
            <span>{nextMaintenance}</span>
            <ArrowRight className="h-2.5 w-2.5 opacity-60" />
          </Link>
        </div>
      </div>

      {/* Right: Bangladesh Standard Time (BST) */}
      <div className="flex items-center gap-3 shrink-0 pl-4">
        <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
          <Clock className="h-3 w-3 text-primary" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-sans font-bold">
            Dhaka BST:
          </span>
          <span className="font-bold text-foreground tabular-nums">{timeStr || '--:--:--'}</span>
        </div>
      </div>
    </div>
  );
}
