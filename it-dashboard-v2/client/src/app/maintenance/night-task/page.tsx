'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Moon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Printer,
  Sparkles,
  ArrowLeft,
  Lock,
  Unlock,
  Radio,
  FileText,
  RotateCcw,
  History,
  Eye,
  Info,
  Send,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessGuard } from '@/components/AccessGuard';
import { formatDate } from '@/lib/utils';
import { confirmAction, showSuccessAlert, showWarningAlert } from '@/lib/sweetalert';

export interface NightTaskReport {
  id: string;
  date: string;
  submittedAt: string;
  engineerName: string;
  // 10 broadcast maintenance fields in exact requested sequence:
  // (1 -> 3 -> 4 -> 6 -> 2 -> 5 -> 8 -> 9 -> 10 -> 11, item 7 removed)
  gvStratusRules: string;     // 1
  octopusBackup: string;      // 3
  coreServerBackup: string;   // 4
  fsmServerServices: string;  // 6
  storageVDrive: string;      // 2
  altoStorageSpace: string;   // 5
  hrErpBackup: string;        // 8
  kDriveBackup: string;       // 9
  vizrtOldData: string;       // 10
  cloudDemo: string;          // 11
  overallNotes?: string;
}

const STORAGE_KEY = 'itv_night_maintenance_reports';

