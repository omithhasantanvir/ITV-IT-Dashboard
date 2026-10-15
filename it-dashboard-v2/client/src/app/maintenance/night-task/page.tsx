'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Moon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Server,
  HardDrive,
  ShieldCheck,
  Send,
  Calendar,
  FileText,
  Printer,
  Sparkles,
  Thermometer,
  Layers,
  ArrowLeft,
  CheckSquare,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessGuard } from '@/components/AccessGuard';
import { formatDate } from '@/lib/utils';

interface NightSubmission {
  id: string;
  date: string;
  engineerName: string;
  extension: string;
  shiftStatus: 'ALL_CLEAR' | 'WARNINGS' | 'CRITICAL';
  rackTemp: string;
  tasksCompleted: string;
  incidents: string;
  handoverNotes: string;
  checklist: string[];
  submittedAt: string;
}

const DEFAULT_NIGHT_CHECKLIST = [
  'SAN & NAS Storage Backup Synchronization verified',
  'Broadcast Ingest & Automation Playout health verified',
  'Core Active Directory & Newsroom servers operational',
  'MCR Transmission lines & intercom handshake tested',
  'Datacenter UPS power & AC temperature within 20°C - 22°C',
  'Daily MAM archive & off-peak render logs cleared',
];

const STORAGE_KEY = 'itv_night_task_submissions';

