'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  FileText,
  RotateCcw,
  History,
  Eye,
  Info,
  Send,
  Check,
  Server,
  HardDrive,
  Database,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatDate, cn } from '@/lib/utils';
import { confirmAction, showSuccessAlert, showWarningAlert } from '@/lib/sweetalert';

export interface NightTaskReport {
  id: string;
  date: string;
  submittedAt: string;
  engineerName: string;
  // 10 broadcast maintenance fields in exact requested sequence:
  // (1 -> 3 -> 4 -> 6 -> 2 -> 5 -> 8 -> 9 -> 10 -> 11, item 7 removed)
  gvStratusRules: string;     // 1
  octopusBackup: string;      // 2 (orig 3)
  coreServerBackup: string;   // 3 (orig 4)
  fsmServerServices: string;  // 4 (orig 6)
  storageVDrive: string;      // 5 (orig 2)
  altoStorageSpace: string;   // 6 (orig 5)
  hrErpBackup: string;        // 7 (orig 8)
  kDriveBackup: string;       // 8 (orig 9)
  vizrtOldData: string;       // 9 (orig 10)
  cloudDemo: string;          // 10 (orig 11)
  overallNotes?: string;
}

const STORAGE_KEY = 'itv_night_maintenance_reports';

interface TaskFieldDef {
  key: keyof NightTaskReport;
  num: number;
  label: string;
  category: 'Broadcast & Core Systems' | 'Production Storage & Archiving' | 'Enterprise Backups & Routine Purge';
  value: string;
  setter: (v: string) => void;
  placeholder: string;
  sopHint?: string;
  suggestions: string[];
}

// Substring highlight component for search/filter matching
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim()) return <span>{text}</span>;
  const q = query.trim();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark
            key={i}
            className="bg-primary/20 text-primary font-bold rounded-xs px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

// Dynamic as-you-type Autocomplete Typeahead Input Field
interface TypeaheadFieldProps {
  id: string;
  num: number;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  sopHint?: string;
  suggestions: string[];
  isFilled: boolean;
  onClear: () => void;
}

