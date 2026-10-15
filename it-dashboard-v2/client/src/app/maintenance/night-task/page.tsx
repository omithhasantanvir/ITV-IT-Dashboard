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
  Layers,
  ArrowLeft,
  CheckSquare,
  Lock,
  Unlock,
  Radio,
  Database,
  Cloud,
  Tv,
  Trash2,
  TrendingUp,
  Cpu,
  Info,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessGuard } from '@/components/AccessGuard';
import { formatDate } from '@/lib/utils';

export interface NightTaskReport {
  id: string;
  date: string;
  submittedAt: string;
  engineerName: string;
  engineerExt: string;
  // The 11 specific broadcast items from the user's form:
  gvStratusRules: string;
  storageVDrive: string;
  octopusBackup: string;
  coreServerBackup: string;
  altoStorageSpace: string;
  fsmServerServices: string;
  tickerStockData: string;
  hrErpBackup: string;
  kDriveBackup: string;
  vizrtOldData: string;
  cloudDemo: string;
  // Extra metadata
  overallNotes: string;
}

const STORAGE_KEY = 'itv_night_maintenance_reports';

export default function DailyNightTaskPage() {
  const { user } = useAuth();

  // Current Live Server/Local Time and Window Countdown
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [countdownStr, setCountdownStr] = useState('');
  const [adminBypass, setAdminBypass] = useState(true); // Enabled by default so users can fill & test anytime!

  // Form Fields (11 exact items)
  const [engineerName, setEngineerName] = useState(user?.name || 'IT Night Engineer');
  const [engineerExt, setEngineerExt] = useState('');
  const [gvStratusRules, setGvStratusRules] = useState('');
  const [storageVDrive, setStorageVDrive] = useState('');
  const [octopusBackup, setOctopusBackup] = useState('');
  const [coreServerBackup, setCoreServerBackup] = useState('');
  const [altoStorageSpace, setAltoStorageSpace] = useState('');
  const [fsmServerServices, setFsmServerServices] = useState('');
  const [tickerStockData, setTickerStockData] = useState('');
  const [hrErpBackup, setHrErpBackup] = useState('');
  const [kDriveBackup, setKDriveBackup] = useState('');
  const [vizrtOldData, setVizrtOldData] = useState('');
  const [cloudDemo, setCloudDemo] = useState('');
  const [overallNotes, setOverallNotes] = useState('');

  // Submissions state
  const [submissions, setSubmissions] = useState<NightTaskReport[]>([]);
  const [activeReport, setActiveReport] = useState<NightTaskReport | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) setEngineerName(user.name);
  }, [user]);

  // Live Clock & Window Calculation (1:30 AM to 6:00 AM)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);

      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentMinuteOfDay = hours * 60 + minutes;

      const windowStart = 1 * 60 + 30; // 01:30 AM (90 mins)
      const windowEnd = 6 * 60; // 06:00 AM (360 mins)

      if (currentMinuteOfDay >= windowStart && currentMinuteOfDay <= windowEnd) {
        setIsWindowOpen(true);
        const diffMins = windowEnd - currentMinuteOfDay;
        const h = Math.floor(diffMins / 60);
        const m = diffMins % 60;
        setCountdownStr(`Window Active &bull; Closes in ${h}h ${m}m`);
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
        const s = 60 - now.getSeconds();
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
          engineerExt: '2401',
          gvStratusRules: 'All GV STRATUS rules active. Workflow rules validated for Ingest and Playout engines without error.',
          storageVDrive: 'V: Drive storage capacity verified: 14.2 TB Total, 4.8 TB Free space (34% available).',
          octopusBackup: 'Octopus NRCS Database full snapshot backup taken successfully at 02:15 AM to NAS Storage.',
          coreServerBackup: 'Core AD & Primary Newsroom servers snapshot backup completed. SHA-256 checksum verified.',
          altoStorageSpace: 'ALTO Storage: Total 80 TB, Free Space 22.4 TB. Media archive migration pool healthy.',
          fsmServerServices: 'FSM Server Control Panel services running normal. All Grass Valley FlashNet tasks synced.',
          tickerStockData: 'Deleted old DSE/CSE stock ticker records from Ticker Engine. Morning news queue refreshed.',
          hrErpBackup: 'HR ERP database automated dump completed and zipped to backup repository.',
          kDriveBackup: 'K: Drive user document shares backed up to secondary backup pool.',
          vizrtOldData: 'VCP Lower 3rd 2014 templates cleaned up from 2015-03-01 to 2015-03-04 (4 days of old data deleted).',
          cloudDemo: 'Cloud demo stream latency checked: 1.6s, uplink connection stable.',
          overallNotes: 'Night shift maintenance 100% complete. Datacenter temp 21°C normal.',
        };
        setSubmissions([sample]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([sample]));
      }
    } catch {
      // fallback
    }
  }, []);

  // Quick fill helper
  const handleQuickFillAll = () => {
    setGvStratusRules('Verified. All STRATUS rules operational and syncing with playout nodes.');
    setStorageVDrive('Storage verified: Free space > 30%, no disk fragmentation warnings.');
    setOctopusBackup('Octopus NRCS backup completed successfully with zero error logs.');
    setCoreServerBackup('Core server backup image created and verified in secondary storage.');
    setAltoStorageSpace('ALTO cold storage checked: Space healthy, drives operating normally.');
    setFsmServerServices('FSM control panel services active: File System Manager healthy.');
    setTickerStockData('Deleted previous day market stock data from Ticker Engine database.');
    setHrErpBackup('HR ERP database backup verified and stored in central vault.');
    setKDriveBackup('K Drive shared documents incremental backup completed.');
    setVizrtOldData('Deleted Vizrt VCP Lower 3rd 2014 data for two consecutive days as per SOP.');
    setCloudDemo('Checked Cloud demo playout node: Connection healthy, latency within 2s.');
    setOverallNotes('All 11 night maintenance routines successfully completed.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isWindowOpen && !adminBypass) {
      alert('Submissions are strictly permitted between 1:30 A.M. and 6:00 A.M. Turn on Admin Bypass to submit outside the window.');
      return;
    }

    const newReport: NightTaskReport = {
      id: `report-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      submittedAt: new Date().toISOString(),
      engineerName: engineerName || user?.name || 'Night Duty Engineer',
      engineerExt: engineerExt || 'IT Desk',
      gvStratusRules,
      storageVDrive,
      octopusBackup,
      coreServerBackup,
      altoStorageSpace,
      fsmServerServices,
      tickerStockData,
      hrErpBackup,
      kDriveBackup,
      vizrtOldData,
      cloudDemo,
      overallNotes: overallNotes || 'Night shift report completed without issue.',
    };

    const updated = [newReport, ...submissions];
    setSubmissions(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setToast('Daily Night-Time Maintenance Report Submitted Successfully!');
    setTimeout(() => setToast(null), 4000);

    // Clear form
    setGvStratusRules('');
    setStorageVDrive('');
    setOctopusBackup('');
    setCoreServerBackup('');
    setAltoStorageSpace('');
    setFsmServerServices('');
    setTickerStockData('');
    setHrErpBackup('');
    setKDriveBackup('');
    setVizrtOldData('');
    setCloudDemo('');
    setOverallNotes('');
  };

  return (
    <AccessGuard module="dashboard">
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500 text-white font-semibold text-xs shadow-2xl animate-in slide-in-from-bottom-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{toast}</span>
          </div>
        )}

        {/* Page Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
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
                  <span>Daily Night-Time Maintenance Report</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase">
                    MCR &bull; Central IT
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  Official 11-point broadcast maintenance checklist &amp; backup audit protocol.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleQuickFillAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-xs font-semibold text-primary transition shadow-xs"
              title="Auto-fill routine completion text for all 11 items"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Auto-Fill Routine Data</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition shadow-xs"
            >
              <Printer className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TOP NOTICE BANNER: Exact Time Window (1:30 AM - 6:00 AM)    */}
        {/* ============================================================ */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border transition-all shadow-md relative overflow-hidden ${
            isWindowOpen
              ? 'bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-slate-950 border-emerald-500/40 text-emerald-100'
              : 'bg-gradient-to-r from-red-950/80 via-zinc-900 to-slate-950 border-red-500/40 text-red-100'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                  isWindowOpen ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                }`}
              >
                {isWindowOpen ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                  <span>Data Backup &amp; Form Submission Available Only Between 1:30 A.M. And 6:00 A.M.</span>
                  {isWindowOpen && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold animate-pulse">
                      ACTIVE NOW
                    </span>
                  )}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    <span>
                      Current Server Time:{' '}
                      <strong className="text-white">
                        {currentTime.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true,
                        })}
                      </strong>
                    </span>
                  </span>
                  <span className="text-slate-500">&bull;</span>
                  <span className="flex items-center gap-1.5 font-mono">
                    <Radio className="h-3.5 w-3.5 text-red-400 animate-pulse" />
                    <span>
                      {isWindowOpen ? (
                        <span className="text-emerald-400 font-bold">{countdownStr}</span>
                      ) : (
                        <span>
                          Portal Opens In: <strong className="text-amber-400">{countdownStr}</strong>
                        </span>
                      )}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Override Toggle */}
            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              <label
                htmlFor="adminBypassToggle"
                className="text-[11px] font-medium text-slate-300 cursor-pointer select-none"
              >
                Admin Testing Mode:
              </label>
              <button
                type="button"
                id="adminBypassToggle"
                onClick={() => setAdminBypass(!adminBypass)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  adminBypass ? 'bg-primary' : 'bg-slate-700'
                }`}
                title="Toggle bypass to allow submissions anytime during testing"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    adminBypass ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MAIN 2-COLUMN LAYOUT: The 11-point Form vs History           */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================== */}
          {/* The 11-Item Form (7 Columns)                               */}
          {/* ========================================================== */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-8 p-5 sm:p-7 rounded-3xl border border-border bg-card/75 backdrop-blur-md shadow-xs space-y-6"
          >
            {/* Engineer Info Bar */}
            <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Night Shift Reporting Engineer</p>
                  <p className="text-[11px] text-muted-foreground">Central MCR Broadcast IT Division</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <input
                  type="text"
                  required
                  value={engineerName}
                  onChange={(e) => setEngineerName(e.target.value)}
                  placeholder="Engineer Name"
                  className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-40"
                />
                <input
                  type="text"
                  value={engineerExt}
                  onChange={(e) => setEngineerExt(e.target.value)}
                  placeholder="Ext: 2401"
                  className="px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-24"
                />
              </div>
            </div>

            {/* -------------------------------------------------------- */}
            {/* CATEGORY 1: GRASS VALLEY & VIDEO STORAGE (Items 1, 2, 5) */}
            {/* -------------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                <Cpu className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  1. Grass Valley &amp; Storage Architecture
                </h3>
              </div>

              {/* Item 1 */}
              <div className="p-4 rounded-2xl border border-border/70 bg-card/60 space-y-2 hover:border-primary/40 transition">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-mono font-bold">
                      01
                    </span>
                    <span>Check GV STRATUS Engines STRATUS Rules</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setGvStratusRules('GV STRATUS Engines rules verified. Playout & Ingest rules active.')}
                    className="text-[10px] font-mono text-primary hover:underline font-semibold"
                  >
                    + Verified
                  </button>
                </div>
                <textarea
                  rows={2}
                  required
                  value={gvStratusRules}
                  onChange={(e) => setGvStratusRules(e.target.value)}
                  placeholder="Enter status of STRATUS engines, workflow rules, ingest queues, and playout nodes..."
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
                />
              </div>

              {/* Item 2 */}
              <div className="p-4 rounded-2xl border border-border/70 bg-card/60 space-y-2 hover:border-primary/40 transition">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-mono font-bold">
                      02
                    </span>
                    <span>Check Storage of V drive</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setStorageVDrive('V: Drive storage capacity verified. Normal headroom available.')}
                    className="text-[10px] font-mono text-primary hover:underline font-semibold"
                  >
                    + Healthy
                  </button>
                </div>
                <textarea
                  rows={2}
                  required
                  value={storageVDrive}
                  onChange={(e) => setStorageVDrive(e.target.value)}
                  placeholder="Enter total size, free space available, and volume health on V: drive..."
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
                />
              </div>

              {/* Item 5 */}
              <div className="p-4 rounded-2xl border border-border/70 bg-card/60 space-y-2 hover:border-primary/40 transition">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-mono font-bold">
                      05
                    </span>
                    <span>Check Total Space and Free Space on ALTO</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setAltoStorageSpace('ALTO cold storage checked. Space capacity verified within threshold.')}
                    className="text-[10px] font-mono text-primary hover:underline font-semibold"
                  >
                    + Space OK
                  </button>
                </div>
                <textarea
                  rows={2}
                  required
                  value={altoStorageSpace}
                  onChange={(e) => setAltoStorageSpace(e.target.value)}
                  placeholder="Mention total storage capacity, utilized space, and remaining free space on ALTO..."
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
                />
              </div>
            </div>

            {/* -------------------------------------------------------- */}
            {/* CATEGORY 2: NEWSROOM NRCS & CORE SERVERS (Items 3, 4, 6) */}
            {/* -------------------------------------------------------- */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                <Server className="h-4 w-4 text-emerald-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  2. Core Newsroom &amp; Server Infrastructure
                </h3>
              </div>

              {/* Item 3 */}
              <div className="p-4 rounded-2xl border border-border/70 bg-card/60 space-y-2 hover:border-primary/40 transition">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[10px] font-mono font-bold">
                      03
                    </span>
                    <span>Take Octopus Server Backup</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setOctopusBackup('Octopus NRCS Database full snapshot backup taken successfully.')}
                    className="text-[10px] font-mono text-emerald-500 hover:underline font-semibold"
                  >
                    + Backup Done
                  </button>
                </div>
                <textarea
                  rows={2}
                  required
                  value={octopusBackup}
                  onChange={(e) => setOctopusBackup(e.target.value)}
                  placeholder="Details of Octopus Newsroom Computer System backup file name, destination, and status..."
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
                />
              </div>

              {/* Item 4 */}
              <div className="p-4 rounded-2xl border border-border/70 bg-card/60 space-y-2 hover:border-primary/40 transition">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[10px] font-mono font-bold">
                      04
                    </span>
                    <span>Take Core Server Backup</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCoreServerBackup('Core Server snapshot backup completed and verified.')}
                    className="text-[10px] font-mono text-emerald-500 hover:underline font-semibold"
                  >
                    + Backup Done
                  </button>
                </div>
                <textarea
                  rows={2}
                  required
                  value={coreServerBackup}
                  onChange={(e) => setCoreServerBackup(e.target.value)}
                  placeholder="Core servers snapshot image details, repository, and verification checksum..."
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
                />
              </div>

              {/* Item 6 */}
              <div className="p-4 rounded-2xl border border-border/70 bg-card/60 space-y-2 hover:border-primary/40 transition">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[10px] font-mono font-bold">
                      06
                    </span>
                    <span>Check FSM Server Control Panel services</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFsmServerServices('FSM Server Control Panel services running normal. All tasks synced.')}
                    className="text-[10px] font-mono text-emerald-500 hover:underline font-semibold"
                  >
                    + Services OK
                  </button>
                </div>
                <textarea
                  rows={2}
                  required
                  value={fsmServerServices}
                  onChange={(e) => setFsmServerServices(e.target.value)}
                  placeholder="Check FlashNet / File System Manager services status in Control Panel..."
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
                />
              </div>
            </div>

            {/* -------------------------------------------------------- */}
            {/* CATEGORY 3: GRAPHICS, TICKER & CLOUD (Items 7, 10, 11)   */}
            {/* -------------------------------------------------------- */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                <Tv className="h-4 w-4 text-blue-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  3. Broadcast Graphics, Ticker &amp; Cloud Nodes
                </h3>
              </div>

              {/* Item 7 */}
              <div className="p-4 rounded-2xl border border-border/70 bg-card/60 space-y-2 hover:border-primary/40 transition">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px] font-mono font-bold">
                      07
                    </span>
                    <span>Delete Stock Data From Ticker Engine</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setTickerStockData('Deleted stock data from Ticker Engine. Database clean for morning session.')}
                    className="text-[10px] font-mono text-blue-500 hover:underline font-semibold"
                  >
                    + Cleared
                  </button>
                </div>
                <textarea
                  rows={2}
                  required
                  value={tickerStockData}
                  onChange={(e) => setTickerStockData(e.target.value)}
                  placeholder="Confirm purging of DSE/CSE market stock tables from ticker broadcast engine..."
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
                />
              </div>

              {/* Item 10: Delete Vizrt Old Data with SOP Instructions */}
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-2.5 transition">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-mono font-bold">
                      10
                    </span>
                    <span>Delete Vizrt Old Data</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setVizrtOldData('Deleted Vizrt VCP Lower 3rd 2014 data from 2015-03-01 to 2015-03-02 as per SOP.')}
                    className="text-[10px] font-mono text-amber-500 hover:underline font-semibold"
                  >
                    + SOP Done
                  </button>
                </div>

                {/* SOP Note Alert Box from screenshot */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>SOP Procedure:</strong> In VCP, go to the <strong>Data</strong> tab. Select <strong>Concept &rarr; LOWER 3RD 2014</strong>, <strong>Template &rarr; ALL</strong>, then sort by <strong>Date</strong>. Start deleting from 2015, making sure to delete at least two days&apos; worth of data Daily. Mention Start and End Date of Deletion.
                  </span>
                </div>

                <textarea
                  rows={3}
                  required
                  value={vizrtOldData}
                  onChange={(e) => setVizrtOldData(e.target.value)}
                  placeholder="Mention Start Date and End Date of deleted Vizrt Lower 3rd 2014 data (e.g. Deleted 2015-03-01 to 2015-03-02)..."
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed font-mono"
                />
              </div>

              {/* Item 11 */}
              <div className="p-4 rounded-2xl border border-border/70 bg-card/60 space-y-2 hover:border-primary/40 transition">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px] font-mono font-bold">
                      11
                    </span>
                    <span>Check Cloud Demo</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCloudDemo('Checked Cloud demo playout node: Stream connection healthy.')}
                    className="text-[10px] font-mono text-blue-500 hover:underline font-semibold"
                  >
                    + Verified
                  </button>
                </div>
                <textarea
                  rows={2}
                  required
                  value={cloudDemo}
                  onChange={(e) => setCloudDemo(e.target.value)}
                  placeholder="Check cloud ingest / distribution demo stream connectivity..."
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
                />
              </div>
            </div>

            {/* -------------------------------------------------------- */}
            {/* CATEGORY 4: ENTERPRISE & STORAGE DRIVES (Items 8, 9)     */}
            {/* -------------------------------------------------------- */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                <Database className="h-4 w-4 text-purple-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                  4. Enterprise ERP &amp; Network Drives
                </h3>
              </div>

              {/* Item 8 */}
              <div className="p-4 rounded-2xl border border-border/70 bg-card/60 space-y-2 hover:border-primary/40 transition">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center text-[10px] font-mono font-bold">
                      08
                    </span>
                    <span>Take HR ERP Data Backup</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setHrErpBackup('HR ERP database backup successfully exported to backup server.')}
                    className="text-[10px] font-mono text-purple-400 hover:underline font-semibold"
                  >
                    + Backup Done
                  </button>
                </div>
                <textarea
                  rows={2}
                  required
                  value={hrErpBackup}
                  onChange={(e) => setHrErpBackup(e.target.value)}
                  placeholder="Confirm HR ERP database dump completion and destination path..."
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
                />
              </div>

              {/* Item 9 */}
              <div className="p-4 rounded-2xl border border-border/70 bg-card/60 space-y-2 hover:border-primary/40 transition">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span className="h-5 w-5 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center text-[10px] font-mono font-bold">
                      09
                    </span>
                    <span>Take K Drive Backup</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setKDriveBackup('K: Drive shared files backup completed.')}
                    className="text-[10px] font-mono text-purple-400 hover:underline font-semibold"
                  >
                    + Backup Done
                  </button>
                </div>
                <textarea
                  rows={2}
                  required
                  value={kDriveBackup}
                  onChange={(e) => setKDriveBackup(e.target.value)}
                  placeholder="Document share K: drive backup status and file transfer confirmation..."
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
                />
              </div>
            </div>

            {/* Additional Remarks */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-foreground">
                Overall Night Shift Observations / Handover Remarks
              </label>
              <textarea
                rows={2}
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
                placeholder="Any special notes for Morning shift engineers (06:00 AM)..."
                className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-primary to-red-600 hover:from-primary/95 hover:to-red-700 text-white font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-primary/25 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              <span>Submit Report</span>
            </button>
          </form>

          {/* ========================================================== */}
          {/* Recent Reports History Column (4 Columns)                   */}
          {/* ========================================================== */}
          <div className="lg:col-span-4 space-y-4">
            {/* Quick Mandate Card */}
            <div className="p-4 rounded-3xl border border-border bg-card/60 backdrop-blur-md space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Submission Policy</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                  ITV-SOP-09
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Nightly maintenance tasks are strictly scheduled during off-peak broadcast hours (01:30 AM – 06:00 AM) to prevent production interruption on live news transmission.
              </p>
            </div>

            {/* Submissions History List */}
            <div className="p-5 rounded-3xl border border-border bg-card/75 backdrop-blur-md shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Submitted Night Reports ({submissions.length})
                </h3>
                <span className="text-[10px] font-mono text-muted-foreground">Central Vault</span>
              </div>

              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {submissions.length > 0 ? (
                  submissions.map((rep) => (
                    <div
                      key={rep.id}
                      onClick={() => setActiveReport(rep)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                        activeReport?.id === rep.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border/80 bg-muted/20 hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Moon className="h-3.5 w-3.5 text-purple-400" />
                          <span className="font-bold text-xs text-foreground">{rep.engineerName}</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-background border border-border text-muted-foreground">
                          Ext: {rep.engineerExt}
                        </span>
                      </div>

                      <div className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        <span className="font-semibold text-foreground">STRATUS: </span>
                        {rep.gvStratusRules}
                      </div>

                      <div className="text-[11px] text-muted-foreground line-clamp-1">
                        <span className="font-semibold text-foreground">Octopus: </span>
                        {rep.octopusBackup}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t border-border/40 font-mono">
                        <span>{formatDate(rep.date)}</span>
                        <span className="text-primary font-semibold hover:underline">
                          View 11 Tasks &rarr;
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    No night maintenance reports logged yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* REPORT INSPECTION MODAL                                      */}
        {/* ============================================================ */}
        {activeReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={() => setActiveReport(null)} />
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card text-foreground shadow-2xl p-6 z-10 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Moon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      Night Maintenance Report &bull; {formatDate(activeReport.date)}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Logged by {activeReport.engineerName} (Ext: {activeReport.engineerExt})
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

              {/* 11 Tasks Detailed List */}
              <div className="space-y-3 text-xs divide-y divide-border/60">
                <div className="pt-2">
                  <p className="font-bold text-foreground">01. Check GV STRATUS Engines STRATUS Rules</p>
                  <p className="text-muted-foreground mt-0.5">{activeReport.gvStratusRules || 'N/A'}</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold text-foreground">02. Check Storage of V drive</p>
                  <p className="text-muted-foreground mt-0.5">{activeReport.storageVDrive || 'N/A'}</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold text-foreground">03. Take Octopus Server Backup</p>
                  <p className="text-muted-foreground mt-0.5">{activeReport.octopusBackup || 'N/A'}</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold text-foreground">04. Take Core Server Backup</p>
                  <p className="text-muted-foreground mt-0.5">{activeReport.coreServerBackup || 'N/A'}</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold text-foreground">05. Check Total Space and Free Space on ALTO</p>
                  <p className="text-muted-foreground mt-0.5">{activeReport.altoStorageSpace || 'N/A'}</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold text-foreground">06. Check FSM Server Control Panel services</p>
                  <p className="text-muted-foreground mt-0.5">{activeReport.fsmServerServices || 'N/A'}</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold text-foreground">07. Delete Stock Data From Ticker Engine</p>
                  <p className="text-muted-foreground mt-0.5">{activeReport.tickerStockData || 'N/A'}</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold text-foreground">08. Take HR ERP Data Backup</p>
                  <p className="text-muted-foreground mt-0.5">{activeReport.hrErpBackup || 'N/A'}</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold text-foreground">09. Take K Drive Backup</p>
                  <p className="text-muted-foreground mt-0.5">{activeReport.kDriveBackup || 'N/A'}</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold text-foreground">10. Delete Vizrt Old Data</p>
                  <p className="text-muted-foreground mt-0.5 font-mono">{activeReport.vizrtOldData || 'N/A'}</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold text-foreground">11. Check Cloud Demo</p>
                  <p className="text-muted-foreground mt-0.5">{activeReport.cloudDemo || 'N/A'}</p>
                </div>
                {activeReport.overallNotes && (
                  <div className="pt-2">
                    <p className="font-bold text-foreground">Handover Notes / Remarks</p>
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
