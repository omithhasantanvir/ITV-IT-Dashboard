'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Printer,
  CheckCircle2,
  ArrowLeft,
  Search,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Check,
  Building,
  Briefcase,
  User,
  Calendar,
  Lock,
  Mail,
  Shield,
  Download,
  AlertCircle,
  ExternalLink,
  QrCode,
  Layout,
  FileText,
  PhoneCall,
  Sparkles,
  UserPlus,
  Hash,
  ShieldCheck,
  RotateCcw,
  KeyRound,
  Laptop,
  Layers,
  UserCheck,
} from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { AccessGuard } from '@/components/AccessGuard';
import { useAuth } from '@/context/AuthContext';
import { BrandLoading } from '@/components/BrandLoading';
import Swal from 'sweetalert2';
import QRCode from 'qrcode';

const QUICK_DEPARTMENTS = [
  'Broadcast Engineering',
  'Information Technology',
  'News Room',
  'Program & Production',
  'Operations',
  'Digital Media',
  'Administration',
  'Human Resources',
];

const QUICK_DESIGNATIONS = [
  'Broadcast Engineer',
  'IT Support Engineer',
  'Video Editor',
  'News Reporter',
  'Senior Sub-Editor',
  'Production Executive',
  'Camera Person',
  'Network Engineer',
];

const EMPLOYEE_TYPES = [
  'Permanent',
  'Contractual',
  'Probationary',
  'Intern',
  'Freelance',
  'Part-Time',
];

type ViewMode = 'HUB' | 'FORM' | 'LIST';
type SlipDisplayMode = 'OFFICIAL' | 'STUDIO';

interface EmployeeSlip {
  id: string;
  slipNumber: string;
  employeeType: string;
  pin: string | null;
  name: string | null;
  designation: string | null;
  department: string | null;
  emailId: string | null;
  emailPassword: string | null;
  domainId: string | null;
  domainPassword: string | null;
  hrmsUsername: string | null;
  hrmsPassword: string | null;
  foodUsername: string | null;
  foodPassword: string | null;
  createdBy: string | null;
  creatorDesignation: string | null;
  issueDate: string;
  status: string;
  createdAt: string;
}