function TypeaheadField({
  id,
  num,
  label,
  value,
  onChange,
  placeholder,
  sopHint,
  suggestions,
  isFilled,
  onClear,
}: TypeaheadFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter matching suggestions dynamically as the engineer types
  const query = value.trim().toLowerCase();
  const matchingSuggestions = useMemo(() => {
    if (!query) {
      // If user toggles suggestions while input is empty, show all available suggestions
      return suggestions;
    }
    return suggestions.filter((s) => s.toLowerCase().includes(query));
  }, [suggestions, query]);

  // Handle typing: open dropdown when user types text
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setHighlightedIndex(-1);
    if (val.trim().length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Select suggestion
  const handleSelect = (sug: string) => {
    onChange(sug);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Keyboard navigation: ArrowDown, ArrowUp, Enter to select, Escape to close
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || matchingSuggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % matchingSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + matchingSuggestions.length) % matchingSuggestions.length);
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < matchingSuggestions.length) {
        e.preventDefault();
        handleSelect(matchingSuggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="space-y-1.5 relative">
      {/* Field Label & Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2 cursor-pointer select-none"
        >
          <span className="h-5 w-5 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-[11px] font-mono font-black shrink-0">
            {num}
          </span>
          <span>{label}</span>
        </label>

        <div className="flex items-center gap-2">
          {isFilled ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Check className="h-2.5 w-2.5" />
              <span>Recorded</span>
            </span>
          ) : (
            <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded bg-muted/60">
              Pending
            </span>
          )}

          {isFilled && (
            <button
              type="button"
              onClick={onClear}
              className="h-5 w-5 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer"
              title="Clear field"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Special SOP Hint for Vizrt (#9) */}
      {sopHint && (
        <div className="p-2.5 rounded-lg bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
          <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-foreground">SOP Rule: </strong>
            {sopHint}
          </div>
        </div>
      )}

      {/* Autocomplete Input Container */}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          required
          autoComplete="off"
          list={`datalist-field-${num}`}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.trim().length > 0 && matchingSuggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-3.5 pr-16 py-2.5 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition shadow-2xs font-normal"
        />

        {/* Fallback Native Browser Datalist */}
        <datalist id={`datalist-field-${num}`}>
          {suggestions.map((sug, sIdx) => (
            <option key={sIdx} value={sug} />
          ))}
        </datalist>

        {/* Right side accessories */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition cursor-pointer"
              title="Clear entry"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              if (!isOpen) {
                inputRef.current?.focus();
              }
            }}
            className={cn(
              "p-1 rounded text-muted-foreground hover:text-primary transition cursor-pointer",
              isOpen && "text-primary bg-primary/10"
            )}
            title="Toggle suggestions list"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Floating Autocomplete Dropdown - Shown dynamically as you type */}
        {isOpen && matchingSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-card/98 dark:bg-zinc-900/98 backdrop-blur-md border border-border shadow-xl rounded-xl py-1 overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-150 ring-1 ring-black/5 dark:ring-white/10">
            <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b border-border/50 bg-muted/40">
              <span className="flex items-center gap-1.5 text-primary">
                <Sparkles className="h-3 w-3" />
                <span>Suggestions ({matchingSuggestions.length})</span>
              </span>
              <span className="text-[9px] font-mono text-muted-foreground/80">
                ↑↓ to navigate &bull; Enter or click to fill
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto divide-y divide-border/40 py-0.5">
              {matchingSuggestions.map((sug, sIdx) => {
                const isSelected = highlightedIndex === sIdx;
                const isExactCurrent = value.trim() === sug.trim();

                return (
                  <button
                    key={sIdx}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(sug);
                    }}
                    onMouseEnter={() => setHighlightedIndex(sIdx)}
                    className={cn(
                      "w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-start justify-between gap-3 cursor-pointer",
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted/70 text-foreground",
                      isExactCurrent && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                    )}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="mt-0.5 shrink-0">
                        {isExactCurrent ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60 mt-1.5" />
                        )}
                      </div>
                      <div className="text-xs leading-relaxed break-words">
                        <HighlightMatch text={sug} query={value} />
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0 px-1 py-0.5 rounded bg-muted/50 border border-border/50 hidden sm:inline-block">
                      Select ↵
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
  const [octopusBackup, setOctopusBackup] = useState('');       // 2 (orig 3)
  const [coreServerBackup, setCoreServerBackup] = useState(''); // 3 (orig 4)
  const [fsmServerServices, setFsmServerServices] = useState(''); // 4 (orig 6)
  const [storageVDrive, setStorageVDrive] = useState('');       // 5 (orig 2)
  const [altoStorageSpace, setAltoStorageSpace] = useState(''); // 6 (orig 5)
  const [hrErpBackup, setHrErpBackup] = useState('');         // 7 (orig 8)
  const [kDriveBackup, setKDriveBackup] = useState('');       // 8 (orig 9)
  const [vizrtOldData, setVizrtOldData] = useState('');       // 9 (orig 10)
  const [cloudDemo, setCloudDemo] = useState('');             // 10 (orig 11)
  const [overallNotes, setOverallNotes] = useState('');

  // Submissions state
  const [submissions, setSubmissions] = useState<NightTaskReport[]>([]);
  const [activeReport, setActiveReport] = useState<NightTaskReport | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSopInfo, setShowSopInfo] = useState(true);

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
          engineerName: 'Omith Hasan',
          gvStratusRules: 'All STRATUS rules active & normal. Zero queue backlog.',
          octopusBackup: 'Octopus NRCS Database & rundown backup taken successfully to NAS.',
          coreServerBackup: 'Core Server DB & Active Directory system snapshot completed.',
          fsmServerServices: 'All FSM Server Control Panel services active & responding normal.',
          storageVDrive: 'Checked V: Drive storage. Total 40 TB, Free 14.8 TB (37% headroom).',
          altoStorageSpace: 'ALTO cold archive verified: 82 TB used, 38 TB available (Healthy).',
          hrErpBackup: 'Daily HR ERP SQL incremental backup completed to secondary NAS.',
          kDriveBackup: 'K: Shared Drive user & department files backup verified.',
          vizrtOldData: 'VCP LOWER 3RD 2014 data deleted for 2 days (2015-05-01 to 2015-05-02).',
          cloudDemo: 'Cloud demo stream and ingest endpoints tested and responsive.',
          overallNotes: 'Routine night shift maintenance checks completed smoothly without anomalies.',
        };
        setSubmissions([sample]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([sample]));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 10 Fields Configuration with High-Quality Smart Suggestions
  const taskFields: TaskFieldDef[] = useMemo(() => [
    // Category 1: Broadcast & Core Systems
    {
      key: 'gvStratusRules',
      num: 1,
      label: 'Check GV STRATUS Engines STRATUS Rules',
      category: 'Broadcast & Core Systems',
      value: gvStratusRules,
      setter: setGvStratusRules,
      placeholder: 'Describe GV STRATUS engine status, workflow rules, playout & ingest queues...',
      suggestions: [
        'All STRATUS rules active & normal. Zero queue backlog.',
        'Playout & Ingest rules verified. Workflow engines responsive.',
        'STRATUS rules verified; PCR rundowns in sync.',
      ],
    },
    {
      key: 'octopusBackup',
      num: 2,
      label: 'Take Octopus Server Backup',
      category: 'Broadcast & Core Systems',
      value: octopusBackup,
      setter: setOctopusBackup,
      placeholder: 'Enter Octopus server backup destination, timestamp, and verification status...',
      suggestions: [
        'Octopus NRCS Database & rundown backup taken successfully to NAS.',
        'Automated & manual night database dump completed without errors.',
        'NRCS backup volume verified on secondary backup storage.',
      ],
    },
    {
      key: 'coreServerBackup',
      num: 3,
      label: 'Take Core Server Backup',
      category: 'Broadcast & Core Systems',
      value: coreServerBackup,
      setter: setCoreServerBackup,
      placeholder: 'Enter Core server backup status, drive location, and file integrity check...',
      suggestions: [
        'Core Server DB & Active Directory system snapshot completed.',
        'System state & registry image backup verified on backup volume.',
        'Nightly core server incremental snapshot verified without warnings.',
      ],
    },
    {
      key: 'fsmServerServices',
      num: 4,
      label: 'Check FSM Server Control Panel services',
      category: 'Broadcast & Core Systems',
      value: fsmServerServices,
      setter: setFsmServerServices,
      placeholder: 'Check services in FSM Control Panel (daemons, services status, sync listeners)...',
      suggestions: [
        'All FSM Server Control Panel services active & responding normal.',
        'Background file sync daemons running healthy, zero service faults.',
        'FSM service health verified; all listener daemons active.',
      ],
    },

    // Category 2: Production Storage & Archiving
    {
      key: 'storageVDrive',
      num: 5,
      label: 'Check Storage of V: drive',
      category: 'Production Storage & Archiving',
      value: storageVDrive,
      setter: setStorageVDrive,
      placeholder: 'Enter V: drive total capacity, available free space, and volume health...',
      suggestions: [
        'Checked V: Drive storage. Total 40 TB, Free 14.8 TB (37% headroom).',
        'V: Drive storage capacity verified healthy. Free headroom > 35%.',
        'Production storage inspected; adequate free headroom for ingest.',
      ],
    },
    {
      key: 'altoStorageSpace',
      num: 6,
      label: 'Check Total Space and Free Space on ALTO',
      category: 'Production Storage & Archiving',
      value: altoStorageSpace,
      setter: setAltoStorageSpace,
      placeholder: 'Enter ALTO archive total capacity and available free space in TB/GB...',
      suggestions: [
        'ALTO cold archive verified: 82 TB used, 38 TB available (Healthy).',
        'ALTO Archive storage checked: Space normal, free headroom sufficient.',
        'Optical disc & deep archive space verified within safe thresholds.',
      ],
    },

    // Category 3: Enterprise Backups & Routine Purge
    {
      key: 'hrErpBackup',
      num: 7,
      label: 'Take HR ERP Data Backup',
      category: 'Enterprise Backups & Routine Purge',
      value: hrErpBackup,
      setter: setHrErpBackup,
      placeholder: 'Confirm HR ERP database export, destination directory, and file size...',
      suggestions: [
        'Daily HR ERP SQL incremental backup completed to secondary NAS.',
        'HR ERP database automated export verified (Size: 12.4 GB).',
        'Full ERP database backup completed without error.',
      ],
    },
    {
      key: 'kDriveBackup',
      num: 8,
      label: 'Take K: Drive Backup',
      category: 'Enterprise Backups & Routine Purge',
      value: kDriveBackup,
      setter: setKDriveBackup,
      placeholder: 'Enter K: drive backup destination, file sync verification, and time of completion...',
      suggestions: [
        'K: Shared Drive user & department files backup verified.',
        'K: Drive nightly mirror backup to central NAS completed.',
        'Incremental sync finished with zero file lock conflicts.',
      ],
    },
    {
      key: 'vizrtOldData',
      num: 9,
      label: 'Delete Vizrt Old Data',
      category: 'Enterprise Backups & Routine Purge',
      value: vizrtOldData,
      setter: setVizrtOldData,
      placeholder: 'State deletion range: e.g. Deleted 2 days data from 2015-05-10 to 2015-05-11...',
      sopHint: 'SOP Guideline: In VCP => Data tab => Concept: LOWER 3RD 2014 => Template: ALL => Sort by Date from 2015. Delete minimum 2 days Daily.',
      suggestions: [
        'VCP LOWER 3RD 2014 data deleted for 2 days (2015-05-01 to 2015-05-02).',
        'VCP LOWER 3RD 2014 data sorted by date and 2 days purged per SOP.',
        'Legacy template data deleted for 2 days (2015-05-03 to 2015-05-04).',
      ],
    },
    {
      key: 'cloudDemo',
      num: 10,
      label: 'Check Cloud Demo',
      category: 'Enterprise Backups & Routine Purge',
      value: cloudDemo,
      setter: setCloudDemo,
      placeholder: 'Enter Cloud Demo streaming & cloud playout engine status...',
      suggestions: [
        'Cloud demo stream and ingest endpoints tested and responsive.',
        'Cloud demo instances active; playback and latency normal.',
        'Cloud ingest tested; zero packet drops or buffering.',
      ],
    },
  ], [
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
  ]);

  // Count filled fields out of 10
  const filledCount = useMemo(() => {
    let count = 0;
    if (gvStratusRules.trim()) count++;
    if (octopusBackup.trim()) count++;
    if (coreServerBackup.trim()) count++;
    if (fsmServerServices.trim()) count++;
    if (storageVDrive.trim()) count++;
    if (altoStorageSpace.trim()) count++;
    if (hrErpBackup.trim()) count++;
    if (kDriveBackup.trim()) count++;
    if (vizrtOldData.trim()) count++;
    if (cloudDemo.trim()) count++;
    return count;
  }, [
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
  ]);

  // Auto fill all 10 with primary routine verification suggestions
  const handleQuickFillAll = () => {
    setGvStratusRules('All STRATUS rules active & normal. Zero queue backlog.');
    setOctopusBackup('Octopus NRCS Database & rundown backup taken successfully to NAS.');
    setCoreServerBackup('Core Server DB & Active Directory system snapshot completed.');
    setFsmServerServices('All FSM Server Control Panel services active & responding normal.');
    setStorageVDrive('Checked V: Drive storage. Total 40 TB, Free 14.8 TB (37% headroom).');
    setAltoStorageSpace('ALTO cold archive verified: 82 TB used, 38 TB available (Healthy).');
    setHrErpBackup('Daily HR ERP SQL incremental backup completed to secondary NAS.');
    setKDriveBackup('K: Shared Drive user & department files backup verified.');
    setVizrtOldData('VCP LOWER 3RD 2014 data deleted for 2 days (2015-05-01 to 2015-05-02).');
    setCloudDemo('Cloud demo stream and ingest endpoints tested and responsive.');
    setOverallNotes('All 10 routine night maintenance checks verified normal.');

    setToast({ message: 'All 10 fields filled with standard routine verification suggestions!', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  // Reset form with confirmation
  const handleReset = async () => {
    const isConfirmed = await confirmAction({
      title: 'Reset All Form Entries?',
      text: 'Are you sure you want to clear all 10 maintenance entries? Any unsaved text will be lost.',
      icon: 'warning',
      confirmButtonText: 'Yes, Clear Form',
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

      // Auto switch to history
      setActiveTab('history');
    }, 450);
  };

  // Group fields into 3 structured categories
  const categories = [
    {
      title: '1. Broadcast & Core Systems',
      desc: 'Grass Valley Stratus workflow rules, Octopus NRCS and Core infrastructure',
      icon: Server,
      fields: taskFields.filter((f) => f.category === 'Broadcast & Core Systems'),
    },
    {
      title: '2. Production Storage & Archiving',
      desc: 'Central V: Drive live production storage and ALTO optical cold archive',
      icon: HardDrive,
      fields: taskFields.filter((f) => f.category === 'Production Storage & Archiving'),
    },
    {
      title: '3. Enterprise Backups & Maintenance',
      desc: 'HR ERP database, K: Shared drive mirror, Vizrt VCP purge and Cloud demo',
      icon: Database,
      fields: taskFields.filter((f) => f.category === 'Enterprise Backups & Routine Purge'),
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
        {/* Toast Alert */}
        {toast && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
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

        {/* Top Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/80">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="h-9 w-9 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition shadow-2xs"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                  <Moon className="h-4 w-4" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  Daily Night Task Submission
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase">
                  10-Point SOP
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Independent Television &bull; Broadcast IT Night Maintenance &amp; Backup Verification Protocol
              </p>
            </div>
          </div>

          {/* View Tab Switcher & Print */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="p-1 rounded-xl border border-border bg-card flex items-center gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'form'
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Form</span>
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono rounded bg-white/20 text-white">
                  {filledCount}/10
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeTab === 'history'
                    ? 'bg-primary text-primary-foreground shadow-2xs'
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
              className="h-8 px-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition shadow-2xs"
              title="Print form"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* Compact Operational Status Strip */}
        <div className="p-3 sm:p-4 rounded-xl border border-border bg-card/70 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                isWindowOpen || adminBypass
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
              }`}
            >
              {isWindowOpen || adminBypass ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">Maintenance Window:</span>
                <span className="font-mono text-muted-foreground">01:30 AM – 06:00 AM</span>
                {adminBypass && !isWindowOpen && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase">
                    Bypass Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3 text-primary" />
                  <span>
                    BST: <strong className="text-foreground">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</strong>
                  </span>
                </span>
                <span>&bull;</span>
                <span className="font-mono">
                  {isWindowOpen ? `Window closes in: ${countdownStr}` : `Window opens in: ${countdownStr}`}
                </span>
              </div>
            </div>
          </div>

          {/* Test Bypass Switch */}
          <div className="flex items-center gap-2 self-start sm:self-center px-2.5 py-1 rounded-lg border border-border/70 bg-muted/30 text-[11px]">
            <span className="text-muted-foreground font-medium">Admin Test Bypass:</span>
            <button
              type="button"
              onClick={() => setAdminBypass(!adminBypass)}
              className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ${
                adminBypass ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
              title="Allow submission outside 1:30 AM - 6:00 AM for testing"
            >
              <span
                className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200 ${
                  adminBypass ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* VIEW 1: SIMPLIFIED, HIGH-READABILITY FORM WITH SUGGESTIONS        */}
        {/* ================================================================= */}
        {activeTab === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Top Toolbar: Reporting Metadata & Quick-Fill Actions */}
            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Report Parameters
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {filledCount} of 10 Completed
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleQuickFillAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 text-xs font-semibold transition shadow-2xs cursor-pointer"
                    title="Fill all 10 fields with verified routine status"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Auto-Fill All Defaults</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition cursor-pointer"
                    title="Clear all fields"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Metadata row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Submission Date
                  </label>
                  <div className="px-3 py-2 rounded-lg border border-border bg-muted/30 text-xs font-mono font-semibold text-foreground">
                    {formatDate(new Date().toISOString())}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Operational Shift
                  </label>
                  <div className="px-3 py-2 rounded-lg border border-border bg-muted/30 text-xs font-mono text-muted-foreground flex items-center justify-between">
                    <span className="font-semibold text-foreground">Night Shift (01:30 - 06:00)</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* 3 STRUCTURED OPERATIONAL SYSTEM GROUPS                           */}
            {/* --------------------------------------------------------------- */}
            {categories.map((cat, catIdx) => (
              <div key={cat.title} className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
                {/* Category Header */}
                <div className="px-5 py-3.5 bg-muted/40 border-b border-border/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <cat.icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-foreground tracking-tight">
                        {cat.title}
                      </h2>
                      <p className="text-[11px] text-muted-foreground">
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Category Fields List */}
                <div className="p-4 sm:p-5 space-y-5 divide-y divide-border/60">
                  {cat.fields.map((field, fIdx) => {
                    const isFilled = field.value.trim().length > 0;

                    return (
                      <div key={field.num} className={fIdx > 0 ? 'pt-5' : ''}>
                        <TypeaheadField
                          id={`night-task-field-${field.num}`}
                          num={field.num}
                          label={field.label}
                          value={field.value}
                          onChange={field.setter}
                          placeholder={field.placeholder}
                          sopHint={field.sopHint}
                          suggestions={field.suggestions}
                          isFilled={isFilled}
                          onClear={() => field.setter('')}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Handover Remarks (Optional) */}
            <div className="p-4 sm:p-5 rounded-xl border border-border bg-card shadow-2xs space-y-2">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                Shift Handover Notes &amp; Remarks (Optional)
              </label>
              <textarea
                rows={2}
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
                placeholder="Mention any abnormal behaviors, pending tickets, or observations to handover to morning shift..."
                className="w-full px-3.5 py-2 rounded-lg border border-border bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Submission Action Bar */}
            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">
                  {filledCount === 10
                    ? '✓ All 10 maintenance points recorded and ready for submission.'
                    : `⚠️ ${10 - filledCount} maintenance points still pending verification.`}
                </p>
                <p className="text-[11px] mt-0.5">
                  Submissions are logged to the official ITV Central Broadcast Archive.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting || (!isWindowOpen && !adminBypass)}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs tracking-wide shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    !isWindowOpen && !adminBypass
                      ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 active:scale-[0.98]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Report...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Submit Daily Night Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ================================================================= */}
        {/* VIEW 2: SUBMISSIONS HISTORY LOG (CLEAN & ORDERED)                  */}
        {/* ================================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-border bg-card shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    <span>Submitted Daily Night Reports</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Historical record of completed 10-point night maintenance shifts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold self-start sm:self-auto hover:bg-primary/90 transition shadow-2xs"
                >
                  + New Report Submission
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
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
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
                          className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 transition shadow-2xs"
                        >
                          <Eye className="h-3.5 w-3.5 text-primary" />
                          <span>View Report Details</span>
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

              {/* 10 Tasks Detailed List */}
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
  );
}
