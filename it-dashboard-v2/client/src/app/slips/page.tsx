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
} from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { AccessGuard } from '@/components/AccessGuard';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';

type ViewMode = 'HUB' | 'FORM' | 'LIST';

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
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
          title: 'Slip Generated Successfully!',
          text: `Credential Slip ${createdSlip.slipNumber} has been created.`,
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

  // Print slip helper
  const handlePrintSlip = () => {
    window.print();
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
                IT Support Credential & Registration System
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
                      <th className="p-4">Department & Designation</th>
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
                            {formatDate(slip.issueDate || slip.createdAt)}
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setActiveSlip(slip)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#0070BA]/10 hover:bg-[#0070BA]/20 text-[#0070BA] dark:text-sky-400 font-semibold text-xs flex items-center gap-1.5 transition"
                                title="View & Print Slip"
                              >
                                <Printer className="h-3.5 w-3.5" />
                                <span>Slip</span>
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
        {/* MODAL: OFFICIAL INDEPENDENT TV CREDENTIAL SLIP PREVIEW   */}
        {/* ======================================================== */}
        {activeSlip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95">
              
              {/* Modal Top Actions */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40 no-print">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <span className="font-bold text-sm text-foreground">
                    Credential Slip: {activeSlip.slipNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintSlip}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/25 hover:bg-primary/90 transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Slip</span>
                  </button>
                  <button
                    onClick={() => setActiveSlip(null)}
                    className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold text-muted-foreground hover:bg-muted transition"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Printable Document Body */}
              <div
                ref={slipPrintRef}
                className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-white text-slate-900 print:p-0 print:m-0"
              >
                {/* Official Slip Header */}
                <div className="border-b-2 border-red-600 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="/itv-logo.png"
                      alt="Independent Television Logo"
                      className="h-14 w-auto object-contain select-none"
                    />
                    <div>
                      <h2 className="text-lg font-black tracking-tight text-slate-950 font-sans leading-tight">
                        INDEPENDENT TELEVISION
                      </h2>
                      <p className="text-[11px] font-bold text-red-600 uppercase tracking-widest font-mono">
                        IT OPERATIONS &bull; CREDENTIAL AUTHORIZATION
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Tajgaon I/A, Dhaka-1208, Bangladesh &bull; Lan &amp; Domain Sync
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded bg-red-100 text-red-700 font-mono inline-block">
                      {activeSlip.slipNumber}
                    </span>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                      Date: {formatDate(activeSlip.issueDate || activeSlip.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Section: Employee Information */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                    1. Employee Information
                  </h4>
                  <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <th className="p-2.5 bg-slate-100 font-bold text-slate-700 w-1/4">Full Name</th>
                        <td className="p-2.5 font-bold text-slate-950">{activeSlip.name || 'N/A'}</td>
                        <th className="p-2.5 bg-slate-100 font-bold text-slate-700 w-1/4">Employee PIN</th>
                        <td className="p-2.5 font-mono font-bold text-red-700">{activeSlip.pin || 'N/A'}</td>
                      </tr>
                      <tr>
                        <th className="p-2.5 bg-slate-100 font-bold text-slate-700">Designation</th>
                        <td className="p-2.5 text-slate-800">{activeSlip.designation || 'Staff'}</td>
                        <th className="p-2.5 bg-slate-100 font-bold text-slate-700">Department</th>
                        <td className="p-2.5 text-slate-800">{activeSlip.department || 'N/A'}</td>
                      </tr>
                      <tr>
                        <th className="p-2.5 bg-slate-100 font-bold text-slate-700">Employee Type</th>
                        <td className="p-2.5 text-slate-800">{activeSlip.employeeType || 'Permanent'}</td>
                        <th className="p-2.5 bg-slate-100 font-bold text-slate-700">Issued On</th>
                        <td className="p-2.5 font-mono text-slate-800">{formatDate(activeSlip.issueDate || activeSlip.createdAt)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section: System Credentials */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                    2. Assigned System &amp; Portal Credentials
                  </h4>
                  <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">System / Service</th>
                        <th className="p-2.5">Username / Identifier</th>
                        <th className="p-2.5">Default Password</th>
                        <th className="p-2.5 text-right no-print">Quick Copy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {/* Email Account */}
                      <tr>
                        <td className="p-2.5 font-sans font-bold text-slate-900">Official E-Mail</td>
                        <td className="p-2.5 font-bold text-blue-700">{activeSlip.emailId || 'N/A'}</td>
                        <td className="p-2.5 font-bold text-slate-800">{activeSlip.emailPassword || 'Itv4312'}</td>
                        <td className="p-2.5 text-right no-print">
                          <button
                            onClick={() => copyToClipboard(activeSlip.emailId || '', 'email')}
                            className="p-1 text-slate-400 hover:text-slate-800 transition"
                            title="Copy Email"
                          >
                            {copiedField === 'email' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </td>
                      </tr>

                      {/* Domain / Active Directory */}
                      <tr>
                        <td className="p-2.5 font-sans font-bold text-slate-900">Domain / Windows PC</td>
                        <td className="p-2.5 font-bold text-slate-900">{activeSlip.domainId || 'N/A'}</td>
                        <td className="p-2.5 font-bold text-slate-800">{activeSlip.domainPassword || 'Itv4312'}</td>
                        <td className="p-2.5 text-right no-print">
                          <button
                            onClick={() => copyToClipboard(activeSlip.domainId || '', 'domain')}
                            className="p-1 text-slate-400 hover:text-slate-800 transition"
                            title="Copy Domain ID"
                          >
                            {copiedField === 'domain' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </td>
                      </tr>

                      {/* X-Factor HRMS */}
                      <tr>
                        <td className="p-2.5 font-sans font-bold text-slate-900">X-Factor HRMS Portal</td>
                        <td className="p-2.5 font-bold text-slate-900">{activeSlip.hrmsUsername || activeSlip.pin || 'N/A'}</td>
                        <td className="p-2.5 font-bold text-slate-800">{activeSlip.hrmsPassword || activeSlip.pin || 'N/A'}</td>
                        <td className="p-2.5 text-right no-print">
                          <button
                            onClick={() => copyToClipboard(activeSlip.hrmsUsername || activeSlip.pin || '', 'hrms')}
                            className="p-1 text-slate-400 hover:text-slate-800 transition"
                            title="Copy HRMS"
                          >
                            {copiedField === 'hrms' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </td>
                      </tr>

                      {/* Food Requisition */}
                      <tr>
                        <td className="p-2.5 font-sans font-bold text-slate-900">Food Requisition System</td>
                        <td className="p-2.5 font-bold text-slate-900">{activeSlip.foodUsername || activeSlip.emailId || 'N/A'}</td>
                        <td className="p-2.5 font-bold text-slate-800">{activeSlip.foodPassword || '123456'}</td>
                        <td className="p-2.5 text-right no-print">
                          <button
                            onClick={() => copyToClipboard(activeSlip.foodUsername || activeSlip.emailId || '', 'food')}
                            className="p-1 text-slate-400 hover:text-slate-800 transition"
                            title="Copy Food Username"
                          >
                            {copiedField === 'food' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-[10px] text-slate-500 italic mt-1.5">
                    * Please change your default passwords upon first login into your respective portals and workstation.
                  </p>
                </div>

                {/* Section: Signatures & Authorization */}
                <div className="pt-8 grid grid-cols-2 gap-8 border-t border-slate-300">
                  <div className="text-left space-y-1">
                    <div className="h-10 border-b border-dashed border-slate-400" />
                    <p className="text-xs font-bold text-slate-900">{activeSlip.createdBy || 'IT Engineer'}</p>
                    <p className="text-[10px] text-slate-600">{activeSlip.creatorDesignation || 'IT Support Engineer'}</p>
                    <p className="text-[9px] text-slate-400">IT Department Authorization</p>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="h-10 border-b border-dashed border-slate-400" />
                    <p className="text-xs font-bold text-slate-900">{activeSlip.name || 'Employee'}</p>
                    <p className="text-[10px] text-slate-600">Employee Signature &amp; Date</p>
                    <p className="text-[9px] text-slate-400">Received Credentials in Good Order</p>
                  </div>
                </div>

                {/* Confidentiality Notice */}
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-center">
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">
                    Strictly Confidential &bull; Independent Television IT Security &amp; Compliance Policy
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AccessGuard>
  );
}
