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
  'Intern',
  'District Correspondent',
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
  issuedBy?: string | null;
  receivedBy?: string | null;
  accessories?: string[];
  issueDate: string;
  status: string;
  createdAt: string;
  employee?: {
    id: string;
    name: string;
    employeeId: string;
    designation?: string | null;
  } | null;
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
  const [showSidePreview, setShowSidePreview] = useState(true);

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

  // Intelligent auto-sync handlers:
  // 1. PIN auto-syncs to X-Factor HRMS Username & Password
  const handlePinChange = (val: string) => {
    setPin(val);
    if (employeeType !== 'Intern') {
      setHrmsUsername(val);
      setHrmsPassword(val);
    }
  };

  // 2. Email ID auto-syncs to Food Requisition Username
  const handleEmailChange = (val: string) => {
    setEmailId(val);
    if (!foodUsername || foodUsername.includes('@')) {
      setFoodUsername(val);
    }
  };

  // 3. Name auto-suggests Domain ID and Email ID / Food Requisition
  const handleNameChange = (val: string) => {
    setName(val);
    if (val.trim().length > 2) {
      const parts = val.trim().toLowerCase().split(/\s+/);
      if (parts.length >= 2) {
        const username = `${parts[0]}.${parts[parts.length - 1]}`;
        if (employeeType === 'District Correspondent') {
          if (!emailId) {
            setEmailId(`${username}@independent24.tv`);
          }
        } else if (employeeType === 'Intern') {
          if (!domainId) setDomainId(username);
          if (!foodUsername || foodUsername.includes('@')) {
            setFoodUsername(username);
          }
        } else {
          if (!domainId) setDomainId(username);
          if (!emailId) {
            const suggestedEmail = `${username}@independent24.tv`;
            setEmailId(suggestedEmail);
            if (!foodUsername || foodUsername.includes('@')) {
              setFoodUsername(suggestedEmail);
            }
          }
        }
      } else {
        if (employeeType === 'District Correspondent') {
          if (!emailId) setEmailId(`${parts[0]}@independent24.tv`);
        } else if (employeeType === 'Intern') {
          if (!domainId) setDomainId(parts[0]);
          if (!foodUsername || foodUsername.includes('@')) setFoodUsername(parts[0]);
        } else {
          if (!domainId) setDomainId(parts[0]);
        }
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
    if (employeeType === 'Intern') {
      setName('Sadia Rahman');
      setDesignation('Intern - News & IT');
      setDepartment('Digital Media');
      setDomainId('sadia.rahman');
      setDomainPassword('Itv4312');
      setFoodUsername('sadia.rahman');
      setFoodPassword('123456');
      setEmailId('');
      setPin('');
      setHrmsUsername('');
      setHrmsPassword('');
    } else if (employeeType === 'District Correspondent') {
      setPin('6120');
      setName('Md. Jahangir Alam');
      setDesignation('Staff Reporter / District Correspondent');
      setDepartment('Chittagong Bureau / News');
      setEmailId('jahangir.ctg@independent24.tv');
      setEmailPassword('Itv4312');
      setHrmsUsername('6120');
      setHrmsPassword('6120');
      setDomainId('');
      setFoodUsername('');
    } else {
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
    }
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
    if (employeeType === 'Permanent' && !pin.trim()) {
      setError('Please enter Employee PIN for Permanent staff.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const isIntern = employeeType === 'Intern';
      const isDistrict = employeeType === 'District Correspondent';

      const payload = {
        date: formDate,
        employeeType,
        pin: !isIntern && pin.trim() ? pin.trim() : null,
        name: name.trim(),
        designation: designation.trim() || null,
        department: department.trim() || null,
        emailId: !isIntern && emailId.trim() ? emailId.trim() : null,
        emailPassword: !isIntern && emailId.trim() ? (emailPassword || 'Itv4312') : null,
        domainId: !isDistrict && domainId.trim() ? domainId.trim() : null,
        domainPassword: !isDistrict && domainId.trim() ? (domainPassword || 'Itv4312') : null,
        hrmsUsername: !isIntern ? (hrmsUsername.trim() || pin.trim() || null) : null,
        hrmsPassword: !isIntern ? (hrmsPassword.trim() || pin.trim() || null) : null,
        foodUsername: !isDistrict ? (foodUsername.trim() || (!isIntern && emailId.trim() ? emailId.trim() : null)) : null,
        foodPassword: !isDistrict && (foodUsername.trim() || emailId.trim()) ? (foodPassword || '123456') : null,
        createdBy: createdBy.trim() || null,
        creatorDesignation: creatorDesignation.trim() || null,
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
    const isIntern = activeSlip.employeeType === 'Intern';
    const isDistrict = activeSlip.employeeType === 'District Correspondent';

    const block = isIntern
      ? `INDEPENDENT TELEVISION LIMITED
Intern Credential Slip
========================================
Employee Type: Intern
Name: ${activeSlip.name || 'N/A'}
Designation: ${activeSlip.designation || 'Intern'}
Department: ${activeSlip.department || 'N/A'}

[LOGIN CREDENTIALS]
Domain ID: ${activeSlip.domainId || 'N/A'}
Domain Password: ${activeSlip.domainPassword || 'Itv4312'}

Food Requisition Username: ${activeSlip.foodUsername || 'N/A'}
Food Requisition Password: ${activeSlip.foodPassword || '123456'}

Portal Links:
- Food Requisition: http://202.84.45.1:50765

IT Support: Ext. 30555 or 01730701335
========================================`
      : isDistrict
      ? `INDEPENDENT TELEVISION LIMITED
District Correspondent Credential Slip
========================================
${activeSlip.pin ? `PIN: ${activeSlip.pin}\n` : ''}Name: ${activeSlip.name || 'N/A'}
Employee Type: District Correspondent
Designation: ${activeSlip.designation || 'District Correspondent'}
Department: ${activeSlip.department || 'N/A'}

[LOGIN CREDENTIALS]
E-Mail ID: ${activeSlip.emailId || 'N/A'}
E-Mail Password: ${activeSlip.emailPassword || 'Itv4312'}

X-Factor HRMS Username: ${activeSlip.hrmsUsername || activeSlip.pin || 'N/A'}
X-Factor HRMS Password: ${activeSlip.hrmsPassword || activeSlip.pin || 'N/A'}

Portal Links:
- E-Mail: https://mail.independent24.tv
- HRMS: http://202.84.45.240:2023/xfactor/

IT Support: Ext. 30555 or 01730701335
========================================`
      : `INDEPENDENT TELEVISION LIMITED
Employee Credential Slip
========================================
PIN: ${activeSlip.pin || 'N/A'}
Name: ${activeSlip.name || 'N/A'}
Employee Type: ${activeSlip.employeeType || 'Permanent'}
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
            <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 sm:p-10 shadow-lg flex flex-col items-center text-center relative overflow-hidden transition-all duration-300">
              
              {/* Subtle top accent gradient */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 via-primary to-rose-500" />

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

              {/* Action Buttons */}
              <div className="w-full space-y-3">
                {/* Button 1: Add New Employee Slip */}
                <button
                  onClick={() => {
                    resetForm();
                    setMode('FORM');
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Employee Slip</span>
                </button>

                {/* Button 2: View All Employee Slips */}
                <button
                  onClick={() => setMode('LIST')}
                  className="w-full py-2.5 px-4 rounded-lg bg-muted/60 hover:bg-muted text-foreground font-bold text-sm border border-border shadow-xs hover:border-border transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
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
        {/* VIEW 2: NEW EMPLOYEE REGISTRATION FORM                   */}
        {/* ======================================================== */}
        {mode === 'FORM' && (
          <div className={showSidePreview ? "max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200" : "max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200"}>
            {/* Clean Page Header & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <button
                  onClick={() => setMode('HUB')}
                  className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Slip Management</span>
                </button>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  New Employee Registration
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enter employee details and portal credentials to generate the official slip.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Toggle Side Preview */}
                <button
                  type="button"
                  onClick={() => setShowSidePreview(!showSidePreview)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition shadow-xs cursor-pointer"
                  title="Toggle side-by-side live slip preview"
                >
                  {showSidePreview ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-primary" />}
                  <span>{showSidePreview ? 'Hide Preview' : 'Side Preview'}</span>
                </button>

                <button
                  type="button"
                  onClick={fillSampleData}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition shadow-xs cursor-pointer"
                  title="Prefill sample data for quick testing"
                >
                  <span>Sample Data</span>
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition shadow-xs cursor-pointer"
                  title="Clear all fields"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2.5 animate-in fade-in shadow-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Layout Wrapper: 1-Column or 2-Column with Side Preview */}
            <div className={showSidePreview ? "grid grid-cols-1 xl:grid-cols-12 gap-8 items-start" : "w-full"}>
              
              {/* Form Column */}
              <div className={showSidePreview ? "xl:col-span-7" : "w-full"}>
                {/* Clean ITV Employee Form Card */}
                <div className="rounded-2xl border border-red-500/20 dark:border-red-900/40 bg-white dark:bg-card p-6 sm:p-8 shadow-[0_4px_25px_rgba(227,30,36,0.06)] dark:shadow-[0_4px_25px_rgba(227,30,36,0.12)] text-left relative overflow-hidden">
                  
                  {/* ITV Signature Top Brand Accent */}
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#E31E24] via-rose-600 to-red-500" />

                  {/* Form Letterhead & Logo Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-border/80">
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border border-red-500/20 shadow-xs shrink-0">
                        <img
                          src="/itv-logo.png"
                          alt="Independent Television Logo"
                          className="h-10 w-auto object-contain drop-shadow-[0_2px_8px_rgba(227,30,36,0.4)] select-none"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black tracking-widest text-[#E31E24] uppercase font-sans">
                            INDEPENDENT
                          </span>
                          <span className="text-[8px] px-1 py-0.2 rounded bg-[#E31E24] text-white font-mono font-extrabold">
                            24
                          </span>
                        </div>
                        <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                          Employee IT Credential Slip
                        </h2>
                        <p className="text-[11px] text-muted-foreground font-medium">
                          IT Broadcast Operations &bull; Access &amp; Provisioning Form
                        </p>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1">
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-[#E31E24] dark:text-red-400 font-bold border border-red-200 dark:border-red-900/60 uppercase tracking-wide">
                        {employeeType} Employee
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Form Ref: ITV-SLIP-REG
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-7">
                    
                    {/* ---------------------------------------------------- */}
                    {/* SECTION 1: GENERAL INFORMATION                       */}
                    {/* ---------------------------------------------------- */}
                    <div>
                      <div className="flex items-center gap-2 border-b border-red-500/20 dark:border-red-900/40 pb-2 mb-4">
                        <div className="p-1 rounded-md bg-red-500/10 text-[#E31E24] dark:text-red-400">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-wider uppercase">
                          GENERAL INFORMATION
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Date */}
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                            Date
                          </label>
                          <input
                            type="date"
                            value={formDate}
                            onChange={(e) => setFormDate(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-[#E31E24] transition shadow-xs"
                          />
                        </div>

                        {/* Employee Type */}
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                            Employee Type
                          </label>
                          <select
                            value={employeeType}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEmployeeType(val);
                              if (val === 'Intern' && foodUsername.includes('@')) {
                                setFoodUsername(domainId || '');
                              }
                            }}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-[#E31E24] transition shadow-xs font-medium cursor-pointer"
                          >
                            {EMPLOYEE_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* PIN & Name based on Employee Type */}
                        {employeeType === 'Intern' ? (
                          <>
                            <div>
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                                Name <span className="text-[#E31E24]">*</span>
                              </label>
                              <input
                                type="text"
                                value={name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="Enter Full Name"
                                required
                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-[#E31E24] transition shadow-xs"
                              />
                            </div>
                            <div className="hidden sm:block" />
                          </>
                        ) : (
                          <>
                            <div>
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                                PIN {employeeType === 'Permanent' && <span className="text-[#E31E24]">*</span>}
                              </label>
                              <input
                                type="text"
                                value={pin}
                                onChange={(e) => handlePinChange(e.target.value)}
                                placeholder="e.g. 5042"
                                required={employeeType === 'Permanent'}
                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 focus:bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-[#E31E24] transition shadow-xs"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                                Name <span className="text-[#E31E24]">*</span>
                              </label>
                              <input
                                type="text"
                                value={name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="Enter Full Name"
                                required
                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-[#E31E24] transition shadow-xs"
                              />
                            </div>
                          </>
                        )}

                        {/* Designation */}
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                            Designation
                          </label>
                          <input
                            type="text"
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            placeholder="Enter Designation"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-[#E31E24] transition shadow-xs"
                          />
                        </div>

                        {/* Department */}
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                            Department
                          </label>
                          <input
                            type="text"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            placeholder="Enter Department"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-[#E31E24] transition shadow-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ---------------------------------------------------- */}
                    {/* SECTION 2: ACCOUNT CREDENTIALS                       */}
                    {/* ---------------------------------------------------- */}
                    <div>
                      <div className="flex items-center gap-2 border-b border-red-500/20 dark:border-red-900/40 pb-2 mb-4">
                        <div className="p-1 rounded-md bg-red-500/10 text-[#E31E24] dark:text-red-400">
                          <KeyRound className="h-3.5 w-3.5" />
                        </div>
                        <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-wider uppercase">
                          ACCOUNT CREDENTIALS
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* E-Mail ID & Password (for Permanent and District Correspondent) */}
                        {employeeType !== 'Intern' && (
                          <>
                            <div>
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                                Email ID
                              </label>
                              <input
                                type="email"
                                value={emailId}
                                onChange={(e) => handleEmailChange(e.target.value)}
                                placeholder="e.g. user@independent24.tv"
                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 focus:bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-[#E31E24] transition shadow-xs"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                                E-Mail Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showEmailPass ? 'text' : 'password'}
                                  value={emailPassword}
                                  onChange={(e) => setEmailPassword(e.target.value)}
                                  placeholder="Itv4312"
                                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 focus:bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-[#E31E24] transition shadow-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowEmailPass(!showEmailPass)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                                  title={showEmailPass ? 'Hide password' : 'Show password'}
                                >
                                  {showEmailPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Domain ID & Password (for Permanent and Intern) */}
                        {employeeType !== 'District Correspondent' && (
                          <>
                            <div>
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                                Domain ID
                              </label>
                              <input
                                type="text"
                                value={domainId}
                                onChange={(e) => setDomainId(e.target.value)}
                                placeholder="Enter Domain ID"
                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 focus:bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-[#E31E24] transition shadow-xs"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                                Domain Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showDomainPass ? 'text' : 'password'}
                                  value={domainPassword}
                                  onChange={(e) => setDomainPassword(e.target.value)}
                                  placeholder="Itv4312"
                                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 focus:bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-[#E31E24] transition shadow-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowDomainPass(!showDomainPass)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                                  title={showDomainPass ? 'Hide password' : 'Show password'}
                                >
                                  {showDomainPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                          </>
                        )}

                        {/* X-Factor HRMS Username & Password (for Permanent and District Correspondent) */}
                        {employeeType !== 'Intern' && (
                          <>
                            <div>
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                                HRMS Username
                              </label>
                              <input
                                type="text"
                                value={hrmsUsername}
                                onChange={(e) => setHrmsUsername(e.target.value)}
                                placeholder="Enter HRMS Username"
                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 focus:bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-[#E31E24] transition shadow-xs"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                                HRMS Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showHrmsPass ? 'text' : 'password'}
                                  value={hrmsPassword}
                                  onChange={(e) => setHrmsPassword(e.target.value)}
                                  placeholder="Enter HRMS Password"
                                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 focus:bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-[#E31E24] transition shadow-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowHrmsPass(!showHrmsPass)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                                  title={showHrmsPass ? 'Hide password' : 'Show password'}
                                >
                                  {showHrmsPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Food Requisition Username & Password (for Permanent and Intern) */}
                        {employeeType !== 'District Correspondent' && (
                          <>
                            <div>
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                                Food Requisition Username
                              </label>
                              <input
                                type="text"
                                value={foodUsername}
                                onChange={(e) => setFoodUsername(e.target.value)}
                                placeholder="Enter Food Req Username"
                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 focus:bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-[#E31E24] transition shadow-xs"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                                Food Requisition Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showFoodPass ? 'text' : 'password'}
                                  value={foodPassword}
                                  onChange={(e) => setFoodPassword(e.target.value)}
                                  placeholder="123456"
                                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 focus:bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-[#E31E24] transition shadow-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowFoodPass(!showFoodPass)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                                  title={showFoodPass ? 'Hide password' : 'Show password'}
                                >
                                  {showFoodPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ---------------------------------------------------- */}
                    {/* SECTION 3: SLIP AUTHORIZATION                        */}
                    {/* ---------------------------------------------------- */}
                    <div>
                      <div className="flex items-center gap-2 border-b border-red-500/20 dark:border-red-900/40 pb-2 mb-4">
                        <div className="p-1 rounded-md bg-red-500/10 text-[#E31E24] dark:text-red-400">
                          <ShieldCheck className="h-3.5 w-3.5" />
                        </div>
                        <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 tracking-wider uppercase">
                          SLIP AUTHORIZATION
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Created By */}
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                            Created By <span className="text-[#E31E24]">*</span>
                          </label>
                          <input
                            type="text"
                            value={createdBy}
                            onChange={(e) => setCreatedBy(e.target.value)}
                            placeholder="Creator Name"
                            required
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-[#E31E24] transition shadow-xs"
                          />
                        </div>

                        {/* Creator Designation */}
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                            Creator Designation <span className="text-[#E31E24]">*</span>
                          </label>
                          <input
                            type="text"
                            value={creatorDesignation}
                            onChange={(e) => setCreatorDesignation(e.target.value)}
                            placeholder="Creator Designation"
                            required
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 focus:bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/25 focus:border-[#E31E24] transition shadow-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ---------------------------------------------------- */}
                    {/* SUBMIT BUTTON                                        */}
                    {/* ---------------------------------------------------- */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#E31E24] via-red-600 to-[#c0151b] hover:from-red-600 hover:to-red-700 text-white font-extrabold text-sm shadow-[0_4px_16px_rgba(227,30,36,0.35)] hover:shadow-[0_6px_22px_rgba(227,30,36,0.45)] transition-all active:scale-[0.99] flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle2 className="h-4.5 w-4.5" />
                        <span>{submitting ? 'Generating Official Slip...' : 'Submit & Generate Official Slip'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Side Real-Time Preview Column (Enabled when showSidePreview is true) */}
              {showSidePreview && (
                <div className="xl:col-span-5 sticky top-6 space-y-3">
                  {/* Preview Top Header Bar */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Printer className="h-4 w-4 text-[#E31E24]" />
                      <span className="text-xs font-bold text-foreground">
                        Slip Live Preview
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-red-500/10 text-[#E31E24] dark:text-red-400 border border-red-500/20 font-bold">
                      Official A4 Format
                    </span>
                  </div>

                  {/* Clean Realistic Paper Sheet Container */}
                  <div className="bg-white text-slate-900 border border-slate-300 rounded-xl p-4 sm:p-5 shadow-sm space-y-3 font-sans select-text text-left relative overflow-hidden">
                    {/* Top Red Accent Strip */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#E31E24] via-rose-600 to-red-500" />

                    {/* Letterhead */}
                    <div className="flex items-start justify-between border-b border-slate-200 pb-2.5 pt-1">
                      <div className="flex items-center gap-2.5">
                        <img
                          src="/itv-logo.png"
                          alt="Independent Television Logo"
                          className="h-9 w-auto object-contain drop-shadow-[0_2px_4px_rgba(227,30,36,0.25)]"
                        />
                        <div>
                          <span className="text-[9px] font-black tracking-widest text-[#E31E24] uppercase block">
                            INDEPENDENT
                          </span>
                          <span className="text-xs font-black text-slate-950 tracking-tight block">
                            Independent Television Limited
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono font-semibold text-slate-600 block">
                          {formatOfficialDate(formDate) || 'DD/MM/YYYY'}
                        </span>
                        <span className="text-[9px] font-extrabold text-[#E31E24] px-1.5 py-0.5 rounded bg-red-50 border border-red-200 uppercase inline-block">
                          {employeeType}
                        </span>
                      </div>
                    </div>

                    {/* Document Title */}
                    <div className="text-center py-0.5">
                      <h4 className="text-xs font-black text-slate-950 tracking-tight uppercase">
                        Login Information
                      </h4>
                    </div>

                    {/* Mini Credentials Table */}
                    <div className="border border-slate-300 rounded-md overflow-hidden">
                      <table className="w-full text-[10px] text-left border-collapse">
                        <tbody className="divide-y divide-slate-200">
                          {/* Employee Type */}
                          <tr className="bg-slate-50/60">
                            <th className="py-1 px-2 font-bold text-slate-900 w-2/5 border-r border-slate-200">Employee Type</th>
                            <td className="py-1 px-2 font-bold text-slate-950 uppercase">{employeeType}</td>
                          </tr>

                          {/* PIN */}
                          {employeeType !== 'Intern' && (
                            <tr>
                              <th className="py-1 px-2 font-bold text-slate-900 border-r border-slate-200">PIN</th>
                              <td className="py-1 px-2 font-mono font-bold text-slate-950">{pin || '—'}</td>
                            </tr>
                          )}

                          {/* Name */}
                          <tr>
                            <th className="py-1 px-2 font-bold text-slate-900 border-r border-slate-200">Name</th>
                            <td className="py-1 px-2 font-bold text-slate-950">{name || '—'}</td>
                          </tr>

                          {/* Designation */}
                          <tr>
                            <th className="py-1 px-2 font-bold text-slate-900 border-r border-slate-200">Designation</th>
                            <td className="py-1 px-2 text-slate-800">{designation || 'Staff'}</td>
                          </tr>

                          {/* Department */}
                          <tr>
                            <th className="py-1 px-2 font-bold text-slate-900 border-r border-slate-200">Department</th>
                            <td className="py-1 px-2 text-slate-800">{department || '—'}</td>
                          </tr>

                          {/* E-Mail */}
                          {employeeType !== 'Intern' && (
                            <>
                              <tr>
                                <th className="py-1 px-2 font-bold text-slate-900 border-r border-slate-200">E-mail ID</th>
                                <td className="py-1 px-2 font-mono text-slate-900">{emailId || '—'}</td>
                              </tr>
                              <tr>
                                <th className="py-1 px-2 font-bold text-slate-900 border-r border-slate-200">E-mail Password</th>
                                <td className="py-1 px-2 font-mono font-bold text-slate-900">{emailPassword || 'Itv4312'}</td>
                              </tr>
                            </>
                          )}

                          {/* Domain ID */}
                          {employeeType !== 'District Correspondent' && (
                            <>
                              <tr>
                                <th className="py-1 px-2 font-bold text-slate-900 border-r border-slate-200">Domain ID</th>
                                <td className="py-1 px-2 font-mono text-slate-900">{domainId || '—'}</td>
                              </tr>
                              <tr>
                                <th className="py-1 px-2 font-bold text-slate-900 border-r border-slate-200">Domain Password</th>
                                <td className="py-1 px-2 font-mono font-bold text-slate-900">{domainPassword || 'Itv4312'}</td>
                              </tr>
                            </>
                          )}

                          {/* HRMS */}
                          {employeeType !== 'Intern' && (
                            <>
                              <tr>
                                <th className="py-1 px-2 font-bold text-slate-900 border-r border-slate-200">HRMS Username</th>
                                <td className="py-1 px-2 font-mono text-slate-900">{hrmsUsername || pin || '—'}</td>
                              </tr>
                              <tr>
                                <th className="py-1 px-2 font-bold text-slate-900 border-r border-slate-200">HRMS Password</th>
                                <td className="py-1 px-2 font-mono font-bold text-slate-900">{hrmsPassword || pin || '—'}</td>
                              </tr>
                            </>
                          )}

                          {/* Food Requisition */}
                          {employeeType !== 'District Correspondent' && (
                            <>
                              <tr>
                                <th className="py-1 px-2 font-bold text-slate-900 border-r border-slate-200">Food Req Username</th>
                                <td className="py-1 px-2 font-mono text-slate-900">{foodUsername || (employeeType !== 'Intern' ? emailId : '') || '—'}</td>
                              </tr>
                              <tr>
                                <th className="py-1 px-2 font-bold text-slate-900 border-r border-slate-200">Food Req Password</th>
                                <td className="py-1 px-2 font-mono font-bold text-slate-900">{foodPassword || '123456'}</td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Quick Access QR Codes section */}
                    <div className="pt-1 text-center">
                      <span className="text-[9.5px] font-bold text-slate-900 block mb-1.5">
                        Quick Access QR Codes
                      </span>

                      {employeeType === 'Intern' ? (
                        <div className="flex justify-center">
                          <div className="border border-slate-200 rounded p-1.5 bg-slate-50 text-center w-28">
                            <div className="w-16 h-16 mx-auto flex items-center justify-center">
                              {foodQr ? (
                                <img src={foodQr} alt="Food QR" className="w-full h-full object-contain" />
                              ) : (
                                <div className="w-full h-full bg-slate-200 rounded flex items-center justify-center text-[8px]">QR</div>
                              )}
                            </div>
                            <span className="text-[8.5px] font-bold text-slate-800 mt-1 block">
                              Food Requisition
                            </span>
                          </div>
                        </div>
                      ) : employeeType === 'District Correspondent' ? (
                        <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
                          <div className="border border-slate-200 rounded p-1.5 bg-slate-50 text-center">
                            <div className="w-14 h-14 mx-auto flex items-center justify-center">
                              {emailQr ? (
                                <img src={emailQr} alt="Email QR" className="w-full h-full object-contain" />
                              ) : (
                                <div className="w-full h-full bg-slate-200 rounded flex items-center justify-center text-[8px]">QR</div>
                              )}
                            </div>
                            <span className="text-[8.5px] font-bold text-slate-800 mt-1 block">
                              E-Mail Portal
                            </span>
                          </div>

                          <div className="border border-slate-200 rounded p-1.5 bg-slate-50 text-center">
                            <div className="w-14 h-14 mx-auto flex items-center justify-center">
                              {hrmsQr ? (
                                <img src={hrmsQr} alt="HRMS QR" className="w-full h-full object-contain" />
                              ) : (
                                <div className="w-full h-full bg-slate-200 rounded flex items-center justify-center text-[8px]">QR</div>
                              )}
                            </div>
                            <span className="text-[8.5px] font-bold text-slate-800 mt-1 block">
                              X-Factor HRMS
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="border border-slate-200 rounded p-1 bg-slate-50 text-center">
                            <div className="w-12 h-12 mx-auto flex items-center justify-center">
                              {emailQr ? (
                                <img src={emailQr} alt="Email QR" className="w-full h-full object-contain" />
                              ) : (
                                <div className="w-full h-full bg-slate-200 rounded flex items-center justify-center text-[7px]">QR</div>
                              )}
                            </div>
                            <span className="text-[8px] font-bold text-slate-800 mt-0.5 block">
                              E-Mail
                            </span>
                          </div>

                          <div className="border border-slate-200 rounded p-1 bg-slate-50 text-center">
                            <div className="w-12 h-12 mx-auto flex items-center justify-center">
                              {hrmsQr ? (
                                <img src={hrmsQr} alt="HRMS QR" className="w-full h-full object-contain" />
                              ) : (
                                <div className="w-full h-full bg-slate-200 rounded flex items-center justify-center text-[7px]">QR</div>
                              )}
                            </div>
                            <span className="text-[8px] font-bold text-slate-800 mt-0.5 block">
                              HRMS
                            </span>
                          </div>

                          <div className="border border-slate-200 rounded p-1 bg-slate-50 text-center">
                            <div className="w-12 h-12 mx-auto flex items-center justify-center">
                              {foodQr ? (
                                <img src={foodQr} alt="Food QR" className="w-full h-full object-contain" />
                              ) : (
                                <div className="w-full h-full bg-slate-200 rounded flex items-center justify-center text-[7px]">QR</div>
                              )}
                            </div>
                            <span className="text-[8px] font-bold text-slate-800 mt-0.5 block">
                              Food Req
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Signatory Footnote */}
                    <div className="pt-1.5 border-t border-slate-200 text-[9px] text-slate-500 flex items-center justify-between">
                      <span className="truncate">
                        Issued by: <strong className="text-slate-800">{createdBy || user?.name || 'IT Operations'}</strong>
                      </span>
                      <span className="font-mono text-emerald-600 font-semibold">
                        Live Sync
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Slips Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
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
            <div className="w-full max-w-3xl my-auto rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[95vh]">
              
              {/* Modal Top Control Toolbar (No-Print) */}
              <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-muted/40 no-print shrink-0">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      Employee Info Slip &bull; {activeSlip.name || 'Staff'}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Slip Ref: {activeSlip.slipNumber} &bull; Type: {activeSlip.employeeType || 'Permanent'}{activeSlip.pin ? ` &bull; PIN: ${activeSlip.pin}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Copy All Text */}
                  <button
                    onClick={handleCopyAllCredentials}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition"
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{isDownloadingPdf ? 'Generating...' : 'PDF'}</span>
                  </button>

                  {/* Print Slip */}
                  <button
                    onClick={handlePrintSlip}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:bg-primary/90 transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Slip</span>
                  </button>

                  {/* Close */}
                  <button
                    onClick={() => setActiveSlip(null)}
                    className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:bg-muted transition"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Scrollable Document Wrapper */}
              <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100/70 dark:bg-slate-950/60 flex justify-center">
                
                {/* ---------------------------------------------------- */}
                {/* THE OFFICIAL PRINTABLE A4 SLIP CONTAINER             */}
                {/* (Calibrated for strict 1-page A4 print & PDF export) */}
                {/* ---------------------------------------------------- */}
                <div
                  ref={slipPrintRef}
                  className="print-area w-full max-w-[680px] bg-white text-slate-900 border border-slate-300 rounded-xl p-4 sm:p-6 shadow-sm space-y-2.5 font-sans select-text text-left"
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
                  {/* MAIN CREDENTIALS TABLE (COMPACT 1-PAGE)            */}
                  {/* -------------------------------------------------- */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <table className="w-full text-[10.5px] text-left border-collapse">
                      <tbody className="divide-y divide-slate-300">
                        {/* Employee Type */}
                        <tr className="hover:bg-slate-50">
                          <th className="py-1 px-2.5 font-bold text-slate-900 w-2/5 bg-slate-50/80 border-r border-slate-300">Employee Type</th>
                          <td className="py-1 px-2.5 font-bold text-slate-950 uppercase">{activeSlip.employeeType || 'Permanent'}</td>
                        </tr>

                        {/* Row: PIN (shown for non-interns or when available) */}
                        {activeSlip.employeeType !== 'Intern' && (
                          <tr className="hover:bg-slate-50">
                            <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">PIN</th>
                            <td className="py-1 px-2.5 font-bold text-slate-950 font-mono">{activeSlip.pin || 'N/A'}</td>
                          </tr>
                        )}

                        {/* Row: Name */}
                        <tr className="hover:bg-slate-50">
                          <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">Name</th>
                          <td className="py-1 px-2.5 font-bold text-slate-950">{activeSlip.name || 'N/A'}</td>
                        </tr>

                        {/* Row: Designation */}
                        <tr className="hover:bg-slate-50">
                          <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">Designation</th>
                          <td className="py-1 px-2.5 text-slate-800">{activeSlip.designation || 'Staff'}</td>
                        </tr>

                        {/* Row: Department */}
                        <tr className="hover:bg-slate-50">
                          <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">Department</th>
                          <td className="py-1 px-2.5 text-slate-800">{activeSlip.department || 'N/A'}</td>
                        </tr>

                        {/* Row: E-mail (for non-interns) */}
                        {activeSlip.employeeType !== 'Intern' && (
                          <>
                            <tr className="hover:bg-slate-50">
                              <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">E-mail ID</th>
                              <td className="py-1 px-2.5 text-slate-900 font-mono">{activeSlip.emailId || 'N/A'}</td>
                            </tr>

                            <tr className="hover:bg-slate-50">
                              <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">E-mail Password</th>
                              <td className="py-1 px-2.5 font-mono font-bold text-slate-900">{activeSlip.emailPassword || 'Itv4312'}</td>
                            </tr>
                          </>
                        )}

                        {/* Row: Domain ID (hidden for District Correspondent) */}
                        {activeSlip.employeeType !== 'District Correspondent' && (
                          <>
                            <tr className="hover:bg-slate-50">
                              <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">Domain ID</th>
                              <td className="py-1 px-2.5 text-slate-900 font-mono">{activeSlip.domainId || 'N/A'}</td>
                            </tr>

                            <tr className="hover:bg-slate-50">
                              <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">Domain Password</th>
                              <td className="py-1 px-2.5 font-mono font-bold text-slate-900">{activeSlip.domainPassword || 'Itv4312'}</td>
                            </tr>
                          </>
                        )}

                        {/* Row: HRMS (for non-interns) */}
                        {activeSlip.employeeType !== 'Intern' && (
                          <>
                            <tr className="hover:bg-slate-50">
                              <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">X-Factor HRMS Username</th>
                              <td className="py-1 px-2.5 text-slate-900 font-mono">{activeSlip.hrmsUsername || activeSlip.pin || 'N/A'}</td>
                            </tr>

                            <tr className="hover:bg-slate-50">
                              <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">X-Factor HRMS Password</th>
                              <td className="py-1 px-2.5 font-mono font-bold text-slate-900">{activeSlip.hrmsPassword || activeSlip.pin || 'N/A'}</td>
                            </tr>
                          </>
                        )}

                        {/* Row: Food Requisition Portal Username & Password (hidden for District Correspondent) */}
                        {activeSlip.employeeType !== 'District Correspondent' && (
                          <>
                            <tr className="hover:bg-slate-50">
                              <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">Food Requisition Portal Username</th>
                              <td className="py-1 px-2.5 text-slate-900 font-mono">{activeSlip.foodUsername || activeSlip.emailId || 'N/A'}</td>
                            </tr>

                            <tr className="hover:bg-slate-50">
                              <th className="py-1 px-2.5 font-bold text-slate-900 bg-slate-50/80 border-r border-slate-300">Food Requisition Portal Password</th>
                              <td className="py-1 px-2.5 font-mono font-bold text-slate-900">{activeSlip.foodPassword || '123456'}</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* -------------------------------------------------- */}
                  {/* IMPORTANT PASSWORD POLICY INSTRUCTIONS             */}
                  {/* -------------------------------------------------- */}
                  <div className="text-[10px] space-y-1 text-slate-800">
                    <p className="font-bold text-slate-950">Important:</p>
                    <div className="pl-1 space-y-0.5 leading-tight text-[9.5px]">
                      {activeSlip.employeeType !== 'District Correspondent' && (
                        <>
                          <p className="font-medium">1. Your Domain password must meet the following requirements:</p>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                            <li>At least 8 characters long.</li>
                            <li>Password Can not contain any part of your Domain ID.</li>
                            <li>Include at least one uppercase letter (A-Z), at least one lowercase letter (a-z), at least one number (0-9), and at least one special character (e.g., !, @, #, $, etc.).</li>
                          </ul>
                        </>
                      )}
                      {activeSlip.employeeType !== 'Intern' && (
                        <p className="font-medium pt-0.5">
                          {activeSlip.employeeType === 'District Correspondent' ? '1.' : '2.'} For E-Mail Password, use any complex password combinations.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* -------------------------------------------------- */}
                  {/* QUICK ACCESS QR CODES                              */}
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
                    {activeSlip.employeeType === 'Intern' ? (
                      <div className="flex justify-center max-w-xs mx-auto">
                        <div className="border border-slate-300 rounded-lg p-2 bg-white text-center flex flex-col items-center w-36 shadow-xs">
                          <div className="w-20 h-20 flex items-center justify-center overflow-hidden">
                            {foodQr ? (
                              <img src={foodQr} alt="Food Requisition QR" className="w-full h-full object-contain" />
                            ) : (
                              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[9px] text-slate-400">
                                QR Code
                              </div>
                            )}
                          </div>
                          <span className="text-[9.5px] font-bold text-slate-800 mt-1 block">
                            Food Requisition
                          </span>
                        </div>
                      </div>
                    ) : activeSlip.employeeType === 'District Correspondent' ? (
                      <div className="grid grid-cols-2 gap-4 justify-items-center max-w-xs mx-auto">
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
                      </div>
                    ) : (
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
                    )}
                  </div>

                  {/* Portal URLs Instruction */}
                  <div className="text-[9.5px] text-slate-800 leading-snug pt-1 space-y-0.5">
                    <p className="font-semibold">
                      {activeSlip.employeeType === 'District Correspondent' ? '2.' : '3.'} Scan the QR code
                      {activeSlip.employeeType === 'Intern' ? '' : 's'} above to quickly access portals:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                      {activeSlip.employeeType !== 'Intern' && (
                        <>
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
                        </>
                      )}
                      {activeSlip.employeeType !== 'District Correspondent' && (
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
                      )}
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
                    {activeSlip.employeeType === 'District Correspondent' ? (
                      <p>** Always log off from your E-Mail session before leaving your computer.</p>
                    ) : activeSlip.employeeType === 'Intern' ? (
                      <p>** Always log off from your domain session before leaving your computer.</p>
                    ) : (
                      <p>** Always log off from your E-Mail/domain session before leaving your computer.</p>
                    )}
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
