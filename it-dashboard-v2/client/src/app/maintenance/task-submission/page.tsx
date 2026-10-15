'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Computer,
  Server,
  Layers,
  Send,
  Calendar,
  FileText,
  Printer,
  Sparkles,
  Search,
  Filter,
  ArrowLeft,
  CheckSquare,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AccessGuard } from '@/components/AccessGuard';
import { formatDate } from '@/lib/utils';

interface MaintenanceTask {
  id: string;
  title: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'SCHEDULED' | 'PENDING_PARTS';
  assetTag: string;
  location: string;
  handledBy: string;
  partsUsed: string;
  description: string;
  date: string;
  submittedAt: string;
}

const CATEGORIES = [
  'Desktop / Workstation Hardware',
  'Server & SAN Storage System',
  'Network Switch / Cabling / Fiber',
  'Broadcast Playout & Ingest Suite',
  'Studio Prompter & Intercom Lines',
  'Software, OS & Antivirus Updates',
  'Datacenter Facilities (UPS, AC, Power)',
];

const STORAGE_KEY = 'itv_maintenance_task_submissions';

export default function MaintenanceTaskSubmissionPage() {
  const { user } = useAuth();

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [status, setStatus] = useState<'IN_PROGRESS' | 'COMPLETED' | 'SCHEDULED' | 'PENDING_PARTS'>('COMPLETED');
  const [assetTag, setAssetTag] = useState('');
  const [location, setLocation] = useState('Newsroom 3rd Floor');
  const [handledBy, setHandledBy] = useState(user?.name || 'IT Hardware Engineer');
  const [partsUsed, setPartsUsed] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Tasks List
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) setHandledBy(user.name);
  }, [user]);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setTasks(JSON.parse(raw));
      } else {
        const sample: MaintenanceTask[] = [
          {
            id: 'maint-001',
            title: 'Editing PC 07 RAM Upgrade & Dust Extraction',
            category: 'Desktop / Workstation Hardware',
            priority: 'MEDIUM',
            status: 'COMPLETED',
            assetTag: 'ITV-WS-07',
            location: 'Video Editing Suite B',
            handledBy: 'Tanvir Hossain',
            partsUsed: '16GB DDR4 RAM Module',
            description: 'Upgraded system memory from 16GB to 32GB for 4K video rendering timeline stability. Cleared CPU heatsink dust.',
            date: new Date().toISOString().split('T')[0],
            submittedAt: new Date().toISOString(),
          },
          {
            id: 'maint-002',
            title: 'Core Datacenter Switch Fan Replacement',
            category: 'Network Switch / Cabling / Fiber',
            priority: 'HIGH',
            status: 'COMPLETED',
            assetTag: 'CISCO-CORE-01',
            location: 'Rack 01 Central Datacenter',
            handledBy: 'Shariful Islam',
            partsUsed: '1x 40mm High-RPM Cooling Fan',
            description: 'Fan alert triggered on Cisco Catalyst 3850 core switch. Replaced secondary cooling module with zero packet loss.',
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            submittedAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ];
        setTasks(sample);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sample));
      }
    } catch {
      // fallback
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please fill out the task title and work description.');
      return;
    }

    const newTask: MaintenanceTask = {
      id: `maint-${Date.now()}`,
      title,
      category,
      priority,
      status,
      assetTag: assetTag || 'N/A',
      location: location || 'Central IT Desk',
      handledBy: handledBy || user?.name || 'IT Engineer',
      partsUsed: partsUsed || 'None (Servicing only)',
      description,
      date,
      submittedAt: new Date().toISOString(),
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setToast('Maintenance Task Logged Successfully!');
    setTimeout(() => setToast(null), 3500);

    // Reset fields
    setTitle('');
    setPartsUsed('');
    setDescription('');
    setAssetTag('');
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesCat = filterCategory === 'ALL' || t.category === filterCategory;
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.handledBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

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
              <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-xs">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                  <span>Maintenance Task Submission</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase">
                    HARDWARE &bull; SERVER &bull; BROADCAST
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  Record preventive servicing, component replacements, troubleshooting, and infrastructure repairs.
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
              <span>Print Reports</span>
            </button>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Submission Form (6 columns) */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-6 p-5 sm:p-6 rounded-3xl border border-border bg-card/75 backdrop-blur-md shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Log New Maintenance Task</h2>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">IT Engineering Form</span>
            </div>

            {/* Task Title */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">
                Task Title / Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Editing Suite 4 PC SSD Upgrade & OS Re-installation"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Priority</label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="LOW">Routine (Low)</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="CRITICAL">🔴 Critical / Emergency Downtime</option>
                </select>
              </div>
            </div>

            {/* Asset ID, Location, and Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Asset ID / Hostname</label>
                <input
                  type="text"
                  value={assetTag}
                  onChange={(e) => setAssetTag(e.target.value)}
                  placeholder="e.g. ITV-PC-102"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Location / Floor</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Newsroom 3rd Fl"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Status</label>
                <select
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="COMPLETED">✅ Completed</option>
                  <option value="IN_PROGRESS">⚡ In Progress</option>
                  <option value="SCHEDULED">📅 Scheduled</option>
                  <option value="PENDING_PARTS">⏳ Pending Spare Parts</option>
                </select>
              </div>
            </div>

            {/* Engineer on duty & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Handled By (Engineer)</label>
                <input
                  type="text"
                  required
                  value={handledBy}
                  onChange={(e) => setHandledBy(e.target.value)}
                  placeholder="Engineer Name"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Date of Service</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Parts Used */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">
                Spare Parts / Materials Used (Optional)
              </label>
              <input
                type="text"
                value={partsUsed}
                onChange={(e) => setPartsUsed(e.target.value)}
                placeholder="e.g. 1x Kingston 500GB SSD, 1x Thermal Paste, RJ45 Cat6 Patch cord"
                className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">
                Work Done / Maintenance Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe diagnostics, repairs performed, cable routing, benchmarks, and current operating condition."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition shadow-md shadow-primary/20 flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              <span>Submit Maintenance Log</span>
            </button>
          </form>

          {/* Maintenance Records & History (6 columns) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Filter & Search Bar */}
            <div className="p-4 rounded-3xl border border-border bg-card/75 backdrop-blur-md shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Maintenance Records ({filteredTasks.length})
                </h3>
                <span className="text-[10px] font-mono text-muted-foreground">All ITV Branches</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title, asset, engineer..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 truncate"
                >
                  <option value="ALL">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* List of Tasks */}
            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-3xl border border-border bg-card/80 hover:border-primary/40 transition shadow-xs space-y-2.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-foreground text-sm leading-tight">{t.title}</h4>
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                          {t.category} &bull; {t.location}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            t.priority === 'CRITICAL'
                              ? 'bg-rose-500 text-white'
                              : t.priority === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-500'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {t.priority}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}
                        >
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-foreground/90 leading-relaxed font-normal">
                      {t.description}
                    </p>

                    {t.partsUsed && t.partsUsed !== 'None' && (
                      <div className="p-2 rounded-xl bg-muted/40 text-[10px] text-muted-foreground flex items-center gap-2">
                        <Tag className="h-3 w-3 text-primary shrink-0" />
                        <span>Parts: {t.partsUsed}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/50 font-mono">
                      <span>Engineer: {t.handledBy}</span>
                      <span>Asset: {t.assetTag} &bull; {formatDate(t.date)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">
                  No maintenance records match your search.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AccessGuard>
  );
}
