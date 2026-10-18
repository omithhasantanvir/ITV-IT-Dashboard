'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ScheduledMaintenanceTask {
  id: string;
  date: string;
  dayOfWeek: string;
  scheduledTask: string;
  task: string;
  status: 'Pending' | 'Completed' | 'Incomplete';
  completedAt?: string;
  completedBy?: string;
}

const STORAGE_KEY = 'itv_scheduled_maintenance_tasks_v2';

const DEFAULT_SCHEDULED_TASKS: ScheduledMaintenanceTask[] = [
  {
    id: 'sched-001',
    date: '2026-10-19',
    dayOfWeek: 'Monday',
    scheduledTask: 'GV Quarterly Maintenance',
    task: '1. Restart all GV Clients\n2. Power Down GV Full System according to procedure\n3. After 10 to 15 min Power Up GV Full system according to procedure',
    status: 'Pending',
  },
  {
    id: 'sched-002',
    date: '2026-10-20',
    dayOfWeek: 'Tuesday',
    scheduledTask: 'Monthly Vizrt Maintenance',
    task: '1. Restart VizDB, VizRTDB Server, Viz1, Viz2, Viz3 Server\n2. Restart Viz Ticker RE, Viz Frame Server\n3. Restart Viz Ticker Client (L2-PCR)',
    status: 'Pending',
  },
  {
    id: 'sched-003',
    date: '2026-10-28',
    dayOfWeek: 'Wednesday',
    scheduledTask: 'GV Weekly Maintenance',
    task: '1. Restart GV Stratus Rundown(PCR)\n2. Restart All Edius Clients\n3. Restart RMI-Ingest\n4. Restart MCR-Ingest',
    status: 'Pending',
  },
  {
    id: 'sched-004',
    date: '2026-11-05',
    dayOfWeek: 'Thursday',
    scheduledTask: 'GV Weekly Maintenance',
    task: '1. Restart GV Stratus Rundown(PCR)\n2. Restart All Edius Clients\n3. Restart RMI-Ingest\n4. Restart MCR-Ingest',
    status: 'Pending',
  },
  {
    id: 'sched-005',
    date: '2026-11-13',
    dayOfWeek: 'Friday',
    scheduledTask: 'GV Weekly Maintenance',
    task: '1. Restart GV Stratus Rundown(PCR)\n2. Restart All Edius Clients\n3. Restart RMI-Ingest\n4. Restart MCR-Ingest',
    status: 'Pending',
  },
  {
    id: 'sched-006',
    date: '2026-11-21',
    dayOfWeek: 'Saturday',
    scheduledTask: 'GV Monthly Maintenance',
    task: '1. Restart all GV Clients\n2. Restart K2-Summit1 & K2-Summit2\n3. Restart Rendering Engine RE1, RE2\n4. Restart GV FTP1\n5. Restart XRE',
    status: 'Pending',
  },
  {
    id: 'sched-007',
    date: '2026-11-23',
    dayOfWeek: 'Monday',
    scheduledTask: 'Monthly Domain Maintenance',
    task: '1. Restart DC-01, DC-02, ITV-SQL-1\n2. Restart DSE Server\n3. Restart WiFi Access Devices',
    status: 'Pending',
  },
  {
    id: 'sched-008',
    date: '2026-11-24',
    dayOfWeek: 'Tuesday',
    scheduledTask: 'Monthly Vizrt Maintenance',
    task: '1. Restart VizDB, VizRTDB Server, Viz1, Viz2, Viz3 Server\n2. Restart Viz Ticker RE, Viz Frame Server\n3. Restart Viz Ticker Client (L2-PCR)',
    status: 'Pending',
  },
];

