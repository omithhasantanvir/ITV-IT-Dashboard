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
} from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { AccessGuard } from '@/components/AccessGuard';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import QRCode from 'qrcode';

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
                  className="w-full py-3 px-5 rounded-2xl bg-[#0070BA] hover:bg-[#005c99] text-white font-bold text-sm shadow-lg shadow-[#0070BA]/25 hover:shadow-xl hover:shadow-[#0070BA]/35 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
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
        {mode === 'FORM' && (
          <div className="max-w-2xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => setMode('HUB')}
              className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Slip Management</span>
            </button>

            {/* Form Container */}
            <div className="rounded-3xl border border-border bg-card shadow-2xl overflow-hidden backdrop-blur-md">
              
              {/* Top Navy Banner Header (Matches Image 1) */}
              <div className="bg-[#101726] px-6 py-8 text-center text-white flex flex-col items-center justify-center relative select-none">
                {/* Independent Television Logo */}
                <img
                  src="/itv-logo.png"
                  alt="Independent Television Logo"
                  className="h-12 w-auto object-contain mb-2 drop-shadow-[0_2px_10px_rgba(239,68,68,0.5)]"
                />
                <span className="text-[10px] tracking-[0.25em] text-slate-300 uppercase font-black font-sans mb-1">
                  INDEPENDENT
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  New Employee Registration
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Fill in the required information to generate the credential slip
                </p>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-7">
                {error && (
                  <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* SECTION 1: GENERAL INFORMATION                       */}
                {/* ---------------------------------------------------- */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black tracking-wider uppercase text-[#0070BA] dark:text-sky-400 flex items-center gap-1.5">
                    GENERAL INFORMATION
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Date */}
                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">Date</label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#0070BA]/40 transition"
                      />
                    </div>

                    {/* Employee Type */}
                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">Employee Type</label>
                      <select
                        value={employeeType}
                        onChange={(e) => setEmployeeType(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#0070BA]/40 transition"
                      >
                        <option value="Permanent">Permanent</option>
                        <option value="Contractual">Contractual</option>
                        <option value="Probationary">Probationary</option>
                        <option value="Intern">Intern</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Part-Time">Part-Time</option>
                      </select>
                    </div>

                    {/* PIN */}
                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">PIN</label>
                      <input
                        type="text"
                        value={pin}
                        onChange={(e) => handlePinChange(e.target.value)}
                        placeholder="Enter PIN"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-[#0070BA]/40 transition"
                      />
                    </div>

                    {/* Name */}
                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Enter Full Name"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#0070BA]/40 transition"
                      />
                    </div>

                    {/* Designation */}
                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">Designation</label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="Enter Designation"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#0070BA]/40 transition"
                      />
                    </div>

                    {/* Department */}
                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">Department</label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="Enter Department"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#0070BA]/40 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* SECTION 2: ACCOUNT CREDENTIALS                       */}
                {/* ---------------------------------------------------- */}
                <div className="space-y-4 pt-2 border-t border-border/60">
                  <h3 className="text-xs font-black tracking-wider uppercase text-[#0070BA] dark:text-sky-400 flex items-center gap-1.5">
                    ACCOUNT CREDENTIALS
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Email ID */}
                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">Email ID</label>
                      <input
                        type="email"
                        value={emailId}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        placeholder="e.g. user@independent24.tv"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-[#0070BA]/40 transition"
                      />
                    </div>

                    {/* E-Mail Password */}
                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">E-Mail Password</label>
                      <input
                        type="text"
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        placeholder="Itv4312"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-[#0070BA]/40 transition"
                      />
                    </div>

                    {/* Domain ID */}
                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">Domain ID</label>
                      <input
                        type="text"
                        value={domainId}
                        onChange={(e) => setDomainId(e.target.value)}
                        placeholder="Enter Domain ID"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-[#0070BA]/40 transition"
                      />
                    </div>

                    {/* Domain Password */}
                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">Domain Password</label>
                      <input
                        type="text"
                        value={domainPassword}
                        onChange={(e) => setDomainPassword(e.target.value)}
                        placeholder="Itv4312"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-[#0070BA]/40 transition"
                      />
                    </div>

                    {/* X-Factor HRMS Username */}
                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">
                        X-Factor HRMS Username
                      </label>
                      <input
                        type="text"
                        value={hrmsUsername}
                        onChange={(e) => setHrmsUsername(e.target.value)}
                        placeholder="Auto-synced from PIN"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/40 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-[#0070BA]/40 transition"
                      />
                    </div>

                    {/* X-Factor HRMS Password */}
                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">
                        X-Factor HRMS Password
                      </label>
                      <input
                        type="text"
                        value={hrmsPassword}
                        onChange={(e) => setHrmsPassword(e.target.value)}
                        placeholder="Auto-synced from PIN"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/40 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-[#0070BA]/40 transition"
                      />
                    </div>

                    {/* Food Requisition Username */}
                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">
                        Food Requisition Username
                      </label>
                      <input
                        type="text"
                        value={foodUsername}
                        onChange={(e) => setFoodUsername(e.target.value)}
                        placeholder="Auto-synced from Email ID"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/40 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-[#0070BA]/40 transition"
                      />
                    </div>

                    {/* Food Requisition Password */}
                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">
                        Food Requisition Password
                      </label>
                      <input
                        type="text"
                        value={foodPassword}
                        onChange={(e) => setFoodPassword(e.target.value)}
                        placeholder="123456"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-[#0070BA]/40 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* SECTION 3: SLIP AUTHORIZATION                        */}
                {/* ---------------------------------------------------- */}
                <div className="space-y-4 pt-2 border-t border-border/60">
                  <h3 className="text-xs font-black tracking-wider uppercase text-[#0070BA] dark:text-sky-400 flex items-center gap-1.5">
                    SLIP AUTHORIZATION
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Created By */}
                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">Created By</label>
                      <input
                        type="text"
                        value={createdBy}
                        onChange={(e) => setCreatedBy(e.target.value)}
                        placeholder="Creator Name"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#0070BA]/40 transition"
                      />
                    </div>

                    {/* Creator Designation */}
                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-1">Creator Designation</label>
                      <input
                        type="text"
                        value={creatorDesignation}
                        onChange={(e) => setCreatorDesignation(e.target.value)}
                        placeholder="Creator Designation"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#0070BA]/40 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#0070BA] hover:bg-[#005c99] text-white font-bold text-sm shadow-xl shadow-[#0070BA]/30 hover:shadow-2xl transition-all duration-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Generating Slip...' : 'Submit Registration'}
                  </button>
                </div>
              </form>
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
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0070BA] hover:bg-[#005c99] text-white text-xs font-bold shadow-md shadow-[#0070BA]/20 transition active:scale-95"
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
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#0070BA]/40"
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
                          Loading credential slips...
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
                            <span className="text-[#0070BA] dark:text-sky-400 font-extrabold">{slip.slipNumber}</span>
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
                                className="px-2.5 py-1.5 rounded-lg bg-[#0070BA]/10 hover:bg-[#0070BA]/20 text-[#0070BA] dark:text-sky-400 font-semibold text-xs flex items-center gap-1.5 transition"
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
                <div
                  ref={slipPrintRef}
                  className="print-area w-full max-w-[700px] bg-white text-slate-900 border border-slate-300 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4 font-sans select-text text-left"
                  style={{ minHeight: '840px' }}
                >
                  
                  {/* Top Mini Header */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono border-b border-slate-100 pb-1">
                    <span>{new Date().toLocaleDateString('en-GB')}, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-sans font-semibold text-slate-700">Employee Info Slip</span>
                  </div>

                  {/* Main Letterhead Header */}
                  <div className="flex items-start justify-between pt-1">
                    {/* Left: ITV Logo */}
                    <div className="flex flex-col items-center select-none shrink-0 w-24">
                      <img
                        src="/itv-logo.png"
                        alt="Independent Television Logo"
                        className="h-16 w-auto object-contain"
                      />
                      <span className="text-[10px] font-black tracking-widest text-slate-800 uppercase mt-0.5">
                        INDEPENDENT
                      </span>
                    </div>

                    {/* Center: Company Name & Address */}
                    <div className="text-center flex-1 px-2">
                      <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-tight">
                        Independent Television Limited
                      </h1>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        149-150, Tejgaon Industrial Area, Dhaka-1208
                      </p>
                    </div>

                    {/* Right: Date */}
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-900">
                        Date: <span className="font-semibold">{formatOfficialDate(activeSlip.issueDate || activeSlip.createdAt)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Document Title: Login Information */}
                  <div className="text-center pt-2 pb-1">
                    <h2 className="text-lg font-black text-slate-950 tracking-tight">
                      Login Information
                    </h2>
                  </div>

                  {/* -------------------------------------------------- */}
                  {/* MAIN 12-ROW CREDENTIALS TABLE (EXACT MATCH)       */}
                  {/* -------------------------------------------------- */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left border-collapse">
                      <tbody className="divide-y divide-slate-300">
                        {/* Row 1: PIN */}
                        <tr className="hover:bg-slate-50">
                          <th className="p-2.5 font-bold text-slate-900 w-1/3 bg-slate-50/70 border-r border-slate-300">PIN</th>
                          <td className="p-2.5 font-bold text-slate-950 font-mono">{activeSlip.pin || 'N/A'}</td>
                        </tr>

                        {/* Row 2: Name */}
                        <tr className="hover:bg-slate-50">
                          <th className="p-2.5 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-300">Name</th>
                          <td className="p-2.5 font-bold text-slate-950">{activeSlip.name || 'N/A'}</td>
                        </tr>

                        {/* Row 3: Designation */}
                        <tr className="hover:bg-slate-50">
                          <th className="p-2.5 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-300">Designation</th>
                          <td className="p-2.5 text-slate-800">{activeSlip.designation || 'Staff'}</td>
                        </tr>

                        {/* Row 4: Department */}
                        <tr className="hover:bg-slate-50">
                          <th className="p-2.5 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-300">Department</th>
                          <td className="p-2.5 text-slate-800">{activeSlip.department || 'N/A'}</td>
                        </tr>

                        {/* Row 5: E-mail ID */}
                        <tr className="hover:bg-slate-50">
                          <th className="p-2.5 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-300">E-mail ID</th>
                          <td className="p-2.5 text-slate-900 font-mono">{activeSlip.emailId || 'N/A'}</td>
                        </tr>

                        {/* Row 6: E-mail Password */}
                        <tr className="hover:bg-slate-50">
                          <th className="p-2.5 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-300">E-mail Password</th>
                          <td className="p-2.5 font-mono font-bold text-slate-900">{activeSlip.emailPassword || 'Itv4312'}</td>
                        </tr>

                        {/* Row 7: Domain ID */}
                        <tr className="hover:bg-slate-50">
                          <th className="p-2.5 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-300">Domain ID</th>
                          <td className="p-2.5 text-slate-900 font-mono">{activeSlip.domainId || 'N/A'}</td>
                        </tr>

                        {/* Row 8: Domain Password */}
                        <tr className="hover:bg-slate-50">
                          <th className="p-2.5 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-300">Domain Password</th>
                          <td className="p-2.5 font-mono font-bold text-slate-900">{activeSlip.domainPassword || 'Itv4312'}</td>
                        </tr>

                        {/* Row 9: X-Factor HRMS Username */}
                        <tr className="hover:bg-slate-50">
                          <th className="p-2.5 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-300">X-Factor HRMS Username</th>
                          <td className="p-2.5 text-slate-900 font-mono">{activeSlip.hrmsUsername || activeSlip.pin || 'N/A'}</td>
                        </tr>

                        {/* Row 10: X-Factor HRMS Password */}
                        <tr className="hover:bg-slate-50">
                          <th className="p-2.5 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-300">X-Factor HRMS Password</th>
                          <td className="p-2.5 font-mono font-bold text-slate-900">{activeSlip.hrmsPassword || activeSlip.pin || 'N/A'}</td>
                        </tr>

                        {/* Row 11: Food Requisition Portal Username */}
                        <tr className="hover:bg-slate-50">
                          <th className="p-2.5 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-300">Food Requisition Portal Username</th>
                          <td className="p-2.5 text-slate-900 font-mono">{activeSlip.foodUsername || activeSlip.emailId || 'N/A'}</td>
                        </tr>

                        {/* Row 12: Food Requisition Portal Password */}
                        <tr className="hover:bg-slate-50">
                          <th className="p-2.5 font-bold text-slate-900 bg-slate-50/70 border-r border-slate-300">Food Requisition Portal Password</th>
                          <td className="p-2.5 font-mono font-bold text-slate-900">{activeSlip.foodPassword || '123456'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* -------------------------------------------------- */}
                  {/* IMPORTANT PASSWORD POLICY INSTRUCTIONS             */}
                  {/* -------------------------------------------------- */}
                  <div className="text-xs space-y-1.5 pt-1 text-slate-800">
                    <p className="font-bold text-slate-950">Important:</p>
                    <div className="pl-1 space-y-0.5 leading-relaxed text-[11px]">
                      <p className="font-medium">1. Your Domain password must meet the following requirements:</p>
                      <ul className="list-disc pl-5 space-y-0.5 text-slate-700">
                        <li>At least 8 characters long.</li>
                        <li>Password Can not contain any part of your Domain ID.</li>
                        <li>Include at least one uppercase letter (A-Z), at least one lowercase letter (a-z), at least one number (0-9), and at least one special character (e.g., !, @, #, $, etc.).</li>
                      </ul>
                      <p className="font-medium pt-1">
                        2. For E-Mail Password, use any complex password combinations.
                      </p>
                    </div>
                  </div>

                  {/* -------------------------------------------------- */}
                  {/* QUICK ACCESS QR CODES (EXACT 3 QR CODES)           */}
                  {/* -------------------------------------------------- */}
                  <div className="pt-2 text-center">
                    <div className="relative flex items-center justify-center mb-3">
                      <div className="border-t border-slate-400 w-full" />
                      <span className="bg-white px-3 text-xs font-bold text-slate-950 tracking-tight shrink-0">
                        Quick Access QR Codes
                      </span>
                      <div className="border-t border-slate-400 w-full" />
                    </div>

                    {/* QR Code Cards Grid */}
                    <div className="grid grid-cols-3 gap-3 sm:gap-6 justify-items-center max-w-lg mx-auto">
                      {/* QR 1: E-Mail Portal */}
                      <div className="border border-slate-300 rounded-lg p-2.5 bg-white text-center flex flex-col items-center w-full shadow-xs">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center overflow-hidden">
                          {emailQr ? (
                            <img src={emailQr} alt="E-Mail Portal QR" className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                              QR Code
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-800 mt-1 block">
                          E-Mail Portal
                        </span>
                      </div>

                      {/* QR 2: X-Factor HRMS */}
                      <div className="border border-slate-300 rounded-lg p-2.5 bg-white text-center flex flex-col items-center w-full shadow-xs">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center overflow-hidden">
                          {hrmsQr ? (
                            <img src={hrmsQr} alt="X-Factor HRMS QR" className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                              QR Code
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-800 mt-1 block">
                          X-Factor HRMS
                        </span>
                      </div>

                      {/* QR 3: Food Requisition */}
                      <div className="border border-slate-300 rounded-lg p-2.5 bg-white text-center flex flex-col items-center w-full shadow-xs">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center overflow-hidden">
                          {foodQr ? (
                            <img src={foodQr} alt="Food Requisition QR" className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                              QR Code
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-800 mt-1 block">
                          Food Requisition
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Portal URLs Instruction */}
                  <div className="text-[11px] text-slate-800 leading-relaxed pt-2 space-y-0.5">
                    <p className="font-medium">3. Scan the QR codes above to quickly access portals:</p>
                    <ul className="list-disc pl-5 space-y-0.5 text-slate-700">
                      <li>
                        <strong>E-Mail Portal:</strong> Scan the QR code or visit:{' '}
                        <a
                          href="https://mail.independent24.tv"
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-700 underline font-mono text-[10.5px]"
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
                          className="text-blue-700 underline font-mono text-[10.5px]"
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
                          className="text-blue-700 underline font-mono text-[10.5px]"
                        >
                          http://202.84.45.1:50765
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* IT Support Contact */}
                  <div className="pt-1 text-[11px] text-slate-800">
                    <p>
                      If you need further assistance with login or if you forget your password, contact IT Support at{' '}
                      <strong>Ext. 30555</strong> or <strong>01730701335</strong>.
                    </p>
                  </div>

                  {/* Security Warnings & Instructions */}
                  <div className="text-center pt-3 text-[10.5px] text-slate-700 space-y-0.5 font-medium">
                    <p>** Please change all of your given default login passwords after receiving this slip.</p>
                    <p>** Always log off from your E-Mail/domain session before leaving your computer.</p>
                  </div>

                  {/* Bottom Computer-Generated Notice */}
                  <div className="text-center pt-4 pb-2 border-t border-slate-200">
                    <p className="text-[10px] font-bold text-slate-600 tracking-wider">
                      **This is a computer-generated receipt and does not require a signature**
                    </p>
                  </div>

                  {/* Bottom Page Numbering / System Stamp */}
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-1">
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
