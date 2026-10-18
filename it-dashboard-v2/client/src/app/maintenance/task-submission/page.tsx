'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Printer,
  ArrowLeft,
  X,
  Play,
  RotateCcw,
  User,
  FileText,
  AlertTriangle,
  Sparkles,
  Check,
  ChevronRight,
  Trash2,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessGuard } from '@/components/AccessGuard';
import { showSuccessAlert, showWarningAlert, confirmAction, confirmDelete } from '@/lib/sweetalert';

export interface ScheduledMaintenanceTask {
  id: string;
  date: string;
  dayOfWeek: string;
  scheduledTask: string;
  task: string;
  status: 'Pending' | 'Completed' | 'Incomplete';
  completedAt?: string;
  completedBy?: string;
  completionNotes?: string;
  incompleteAt?: string;
  incompleteReportedBy?: string;
  incompleteReason?: string;
  checklist?: { step: string; done: boolean }[];
}

const STORAGE_KEY = 'itv_scheduled_maintenance_tasks_v2';

// Seed data matching the user's ITV schedule screenshot exactly
const DEFAULT_SCHEDULED_TASKS: ScheduledMaintenanceTask[] = [
  {
    id: 'sched-001',
    date: '2026-10-19',
    dayOfWeek: 'Monday',
    scheduledTask: 'GV Quarterly Maintenance',
    task: `1. Restart all GV Clients\n2. Power Down GV Full System according to procedure\n3. After 10 to 15 min Power Up GV Full system according to procedure`,
    status: 'Pending',
  },
  {
    id: 'sched-002',
    date: '2026-10-20',
    dayOfWeek: 'Tuesday',
    scheduledTask: 'Monthly Vizrt Maintenance',
    task: `1. Restart VizDB, VizRTDB Server, Viz1, Viz2, Viz3 Server\n2. Restart Viz Ticker RE, Viz Frame Server\n3. Restart Viz Ticker Client (L2-PCR)\n* When Restart Pls Inform MCR to remove Viz3 Hard Patch Cable Issue\n* After Restart Clean temp, %temp%, Prefetch for each server then run apps`,
    status: 'Pending',
  },
  {
    id: 'sched-003',
    date: '2026-10-28',
    dayOfWeek: 'Wednesday',
    scheduledTask: 'GV Weekly Maintenance',
    task: `1. Restart GV Stratus Rundown(PCR)\n2. Restart All Edius Clients,\n3. Restart RMI-Ingest,\n4. Restart MCR-Ingest\n5. Restart all GV Express storyboard-Newsroom)`,
    status: 'Pending',
  },
  {
    id: 'sched-004',
    date: '2026-11-05',
    dayOfWeek: 'Thursday',
    scheduledTask: 'GV Weekly Maintenance',
    task: `1. Restart GV Stratus Rundown(PCR)\n2. Restart All Edius Clients,\n3. Restart RMI-Ingest,\n4. Restart MCR-Ingest\n5. Restart all GV Express storyboard-Newsroom)`,
    status: 'Pending',
  },
  {
    id: 'sched-005',
    date: '2026-11-13',
    dayOfWeek: 'Friday',
    scheduledTask: 'GV Weekly Maintenance',
    task: `1. Restart GV Stratus Rundown(PCR)\n2. Restart All Edius Clients,\n3. Restart RMI-Ingest,\n4. Restart MCR-Ingest\n5. Restart all GV Express storyboard-Newsroom)`,
    status: 'Pending',
  },
  {
    id: 'sched-006',
    date: '2026-11-21',
    dayOfWeek: 'Saturday',
    scheduledTask: 'GV Monthly Maintenance',
    task: `1. Restart all GV Clients\n2. Restart K2-Summit1 & K2-Summit2, (10.1.2.1 & 10.1.2.2)\n3. Restart Rendering Engine RE1, RE2 (10.1.2.31 & 10.1.2.32)\n4. Restart GV FTP1 (10.1.2.6)\n5. Restart XRE (10.1.4.71), ITV-NAS1[Edius_Share](10.1.2.72)`,
    status: 'Pending',
  },
  {
    id: 'sched-007',
    date: '2026-11-23',
    dayOfWeek: 'Monday',
    scheduledTask: 'Monthly Domain Maintenance',
    task: `1. Restart DC-01 (172.19.4.4) DC-02(172.19.4.5) ITV-SQL-1(172.19.4.10)\n2. Restart DSE Server (172.19.4.9)\n3. Restart WiFi Access Devices`,
    status: 'Pending',
  },
  {
    id: 'sched-008',
    date: '2026-11-24',
    dayOfWeek: 'Tuesday',
    scheduledTask: 'Monthly Vizrt Maintenance',
    task: `1. Restart VizDB, VizRTDB Server, Viz1, Viz2, Viz3 Server\n2. Restart Viz Ticker RE, Viz Frame Server\n3. Restart Viz Ticker Client (L2-PCR)\n* When Restart Pls Inform MCR to remove Viz3 Hard Patch Cable Issue\n* After Restart Clean temp, %temp%, Prefetch for each server then run apps`,
    status: 'Pending',
  },
  // Sample pre-existing Completed record
  {
    id: 'sched-009',
    date: '2026-10-14',
    dayOfWeek: 'Wednesday',
    scheduledTask: 'GV Weekly Maintenance',
    task: `1. Restart GV Stratus Rundown(PCR)\n2. Restart All Edius Clients,\n3. Restart RMI-Ingest,\n4. Restart MCR-Ingest\n5. Restart all GV Express storyboard-Newsroom)`,
    status: 'Completed',
    completedAt: '2026-10-14 04:45 AM',
    completedBy: 'Omith Hasan',
    completionNotes: 'All 5 ingest servers & PCR rundowns reloaded cleanly. Edius clients tested on timeline playback.',
  },
  // Sample pre-existing Incomplete record
  {
    id: 'sched-010',
    date: '2026-10-07',
    dayOfWeek: 'Wednesday',
    scheduledTask: 'Monthly Domain Maintenance',
    task: `1. Restart DC-01 (172.19.4.4) DC-02(172.19.4.5) ITV-SQL-1(172.19.4.10)\n2. Restart DSE Server (172.19.4.9)\n3. Restart WiFi Access Devices`,
    status: 'Incomplete',
    incompleteAt: '2026-10-07 05:15 AM',
    incompleteReportedBy: 'Sajid Karim',
    incompleteReason: 'Studio 1 Prime-time election broadcast extended beyond planned maintenance window. Postponed to next cycle.',
  },
];