export default function DailyNightTaskPage() {
  const { user } = useAuth();

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [engineerName, setEngineerName] = useState(user?.name || 'IT Night Engineer');
  const [extension, setExtension] = useState('');
  const [rackTemp, setRackTemp] = useState('21.5°C Normal');
  const [shiftStatus, setShiftStatus] = useState<'ALL_CLEAR' | 'WARNINGS' | 'CRITICAL'>('ALL_CLEAR');
  const [tasksCompleted, setTasksCompleted] = useState('');
  const [incidents, setIncidents] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [checklist, setChecklist] = useState<string[]>(DEFAULT_NIGHT_CHECKLIST);

  // Submissions state
  const [submissions, setSubmissions] = useState<NightSubmission[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) setEngineerName(user.name);
  }, [user]);

  // Load from local storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSubmissions(JSON.parse(raw));
      } else {
        // Initial sample
        const sample: NightSubmission[] = [
          {
            id: 'night-001',
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            engineerName: 'Tanvir Hossain',
            extension: '2401',
            shiftStatus: 'ALL_CLEAR',
            rackTemp: '21.0°C Normal',
            tasksCompleted: 'SAN snapshot backup completed. Grass Valley playout nodes updated with latest patches. Cleaned server intake dust filters.',
            incidents: 'None. All broadcast channels transmitted with zero downtime.',
            handoverNotes: 'Morning shift to verify NAS pool 2 scheduled integrity scrub at 11:00 AM.',
            checklist: DEFAULT_NIGHT_CHECKLIST,
            submittedAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ];
        setSubmissions(sample);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
      }
    } catch {
      // fallback
    }
  }, []);

  const toggleChecklist = (item: string) => {
    if (checklist.includes(item)) {
      setChecklist(checklist.filter((c) => c !== item));
    } else {
      setChecklist([...checklist, item]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tasksCompleted.trim()) {
      alert('Please fill out the summary of tasks completed during the night shift.');
      return;
    }

    const newSub: NightSubmission = {
      id: `night-${Date.now()}`,
      date,
      engineerName: engineerName || user?.name || 'Night Duty Engineer',
      extension: extension || 'IT Desk',
      shiftStatus,
      rackTemp,
      tasksCompleted,
      incidents: incidents || 'No operational incidents reported.',
      handoverNotes: handoverNotes || 'Normal morning shift handover.',
      checklist,
      submittedAt: new Date().toISOString(),
    };

    const updated = [newSub, ...submissions];
    setSubmissions(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setToast('Night Shift Task Log submitted successfully!');
    setTimeout(() => setToast(null), 3500);

    // Reset fields
    setTasksCompleted('');
    setIncidents('');
    setHandoverNotes('');
  };

  return (
    <AccessGuard module="dashboard">
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500 text-white font-semibold text-xs shadow-2xl animate-in slide-in-from-bottom-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{toast}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="h-9 w-9 rounded-xl border border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shadow-xs">
                <Moon className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                  <span>Daily Night Task Submission</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase">
                    10:00 PM - 06:00 AM
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  Nightly Datacenter inspection, server maintenance, backup synchronization &amp; morning handover.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition shadow-xs"
            >
              <Printer className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Print Log</span>
            </button>
          </div>
        </div>

        {/* Main 2-column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Submission Form (7 columns) */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-7 p-5 sm:p-6 rounded-3xl border border-border bg-card/75 backdrop-blur-md shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Night Shift Handover Form</h2>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                IT Operations &bull; Central MCR
              </span>
            </div>

            {/* Engineer, Date, and Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Duty Date</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Engineer On Duty</label>
                <input
                  type="text"
                  required
                  value={engineerName}
                  onChange={(e) => setEngineerName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Intercom / Ext</label>
                <input
                  type="text"
                  value={extension}
                  onChange={(e) => setExtension(e.target.value)}
                  placeholder="e.g. 2401"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Shift Health & Datacenter Temperature */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Overall Shift Status</label>
                <select
                  value={shiftStatus}
                  onChange={(e: any) => setShiftStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="ALL_CLEAR">🟢 All Clear &bull; 100% Operational</option>
                  <option value="WARNINGS">🟡 Minor Warnings &bull; Action Pending</option>
                  <option value="CRITICAL">🔴 Critical Issue &bull; Urgent Handover</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Thermometer className="h-3 w-3 text-emerald-500" />
                  <span>Datacenter Temperature</span>
                </label>
                <input
                  type="text"
                  value={rackTemp}
                  onChange={(e) => setRackTemp(e.target.value)}
                  placeholder="e.g. 21°C Normal, UPS Normal"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Night Maintenance Routine Checklist */}
            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5 text-primary" />
                <span>Mandatory Night Checklist (Click to Toggle)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEFAULT_NIGHT_CHECKLIST.map((item) => {
                  const isChecked = checklist.includes(item);
                  return (
                    <button
                      type="button"
                      key={item}
                      onClick={() => toggleChecklist(item)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition flex items-start gap-2.5 ${
                        isChecked
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold'
                          : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      <CheckCircle2
                        className={`h-4 w-4 shrink-0 mt-0.5 ${
                          isChecked ? 'text-emerald-500' : 'text-muted-foreground/40'
                        }`}
                      />
                      <span className="leading-tight text-[11px]">{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary of Tasks Completed */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">
                Night Tasks Completed / Maintenance Carried Out <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={tasksCompleted}
                onChange={(e) => setTasksCompleted(e.target.value)}
                placeholder="Detail servers rebooted, backup jobs run, Avid/Grass Valley storage scrub, system updates, etc."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
              />
            </div>

            {/* Incidents & Handover */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Incidents / Alerts (If Any)
                </label>
                <textarea
                  rows={2}
                  value={incidents}
                  onChange={(e) => setIncidents(e.target.value)}
                  placeholder="e.g. Minor UPS fluctuation at 02:30 AM, resolved."
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Morning Shift Handover Notes
                </label>
                <textarea
                  rows={2}
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="Notes for Morning 06:00 AM shift engineers..."
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition shadow-md shadow-primary/20 flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              <span>Submit Night Shift Task Log</span>
            </button>
          </form>

          {/* Submissions History & Guidelines (5 columns) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Quick Shift Overview Card */}
            <div className="p-4 rounded-3xl border border-border bg-card/60 backdrop-blur-md space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Night Shift IT Mandate</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold">
                  SOP-ITV-NIGHT
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                All night shift engineers must ensure SAN/NAS off-peak backups conclude before 05:00 AM. 
                Morning transmission readiness must be green prior to 06:00 AM shift change.
              </p>
            </div>

            {/* Recent Submissions List */}
            <div className="p-5 rounded-3xl border border-border bg-card/75 backdrop-blur-md shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Recent Night Submissions
                </h3>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {submissions.length} Logged
                </span>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {submissions.length > 0 ? (
                  submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3.5 rounded-2xl border border-border/80 bg-muted/20 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Moon className="h-3.5 w-3.5 text-purple-400" />
                          <span className="font-bold text-foreground">{sub.engineerName}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Ext: {sub.extension}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                            sub.shiftStatus === 'ALL_CLEAR'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : sub.shiftStatus === 'WARNINGS'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          {sub.shiftStatus}
                        </span>
                      </div>

                      <p className="text-[11px] text-foreground font-medium leading-relaxed">
                        {sub.tasksCompleted}
                      </p>

                      {sub.handoverNotes && (
                        <div className="p-2 rounded-xl bg-background/60 border border-border/50 text-[10px] text-muted-foreground">
                          <span className="font-bold text-foreground">Handover: </span>
                          {sub.handoverNotes}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40 font-mono">
                        <span>Duty: {formatDate(sub.date)}</span>
                        <span>Temp: {sub.rackTemp}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No night shift logs recorded yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AccessGuard>
  );
}