export default function DailyNightTaskPage() {
  const { user } = useAuth();

  // Active view: 'form' or 'history'
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  // Live Server / Local Time & Window Countdown
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [countdownStr, setCountdownStr] = useState('');
  const [adminBypass, setAdminBypass] = useState(true); // Enabled by default for testing/preview

  // Form Fields in exact sequence: 1, 3, 4, 6, 2, 5, 8, 9, 10, 11
  const [engineerName, setEngineerName] = useState(user?.name || 'IT Night Engineer');
  const [gvStratusRules, setGvStratusRules] = useState('');     // 1
  const [octopusBackup, setOctopusBackup] = useState('');       // 3
  const [coreServerBackup, setCoreServerBackup] = useState(''); // 4
  const [fsmServerServices, setFsmServerServices] = useState(''); // 6
  const [storageVDrive, setStorageVDrive] = useState('');       // 2
  const [altoStorageSpace, setAltoStorageSpace] = useState(''); // 5
  const [hrErpBackup, setHrErpBackup] = useState('');         // 8
  const [kDriveBackup, setKDriveBackup] = useState('');       // 9
  const [vizrtOldData, setVizrtOldData] = useState('');       // 10
  const [cloudDemo, setCloudDemo] = useState('');             // 11
  const [overallNotes, setOverallNotes] = useState('');

  // Submissions state
  const [submissions, setSubmissions] = useState<NightTaskReport[]>([]);
  const [activeReport, setActiveReport] = useState<NightTaskReport | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.name) setEngineerName(user.name);
  }, [user]);

  // Live Clock & 1:30 AM - 6:00 AM calculation
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);

      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentMinuteOfDay = hours * 60 + minutes;

      const windowStart = 1 * 60 + 30; // 01:30 AM
      const windowEnd = 6 * 60; // 06:00 AM

      if (currentMinuteOfDay >= windowStart && currentMinuteOfDay <= windowEnd) {
        setIsWindowOpen(true);
        const diffMins = windowEnd - currentMinuteOfDay;
        const h = Math.floor(diffMins / 60);
        const m = diffMins % 60;
        const s = 59 - now.getSeconds();
        setCountdownStr(
          `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
        );
      } else {
        setIsWindowOpen(false);
        let minsUntilNextStart = 0;
        if (currentMinuteOfDay < windowStart) {
          minsUntilNextStart = windowStart - currentMinuteOfDay;
        } else {
          minsUntilNextStart = 24 * 60 - currentMinuteOfDay + windowStart;
        }
        const h = Math.floor(minsUntilNextStart / 60);
        const m = minsUntilNextStart % 60;
        const s = 59 - now.getSeconds();
        setCountdownStr(
          `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
        );
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load submissions from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSubmissions(JSON.parse(raw));
      } else {
        const sample: NightTaskReport = {
          id: 'report-sample-01',
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          submittedAt: new Date(Date.now() - 86400000).toISOString(),
          engineerName: 'Tanvir Hossain',
          gvStratusRules: 'STRATUS rules verified. Ingest & Playout rules active with zero queue backlog.',
          octopusBackup: 'Octopus NRCS Database backup taken successfully to Central NAS.',
          coreServerBackup: 'Core Active Directory & DB Server system snapshot completed.',
          fsmServerServices: 'FSM Server Control Panel services running normal. All background daemon active.',
          storageVDrive: 'Checked V: Drive storage. Total 40 TB, Free 14.8 TB (37% free headroom).',
          altoStorageSpace: 'ALTO cold archive verified. Space: 82 TB used, 38 TB available.',
          hrErpBackup: 'Daily HR ERP SQL incremental backup completed to secondary backup cluster.',
          kDriveBackup: 'K: Shared Drive mirror backup verified and synchronized.',
          vizrtOldData: 'VCP LOWER 3RD 2014 data sorted. Deleted from 2015-04-12 to 2015-04-14 (2 days purged).',
          cloudDemo: 'Cloud demo stream and ingest endpoints tested and responsive.',
          overallNotes: 'All 10 routine maintenance checks completed smoothly without anomalies.',
        };
        setSubmissions([sample]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([sample]));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Auto fill routine text
  const handleQuickFillAll = () => {
    setGvStratusRules('GV STRATUS Engines rules verified. Playout & Ingest rules active with zero errors.');
    setOctopusBackup('Octopus NRCS Server automated & manual night backup completed successfully.');
    setCoreServerBackup('Core Server backup completed and verified on local backup volume.');
    setFsmServerServices('FSM Server Control Panel all services active and responding normally.');
    setStorageVDrive('V: Drive storage capacity verified. Adequate free space available for production.');
    setAltoStorageSpace('ALTO Archive storage checked. Total space and free space within normal thresholds.');
    setHrErpBackup('HR ERP database nightly incremental backup completed without error.');
    setKDriveBackup('K: Drive user and department files backup completed.');
    setVizrtOldData('In VCP: LOWER 3RD 2014 template data deleted for 2 days. Start: 2015-05-01, End: 2015-05-02.');
    setCloudDemo('Cloud Demo system tested and running normal.');
    setOverallNotes('Routine night-shift maintenance completed successfully.');

    setToast({ message: 'All 10 fields auto-filled with verified routine data!', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  // Reset form with modern SweetAlert confirmation dialog
  const handleReset = async () => {
    const isConfirmed = await confirmAction({
      title: 'Reset Form Fields?',
      text: 'Are you sure you want to clear all 10 broadcast maintenance entries? Any unsaved text will be lost.',
      icon: 'warning',
      confirmButtonText: 'Yes, Reset Form',
      cancelButtonText: 'Cancel',
      isDanger: true,
    });

    if (isConfirmed) {
      setGvStratusRules('');
      setOctopusBackup('');
      setCoreServerBackup('');
      setFsmServerServices('');
      setStorageVDrive('');
      setAltoStorageSpace('');
      setHrErpBackup('');
      setKDriveBackup('');
      setVizrtOldData('');
      setCloudDemo('');
      setOverallNotes('');
      await showSuccessAlert('Form Cleared', 'All 10 maintenance task fields have been reset.');
    }
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isWindowOpen && !adminBypass) {
      await showWarningAlert(
        'Submission Window Locked',
        'Night-Time Maintenance Reports can only be submitted between 1:30 A.M. and 6:00 A.M. Please turn on "Admin Test Bypass" above to test submissions anytime.'
      );
      return;
    }

    setIsSubmitting(true);

    const newReport: NightTaskReport = {
      id: `report-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      submittedAt: new Date().toISOString(),
      engineerName: engineerName || user?.name || 'Night Duty Engineer',
      gvStratusRules,
      octopusBackup,
      coreServerBackup,
      fsmServerServices,
      storageVDrive,
      altoStorageSpace,
      hrErpBackup,
      kDriveBackup,
      vizrtOldData,
      cloudDemo,
      overallNotes: overallNotes || 'Routine night shift report completed.',
    };

    setTimeout(async () => {
      const updated = [newReport, ...submissions];
      setSubmissions(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setIsSubmitting(false);

      await showSuccessAlert(
        'Report Submitted!',
        'Daily Night-Time Maintenance Report has been successfully saved to central archive.'
      );

      // Reset fields
      setGvStratusRules('');
      setOctopusBackup('');
      setCoreServerBackup('');
      setFsmServerServices('');
      setStorageVDrive('');
      setAltoStorageSpace('');
      setHrErpBackup('');
      setKDriveBackup('');
      setVizrtOldData('');
      setCloudDemo('');
      setOverallNotes('');
    }, 400);
  };

  // Helper for quick pill insertion
  const setQuickValue = (setter: React.Dispatch<React.SetStateAction<string>>, text: string) => {
    setter(text);
  };

  return (
    <AccessGuard module="dashboard">
      <div className="space-y-6 pb-16 animate-in fade-in duration-200">
        {/* Floating Toast Notification */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl text-white font-semibold text-xs shadow-2xl animate-in slide-in-from-bottom-3 ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Top Navigation & Controls */}
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="h-9 w-9 rounded-xl border border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                  <Moon className="h-4 w-4" />
                </div>
                <h1 className="text-xl font-black text-foreground tracking-tight">
                  Daily Night Task Submission
                </h1>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Central Broadcast IT Night-Time Maintenance &amp; Backup Verification Protocol
              </p>
            </div>
          </div>

          {/* Tab Switcher: Form vs History */}
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-xl border border-border bg-card/80 flex items-center gap-1 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'form'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Report Form</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'history'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                <span>History ({submissions.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="h-8 px-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition shadow-xs"
              title="Print form"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TOP ALERT BANNER: EXACT MATCH WITH SCREENSHOT (TIME WINDOW LOCK) */}
        {/* ================================================================= */}
        <div className="max-w-4xl mx-auto">
          <div
            className={`p-4 sm:p-5 rounded-xl shadow-md border transition-all text-white relative overflow-hidden ${
              isWindowOpen
                ? 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 border-emerald-500/50'
                : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 border-red-500/50'
            }`}
          >
            {/* Subtle background glow */}
            <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-inner">
                  {isWindowOpen ? (
                    <Unlock className="h-5 w-5 text-white" />
                  ) : (
                    <Lock className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                    <span>Data Backup &amp; Form Submission Available Only Between 1:30 A.M. And 6:00 A.M.</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-red-50">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Clock className="h-3.5 w-3.5 opacity-90" />
                      <span>
                        Current Server Time:{' '}
                        <strong className="text-white font-mono font-bold">
                          {currentTime.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true,
                          })}
                        </strong>
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <span className="opacity-90">⏳</span>
                      <span>
                        {isWindowOpen ? (
                          <>
                            Portal Closes In:{' '}
                            <strong className="text-emerald-100 font-mono font-bold">
                              {countdownStr}
                            </strong>
                          </>
                        ) : (
                          <>
                            Portal Opens In:{' '}
                            <strong className="text-amber-200 font-mono font-bold">
                              {countdownStr}
                            </strong>
                          </>
                        )}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Bypass Switch (Discreet & Convenient for Testing) */}
              <div className="flex items-center gap-2 self-start md:self-center bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/15 text-[11px]">
                <span className="text-red-100 font-medium">Admin Test Bypass:</span>
                <button
                  type="button"
                  onClick={() => setAdminBypass(!adminBypass)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-white/20 transition-colors duration-200 ${
                    adminBypass ? 'bg-emerald-400' : 'bg-slate-700'
                  }`}
                  title="Toggle to allow submissions anytime during testing"
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                      adminBypass ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* VIEW 1: THE CENTRALIZED REORGANIZED FORM                          */}
        {/* ================================================================= */}
        {activeTab === 'form' && (
          <div className="max-w-4xl mx-auto">
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden transition-all">
              {/* Form Title Banner - Independent Television Corporate Broadcast Header */}
              <div className="bg-gradient-to-r from-slate-900 via-zinc-900 to-slate-950 border-b border-border/80 px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] tracking-[0.2em] text-red-500 uppercase font-black">
                      INDEPENDENT TELEVISION
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/10 text-slate-300 font-mono">
                      LOG-NIGHT
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                    Daily Night-Time Maintenance Report Submission
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Broadcast IT &amp; Central Infrastructure Operations Log &bull; 01:30 AM – 06:00 AM Window
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleQuickFillAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition shadow-xs"
                    title="Quickly fill routine verification text across all fields"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Auto-Fill All</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/90 transition"
                    title="Reset all inputs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 bg-card/60">
                {/* Engineer Metadata Sub-Bar */}
                <div className="p-4 rounded-xl border border-border/80 bg-muted/30 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Reporting Engineer
                    </label>
                    <div className="relative">
                      <User className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={engineerName}
                        onChange={(e) => setEngineerName(e.target.value)}
                        placeholder="Engineer Full Name"
                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Maintenance Shift
                    </label>
                    <div className="px-3 py-2 rounded-lg border border-border bg-background/50 text-xs font-mono text-muted-foreground flex items-center justify-between">
                      <span>Night (01:30 - 06:00)</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    </div>
                  </div>
                </div>

                {/* --------------------------------------------------------------------------------- */}
                {/* THE 10 FIELDS IN EXACT REQUESTED SEQUENCE: 1, 3, 4, 6, 2, 5, 8, 9, 10, 11 (7 removed) */}
                {/* --------------------------------------------------------------------------------- */}
                <div className="space-y-5">
                  {/* #1 (Original 1): Check GV STRATUS Engines STRATUS Rules */}
                  <div className="space-y-1.5 p-4 rounded-xl border border-border/70 bg-card/40 hover:border-primary/40 transition">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="h-5 w-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center text-[11px] font-mono font-black">
                          1
                        </span>
                        <span>Check GV STRATUS Engines STRATUS Rules</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setQuickValue(setGvStratusRules, 'All STRATUS Engine rules active. No queue backlog.')}
                          className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary border border-border transition font-medium"
                        >
                          + Normal
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      required
                      value={gvStratusRules}
                      onChange={(e) => setGvStratusRules(e.target.value)}
                      placeholder="Describe GV STRATUS engine status, workflow rules, playout & ingest queues..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed transition"
                    />
                  </div>

                  {/* #2 (Original 3): Take Octopus Server Backup */}
                  <div className="space-y-1.5 p-4 rounded-xl border border-border/70 bg-card/40 hover:border-primary/40 transition">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="h-5 w-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center text-[11px] font-mono font-black">
                          2
                        </span>
                        <span>Take Octopus Server Backup</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setQuickValue(setOctopusBackup, 'Octopus NRCS Database & rundown backup taken successfully.')}
                          className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary border border-border transition font-medium"
                        >
                          + Completed
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      required
                      value={octopusBackup}
                      onChange={(e) => setOctopusBackup(e.target.value)}
                      placeholder="Enter Octopus server backup destination, timestamp, and verification status..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed transition"
                    />
                  </div>

                  {/* #3 (Original 4): Take Core Server Backup */}
                  <div className="space-y-1.5 p-4 rounded-xl border border-border/70 bg-card/40 hover:border-primary/40 transition">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="h-5 w-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center text-[11px] font-mono font-black">
                          3
                        </span>
                        <span>Take Core Server Backup</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setQuickValue(setCoreServerBackup, 'Core Server system image and database snapshot completed.')}
                          className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary border border-border transition font-medium"
                        >
                          + Completed
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      required
                      value={coreServerBackup}
                      onChange={(e) => setCoreServerBackup(e.target.value)}
                      placeholder="Enter Core server backup status, drive location, and file integrity check..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed transition"
                    />
                  </div>

                  {/* #4 (Original 6): Check FSM Server Control Panel services */}
                  <div className="space-y-1.5 p-4 rounded-xl border border-border/70 bg-card/40 hover:border-primary/40 transition">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="h-5 w-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center text-[11px] font-mono font-black">
                          4
                        </span>
                        <span>Check FSM Server Control Panel services</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setQuickValue(setFsmServerServices, 'FSM Server Control Panel services running. No service stoppage.')}
                          className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary border border-border transition font-medium"
                        >
                          + Active
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      required
                      value={fsmServerServices}
                      onChange={(e) => setFsmServerServices(e.target.value)}
                      placeholder="Check services in FSM Control Panel (daemons, services status, sync listeners)..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed transition"
                    />
                  </div>

                  {/* #5 (Original 2): Check Storage of V drive */}
                  <div className="space-y-1.5 p-4 rounded-xl border border-border/70 bg-card/40 hover:border-primary/40 transition">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="h-5 w-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center text-[11px] font-mono font-black">
                          5
                        </span>
                        <span>Check Storage of V drive</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setQuickValue(setStorageVDrive, 'V: Drive storage capacity checked. Adequate free headroom.')}
                          className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary border border-border transition font-medium"
                        >
                          + Healthy
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      required
                      value={storageVDrive}
                      onChange={(e) => setStorageVDrive(e.target.value)}
                      placeholder="Enter V: drive total capacity, available free space, and volume health..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed transition"
                    />
                  </div>

                  {/* #6 (Original 5): Check Total Space and Free Space on ALTO */}
                  <div className="space-y-1.5 p-4 rounded-xl border border-border/70 bg-card/40 hover:border-primary/40 transition">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="h-5 w-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center text-[11px] font-mono font-black">
                          6
                        </span>
                        <span>Check Total Space and Free Space on ALTO</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setQuickValue(setAltoStorageSpace, 'ALTO Archive storage checked: Space normal, free headroom sufficient.')}
                          className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary border border-border transition font-medium"
                        >
                          + Normal
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      required
                      value={altoStorageSpace}
                      onChange={(e) => setAltoStorageSpace(e.target.value)}
                      placeholder="Enter ALTO archive total capacity and available free space in TB/GB..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed transition"
                    />
                  </div>

                  {/* #7 (Original 8): Take HR ERP Data Backup */}
                  <div className="space-y-1.5 p-4 rounded-xl border border-border/70 bg-card/40 hover:border-primary/40 transition">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="h-5 w-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center text-[11px] font-mono font-black">
                          7
                        </span>
                        <span>Take HR ERP Data Backup</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setQuickValue(setHrErpBackup, 'HR ERP database automated & manual backup verified on NAS.')}
                          className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary border border-border transition font-medium"
                        >
                          + Completed
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      required
                      value={hrErpBackup}
                      onChange={(e) => setHrErpBackup(e.target.value)}
                      placeholder="Confirm HR ERP database export, destination directory, and file size..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed transition"
                    />
                  </div>

                  {/* #8 (Original 9): Take K Drive Backup */}
                  <div className="space-y-1.5 p-4 rounded-xl border border-border/70 bg-card/40 hover:border-primary/40 transition">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="h-5 w-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center text-[11px] font-mono font-black">
                          8
                        </span>
                        <span>Take K Drive Backup</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setQuickValue(setKDriveBackup, 'K: Drive department and shared folders backup verified.')}
                          className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary border border-border transition font-medium"
                        >
                          + Completed
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      required
                      value={kDriveBackup}
                      onChange={(e) => setKDriveBackup(e.target.value)}
                      placeholder="Enter K: drive backup destination, file sync verification, and time of completion..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed transition"
                    />
                  </div>

                  {/* #9 (Original 10): Delete Vizrt Old Data (with Special SOP Note Callout) */}
                  <div className="space-y-2 p-4 sm:p-5 rounded-xl border-2 border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-500/50 transition">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="h-5 w-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[11px] font-mono font-black">
                          9
                        </span>
                        <span>Delete Vizrt Old Data</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setQuickValue(
                              setVizrtOldData,
                              'VCP LOWER 3RD 2014 data deleted for 2 days. Start Date: 2015-06-01, End Date: 2015-06-02.'
                            )
                          }
                          className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition font-medium"
                        >
                          + Insert Sample
                        </button>
                      </div>
                    </div>

                    {/* Official SOP Guideline Note directly from screenshot */}
                    <div className="p-3 rounded-lg bg-background/80 border border-border/80 flex items-start gap-2.5 text-[11px] text-muted-foreground leading-relaxed">
                      <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground">SOP Instruction: </strong>
                        In VCP, go to the <strong>Data tab</strong>. Select{' '}
                        <span className="font-mono text-foreground font-semibold">
                          Concept =&gt; LOWER 3RD 2014
                        </span>
                        , <span className="font-mono text-foreground font-semibold">Template =&gt; ALL</span>, then sort by <strong>Date</strong>. Start deleting from <strong>2015</strong>, making sure to delete at least two days&apos; worth of data Daily. Mention Start and End Date of Deletion.
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      required
                      value={vizrtOldData}
                      onChange={(e) => setVizrtOldData(e.target.value)}
                      placeholder="State deletion range: e.g. Deleted 2 days data from 2015-05-10 to 2015-05-11..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 leading-relaxed transition"
                    />
                  </div>

                  {/* #10 (Original 11): Check Cloud Demo */}
                  <div className="space-y-1.5 p-4 rounded-xl border border-border/70 bg-card/40 hover:border-primary/40 transition">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="h-5 w-5 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center text-[11px] font-mono font-black">
                          10
                        </span>
                        <span>Check Cloud Demo</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setQuickValue(setCloudDemo, 'Cloud Demo system checked and responsive.')}
                          className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary border border-border transition font-medium"
                        >
                          + Normal
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      required
                      value={cloudDemo}
                      onChange={(e) => setCloudDemo(e.target.value)}
                      placeholder="Enter Cloud Demo streaming & cloud playout engine status..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed transition"
                    />
                  </div>
                </div>

                {/* Optional Handover Notes */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Handover Notes / Remarks (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={overallNotes}
                    onChange={(e) => setOverallNotes(e.target.value)}
                    placeholder="Any observations, pending tasks, or issues to flag for morning shift engineers..."
                    className="w-full px-3.5 py-2 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t border-border">
                  <button
                    type="submit"
                    disabled={isSubmitting || (!isWindowOpen && !adminBypass)}
                    className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 transition-all ${
                      !isWindowOpen && !adminBypass
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 text-white shadow-blue-600/25 active:scale-[0.99]'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting Daily Maintenance Report...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Submit Report</span>
                      </>
                    )}
                  </button>

                  {!isWindowOpen && !adminBypass && (
                    <p className="text-center text-[11px] text-red-400 mt-2">
                      🔒 Submission window locked. Turn on &ldquo;Admin Test Bypass&rdquo; at the top to submit outside 1:30 AM - 6:00 AM.
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 2: SUBMISSIONS HISTORY LOG (ORGANIZED & CLEAN)               */}
        {/* ================================================================= */}
        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    <span>Submitted Daily Night Reports</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Historical archive of 10-point broadcast maintenance checks
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold self-start sm:self-auto hover:bg-primary/90 transition"
                >
                  + New Submission
                </button>
              </div>

              {submissions.length > 0 ? (
                <div className="space-y-3">
                  {submissions.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-4 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-sm text-foreground">{rep.engineerName}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {formatDate(rep.date)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          <strong className="text-foreground">STRATUS:</strong> {rep.gvStratusRules} &bull;{' '}
                          <strong className="text-foreground">Octopus:</strong> {rep.octopusBackup}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setActiveReport(rep)}
                          className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition shadow-xs"
                        >
                          <Eye className="h-3.5 w-3.5 text-primary" />
                          <span>View Full Report</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-xs">
                  No maintenance reports submitted yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* REPORT INSPECTION MODAL                                           */}
        {/* ================================================================= */}
        {activeReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={() => setActiveReport(null)} />
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card text-foreground shadow-2xl p-6 z-10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Moon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      Daily Night Maintenance Report &bull; {formatDate(activeReport.date)}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Logged by {activeReport.engineerName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveReport(null)}
                  className="text-muted-foreground hover:text-foreground text-sm font-bold px-2 py-1"
                >
                  ✕
                </button>
              </div>

              {/* 10 Tasks Detailed List in Requested Sequence */}
              <div className="space-y-3 text-xs divide-y divide-border/60">
                <div className="pt-2">
                  <p className="font-bold text-foreground">1. Check GV STRATUS Engines STRATUS Rules</p>
                  <p className="text-muted-foreground mt-0.5">{activeReport.gvStratusRules || 'N/A'}</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold text-foreground">2. Take Octopus Server Backup</p>
                  <p className="text-muted-foreground mt-0.5">{activeReport.octopusBackup || 'N/A'}</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold text-foreground">3. Take Core Server Backup</p>
                  <p className="text-muted-foreground mt-0.5">{activeReport.coreServerBackup || 'N/A'}</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold text-foreground">4. Check FSM Server Control Panel services</p>
                  <p className="text-muted-foreground mt-0.5">{activeReport.fsmServerServices || 'N/A'}</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold text-foreground">5. Check Storage of V drive</p>
                  <p className="text-muted-foreground mt-0.5">{activeReport.storageVDrive || 'N/A'}</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold text-foreground">6. Check Total Space and Free Space on ALTO</p>
                  <p className="text-muted-foreground mt-0.5">{activeReport.altoStorageSpace || 'N/A'}</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold text-foreground">7. Take HR ERP Data Backup</p>
                  <p className="text-muted-foreground mt-0.5">{activeReport.hrErpBackup || 'N/A'}</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold text-foreground">8. Take K Drive Backup</p>
                  <p className="text-muted-foreground mt-0.5">{activeReport.kDriveBackup || 'N/A'}</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold text-foreground">9. Delete Vizrt Old Data</p>
                  <p className="text-muted-foreground mt-0.5 font-mono">{activeReport.vizrtOldData || 'N/A'}</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold text-foreground">10. Check Cloud Demo</p>
                  <p className="text-muted-foreground mt-0.5">{activeReport.cloudDemo || 'N/A'}</p>
                </div>
                {activeReport.overallNotes && (
                  <div className="pt-2">
                    <p className="font-bold text-foreground">Remarks / Handover Notes</p>
                    <p className="text-muted-foreground mt-0.5">{activeReport.overallNotes}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Print Report
                </button>
                <button
                  onClick={() => setActiveReport(null)}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
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