export default function SlipsPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<ViewMode>('HUB');
  const [slips, setSlips] = useState<EmployeeSlip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSlip, setActiveSlip] = useState<EmployeeSlip | null>(null);
  const [displayMode, setDisplayMode] = useState<SlipDisplayMode>('OFFICIAL');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // QR Code Data URLs (Generated locally and completely offline)
  const [emailQr, setEmailQr] = useState<string>('');
  const [hrmsQr, setHrmsQr] = useState<string>('');
  const [foodQr, setFoodQr] = useState<string>('');

  // Form states matching the exact layout of Image 1
  const [formDate, setFormDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [employeeType, setEmployeeType] = useState('Permanent');
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');

  // Credentials
  const [emailId, setEmailId] = useState('');
  const [emailPassword, setEmailPassword] = useState('Itv4312');
  const [domainId, setDomainId] = useState('');
  const [domainPassword, setDomainPassword] = useState('Itv4312');
  const [hrmsUsername, setHrmsUsername] = useState('');
  const [hrmsPassword, setHrmsPassword] = useState('');
  const [foodUsername, setFoodUsername] = useState('');
  const [foodPassword, setFoodPassword] = useState('123456');

  // Authorization
  const [createdBy, setCreatedBy] = useState('');
  const [creatorDesignation, setCreatorDesignation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form password visibility toggles
  const [showEmailPass, setShowEmailPass] = useState(false);
  const [showDomainPass, setShowDomainPass] = useState(false);
  const [showHrmsPass, setShowHrmsPass] = useState(false);
  const [showFoodPass, setShowFoodPass] = useState(false);

  // Print ref
  const slipPrintRef = useRef<HTMLDivElement>(null);

  // Generate QR codes for portals
  useEffect(() => {
    QRCode.toDataURL('https://mail.independent24.tv', { width: 180, margin: 1, errorCorrectionLevel: 'M' })
      .then(setEmailQr)
      .catch((err) => console.error(err));

    QRCode.toDataURL('http://202.84.45.240:2023/xfactor/', { width: 180, margin: 1, errorCorrectionLevel: 'M' })
      .then(setHrmsQr)
      .catch((err) => console.error(err));

    QRCode.toDataURL('http://202.84.45.1:50765', { width: 180, margin: 1, errorCorrectionLevel: 'M' })
      .then(setFoodQr)
      .catch((err) => console.error(err));
  }, []);

  // Prepopulate creator details when user loads
  useEffect(() => {
    if (user) {
      if (!createdBy) setCreatedBy(user.name || '');
      if (!creatorDesignation) setCreatorDesignation(user.designation || 'IT Support Engineer');
    }
  }, [user]);

  // Fetch slips from server
  const fetchSlips = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/slips');
      setSlips(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch slips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlips();
  }, []);

  // Format date helper matching DD/MM/YYYY
  const formatOfficialDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Intelligent auto-sync handlers as seen in Image 1:
  // 1. PIN auto-syncs to X-Factor HRMS Username & Password
  const handlePinChange = (val: string) => {
    setPin(val);
    setHrmsUsername(val);
    setHrmsPassword(val);
  };

  // 2. Email ID auto-syncs to Food Requisition Username
  const handleEmailChange = (val: string) => {
    setEmailId(val);
    setFoodUsername(val);
  };

  // 3. Name auto-suggests Domain ID and Email ID if empty
  const handleNameChange = (val: string) => {
    setName(val);
    if (!domainId && val.trim().length > 2) {
      const parts = val.trim().toLowerCase().split(/\s+/);
      if (parts.length >= 2) {
        setDomainId(`${parts[0]}.${parts[parts.length - 1]}`);
        if (!emailId) {
          const suggestedEmail = `${parts[0]}.${parts[parts.length - 1]}@independent24.tv`;
          setEmailId(suggestedEmail);
          setFoodUsername(suggestedEmail);
        }
      } else {
        setDomainId(parts[0]);
      }
    }
  };

  // Reset form to clean default state
  const resetForm = () => {
    const today = new Date();
    setFormDate(today.toISOString().split('T')[0]);
    setEmployeeType('Permanent');
    setPin('');
    setName('');
    setDesignation('');
    setDepartment('');
    setEmailId('');
    setEmailPassword('Itv4312');
    setDomainId('');
    setDomainPassword('Itv4312');
    setHrmsUsername('');
    setHrmsPassword('');
    setFoodUsername('');
    setFoodPassword('123456');
    setCreatedBy(user?.name || '');
    setCreatorDesignation(user?.designation || 'IT Support Engineer');
    setError(null);
  };

  // Rapid sample profile filler for preview and testing
  const fillSampleData = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormDate(today);
    setEmployeeType('Permanent');
    setPin('5042');
    setName('Tanvir Hasan Omith');
    setDesignation('Broadcast Systems Specialist');
    setDepartment('Broadcast Engineering');
    setEmailId('tanvir.hasan@independent24.tv');
    setEmailPassword('Itv4312');
    setDomainId('tanvir.hasan');
    setDomainPassword('Itv4312');
    setHrmsUsername('5042');
    setHrmsPassword('5042');
    setFoodUsername('tanvir.hasan@independent24.tv');
    setFoodPassword('123456');
    setCreatedBy(user?.name || 'IT Operations Admin');
    setCreatorDesignation(user?.designation || 'Senior IT Support Engineer');
    setError(null);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter Employee Name.');
      return;
    }
    if (!pin.trim()) {
      setError('Please enter Employee PIN.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        date: formDate,
        employeeType,
        pin,
        name,
        designation,
        department,
        emailId,
        emailPassword,
        domainId,
        domainPassword,
        hrmsUsername: hrmsUsername || pin,
        hrmsPassword: hrmsPassword || pin,
        foodUsername: foodUsername || emailId,
        foodPassword,
        createdBy,
        creatorDesignation,
      };

      const res = await api.post('/api/slips', payload);
      if (res.data?.success) {
        const createdSlip = res.data.data;
        Swal.fire({
          icon: 'success',
          title: 'Employee Slip Created!',
          text: `Official Credential Slip for ${createdSlip.name} (${createdSlip.slipNumber}) is ready.`,
          confirmButtonText: 'View & Print Slip',
          showCancelButton: true,
          cancelButtonText: 'View All Slips',
        }).then((result) => {
          fetchSlips();
          resetForm();
          if (result.isConfirmed) {
            setActiveSlip(createdSlip);
            setMode('LIST');
          } else {
            setMode('LIST');
          }
        });
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Slip
  const handleDeleteSlip = async (id: string, slipNumber: string) => {
    const result = await Swal.fire({
      title: 'Delete Credential Slip?',
      text: `Are you sure you want to delete slip ${slipNumber}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#e11d48',
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/api/slips/${id}`);
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'The slip has been removed.',
          timer: 1500,
          showConfirmButton: false,
        });
        fetchSlips();
        if (activeSlip?.id === id) setActiveSlip(null);
      } catch (err: any) {
        Swal.fire('Error', getErrorMessage(err), 'error');
      }
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Copy full credential block to clipboard
  const handleCopyAllCredentials = () => {
    if (!activeSlip) return;
    const block = `INDEPENDENT TELEVISION LIMITED
Employee Credential Slip
========================================
PIN: ${activeSlip.pin || 'N/A'}
Name: ${activeSlip.name || 'N/A'}
Designation: ${activeSlip.designation || 'N/A'}
Department: ${activeSlip.department || 'N/A'}

[LOGIN CREDENTIALS]
E-Mail ID: ${activeSlip.emailId || 'N/A'}
E-Mail Password: ${activeSlip.emailPassword || 'Itv4312'}

Domain ID: ${activeSlip.domainId || 'N/A'}
Domain Password: ${activeSlip.domainPassword || 'Itv4312'}

X-Factor HRMS Username: ${activeSlip.hrmsUsername || activeSlip.pin || 'N/A'}
X-Factor HRMS Password: ${activeSlip.hrmsPassword || activeSlip.pin || 'N/A'}

Food Requisition Username: ${activeSlip.foodUsername || activeSlip.emailId || 'N/A'}
Food Requisition Password: ${activeSlip.foodPassword || '123456'}

Portal Links:
- E-Mail: https://mail.independent24.tv
- HRMS: http://202.84.45.240:2023/xfactor/
- Food: http://202.84.45.1:50765

IT Support: Ext. 30555 or 01730701335
========================================`;
    navigator.clipboard.writeText(block);
    setCopiedField('all');
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Print slip helper
  const handlePrintSlip = () => {
    window.print();
  };

  // Download PDF helper
  const handleDownloadPdf = async () => {
    if (!slipPrintRef.current) return;
    setIsDownloadingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(slipPrintRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 8;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, Math.min(contentHeight, pageHeight - margin * 2));
      pdf.save(`Employee-Info-Slip-${activeSlip?.pin || activeSlip?.slipNumber}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      Swal.fire('PDF Export Error', 'Could not generate PDF. Please use the Print option.', 'error');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Filtered slips
  const filteredSlips = slips.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.slipNumber?.toLowerCase().includes(q) ||
      s.name?.toLowerCase().includes(q) ||
      s.pin?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q) ||
      s.designation?.toLowerCase().includes(q) ||
      s.emailId?.toLowerCase().includes(q) ||
      s.createdBy?.toLowerCase().includes(q)
    );
  });

  return (
    <AccessGuard module="slips">
      <div className="space-y-6">

        {/* ======================================================== */}
        {/* VIEW 1: HUB LANDING CARD (EXACT MATCH TO IMAGE 2)        */}
        {/* ======================================================== */}
        {mode === 'HUB' && (
          <div className="min-h-[75vh] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card/95 border border-border/80 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center relative overflow-hidden transition-all duration-300">
              
              {/* Subtle top accent gradient */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-600 via-primary to-rose-500" />

              {/* Centered Independent Television Logo */}
              <div className="mb-3 flex items-center justify-center">
                <img
                  src="/itv-logo.png"
                  alt="Independent Television Logo"
                  className="h-16 w-auto object-contain drop-shadow-[0_4px_14px_rgba(227,30,36,0.45)] select-none transition-transform hover:scale-105"
                />
              </div>

              {/* Sub-brand text */}
              <span className="text-[11px] font-black tracking-[0.25em] text-foreground/80 uppercase font-sans mb-1.5">
                INDEPENDENT
              </span>

              {/* Title & Subtitle */}
              <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-1">
                Employee Slip Management
              </h2>
              <p className="text-xs text-muted-foreground font-medium mb-8">
                IT Support Credential &amp; Registration System
              </p>

              {/* Action Buttons from Image 2 */}
              <div className="w-full space-y-3.5">
                {/* Button 1: Add New Employee Slip */}
                <button
                  onClick={() => {
                    resetForm();
                    setMode('FORM');
                  }}
                  className="w-full py-3 px-5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Employee Slip</span>
                </button>

                {/* Button 2: View All Employee Slips */}
                <button
                  onClick={() => setMode('LIST')}
                  className="w-full py-3 px-5 rounded-2xl bg-muted/60 hover:bg-muted text-foreground font-bold text-sm border border-border/80 shadow-xs hover:border-border transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  <span>View All Employee Slips ({slips.length})</span>
                </button>
              </div>

              {/* Footer metadata */}
              <div className="mt-8 pt-4 border-t border-border/50 w-full flex items-center justify-between text-[11px] text-muted-foreground">
                <span>IT Operations Department</span>
                <span className="font-mono">v2.0 &bull; LAN Sync</span>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: NEW EMPLOYEE REGISTRATION FORM (IMAGE 1)         */}
        {/* ======================================================== */}
        {/* ======================================================== */}
        {/* VIEW 2: REDESIGNED NEW EMPLOYEE REGISTRATION FORM        */}
        {/* ======================================================== */}
        {mode === 'FORM' && (
          <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
            {/* Top Toolbar / Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setMode('HUB')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border/80 hover:border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition shadow-xs active:scale-[0.98]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Slip Management</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fillSampleData}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition shadow-xs active:scale-[0.98]"
                  title="Prefill sample broadcast employee profile for fast testing"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Fill Sample ITV Profile</span>
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition active:scale-[0.98]"
                  title="Clear all fields"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>

                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LAN Provisioning Active
                </span>
              </div>
            </div>

            {/* Studio Hero Banner Header */}
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-slate-950 via-zinc-900 to-slate-950 p-6 sm:p-8 text-white shadow-2xl">
              {/* Subtle Ambient Red Glow Effects */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/4 -mb-16 w-60 h-60 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-black/40 border border-white/10 p-2 flex items-center justify-center shrink-0 shadow-inner">
                    <img
                      src="/itv-logo.png"
                      alt="Independent Television Logo"
                      className="h-10 w-auto object-contain drop-shadow-[0_2px_8px_rgba(239,68,68,0.6)]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] tracking-[0.25em] text-red-400 uppercase font-black font-sans">
                        INDEPENDENT TELEVISION
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-semibold font-mono">
                        IT OPERATIONS
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                      New Employee Registration
                    </h1>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      Provision employee credentials for internal broadcast systems, Active Directory domain, and staff web portals.
                    </p>
                  </div>
                </div>

                <div className="hidden lg:flex flex-col items-end text-right border-l border-white/10 pl-6">
                  <span className="text-xs font-bold text-white tracking-wide">IT Operations Hub</span>
                  <span className="text-[11px] text-slate-400">Tejgaon I/A, Dhaka-1208</span>
                  <span className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                    <ShieldCheck className="h-3 w-3" /> Auto-Sync Active
                  </span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2.5 animate-in fade-in shadow-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Master-Detail Two-Column Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form Controls */}
              <div className="xl:col-span-7 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* ======================================================== */}
                  {/* CARD 1: GENERAL INFORMATION                              */}
                  {/* ======================================================== */}
                  <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md p-6 sm:p-7 shadow-lg space-y-5">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-black tracking-wider uppercase text-foreground">
                            01. General Information
                          </h3>
                          <p className="text-[11px] text-muted-foreground">
                            Personal &amp; organizational designation records
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                        Step 1 / 3
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Issue Date */}
                      <div>
                        <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5 mb-1.5">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span>Issue Date</span>
                        </label>
                        <input
                          type="date"
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition shadow-xs font-mono"
                        />
                      </div>

                      {/* Employee Type */}
                      <div>
                        <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5 mb-1.5">
                          <UserCheck className="h-3.5 w-3.5 text-primary" />
                          <span>Employee Type</span>
                        </label>
                        <select
                          value={employeeType}
                          onChange={(e) => setEmployeeType(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition shadow-xs font-medium"
                        >
                          {EMPLOYEE_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* PIN */}
                      <div>
                        <label className="text-[11px] font-bold text-foreground flex items-center justify-between mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <Hash className="h-3.5 w-3.5 text-primary" />
                            <span>Employee PIN <span className="text-primary">*</span></span>
                          </span>
                          <span className="text-[10px] text-emerald-500 font-mono font-medium flex items-center gap-0.5">
                            <Sparkles className="h-2.5 w-2.5" /> Syncs HRMS
                          </span>
                        </label>
                        <input
                          type="text"
                          value={pin}
                          onChange={(e) => handlePinChange(e.target.value)}
                          placeholder="e.g. 5042"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 transition shadow-xs"
                        />
                      </div>

                      {/* Full Name */}
                      <div>
                        <label className="text-[11px] font-bold text-foreground flex items-center justify-between mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-primary" />
                            <span>Full Name <span className="text-primary">*</span></span>
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
                            Auto-suggests Email
                          </span>
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder="e.g. Tanvir Hasan Omith"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition shadow-xs"
                        />
                      </div>

                      {/* Designation */}
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5 mb-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-primary" />
                          <span>Designation</span>
                        </label>
                        <input
                          type="text"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          placeholder="e.g. Broadcast Systems Specialist"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition shadow-xs mb-2"
                        />
                        {/* Quick Designation Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-muted-foreground font-medium mr-1">Quick:</span>
                          {QUICK_DESIGNATIONS.slice(0, 5).map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setDesignation(d)}
                              className="px-2 py-0.5 rounded-lg border border-border/70 bg-muted/40 hover:bg-muted text-[10px] text-muted-foreground hover:text-foreground transition"
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Department */}
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5 mb-1.5">
                          <Building className="h-3.5 w-3.5 text-primary" />
                          <span>Department</span>
                        </label>
                        <input
                          type="text"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="e.g. Broadcast Engineering"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition shadow-xs mb-2"
                        />
                        {/* Quick Department Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] text-muted-foreground font-medium mr-1">Quick:</span>
                          {QUICK_DEPARTMENTS.slice(0, 5).map((dept) => (
                            <button
                              key={dept}
                              type="button"
                              onClick={() => setDepartment(dept)}
                              className="px-2 py-0.5 rounded-lg border border-border/70 bg-muted/40 hover:bg-muted text-[10px] text-muted-foreground hover:text-foreground transition"
                            >
                              {dept}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* CARD 2: ACCOUNT CREDENTIALS                              */}
                  {/* ======================================================== */}
                  <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md p-6 sm:p-7 shadow-lg space-y-5">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                          <KeyRound className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-black tracking-wider uppercase text-foreground">
                            02. Account Credentials &amp; Portals
                          </h3>
                          <p className="text-[11px] text-muted-foreground">
                            Corporate Single Sign-On and portal access credentials
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                        Step 2 / 3
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Credential 1: Corporate E-Mail */}
                      <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 hover:border-primary/40 transition space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                            <Mail className="h-4 w-4 text-primary" />
                            <span>1. Corporate E-Mail Portal</span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            mail.independent24.tv
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                              Email ID
                            </label>
                            <input
                              type="email"
                              value={emailId}
                              onChange={(e) => handleEmailChange(e.target.value)}
                              placeholder="e.g. user@independent24.tv"
                              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 transition shadow-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                              E-Mail Password
                            </label>
                            <div className="relative">
                              <input
                                type={showEmailPass ? 'text' : 'password'}
                                value={emailPassword}
                                onChange={(e) => setEmailPassword(e.target.value)}
                                placeholder="Itv4312"
                                className="w-full px-3 py-2 pr-9 rounded-xl border border-border bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 transition shadow-xs"
                              />
                              <button
                                type="button"
                                onClick={() => setShowEmailPass(!showEmailPass)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                                title={showEmailPass ? 'Hide password' : 'Show password'}
                              >
                                {showEmailPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Credential 2: Active Directory Domain */}
                      <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 hover:border-primary/40 transition space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                            <Laptop className="h-4 w-4 text-primary" />
                            <span>2. Active Directory / PC Domain</span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                            LAN Workstation
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                              Domain ID
                            </label>
                            <input
                              type="text"
                              value={domainId}
                              onChange={(e) => setDomainId(e.target.value)}
                              placeholder="e.g. firstname.lastname"
                              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 transition shadow-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                              Domain Password
                            </label>
                            <div className="relative">
                              <input
                                type={showDomainPass ? 'text' : 'password'}
                                value={domainPassword}
                                onChange={(e) => setDomainPassword(e.target.value)}
                                placeholder="Itv4312"
                                className="w-full px-3 py-2 pr-9 rounded-xl border border-border bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 transition shadow-xs"
                              />
                              <button
                                type="button"
                                onClick={() => setShowDomainPass(!showDomainPass)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                                title={showDomainPass ? 'Hide password' : 'Show password'}
                              >
                                {showDomainPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Credential 3: X-Factor HRMS */}
                      <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 hover:border-emerald-500/40 transition space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                            <UserCheck className="h-4 w-4 text-emerald-500" />
                            <span>3. X-Factor HRMS Portal</span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1 font-semibold">
                            <Sparkles className="h-2.5 w-2.5" /> Synced with PIN
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                              HRMS Username
                            </label>
                            <input
                              type="text"
                              value={hrmsUsername}
                              onChange={(e) => setHrmsUsername(e.target.value)}
                              placeholder="Auto-synced from PIN"
                              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition shadow-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                              HRMS Password
                            </label>
                            <div className="relative">
                              <input
                                type={showHrmsPass ? 'text' : 'password'}
                                value={hrmsPassword}
                                onChange={(e) => setHrmsPassword(e.target.value)}
                                placeholder="Auto-synced from PIN"
                                className="w-full px-3 py-2 pr-9 rounded-xl border border-border bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition shadow-xs"
                              />
                              <button
                                type="button"
                                onClick={() => setShowHrmsPass(!showHrmsPass)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                                title={showHrmsPass ? 'Hide password' : 'Show password'}
                              >
                                {showHrmsPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Credential 4: Food Requisition System */}
                      <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 hover:border-amber-500/40 transition space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                            <FileText className="h-4 w-4 text-amber-500" />
                            <span>4. Food Requisition System</span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1 font-semibold">
                            <Sparkles className="h-2.5 w-2.5" /> Synced with Email
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                              Requisition Username
                            </label>
                            <input
                              type="text"
                              value={foodUsername}
                              onChange={(e) => setFoodUsername(e.target.value)}
                              placeholder="Auto-synced from Email"
                              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition shadow-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                              Requisition Password
                            </label>
                            <div className="relative">
                              <input
                                type={showFoodPass ? 'text' : 'password'}
                                value={foodPassword}
                                onChange={(e) => setFoodPassword(e.target.value)}
                                placeholder="123456"
                                className="w-full px-3 py-2 pr-9 rounded-xl border border-border bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition shadow-xs"
                              />
                              <button
                                type="button"
                                onClick={() => setShowFoodPass(!showFoodPass)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                                title={showFoodPass ? 'Hide password' : 'Show password'}
                              >
                                {showFoodPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* CARD 3: SLIP AUTHORIZATION                               */}
                  {/* ======================================================== */}
                  <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md p-6 sm:p-7 shadow-lg space-y-5">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-black tracking-wider uppercase text-foreground">
                            03. Slip Authorization &amp; Issuer
                          </h3>
                          <p className="text-[11px] text-muted-foreground">
                            Recorded signatory for this official ITV employee credential document
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                        Step 3 / 3
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Created By */}
                      <div>
                        <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5 mb-1.5">
                          <User className="h-3.5 w-3.5 text-primary" />
                          <span>Created By <span className="text-primary">*</span></span>
                        </label>
                        <input
                          type="text"
                          value={createdBy}
                          onChange={(e) => setCreatedBy(e.target.value)}
                          placeholder="Creator Name"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition shadow-xs"
                        />
                      </div>

                      {/* Creator Designation */}
                      <div>
                        <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5 mb-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-primary" />
                          <span>Creator Designation <span className="text-primary">*</span></span>
                        </label>
                        <input
                          type="text"
                          value={creatorDesignation}
                          onChange={(e) => setCreatorDesignation(e.target.value)}
                          placeholder="e.g. IT Support Engineer"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition shadow-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Actions */}
                  <div className="pt-2 space-y-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-primary via-primary/95 to-red-700 hover:from-primary/90 hover:to-red-800 text-white font-extrabold text-sm shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      <span>{submitting ? 'Generating Official Slip...' : 'Submit Registration & Generate Slip'}</span>
                    </button>

                    <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      <span>Submitting will record the employee and produce the official single-page A4 credential slip.</span>
                    </p>
                  </div>
                </form>
              </div>

              {/* Right Column: Live Interactive Credential Slip Preview */}
              <div className="xl:col-span-5 sticky top-6 space-y-4">
                <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md p-6 shadow-2xl space-y-5">
                  {/* Top Preview Bar */}
                  <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-wider text-foreground">
                        Live Slip Preview
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                      Single-Page A4 Ready
                    </span>
                  </div>

                  {/* Mini Official Slip Preview Box */}
                  <div className="rounded-2xl border border-border bg-background/95 p-4 sm:p-5 shadow-inner space-y-4 text-foreground">
                    {/* Official Banner Header */}
                    <div className="border-b border-border/70 pb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src="/itv-logo.png"
                          alt="ITV Logo"
                          className="h-7 w-auto object-contain drop-shadow-xs"
                        />
                        <div>
                          <span className="text-[9px] tracking-[0.2em] uppercase font-black text-muted-foreground block">
                            INDEPENDENT
                          </span>
                          <span className="text-xs font-extrabold text-foreground tracking-tight block">
                            Employee Info Slip
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-muted-foreground block">
                          {formatOfficialDate(formDate) || 'DD/MM/YYYY'}
                        </span>
                        <span className="text-[9px] font-semibold text-primary block uppercase">
                          {employeeType}
                        </span>
                      </div>
                    </div>

                    {/* Employee Profile Strip */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-red-800 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                        {name.trim()
                          ? name
                              .trim()
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((n) => n[0]?.toUpperCase())
                              .join('')
                          : 'IT'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-foreground truncate">
                          {name.trim() || 'Employee Full Name'}
                        </h4>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {designation.trim() || 'Designation'} &bull; {department.trim() || 'Department'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-background border border-border text-foreground">
                          PIN: {pin.trim() || '—'}
                        </span>
                      </div>
                    </div>

                    {/* Compact Credentials Grid */}
                    <div className="space-y-2 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50 flex items-center justify-between">
                        <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-primary" /> E-Mail:
                        </span>
                        <span className="font-mono font-bold text-foreground text-right truncate max-w-[190px]">
                          {emailId || '—'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50 flex items-center justify-between">
                        <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                          <Laptop className="h-3 w-3 text-primary" /> Domain ID:
                        </span>
                        <span className="font-mono font-bold text-foreground text-right truncate max-w-[190px]">
                          {domainId || '—'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50 flex items-center justify-between">
                        <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                          <UserCheck className="h-3 w-3 text-emerald-500" /> HRMS Login:
                        </span>
                        <span className="font-mono font-bold text-emerald-500 text-right truncate max-w-[190px]">
                          {hrmsUsername || pin || '—'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-muted/20 border border-border/50 flex items-center justify-between">
                        <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                          <FileText className="h-3 w-3 text-amber-500" /> Requisition:
                        </span>
                        <span className="font-mono font-bold text-amber-500 text-right truncate max-w-[190px]">
                          {foodUsername || emailId || '—'}
                        </span>
                      </div>
                    </div>

                    {/* QR Code Scannable Badges Mini Row */}
                    <div className="pt-2 border-t border-border/60">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                        <span className="font-bold flex items-center gap-1">
                          <QrCode className="h-3 w-3 text-primary" /> Offline QR Portals
                        </span>
                        <span className="font-mono text-[9px]">3 Portals Linked</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-1.5 rounded-lg border border-border/60 bg-muted/30 text-center">
                          {emailQr ? (
                            <img src={emailQr} alt="Email QR" className="h-10 w-10 mx-auto object-contain rounded" />
                          ) : (
                            <div className="h-10 w-10 mx-auto bg-muted rounded flex items-center justify-center text-[8px]">QR</div>
                          )}
                          <span className="text-[8px] font-bold text-foreground block mt-1">E-Mail</span>
                        </div>

                        <div className="p-1.5 rounded-lg border border-border/60 bg-muted/30 text-center">
                          {hrmsQr ? (
                            <img src={hrmsQr} alt="HRMS QR" className="h-10 w-10 mx-auto object-contain rounded" />
                          ) : (
                            <div className="h-10 w-10 mx-auto bg-muted rounded flex items-center justify-center text-[8px]">QR</div>
                          )}
                          <span className="text-[8px] font-bold text-foreground block mt-1">X-Factor</span>
                        </div>

                        <div className="p-1.5 rounded-lg border border-border/60 bg-muted/30 text-center">
                          {foodQr ? (
                            <img src={foodQr} alt="Food QR" className="h-10 w-10 mx-auto object-contain rounded" />
                          ) : (
                            <div className="h-10 w-10 mx-auto bg-muted rounded flex items-center justify-center text-[8px]">QR</div>
                          )}
                          <span className="text-[8px] font-bold text-foreground block mt-1">Food Req</span>
                        </div>
                      </div>
                    </div>

                    {/* Authorized Signatory Footnote */}
                    <div className="pt-2 border-t border-border/60 text-[10px] text-muted-foreground flex items-center justify-between">
                      <span className="truncate">
                        Issued by: <strong className="text-foreground">{createdBy || user?.name || 'IT Operations'}</strong>
                      </span>
                      <span className="text-[9px] font-mono text-emerald-500 font-semibold">
                        Ready
                      </span>
                    </div>
                  </div>

                  {/* Interactive Helper Box */}
                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/70 text-xs text-muted-foreground flex items-start gap-2.5">
                    <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      This live preview syncs instantaneously as you enter details. Upon submitting, the record is stored securely and you can immediately print or download the official slip.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: VIEW ALL EMPLOYEE SLIPS (DIRECTORY LIST)         */}
        {/* ======================================================== */}
        {mode === 'LIST' && (
          <div className="space-y-6">
            {/* Top Bar Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <button
                  onClick={() => setMode('HUB')}
                  className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Hub</span>
                </button>
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                  <span>Employee Credential Slips</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
                    {filteredSlips.length} Records
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All generated IT onboarding slips, system credentials, and account sign-offs.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    resetForm();
                    setMode('FORM');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 transition active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Employee Slip</span>
                </button>
              </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3.5 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by Slip No, Name, PIN, Department, or Email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Slips Table */}
            <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-md overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-4">Slip No.</th>
                      <th className="p-4">Staff Details</th>
                      <th className="p-4">Department &amp; Designation</th>
                      <th className="p-4">Account Credentials</th>
                      <th className="p-4">Issued By</th>
                      <th className="p-4">Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          <BrandLoading
                            size="inline"
                            text="Loading credential slips..."
                          />
                        </td>
                      </tr>
                    ) : filteredSlips.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-10 text-center text-muted-foreground">
                          <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                          <p className="font-semibold text-foreground text-sm">No credential slips found</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Click &ldquo;New Employee Slip&rdquo; to register and create a credential sheet.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredSlips.map((slip) => (
                        <tr key={slip.id} className="hover:bg-muted/30 transition group">
                          {/* Slip Number */}
                          <td className="p-4 font-mono font-bold text-foreground">
                            <span className="text-primary font-extrabold">{slip.slipNumber}</span>
                            <span className="block text-[10px] text-muted-foreground font-normal">
                              {slip.employeeType || 'Permanent'}
                            </span>
                          </td>

                          {/* Staff Details */}
                          <td className="p-4">
                            <p className="font-bold text-foreground">{slip.name || slip.employee?.name || 'N/A'}</p>
                            {slip.pin && (
                              <p className="text-[10px] text-muted-foreground font-mono">
                                PIN: <span className="font-semibold text-foreground">{slip.pin}</span>
                              </p>
                            )}
                          </td>

                          {/* Department & Designation */}
                          <td className="p-4">
                            <p className="font-medium text-foreground">{slip.designation || 'Staff'}</p>
                            <p className="text-[10px] text-muted-foreground">{slip.department || 'General'}</p>
                          </td>

                          {/* Credentials summary */}
                          <td className="p-4 space-y-0.5">
                            {slip.emailId && (
                              <p className="text-[11px] font-mono text-foreground flex items-center gap-1 truncate max-w-[200px]">
                                <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                                {slip.emailId}
                              </p>
                            )}
                            {slip.domainId && (
                              <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                                <Lock className="h-2.5 w-2.5 shrink-0" />
                                Domain: <span className="text-foreground">{slip.domainId}</span>
                              </p>
                            )}
                          </td>

                          {/* Issued by */}
                          <td className="p-4 text-[11px] text-muted-foreground">
                            <p className="font-semibold text-foreground">{slip.createdBy || slip.issuedBy || 'IT Admin'}</p>
                            <p className="text-[10px] text-muted-foreground">{slip.creatorDesignation || 'IT Engineer'}</p>
                          </td>

                          {/* Issue Date */}
                          <td className="p-4 text-[11px] text-muted-foreground font-mono">
                            {formatOfficialDate(slip.issueDate || slip.createdAt)}
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setActiveSlip(slip)}
                                className="px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs flex items-center gap-1.5 transition"
                                title="View & Print Official Slip"
                              >
                                <Printer className="h-3.5 w-3.5" />
                                <span>Official Slip</span>
                              </button>

                              <button
                                onClick={() => handleDeleteSlip(slip.id, slip.slipNumber)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition"
                                title="Delete Slip"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: OFFICIAL INDEPENDENT TV EMPLOYEE INFO SLIP        */}
        {/* EXACT CONTENT MATCH TO USER'S OFFICIAL IMAGE WITH        */}
        {/* 100% CLEAN PRINT TO A4 & DOWNLOAD PDF CAPABILITY         */}
        {/* ======================================================== */}
        {activeSlip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-background/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
            <div className="w-full max-w-3xl my-auto rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[95vh]">
              
              {/* Modal Top Control Toolbar (No-Print) */}
              <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-muted/40 no-print shrink-0">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      Employee Info Slip &bull; {activeSlip.name || 'Staff'}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Slip Ref: {activeSlip.slipNumber} &bull; PIN: {activeSlip.pin}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Copy All Text */}
                  <button
                    onClick={handleCopyAllCredentials}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition"
                    title="Copy formatted text to clipboard"
                  >
                    {copiedField === 'all' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy All</span>
                      </>
                    )}
                  </button>

                  {/* Download PDF */}
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{isDownloadingPdf ? 'Generating...' : 'PDF'}</span>
                  </button>

                  {/* Print Slip */}
                  <button
                    onClick={handlePrintSlip}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/25 hover:bg-primary/90 transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Slip</span>
                  </button>

                  {/* Close */}
                  <button
                    onClick={() => setActiveSlip(null)}
                    className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground hover:bg-muted transition"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Scrollable Document Wrapper */}
              <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100/70 dark:bg-slate-950/60 flex justify-center">
                
                {/* ---------------------------------------------------- */}
                {/* THE OFFICIAL PRINTABLE A4 SLIP CONTAINER             */}
                {/* (Matches the user's uploaded official image exactly) */}
                {/* ---------------------------------------------------- */}
                {/* ---------------------------------------------------- */}
                {/* THE OFFICIAL PRINTABLE A4 SLIP CONTAINER             */}
                {/* (Calibrated for strict 1-page A4 print & PDF export) */}
                {/* ---------------------------------------------------- */}
                <div
                  ref={slipPrintRef}
                  className="print-area w-full max-w-[680px] bg-white text-slate-900 border border-slate-300 rounded-2xl p-4 sm:p-6 shadow-sm space-y-2.5 font-sans select-text text-left"
                >
                  
                  {/* Top Mini Header */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono border-b border-slate-200 pb-1">
                    <span>{new Date().toLocaleDateString('en-GB')}, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-sans font-semibold text-slate-700">Employee Info Slip</span>
                  </div>

                  {/* Main Letterhead Header */}
                  <div className="flex items-start justify-between pt-0.5">
                    {/* Left: ITV Logo */}
                    <div className="flex flex-col items-center select-none shrink-0 w-20">
                      <img
                        src="/itv-logo.png"
                        alt="Independent Television Logo"
                        className="h-12 w-auto object-contain"
                      />
                      <span className="text-[9px] font-black tracking-widest text-slate-800 uppercase mt-0.5">
                        INDEPENDENT
                      </span>
                    </div>

                    {/* Center: Company Name & Address */}
                    <div className="text-center flex-1 px-2">
                      <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight leading-tight">
                        Independent Television Limited
                      </h1>
                      <p className="text-[10.5px] text-slate-600 font-medium mt-0.5">
                        149-150, Tejgaon Industrial Area, Dhaka-1208
                      </p>
                    </div>

                    {/* Right: Date */}
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-bold text-slate-900">
                        Date: <span className="font-semibold">{formatOfficialDate(activeSlip.issueDate || activeSlip.createdAt)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Document Title: Login Information */}
                  <div className="text-center py-0.5">
                    <h2 className="text-base font-black text-slate-950 tracking-tight">
                      Login Information
                    </h2>
                  </div>

                  {/* -------------------------------------------------- */}
                  {/* MAIN 12-ROW CREDENTIALS TABLE (COMPACT 1-PAGE)     */}
                  {/* -------------------------------------------------- */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <table className="w-full text-[10.5px] text-left border-collapse">
                      <tbody className="divide-y divide-slate-300">
                        {/* Row 1: PIN */}
                        <tr className="hover:bg-slate-50">
                          <th className="py-1 px-2.5 font-bold text-slate-900 w-2/5 bg-slate-50/80 border-r border-slate-300">PIN</th>
                          <td className="py-1 px-2.5 font-bold text-slate-950 font-mono">{activeSlip.pin || 'N/A'}</td>
                        </tr>

                        {/* Row 2: Name */}
                        <tr className="hover:bg-slate-50">
                          <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">Name</th>
                          <td className="py-1 px-2.5 font-bold text-slate-950">{activeSlip.name || 'N/A'}</td>
                        </tr>

                        {/* Row 3: Designation */}
                        <tr className="hover:bg-slate-50">
                          <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">Designation</th>
                          <td className="py-1 px-2.5 text-slate-800">{activeSlip.designation || 'Staff'}</td>
                        </tr>

                        {/* Row 4: Department */}
                        <tr className="hover:bg-slate-50">
                          <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">Department</th>
                          <td className="py-1 px-2.5 text-slate-800">{activeSlip.department || 'N/A'}</td>
                        </tr>

                        {/* Row 5: E-mail ID */}
                        <tr className="hover:bg-slate-50">
                          <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">E-mail ID</th>
                          <td className="py-1 px-2.5 text-slate-900 font-mono">{activeSlip.emailId || 'N/A'}</td>
                        </tr>

                        {/* Row 6: E-mail Password */}
                        <tr className="hover:bg-slate-50">
                          <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">E-mail Password</th>
                          <td className="py-1 px-2.5 font-mono font-bold text-slate-900">{activeSlip.emailPassword || 'Itv4312'}</td>
                        </tr>

                        {/* Row 7: Domain ID */}
                        <tr className="hover:bg-slate-50">
                          <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">Domain ID</th>
                          <td className="py-1 px-2.5 text-slate-900 font-mono">{activeSlip.domainId || 'N/A'}</td>
                        </tr>

                        {/* Row 8: Domain Password */}
                        <tr className="hover:bg-slate-50">
                          <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">Domain Password</th>
                          <td className="py-1 px-2.5 font-mono font-bold text-slate-900">{activeSlip.domainPassword || 'Itv4312'}</td>
                        </tr>

                        {/* Row 9: X-Factor HRMS Username */}
                        <tr className="hover:bg-slate-50">
                          <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">X-Factor HRMS Username</th>
                          <td className="py-1 px-2.5 text-slate-900 font-mono">{activeSlip.hrmsUsername || activeSlip.pin || 'N/A'}</td>
                        </tr>

                        {/* Row 10: X-Factor HRMS Password */}
                        <tr className="hover:bg-slate-50">
                          <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">X-Factor HRMS Password</th>
                          <td className="py-1 px-2.5 font-mono font-bold text-slate-900">{activeSlip.hrmsPassword || activeSlip.pin || 'N/A'}</td>
                        </tr>

                        {/* Row 11: Food Requisition Portal Username */}
                        <tr className="hover:bg-slate-50">
                          <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">Food Requisition Portal Username</th>
                          <td className="py-1 px-2.5 text-slate-900 font-mono">{activeSlip.foodUsername || activeSlip.emailId || 'N/A'}</td>
                        </tr>

                        {/* Row 12: Food Requisition Portal Password */}
                        <tr className="hover:bg-slate-50">
                          <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">Food Requisition Portal Password</th>
                          <td className="py-1 px-2.5 font-mono font-bold text-slate-900">{activeSlip.foodPassword || '123456'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* -------------------------------------------------- */}
                  {/* IMPORTANT PASSWORD POLICY INSTRUCTIONS             */}
                  {/* -------------------------------------------------- */}
                  <div className="text-[10px] space-y-1 text-slate-800">
                    <p className="font-bold text-slate-950">Important:</p>
                    <div className="pl-1 space-y-0.5 leading-tight text-[9.5px]">
                      <p className="font-medium">1. Your Domain password must meet the following requirements:</p>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                        <li>At least 8 characters long.</li>
                        <li>Password Can not contain any part of your Domain ID.</li>
                        <li>Include at least one uppercase letter (A-Z), at least one lowercase letter (a-z), at least one number (0-9), and at least one special character (e.g., !, @, #, $, etc.).</li>
                      </ul>
                      <p className="font-medium pt-0.5">
                        2. For E-Mail Password, use any complex password combinations.
                      </p>
                    </div>
                  </div>

                  {/* -------------------------------------------------- */}
                  {/* QUICK ACCESS QR CODES (3 QR CODES)                 */}
                  {/* -------------------------------------------------- */}
                  <div className="pt-1 text-center">
                    <div className="relative flex items-center justify-center mb-2">
                      <div className="border-t border-slate-400 w-full" />
                      <span className="bg-white px-3 text-[11px] font-bold text-slate-950 tracking-tight shrink-0">
                        Quick Access QR Codes
                      </span>
                      <div className="border-t border-slate-400 w-full" />
                    </div>

                    {/* QR Code Cards Grid */}
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-5 justify-items-center max-w-md mx-auto">
                      {/* QR 1: E-Mail Portal */}
                      <div className="border border-slate-300 rounded-lg p-1.5 bg-white text-center flex flex-col items-center w-full shadow-xs">
                        <div className="w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center overflow-hidden">
                          {emailQr ? (
                            <img src={emailQr} alt="E-Mail Portal QR" className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[9px] text-slate-400">
                              QR Code
                            </div>
                          )}
                        </div>
                        <span className="text-[9.5px] font-bold text-slate-800 mt-0.5 block">
                          E-Mail Portal
                        </span>
                      </div>

                      {/* QR 2: X-Factor HRMS */}
                      <div className="border border-slate-300 rounded-lg p-1.5 bg-white text-center flex flex-col items-center w-full shadow-xs">
                        <div className="w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center overflow-hidden">
                          {hrmsQr ? (
                            <img src={hrmsQr} alt="X-Factor HRMS QR" className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[9px] text-slate-400">
                              QR Code
                            </div>
                          )}
                        </div>
                        <span className="text-[9.5px] font-bold text-slate-800 mt-0.5 block">
                          X-Factor HRMS
                        </span>
                      </div>

                      {/* QR 3: Food Requisition */}
                      <div className="border border-slate-300 rounded-lg p-1.5 bg-white text-center flex flex-col items-center w-full shadow-xs">
                        <div className="w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center overflow-hidden">
                          {foodQr ? (
                            <img src={foodQr} alt="Food Requisition QR" className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[9px] text-slate-400">
                              QR Code
                            </div>
                          )}
                        </div>
                        <span className="text-[9.5px] font-bold text-slate-800 mt-0.5 block">
                          Food Requisition
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Portal URLs Instruction */}
                  <div className="text-[9.5px] text-slate-800 leading-snug pt-1 space-y-0.5">
                    <p className="font-semibold">3. Scan the QR codes above to quickly access portals:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                      <li>
                        <strong>E-Mail Portal:</strong> Scan the QR code or visit:{' '}
                        <a
                          href="https://mail.independent24.tv"
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-700 underline font-mono text-[9px]"
                        >
                          https://mail.independent24.tv
                        </a>
                      </li>
                      <li>
                        <strong>X-Factor HRMS Portal:</strong> Scan the QR code or visit:{' '}
                        <a
                          href="http://202.84.45.240:2023/xfactor/"
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-700 underline font-mono text-[9px]"
                        >
                          http://202.84.45.240:2023/xfactor/
                        </a>
                      </li>
                      <li>
                        <strong>Food Requisition Portal:</strong> Scan the QR code or visit:{' '}
                        <a
                          href="http://202.84.45.1:50765"
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-700 underline font-mono text-[9px]"
                        >
                          http://202.84.45.1:50765
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* IT Support Contact */}
                  <div className="pt-0.5 text-[9.5px] text-slate-800">
                    <p>
                      If you need further assistance with login or if you forget your password, contact IT Support at{' '}
                      <strong>Ext. 30555</strong> or <strong>01730701335</strong>.
                    </p>
                  </div>

                  {/* Security Warnings & Instructions */}
                  <div className="text-center pt-1.5 text-[9px] text-slate-700 space-y-0.5 font-medium">
                    <p>** Please change all of your given default login passwords after receiving this slip.</p>
                    <p>** Always log off from your E-Mail/domain session before leaving your computer.</p>
                  </div>

                  {/* Bottom Computer-Generated Notice */}
                  <div className="text-center pt-2 pb-1 border-t border-slate-200">
                    <p className="text-[9.5px] font-bold text-slate-600 tracking-wider">
                      **This is a computer-generated receipt and does not require a signature**
                    </p>
                  </div>

                  {/* Bottom Page Numbering / System Stamp */}
                  <div className="flex items-center justify-between text-[8px] text-slate-400 font-mono pt-0.5">
                    <span>172.19.4.7:2023/slip/view_employee.php?id={activeSlip.pin || activeSlip.id.slice(0, 8)}</span>
                    <span>1/1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AccessGuard>
  );
}