// Presets for new task creation
const TASK_PRESETS: { name: string; task: string }[] = [
  {
    name: 'GV Weekly Maintenance',
    task: `1. Restart GV Stratus Rundown(PCR)\n2. Restart All Edius Clients,\n3. Restart RMI-Ingest,\n4. Restart MCR-Ingest\n5. Restart all GV Express storyboard-Newsroom)`,
  },
  {
    name: 'GV Monthly Maintenance',
    task: `1. Restart all GV Clients\n2. Restart K2-Summit1 & K2-Summit2, (10.1.2.1 & 10.1.2.2)\n3. Restart Rendering Engine RE1, RE2 (10.1.2.31 & 10.1.2.32)\n4. Restart GV FTP1 (10.1.2.6)\n5. Restart XRE (10.1.4.71), ITV-NAS1[Edius_Share](10.1.2.72)`,
  },
  {
    name: 'GV Quarterly Maintenance',
    task: `1. Restart all GV Clients\n2. Power Down GV Full System according to procedure\n3. After 10 to 15 min Power Up GV Full system according to procedure`,
  },
  {
    name: 'Monthly Vizrt Maintenance',
    task: `1. Restart VizDB, VizRTDB Server, Viz1, Viz2, Viz3 Server\n2. Restart Viz Ticker RE, Viz Frame Server\n3. Restart Viz Ticker Client (L2-PCR)\n* When Restart Pls Inform MCR to remove Viz3 Hard Patch Cable Issue\n* After Restart Clean temp, %temp%, Prefetch for each server then run apps`,
  },
  {
    name: 'Monthly Domain Maintenance',
    task: `1. Restart DC-01 (172.19.4.4) DC-02(172.19.4.5) ITV-SQL-1(172.19.4.10)\n2. Restart DSE Server (172.19.4.9)\n3. Restart WiFi Access Devices`,
  },
  {
    name: 'Custom Broadcast Maintenance',
    task: `1. \n2. \n3. `,
  },
];