export function BroadcastOperationsStrip({ className }: { className?: string }) {
  const [tasks, setTasks] = useState<ScheduledMaintenanceTask[]>([]);
  const [mounted, setMounted] = useState(false);

  // Load scheduled maintenance tasks (strictly excluding daily night tasks)
  const loadTasks = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let list: ScheduledMaintenanceTask[] = [];
      if (raw) {
        list = JSON.parse(raw);
      } else {
        list = DEFAULT_SCHEDULED_TASKS;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SCHEDULED_TASKS));
      }

      // Filter only upcoming/pending tasks in chronological sequence (when one completes, next takes priority)
      const pending = list
        .filter((t) => t.status === 'Pending')
        .sort((a, b) => a.date.localeCompare(b.date));

      setTasks(pending);
    } catch (e) {
      console.error('Failed to load maintenance tasks', e);
      setTasks(DEFAULT_SCHEDULED_TASKS.filter((t) => t.status === 'Pending'));
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    loadTasks();

    const handleUpdate = () => loadTasks();
    window.addEventListener('itv_maintenance_tasks_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(loadTasks, 4000);

    return () => {
      window.removeEventListener('itv_maintenance_tasks_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, [loadTasks]);

  // Only the single immediate next upcoming maintenance task
  const upcomingTask = useMemo(() => {
    return tasks.length > 0 ? tasks[0] : null;
  }, [tasks]);

  // Generate continuous seamless marquee loop of ONLY this upcoming task (duplicated for translateX(-50%))
  const loopItems = useMemo(() => {
    if (!upcomingTask) return [];
    // Repeat the single upcoming task so it flows continuously across any widescreen resolution
    return [upcomingTask, upcomingTask, upcomingTask, upcomingTask, upcomingTask, upcomingTask];
  }, [upcomingTask]);

  return (
    <div
      className={cn(
        'h-9 border-b border-border/80 bg-muted/40 dark:bg-card/70 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between text-[11px] select-none overflow-hidden whitespace-nowrap z-10 relative',
        className
      )}
    >
      {/* Left Badge: Fixed Branding Anchor */}
      <div className="flex items-center gap-2 pl-2.5 pr-3 py-1 bg-gradient-to-r from-primary to-rose-700 text-white font-bold text-[10px] tracking-wider rounded-md shrink-0 shadow-xs uppercase select-none z-20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
        <Calendar className="h-3 w-3 shrink-0" />
        <span className="font-sans font-bold tracking-wide">UPCOMING MAINTENANCE</span>
      </div>

      {/* Center: Infinite Continuous Scrolling Marquee of ONLY the upcoming task */}
      <div className="relative flex-1 overflow-hidden h-full flex items-center mx-3">
        {/* Soft Left & Right Fade Masks */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-muted/70 dark:from-card/90 to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-muted/70 dark:from-card/90 to-transparent pointer-events-none z-10" />

        {upcomingTask ? (
          <div className="animate-itv-ticker will-change-transform flex items-center gap-8 py-0.5">
            {loopItems.map((task, idx) => (
              <React.Fragment key={`${task.id}-${idx}`}>
                <Link
                  href="/maintenance/task-submission"
                  className="inline-flex items-center gap-3 px-3 py-1 rounded-md bg-card/85 hover:bg-card border border-border/70 hover:border-primary/50 text-foreground transition-all duration-150 group shadow-2xs hover:shadow-xs cursor-pointer"
                  title={`Upcoming Maintenance: ${task.scheduledTask} scheduled for ${task.date} (${task.dayOfWeek}) - Click to view or perform`}
                >
                  <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 flex items-center gap-1.5 shrink-0">
                    <Calendar className="h-3 w-3 text-primary shrink-0" />
                    <span>{task.date}</span>
                    <span className="opacity-80 font-sans font-medium">({task.dayOfWeek})</span>
                  </span>

                  <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      Next Up
                    </span>
                    <span>{task.scheduledTask}</span>
                  </span>

                  {task.task && (
                    <span className="text-muted-foreground text-[11px] truncate max-w-[420px] lg:max-w-[650px] font-sans">
                      &bull; {task.task.replace(/\n/g, ' &bull; ')}
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-primary shrink-0 group-hover:underline pl-1">
                    <span>Execute</span>
                    <ArrowRight className="h-2.5 w-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
                <span className="text-muted-foreground/30 font-bold select-none text-xs">&bull; &bull; &bull;</span>
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground flex items-center gap-2 pl-4">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>All scheduled maintenance tasks are completed for this cycle. No upcoming tasks.</span>
          </div>
        )}
      </div>

      {/* Right Action: Direct Link to Maintenance Schedule Manager */}
      <Link
        href="/maintenance/task-submission"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold text-primary hover:text-primary-foreground bg-primary/10 hover:bg-primary border border-primary/20 transition-all duration-150 shrink-0 z-20 shadow-2xs group"
        title="Open Maintenance Schedule Manager"
      >
        <span>All Schedules</span>
        <ArrowRight className="h-2.5 w-2.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