const getDayOfWeek = (dateStr: string): string => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
};

export default function ScheduledTasksPage() {
  const { user } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'Pending' | 'Completed' | 'Incomplete'>('Pending');

  // Tasks Data
  const [tasks, setTasks] = useState<ScheduledMaintenanceTask[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Perform Task Modal
  const [performingTask, setPerformingTask] = useState<ScheduledMaintenanceTask | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<{ [key: number]: boolean }>({});
  const [engineerName, setEngineerName] = useState(user?.name || 'IT Broadcast Engineer');
  const [executionNotes, setExecutionNotes] = useState('');
  const [actionOutcome, setActionOutcome] = useState<'complete' | 'incomplete'>('complete');
  const [incompleteReasonText, setIncompleteReasonText] = useState('');

  // Add Task Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDate, setNewDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [newPreset, setNewPreset] = useState(TASK_PRESETS[0].name);
  const [newTitle, setNewTitle] = useState(TASK_PRESETS[0].name);
  const [newTaskBody, setNewTaskBody] = useState(TASK_PRESETS[0].task);

  // View Details Modal
  const [viewingTask, setViewingTask] = useState<ScheduledMaintenanceTask | null>(null);

  // Load from Storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTasks(JSON.parse(stored));
      } else {
        setTasks(DEFAULT_SCHEDULED_TASKS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SCHEDULED_TASKS));
      }
    } catch (e) {
      console.error(e);
      setTasks(DEFAULT_SCHEDULED_TASKS);
    }
  }, []);

  // Sync user name
  useEffect(() => {
    if (user?.name) setEngineerName(user.name);
  }, [user]);

  // Save tasks helper
  const saveTasks = (updated: ScheduledMaintenanceTask[]) => {
    setTasks(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('itv_maintenance_tasks_updated'));
      }
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  };

  // Open Perform Modal
  const handleOpenPerform = (task: ScheduledMaintenanceTask) => {
    setPerformingTask(task);
    setEngineerName(user?.name || 'IT Broadcast Engineer');
    setExecutionNotes('');
    setActionOutcome('complete');
    setIncompleteReasonText('');

    // Parse steps
    const lines = task.task.split('\n').filter((l) => l.trim().length > 0);
    const initialChecked: { [key: number]: boolean } = {};
    lines.forEach((_, idx) => {
      initialChecked[idx] = false;
    });
    setCheckedSteps(initialChecked);
  };

  // Submit Perform Modal
  const handleSubmitPerform = (e: React.FormEvent) => {
    e.preventDefault();
    if (!performingTask) return;

    const nowFormatted = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    if (actionOutcome === 'complete') {
      const updated = tasks.map((t) => {
        if (t.id === performingTask.id) {
          return {
            ...t,
            status: 'Completed' as const,
            completedAt: nowFormatted,
            completedBy: engineerName,
            completionNotes: executionNotes.trim() || 'All maintenance checklist steps performed and verified.',
          };
        }
        return t;
      });

      saveTasks(updated);
      showSuccessAlert('Task Completed', `${performingTask.scheduledTask} marked as Completed!`);
    } else {
      if (!incompleteReasonText.trim()) {
        showWarningAlert('Reason Required', 'Please provide an explanation for why this task was incomplete.');
        return;
      }

      const updated = tasks.map((t) => {
        if (t.id === performingTask.id) {
          return {
            ...t,
            status: 'Incomplete' as const,
            incompleteAt: nowFormatted,
            incompleteReportedBy: engineerName,
            incompleteReason: incompleteReasonText.trim(),
          };
        }
        return t;
      });

      saveTasks(updated);
      showWarningAlert('Marked Incomplete', `${performingTask.scheduledTask} moved to Incomplete Tasks.`);
    }

    setPerformingTask(null);
  };

  // Re-open / Mark as Pending
  const handleReopenTask = async (task: ScheduledMaintenanceTask) => {
    const confirmed = await confirmAction({
      title: 'Re-open Scheduled Task?',
      text: `Move "${task.scheduledTask}" (${task.date}) back to Pending Tasks?`,
      confirmButtonText: 'Yes, Move to Pending',
    });

    if (confirmed) {
      const updated = tasks.map((t) => {
        if (t.id === task.id) {
          return {
            ...t,
            status: 'Pending' as const,
            completedAt: undefined,
            completedBy: undefined,
            completionNotes: undefined,
            incompleteAt: undefined,
            incompleteReportedBy: undefined,
            incompleteReason: undefined,
          };
        }
        return t;
      });
      saveTasks(updated);
      showSuccessAlert('Task Re-opened', 'Task moved back to Pending Tasks tab.');
    }
  };

  // Delete Task
  const handleDeleteTask = async (task: ScheduledMaintenanceTask) => {
    const confirmed = await confirmDelete({
      title: 'Delete Scheduled Task?',
      text: `Remove "${task.scheduledTask}" (${task.date}) permanently?`,
      confirmButtonText: 'Yes, Delete Task',
    });

    if (confirmed) {
      const updated = tasks.filter((t) => t.id !== task.id);
      saveTasks(updated);
      showSuccessAlert('Deleted', 'Task removed from schedule.');
    }
  };

  // Add Task Preset Selection
  const handlePresetChange = (presetName: string) => {
    setNewPreset(presetName);
    const found = TASK_PRESETS.find((p) => p.name === presetName);
    if (found) {
      setNewTitle(found.name);
      setNewTaskBody(found.task);
    }
  };

  // Add Task Submit
  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newTitle.trim() || !newTaskBody.trim()) {
      showWarningAlert('Input Required', 'Please provide a valid date, task title, and task instructions.');
      return;
    }

    const newTask: ScheduledMaintenanceTask = {
      id: `sched-${Date.now()}`,
      date: newDate,
      dayOfWeek: getDayOfWeek(newDate),
      scheduledTask: newTitle.trim(),
      task: newTaskBody.trim(),
      status: 'Pending',
    };

    const updated = [newTask, ...tasks].sort((a, b) => a.date.localeCompare(b.date));
    saveTasks(updated);
    setIsAddModalOpen(false);
    showSuccessAlert('Task Scheduled', `New scheduled task added for ${newDate}!`);
  };

  // Counts
  const pendingCount = tasks.filter((t) => t.status === 'Pending').length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const incompleteCount = tasks.filter((t) => t.status === 'Incomplete').length;

  // Filtered List
  const visibleTasks = tasks
    .filter((t) => t.status === activeTab)
    .filter((t) => {
      const matchesSearch =
        t.scheduledTask.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.date.includes(searchTerm) ||
        t.dayOfWeek.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.completedBy && t.completedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.incompleteReason && t.incompleteReason.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType =
        filterType === 'ALL' ||
        (filterType === 'GV' && t.scheduledTask.toLowerCase().includes('gv')) ||
        (filterType === 'VIZRT' && t.scheduledTask.toLowerCase().includes('vizrt')) ||
        (filterType === 'DOMAIN' && t.scheduledTask.toLowerCase().includes('domain'));

      return matchesSearch && matchesType;
    });

  return (
    <AccessGuard module="dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="h-9 w-9 rounded-xl border border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                  <span>Scheduled Tasks</span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  Independent Television • Central Broadcast & Infrastructure Maintenance Schedule
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule New Task</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition shadow-xs"
            >
              <Printer className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Print Schedule</span>
            </button>
          </div>
        </div>

        {/* Tab Buttons (Exact match to screenshot style) */}
        <div className="flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('Pending')}
              className={`pb-3 pt-1 px-1 sm:px-2 text-sm font-semibold transition-all relative border-b-2 flex items-center gap-2 ${
                activeTab === 'Pending'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Pending Tasks</span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                  activeTab === 'Pending'
                    ? 'bg-amber-500/20 text-amber-500 font-bold'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {pendingCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('Completed')}
              className={`pb-3 pt-1 px-1 sm:px-2 text-sm font-semibold transition-all relative border-b-2 flex items-center gap-2 ${
                activeTab === 'Completed'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Completed Tasks</span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                  activeTab === 'Completed'
                    ? 'bg-emerald-500/20 text-emerald-500 font-bold'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {completedCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('Incomplete')}
              className={`pb-3 pt-1 px-1 sm:px-2 text-sm font-semibold transition-all relative border-b-2 flex items-center gap-2 ${
                activeTab === 'Incomplete'
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Incomplete Tasks</span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                  activeTab === 'Incomplete'
                    ? 'bg-rose-500/20 text-rose-500 font-bold'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {incompleteCount}
              </span>
            </button>
          </div>

          {/* Quick Search & Filter */}
          <div className="hidden md:flex items-center gap-2 pb-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tasks..."
                className="pl-8 pr-3 py-1.5 rounded-lg text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-44"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Types</option>
              <option value="GV">GV Maintenance</option>
              <option value="VIZRT">Vizrt Maintenance</option>
              <option value="DOMAIN">Domain Maintenance</option>
            </select>
          </div>
        </div>

        {/* Schedule Table (Styled matching screenshot) */}
        <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              {/* Header with Dark Background as in Screenshot */}
              <thead>
                <tr className="bg-[#151b26] text-white divide-x divide-gray-700/50">
                  <th className="py-3 px-3.5 font-bold tracking-wide w-28 whitespace-nowrap">Date</th>
                  <th className="py-3 px-3.5 font-bold tracking-wide w-32 whitespace-nowrap">Day of the Week</th>
                  <th className="py-3 px-4 font-bold tracking-wide w-56 whitespace-nowrap">Scheduled Task</th>
                  <th className="py-3 px-4 font-bold tracking-wide">Task</th>
                  <th className="py-3 px-3.5 font-bold tracking-wide w-28 text-center whitespace-nowrap">Status</th>
                  <th className="py-3 px-3.5 font-bold tracking-wide w-32 text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {visibleTasks.length > 0 ? (
                  visibleTasks.map((row, index) => (
                    <tr
                      key={row.id}
                      className={`divide-x divide-border hover:bg-muted/30 transition-colors ${
                        index % 2 === 0 ? 'bg-card' : 'bg-muted/10'
                      }`}
                    >
                      {/* Date */}
                      <td className="py-3.5 px-3.5 font-mono text-xs text-foreground font-semibold align-middle whitespace-nowrap">
                        {row.date}
                      </td>

                      {/* Day of Week */}
                      <td className="py-3.5 px-3.5 text-xs text-foreground font-medium align-middle whitespace-nowrap">
                        {row.dayOfWeek}
                      </td>

                      {/* Scheduled Task Title */}
                      <td className="py-3.5 px-4 text-xs font-bold text-foreground align-middle">
                        <span className="hover:text-primary transition-colors">{row.scheduledTask}</span>
                      </td>

                      {/* Task Checklist / Instructions */}
                      <td className="py-3.5 px-4 text-xs text-foreground/90 align-middle leading-relaxed">
                        <div className="whitespace-pre-line font-sans text-xs">
                          {row.task}
                        </div>

                        {/* Extra metadata for Completed / Incomplete tasks */}
                        {row.status === 'Completed' && (
                          <div className="mt-2.5 pt-2 border-t border-border/60 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <span>Completed by <strong>{row.completedBy}</strong> on {row.completedAt}</span>
                            {row.completionNotes && (
                              <p className="text-muted-foreground mt-0.5 italic">"{row.completionNotes}"</p>
                            )}
                          </div>
                        )}

                        {row.status === 'Incomplete' && (
                          <div className="mt-2.5 pt-2 border-t border-border/60 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                            <span>Issue logged by <strong>{row.incompleteReportedBy}</strong> on {row.incompleteAt}</span>
                            {row.incompleteReason && (
                              <p className="text-muted-foreground mt-0.5 italic">"{row.incompleteReason}"</p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                        {row.status === 'Pending' && (
                          <span className="inline-block px-3 py-1 rounded bg-[#ffc107] text-slate-950 font-bold text-[11px] shadow-2xs select-none">
                            Pending
                          </span>
                        )}

                        {row.status === 'Completed' && (
                          <span className="inline-block px-3 py-1 rounded bg-emerald-600 text-white font-bold text-[11px] shadow-2xs select-none">
                            Completed
                          </span>
                        )}

                        {row.status === 'Incomplete' && (
                          <span className="inline-block px-3 py-1 rounded bg-rose-600 text-white font-bold text-[11px] shadow-2xs select-none">
                            Incomplete
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-3 text-center align-middle whitespace-nowrap">
                        {row.status === 'Pending' && (
                          <button
                            onClick={() => handleOpenPerform(row)}
                            className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-[#007bff] hover:bg-blue-600 active:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
                          >
                            Perform Task
                          </button>
                        )}

                        {row.status === 'Completed' && (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setViewingTask(row)}
                              className="px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground font-medium text-xs border border-border"
                              title="View Details"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => handleReopenTask(row)}
                              className="p-1 rounded-md text-muted-foreground hover:text-amber-500 hover:bg-muted/80"
                              title="Move back to Pending"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}

                        {row.status === 'Incomplete' && (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenPerform(row)}
                              className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-[#007bff] hover:bg-blue-600 text-white font-semibold text-xs shadow-xs"
                            >
                              Retry Task
                            </button>
                            <button
                              onClick={() => handleReopenTask(row)}
                              className="p-1 rounded-md text-muted-foreground hover:text-amber-500 hover:bg-muted/80"
                              title="Reopen to Pending"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Calendar className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm font-semibold">No {activeTab.toLowerCase()} tasks found</p>
                        <p className="text-xs text-muted-foreground">
                          {activeTab === 'Pending'
                            ? 'All scheduled broadcast maintenance tasks have been handled.'
                            : activeTab === 'Completed'
                            ? 'No tasks marked as completed yet.'
                            : 'No incomplete or deferred maintenance tasks logged.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info pill */}
        <div className="p-3.5 rounded-xl bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              All schedules persist locally and agree with ITV Broadcast Procedures & Master Control Room (MCR) coordination.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                saveTasks(DEFAULT_SCHEDULED_TASKS);
                showSuccessAlert('Reset Complete', 'Reloaded default ITV schedule from master list.');
              }}
              className="text-[11px] text-muted-foreground hover:text-primary transition-colors underline"
            >
              Reset to Original Screenshot Master List
            </button>
          </div>
        </div>

        {/* ----------------- PERFORM TASK MODAL ----------------- */}
        {performingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 border border-blue-600/20">
                    <Play className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Perform Maintenance Task
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {performingTask.scheduledTask} &bull; {performingTask.date} ({performingTask.dayOfWeek})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPerformingTask(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmitPerform} className="p-5 overflow-y-auto space-y-4">
                {/* Step checklist */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Execution Steps Checklist
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const lines = performingTask.task.split('\n').filter((l) => l.trim().length > 0);
                        const allDone: { [key: number]: boolean } = {};
                        lines.forEach((_, i) => (allDone[i] = true));
                        setCheckedSteps(allDone);
                      }}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      Check All Steps
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2 max-h-56 overflow-y-auto">
                    {performingTask.task
                      .split('\n')
                      .filter((l) => l.trim().length > 0)
                      .map((line, idx) => (
                        <label
                          key={idx}
                          className="flex items-start gap-2.5 text-xs text-foreground cursor-pointer hover:bg-muted/60 p-1.5 rounded-lg transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={checkedSteps[idx] || false}
                            onChange={(e) =>
                              setCheckedSteps({ ...checkedSteps, [idx]: e.target.checked })
                            }
                            className="mt-0.5 rounded border-border text-primary focus:ring-primary h-4 w-4 shrink-0"
                          />
                          <span className={checkedSteps[idx] ? 'line-through text-muted-foreground' : ''}>
                            {line}
                          </span>
                        </label>
                      ))}
                  </div>
                </div>

                {/* Outcome Toggle (Complete vs Incomplete) */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Action Outcome
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setActionOutcome('complete')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        actionOutcome === 'complete'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-muted/40 text-muted-foreground hover:text-foreground border-border'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Task Completed Successfully</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionOutcome('incomplete')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        actionOutcome === 'incomplete'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-muted/40 text-muted-foreground hover:text-foreground border-border'
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span>Mark as Incomplete / Postponed</span>
                    </button>
                  </div>
                </div>

                {/* Handled By Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Handled / Verified By (Engineer Name)
                  </label>
                  <input
                    type="text"
                    required
                    value={engineerName}
                    onChange={(e) => setEngineerName(e.target.value)}
                    placeholder="Engineer Name"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Conditional Reason / Notes */}
                {actionOutcome === 'complete' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Execution Notes / Verification Remarks
                    </label>
                    <textarea
                      rows={2}
                      value={executionNotes}
                      onChange={(e) => setExecutionNotes(e.target.value)}
                      placeholder="e.g. All clients reloaded cleanly, temp cache purged, MCR acknowledged."
                      className="w-full px-3 py-2 rounded-xl text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-rose-500 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Why was this task incomplete / postponed? (Required)</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={incompleteReasonText}
                      onChange={(e) => setIncompleteReasonText(e.target.value)}
                      placeholder="e.g. Live broadcast running in PCR; couldn't reboot VizRT server. Postponed."
                      className="w-full px-3 py-2 rounded-xl text-xs bg-rose-500/5 border border-rose-500/40 text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
                    />
                  </div>
                )}

                {/* Modal Footer Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setPerformingTask(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all flex items-center gap-1.5 ${
                      actionOutcome === 'complete'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {actionOutcome === 'complete' ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Confirm & Complete Task</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4" />
                        <span>Confirm Incomplete Status</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ----------------- SCHEDULE NEW TASK MODAL ----------------- */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-bold text-foreground">Schedule Maintenance Task</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSchedule} className="p-5 space-y-4">
                {/* Date & Day of Week */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Date</label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Day of the Week</label>
                    <input
                      type="text"
                      disabled
                      value={getDayOfWeek(newDate)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-muted/20 border border-border/60 text-muted-foreground cursor-not-allowed font-semibold"
                    />
                  </div>
                </div>

                {/* Template Preset Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Select ITV Maintenance Template
                  </label>
                  <select
                    value={newPreset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {TASK_PRESETS.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Scheduled Task Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Scheduled Task Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. GV Weekly Maintenance"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                  />
                </div>

                {/* Task Instructions */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Task Steps / Checklist Instructions
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={newTaskBody}
                    onChange={(e) => setNewTaskBody(e.target.value)}
                    placeholder="1. Step one&#10;2. Step two&#10;3. Step three"
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
                  >
                    Add to Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ----------------- DETAILS MODAL ----------------- */}
        {viewingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">{viewingTask.scheduledTask}</h3>
                </div>
                <button
                  onClick={() => setViewingTask(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>Date: <strong className="text-foreground">{viewingTask.date}</strong></div>
                  <div>Day: <strong className="text-foreground">{viewingTask.dayOfWeek}</strong></div>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border whitespace-pre-line text-foreground/90">
                  {viewingTask.task}
                </div>

                {viewingTask.completedBy && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 space-y-1">
                    <p className="font-bold">Completed By: {viewingTask.completedBy}</p>
                    <p className="text-[11px]">Timestamp: {viewingTask.completedAt}</p>
                    {viewingTask.completionNotes && (
                      <p className="text-muted-foreground italic mt-1">"{viewingTask.completionNotes}"</p>
                    )}
                  </div>
                )}

                {viewingTask.incompleteReason && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 space-y-1">
                    <p className="font-bold">Incomplete Issue Logged By: {viewingTask.incompleteReportedBy}</p>
                    <p className="text-[11px]">Timestamp: {viewingTask.incompleteAt}</p>
                    <p className="text-muted-foreground italic mt-1">"{viewingTask.incompleteReason}"</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button
                  onClick={() => {
                    handleDeleteTask(viewingTask);
                    setViewingTask(null);
                  }}
                  className="text-xs text-rose-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Task</span>
                </button>
                <button
                  onClick={() => setViewingTask(null)}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AccessGuard>
  );
}
