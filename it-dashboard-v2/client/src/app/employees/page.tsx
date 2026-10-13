'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  ShieldCheck,
  Mail,
  Phone,
  Building2,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  UserX,
  Activity,
  Trash2,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Laptop,
  Briefcase,
  Layers,
  Upload,
  Image as ImageIcon,
  Camera,
  Pencil,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { AccessGuard } from '@/components/AccessGuard';
import { confirmDelete, showWarningAlert, showErrorAlert, showSuccessAlert } from '@/lib/sweetalert';

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  username: string;
  email: string;
  department?: string;
  designation?: string;
  extensionNumber?: string;
  phone?: string;
  profilePhoto?: string;
  joiningDate?: string;
  leavingDate?: string | null;
  employmentStatus: 'Active' | 'Former' | string;
  role: 'SUPER_ADMIN' | 'IT_ADMIN' | 'IT_SUPPORT' | 'VIEWER';
  isITTeam: boolean;
  itStatus: 'AVAILABLE' | 'BUSY' | 'AWAY' | 'OFFLINE';
  officeLocation?: string;
  remarks?: string;
  computers?: any[];
  extensions?: any[];
  createdAt?: string;
}

type TabFilter = 'ALL' | 'RUNNING' | 'EX';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [itStatusFilter, setItStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const { user, isSuperAdmin, canPerformAction } = useAuth();

  // Individual User Details Modal
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Super Admin Password Reset Modal
  const [adminResetTarget, setAdminResetTarget] = useState<Employee | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminResetSuccess, setAdminResetSuccess] = useState<string | null>(null);
  const [adminResetSubmitting, setAdminResetSubmitting] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Self Password Reset Modal (for all members)
  const [isSelfPasswordModalOpen, setIsSelfPasswordModalOpen] = useState(false);
  const [selfCurrentPassword, setSelfCurrentPassword] = useState('');
  const [selfNewPassword, setSelfNewPassword] = useState('');
  const [selfConfirmPassword, setSelfConfirmPassword] = useState('');
  const [showSelfCurrentPass, setShowSelfCurrentPass] = useState(false);
  const [showSelfNewPass, setShowSelfNewPass] = useState(false);
  const [selfSubmitting, setSelfSubmitting] = useState(false);
  const [selfError, setSelfError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    username: '',
    email: '',
    password: '',
    profilePhoto: '',
    department: 'Information Technology',
    designation: 'IT Support Engineer',
    extensionNumber: '',
    phone: '',
    role: 'IT_SUPPORT',
    itStatus: 'AVAILABLE',
    officeLocation: 'HQ Floor 4',
    employmentStatus: 'Active', // 'Active' = IT Running, 'Former' = EX IT
    joiningDate: new Date().toISOString().split('T')[0],
    leavingDate: '',
    remarks: '',
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params: any = { itTeam: 'true' };
      if (search) params.search = search;
      if (activeTab === 'RUNNING') params.status = 'Active';
      if (activeTab === 'EX') params.status = 'Former';

      const res = await api.get('/api/users', { params });
      setEmployees(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, activeTab]);

  // Derived counts
  const totalCount = employees.length;
  const runningCount = useMemo(
    () => employees.filter((e) => e.employmentStatus === 'Active').length,
    [employees]
  );
  const exCount = useMemo(
    () => employees.filter((e) => e.employmentStatus !== 'Active').length,
    [employees]
  );
  const availableCount = useMemo(
    () => employees.filter((e) => e.employmentStatus === 'Active' && e.itStatus === 'AVAILABLE').length,
    [employees]
  );

  // Filtered employees by secondary dropdowns
  const displayedEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (itStatusFilter && emp.itStatus !== itStatusFilter) return false;
      if (roleFilter && emp.role !== roleFilter) return false;
      return true;
    });
  }, [employees, itStatusFilter, roleFilter]);

  // Suggest next ID when modal opens in Add mode
  const openAddModal = () => {
    setEditingEmployee(null);
    setFormError(null);
    let nextNum = 1;
    employees.forEach((e) => {
      const match = e.employeeId?.match(/EMP-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n >= nextNum) nextNum = n + 1;
      }
    });
    const suggestedId = `EMP-${String(nextNum).padStart(4, '0')}`;

    setFormData({
      employeeId: suggestedId,
      name: '',
      username: '',
      email: '',
      password: '',
      profilePhoto: '',
      department: 'Information Technology',
      designation: 'IT Support Engineer',
      extensionNumber: '',
      phone: '',
      role: 'IT_SUPPORT',
      itStatus: 'AVAILABLE',
      officeLocation: 'HQ Floor 4',
      employmentStatus: activeTab === 'EX' ? 'Former' : 'Active',
      joiningDate: new Date().toISOString().split('T')[0],
      leavingDate: activeTab === 'EX' ? new Date().toISOString().split('T')[0] : '',
      remarks: '',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal with prefilled employee data
  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormError(null);
    setFormData({
      employeeId: emp.employeeId || '',
      name: emp.name || '',
      username: emp.username || '',
      email: emp.email || '',
      password: '',
      profilePhoto: emp.profilePhoto || '',
      department: emp.department || 'Information Technology',
      designation: emp.designation || '',
      extensionNumber: emp.extensionNumber || '',
      phone: emp.phone || '',
      role: emp.role || 'IT_SUPPORT',
      itStatus: emp.itStatus || 'AVAILABLE',
      officeLocation: emp.officeLocation || 'HQ Floor 4',
      employmentStatus: emp.employmentStatus || 'Active',
      joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
      leavingDate: emp.leavingDate ? new Date(emp.leavingDate).toISOString().split('T')[0] : '',
      remarks: emp.remarks || '',
    });
    setIsModalOpen(true);
  };

  // Auto-fill username & email when name changes (only in Add mode)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (editingEmployee) {
      setFormData((prev) => ({ ...prev, name: val }));
      return;
    }
    const cleanUser = val.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
    setFormData((prev) => ({
      ...prev,
      name: val,
      username: prev.username || cleanUser,
      email: prev.email || (cleanUser ? `${cleanUser}@company.local` : ''),
    }));
  };

  // Image file upload handler (supports ANY file size & format, smart head-preservation cropping)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so re-selecting the same file works
    e.target.value = '';

    const reader = new FileReader();
    reader.onerror = () => {
      alert('Could not read the selected image file. Please try another image.');
    };
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== 'string') return;

      const img = new Image();
      img.onload = () => {
        try {
          const naturalWidth = img.naturalWidth || img.width;
          const naturalHeight = img.naturalHeight || img.height;

          if (!naturalWidth || !naturalHeight) {
            setFormData((prev) => ({ ...prev, profilePhoto: result }));
            return;
          }

          // Target uniform high-resolution square avatar (512x512)
          const targetSize = 512;
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            setFormData((prev) => ({ ...prev, profilePhoto: result }));
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          let sx = 0;
          let sy = 0;
          let sWidth = naturalWidth;
          let sHeight = naturalHeight;

          if (naturalHeight > naturalWidth) {
            // Portrait photo: The head/forehead is in the top section of the photo.
            // Anchor square crop strictly at the top (sy = 0) so the head/hair is 100% preserved!
            sHeight = naturalWidth;
            sy = 0;
          } else if (naturalWidth > naturalHeight) {
            // Landscape photo: Horizontally center the subject
            sWidth = naturalHeight;
            sx = Math.round((naturalWidth - naturalHeight) / 2);
          }

          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetSize, targetSize);

          // Compress to clean, lightweight JPEG (~60-90KB) for fast load & crisp display
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          setFormData((prev) => ({ ...prev, profilePhoto: optimizedDataUrl }));
        } catch (err) {
          console.error('Error during image canvas processing:', err);
          setFormData((prev) => ({ ...prev, profilePhoto: result }));
        }
      };
      img.onerror = () => {
        // Fallback to direct data URL if browser cannot decode via Image
        setFormData((prev) => ({ ...prev, profilePhoto: result }));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Please enter full name.');
      return;
    }
    if (!formData.employeeId.trim()) {
      setFormError('Please enter employee ID.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingEmployee) {
        // Update existing employee
        const payload: any = {
          ...formData,
          joiningDate: formData.joiningDate || undefined,
          leavingDate: formData.employmentStatus !== 'Active' && formData.leavingDate ? formData.leavingDate : null,
        };
        // If password field is empty during edit, do not overwrite existing password
        if (!payload.password || payload.password.trim() === '') {
          delete payload.password;
        }

        const res = await api.put(`/api/users/${editingEmployee.id}`, payload);
        if (res.data?.success) {
          setIsModalOpen(false);
          setEditingEmployee(null);
          setSuccessToast(`Employee "${formData.name}" updated successfully!`);
          setTimeout(() => setSuccessToast(null), 4000);
          fetchEmployees();
        } else {
          setFormError(res.data?.message || 'Failed to update employee');
        }
      } else {
        // Create new employee
        const payload: any = {
          ...formData,
          isITTeam: true,
          department: 'Information Technology',
          joiningDate: formData.joiningDate || undefined,
          leavingDate: formData.employmentStatus !== 'Active' && formData.leavingDate ? formData.leavingDate : null,
        };

        const res = await api.post('/api/users', payload);
        if (res.data?.success) {
          setIsModalOpen(false);
          setSuccessToast(
            formData.employmentStatus === 'Active'
              ? `Running IT Employee "${formData.name}" added successfully!`
              : `EX IT Employee record for "${formData.name}" recorded successfully!`
          );
          setTimeout(() => setSuccessToast(null), 4000);
          fetchEmployees();
        } else {
          setFormError(res.data?.message || 'Failed to add employee');
        }
      }
    } catch (err: any) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (emp: Employee) => {
    // Frontend protection check
    if (emp.role === 'SUPER_ADMIN' || emp.username === 'omith.hasan') {
      showWarningAlert(
        'Security Protection',
        'Super Admin accounts are protected by system policy and cannot be deleted.'
      );
      return;
    }

    const confirmed = await confirmDelete({
      title: 'Remove Employee?',
      text: `Are you sure you want to remove ${emp.name} (${emp.employeeId}) from the system?`,
      confirmButtonText: 'Yes, Remove Employee',
    });
    if (!confirmed) return;

    try {
      const res = await api.delete(`/api/users/${emp.id}`);
      if (res.data?.success === false) {
        showErrorAlert('Delete Failed', res.data?.message || 'Failed to delete employee.');
        return;
      }
      setEmployees((prev) => prev.filter((item) => item.id !== emp.id));
      showSuccessAlert('Deleted!', `Employee "${emp.name}" removed successfully.`);
    } catch (err: any) {
      showErrorAlert('Error', getErrorMessage(err));
    }
  };

  // Generate strong random password for admin reset
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAdminNewPassword(pass);
  };

  // Super Admin password reset handler
  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminResetTarget) return;
    if (!adminNewPassword || adminNewPassword.trim().length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }
    setAdminResetSubmitting(true);
    try {
      const res = await api.post(`/api/users/${adminResetTarget.id}/reset-password`, {
        newPassword: adminNewPassword.trim(),
      });
      setSuccessToast(res.data?.message || `Password reset successfully for ${adminResetTarget.name}`);
      setAdminResetSuccess(adminNewPassword.trim());
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      alert(getErrorMessage(err));
    } finally {
      setAdminResetSubmitting(false);
    }
  };

  // Self password reset handler (any member)
  const handleSelfChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfCurrentPassword || !selfNewPassword) {
      setSelfError('Please enter both current and new passwords.');
      return;
    }
    if (selfNewPassword.length < 6) {
      setSelfError('New password must be at least 6 characters long.');
      return;
    }
    if (selfNewPassword !== selfConfirmPassword) {
      setSelfError('New password and confirmation do not match.');
      return;
    }
    setSelfSubmitting(true);
    setSelfError(null);
    try {
      const res = await api.post('/api/auth/change-password', {
        currentPassword: selfCurrentPassword,
        newPassword: selfNewPassword,
      });
      setSuccessToast(res.data?.message || 'Your password was changed successfully!');
      setTimeout(() => setSuccessToast(null), 3500);
      setIsSelfPasswordModalOpen(false);
      setSelfCurrentPassword('');
      setSelfNewPassword('');
      setSelfConfirmPassword('');
    } catch (err: any) {
      setSelfError(getErrorMessage(err));
    } finally {
      setSelfSubmitting(false);
    }
  };

  return (
    <AccessGuard module="employees">
      <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500 text-white font-medium text-xs shadow-2xl shadow-emerald-500/30 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              IT Employee Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold">
              IT Operations Team
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage active IT Running staff members and maintain records for EX IT employees.
          </p>
        </div>

        {canPerformAction('employees', 'create') && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/25 active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('ALL')}
          className={cn(
            'p-4 rounded-2xl border transition cursor-pointer backdrop-blur-sm',
            activeTab === 'ALL'
              ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/40'
              : 'border-border bg-card/60 hover:border-border/80'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total IT Staff
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2">{totalCount}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Running & Ex IT personnel</p>
        </div>

        <div
          onClick={() => setActiveTab('RUNNING')}
          className={cn(
            'p-4 rounded-2xl border transition cursor-pointer backdrop-blur-sm',
            activeTab === 'RUNNING'
              ? 'border-emerald-500/60 bg-emerald-500/5 ring-1 ring-emerald-500/40'
              : 'border-border bg-card/60 hover:border-border/80'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              IT Running Staff
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-extrabold text-emerald-500">{runningCount}</p>
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Active on duty</p>
        </div>

        <div
          onClick={() => setActiveTab('EX')}
          className={cn(
            'p-4 rounded-2xl border transition cursor-pointer backdrop-blur-sm',
            activeTab === 'EX'
              ? 'border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/40'
              : 'border-border bg-card/60 hover:border-border/80'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              EX IT Employees
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <UserX className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-500 mt-2">{exCount}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Resigned / Former staff</p>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Available Now
            </span>
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-purple-400 mt-2">{availableCount}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Free for urgent assignments</p>
        </div>
      </div>

      {/* Tabs and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center p-1 rounded-xl border border-border bg-card/80 backdrop-blur-md w-fit">
          <button
            onClick={() => setActiveTab('ALL')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5',
              activeTab === 'ALL'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span>All IT Personnel</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted/60">{totalCount}</span>
          </button>

          <button
            onClick={() => setActiveTab('RUNNING')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5',
              activeTab === 'RUNNING'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>IT Running Employee</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
              {runningCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('EX')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5',
              activeTab === 'EX'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span>EX IT Employee</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300">
              {exCount}
            </span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2 flex-1 sm:max-w-md">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 absolute left-3.5 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, ID, designation, ext..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-muted-foreground/60"
            />
          </div>

          <select
            value={itStatusFilter}
            onChange={(e) => setItStatusFilter(e.target.value)}
            className="px-2.5 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Duty Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="BUSY">Busy</option>
            <option value="AWAY">Away</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="p-4">Employee</th>
                <th className="p-4">ID & Contact</th>
                <th className="p-4">Status & Category</th>
                <th className="p-4">Duty Status</th>
                <th className="p-4">Service Timeline</th>
                <th className="p-4">PABX & Hardware</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground">
                    <div className="inline-flex items-center gap-2 text-xs">
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Loading IT employee records...</span>
                    </div>
                  </td>
                </tr>
              ) : displayedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="h-12 w-12 rounded-2xl bg-muted/60 text-muted-foreground mx-auto flex items-center justify-center">
                        <Users className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-semibold text-foreground">No IT employees found</p>
                      <p className="text-[11px] text-muted-foreground">
                        {activeTab === 'RUNNING'
                          ? 'No running IT employees match your search.'
                          : activeTab === 'EX'
                          ? 'No EX IT employees recorded yet.'
                          : 'Try modifying your search criteria or add an employee.'}
                      </p>
                      <button
                        onClick={openAddModal}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add New Employee</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedEmployees.map((emp) => {
                  const isRunning = emp.employmentStatus === 'Active';
                  return (
                    <tr key={emp.id} className="hover:bg-muted/30 transition group">
                      {/* Name, Avatar & Designation */}
                      <td className="p-4">
                        <div
                          onClick={() => setViewingEmployee(emp)}
                          className="flex items-center gap-3 cursor-pointer group/emp hover:opacity-95 transition"
                          title={`Click to view details of ${emp.name}`}
                        >
                          {/* Guaranteed Uniform Avatar Box: strictly 40x40px (w-10 h-10) with aspect-square */}
                          <div className="relative w-10 h-10 min-w-10 min-h-10 max-w-10 max-h-10 aspect-square rounded-xl overflow-hidden shrink-0 border border-border shadow-xs bg-muted/40 flex items-center justify-center group-hover/emp:border-primary/50 transition">
                            {emp.profilePhoto ? (
                              <img
                                src={emp.profilePhoto}
                                alt={emp.name}
                                className="w-full h-full object-cover object-top aspect-square"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                  const parent = (e.target as HTMLElement).parentElement;
                                  if (parent) {
                                    const fallback = parent.querySelector('.initial-fallback');
                                    if (fallback) (fallback as HTMLElement).classList.remove('hidden');
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              className={cn(
                                'initial-fallback w-full h-full font-bold flex items-center justify-center text-xs uppercase',
                                emp.profilePhoto ? 'hidden' : 'flex',
                                isRunning
                                  ? 'bg-gradient-to-tr from-blue-600/20 to-indigo-500/20 text-primary'
                                  : 'bg-muted text-muted-foreground'
                              )}
                            >
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground leading-tight truncate group-hover/emp:text-primary transition flex items-center gap-1.5">
                              <span>{emp.name}</span>
                              <Eye className="h-3 w-3 opacity-0 group-hover/emp:opacity-60 transition text-muted-foreground shrink-0" />
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                              {emp.designation || 'IT Engineer'}
                            </p>
                            <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                              {emp.role.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* ID & Contact */}
                      <td className="p-4 space-y-1">
                        <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-card border border-border text-foreground">
                          {emp.employeeId}
                        </span>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <Mail className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                          <span className="truncate max-w-[160px]">{emp.email}</span>
                        </p>
                        {emp.phone && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <Phone className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                            <span>{emp.phone}</span>
                          </p>
                        )}
                      </td>

                      {/* Status & Category */}
                      <td className="p-4">
                        {isRunning ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>IT Running</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold">
                            <UserX className="h-3 w-3" />
                            <span>EX IT Employee</span>
                          </div>
                        )}
                        {emp.officeLocation && (
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {emp.officeLocation}
                          </p>
                        )}
                      </td>

                      {/* Duty Status */}
                      <td className="p-4">
                        {isRunning ? (
                          <span
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider',
                              emp.itStatus === 'AVAILABLE'
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : emp.itStatus === 'BUSY'
                                ? 'bg-amber-500/15 text-amber-500'
                                : emp.itStatus === 'AWAY'
                                ? 'bg-blue-500/15 text-blue-500'
                                : 'bg-zinc-500/15 text-zinc-400'
                            )}
                          >
                            {emp.itStatus}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            Released
                          </span>
                        )}
                      </td>

                      {/* Service Timeline */}
                      <td className="p-4 text-[11px] space-y-0.5">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span className="font-semibold text-foreground">Joined:</span>
                          <span>{formatDate(emp.joiningDate)}</span>
                        </div>
                        {!isRunning && emp.leavingDate && (
                          <div className="flex items-center gap-1 text-amber-500/90 font-medium">
                            <span className="font-semibold">Left:</span>
                            <span>{formatDate(emp.leavingDate)}</span>
                          </div>
                        )}
                        {emp.remarks && (
                          <p
                            className="text-[10px] text-muted-foreground italic truncate max-w-[150px]"
                            title={emp.remarks}
                          >
                            "{emp.remarks}"
                          </p>
                        )}
                      </td>

                      {/* Hardware & Extensions */}
                      <td className="p-4">
                        <div className="space-y-1">
                          {emp.extensionNumber ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                              <PhoneCall className="h-2.5 w-2.5" />
                              <span>Ext {emp.extensionNumber}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">No Extension</span>
                          )}

                          <div>
                            {emp.computers && emp.computers.length > 0 ? (
                              emp.computers.map((c: any) => (
                                <span
                                  key={c.id || c.assetId}
                                  className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground mr-1"
                                >
                                  {c.assetId}
                                </span>
                              ))
                            ) : (
                              <p className="text-[10px] text-muted-foreground">0 Workstations</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details Button */}
                          <button
                            onClick={() => setViewingEmployee(emp)}
                            title={`View Details of ${emp.name}`}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-sky-500 hover:bg-sky-500/10 transition"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Super Admin Reset Password Button */}
                          {isSuperAdmin && (
                            <button
                              onClick={() => {
                                setAdminResetTarget(emp);
                                setAdminNewPassword('');
                                setAdminResetSuccess(null);
                                setCopiedPassword(false);
                              }}
                              title={`Reset Password for ${emp.name} (Super Admin)`}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition"
                            >
                              <KeyRound className="h-4 w-4 text-amber-500/80 hover:text-amber-500" />
                            </button>
                          )}

                          {/* Edit Employee Button */}
                          {canPerformAction('employees', 'edit') && (
                            <button
                              onClick={() => openEditModal(emp)}
                              title={`Edit ${emp.name}`}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}

                          {/* Delete Button or Protected Badge */}
                          {emp.role === 'SUPER_ADMIN' || emp.username === 'omith.hasan' ? (
                            <span
                              title="Protected Super Admin: Cannot be deleted by anyone"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/25 select-none cursor-default"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>Protected</span>
                            </span>
                          ) : canPerformAction('employees', 'delete') ? (
                            <button
                              onClick={() => handleDelete(emp)}
                              title={`Delete ${emp.name}`}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition opacity-70 group-hover:opacity-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-card/60">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span>{editingEmployee ? 'Edit IT Employee Profile' : 'Add IT Employee'}</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editingEmployee
                    ? `Update profile details, designations, or roles for "${editingEmployee.name}".`
                    : 'Record active running IT personnel or archive an EX IT employee profile.'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
              {formError && (
                <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Status Selector: IT Running Employee vs EX IT Employee */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Employee Classification <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        employmentStatus: 'Active',
                        itStatus: 'AVAILABLE',
                      }))
                    }
                    className={cn(
                      'p-3.5 rounded-2xl border text-left transition flex items-center gap-3',
                      formData.employmentStatus === 'Active'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 ring-2 ring-emerald-500/30'
                        : 'border-border bg-muted/40 text-muted-foreground hover:border-border/80'
                    )}
                  >
                    <div
                      className={cn(
                        'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
                        formData.employmentStatus === 'Active'
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">IT Running Employee</p>
                      <p className="text-[10px] text-muted-foreground">Active corporate IT staff member</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        employmentStatus: 'Former',
                        itStatus: 'OFFLINE',
                        leavingDate: p.leavingDate || new Date().toISOString().split('T')[0],
                      }))
                    }
                    className={cn(
                      'p-3.5 rounded-2xl border text-left transition flex items-center gap-3',
                      formData.employmentStatus !== 'Active'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400 ring-2 ring-amber-500/30'
                        : 'border-border bg-muted/40 text-muted-foreground hover:border-border/80'
                    )}
                  >
                    <div
                      className={cn(
                        'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
                        formData.employmentStatus !== 'Active'
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <UserX className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">EX IT Employee</p>
                      <p className="text-[10px] text-muted-foreground">Former or resigned IT engineer</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Profile Photo Section (Guaranteed Uniform Square Size) */}
              <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-primary" />
                    <span>Employee Photo / Avatar</span>
                  </label>
                  {formData.profilePhoto && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, profilePhoto: '' })}
                      className="text-[11px] text-rose-500 hover:text-rose-400 font-semibold flex items-center gap-1 transition"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Uniform Square Preview Box: strictly 80x80px (w-20 h-20) */}
                  <div className="relative w-20 h-20 min-w-20 min-h-20 max-w-20 max-h-20 aspect-square rounded-2xl border-2 border-border/80 bg-card overflow-hidden shadow-md flex items-center justify-center shrink-0 group">
                    {formData.profilePhoto ? (
                      <img
                        src={formData.profilePhoto}
                        alt="Avatar Preview"
                        className="w-full h-full object-cover object-top aspect-square"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground p-2 text-center">
                        <Camera className="h-6 w-6 text-muted-foreground/60" />
                        <span className="text-[9px] font-semibold mt-1">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Photo Actions: File Upload & URL */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="profile-photo-file-input"
                        className="cursor-pointer px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Browse / Upload Image</span>
                      </label>
                      <input
                        id="profile-photo-file-input"
                        type="file"
                        accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg,.jfif,.avif"
                        className="hidden"
                        onChange={handleImageFileChange}
                      />
                      <span className="text-[11px] text-muted-foreground">
                        Any format & size supported (auto-fitted & smart head framed)
                      </span>
                    </div>

                    <div className="relative">
                      <ImageIcon className="h-3.5 w-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                      <input
                        type="url"
                        placeholder="Or paste direct image URL (e.g. https://...)"
                        value={formData.profilePhoto}
                        onChange={(e) => setFormData({ ...formData, profilePhoto: e.target.value })}
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-card/60 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono placeholder:font-sans"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid: Employee ID, Full Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Employee ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP-0004"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Ahmed"
                    value={formData.name}
                    onChange={handleNameChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Grid: Email, Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Corporate Email</label>
                  <input
                    type="email"
                    placeholder="e.g. tanvir.ahmed@company.local"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">System Username</label>
                  <input
                    type="text"
                    placeholder="e.g. tanvir.ahmed"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                  />
                </div>
              </div>

              {/* Grid: Designation & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">IT Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. IT Support Engineer"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>System Role</span>
                    {editingEmployee?.role === 'SUPER_ADMIN' && (
                      <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Protected
                      </span>
                    )}
                  </label>
                  <select
                    value={formData.role}
                    disabled={editingEmployee?.role === 'SUPER_ADMIN'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className={cn(
                      "w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40",
                      editingEmployee?.role === 'SUPER_ADMIN' && "opacity-80 cursor-not-allowed bg-muted/40"
                    )}
                  >
                    <option value="IT_SUPPORT">IT Support (Technician)</option>
                    <option value="IT_ADMIN">IT Admin (Network / Systems)</option>
                    <option value="SUPER_ADMIN">Super Admin (IT Lead)</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </div>
              </div>

              {/* Grid: Extension, Phone, Office Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">PABX Extension</label>
                  <input
                    type="text"
                    placeholder="e.g. 1104"
                    value={formData.extensionNumber}
                    onChange={(e) => setFormData({ ...formData, extensionNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Mobile Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +880 1700-000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Office Location</label>
                  <input
                    type="text"
                    placeholder="e.g. HQ Floor 4"
                    value={formData.officeLocation}
                    onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Service Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {formData.employmentStatus !== 'Active' ? (
                  <div className="space-y-1.5 animate-in fade-in">
                    <label className="text-xs font-semibold text-amber-500">
                      Leaving / Resignation Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required={formData.employmentStatus !== 'Active'}
                      value={formData.leavingDate}
                      onChange={(e) => setFormData({ ...formData, leavingDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">IT Duty Status</label>
                    <select
                      value={formData.itStatus}
                      onChange={(e) => setFormData({ ...formData, itStatus: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="AVAILABLE">🟢 Available (On Duty)</option>
                      <option value="BUSY">🟡 Busy (Troubleshooting)</option>
                      <option value="AWAY">🔵 Away (Break / Field)</option>
                      <option value="OFFLINE">⚪ Offline</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Password & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(!editingEmployee || isSuperAdmin) ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      {editingEmployee ? 'Change Password (Super Admin Only)' : 'Initial Password'}{' '}
                      <span className="text-[10px] text-muted-foreground">
                        {editingEmployee ? '(Leave empty to keep current)' : '(Default: Welcome@123)'}
                      </span>
                    </label>
                    <input
                      type="password"
                      placeholder={editingEmployee ? 'Leave empty to keep existing password' : 'Leave empty for Welcome@123'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Password Management</label>
                    <div className="p-2.5 rounded-xl border border-border bg-muted/20 text-[11px] text-muted-foreground flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>Password can only be modified by Super Admin.</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Remarks / Handover Notes</label>
                  <input
                    type="text"
                    placeholder={
                      formData.employmentStatus === 'Active'
                        ? 'e.g. Lead for Server Migration'
                        : 'e.g. Cleared IT clearance and returned assets'
                    }
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-foreground transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center gap-2 transition shadow-lg shadow-primary/25 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{editingEmployee ? 'Updating...' : 'Saving Employee...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{editingEmployee ? 'Update Profile' : 'Save Employee'}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Employee Details Modal */}
      {viewingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Header banner */}
            <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-md bg-muted/60 flex items-center justify-center shrink-0">
                  {viewingEmployee.profilePhoto ? (
                    <img
                      src={viewingEmployee.profilePhoto}
                      alt={viewingEmployee.name}
                      className="w-full h-full object-cover object-top aspect-square"
                    />
                  ) : (
                    <div className="w-full h-full font-black text-xl flex items-center justify-center uppercase bg-gradient-to-tr from-blue-600/20 to-indigo-500/20 text-primary">
                      {viewingEmployee.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span
                    className={cn(
                      'absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-card',
                      viewingEmployee.itStatus === 'AVAILABLE'
                        ? 'bg-emerald-500'
                        : viewingEmployee.itStatus === 'BUSY'
                        ? 'bg-amber-500'
                        : viewingEmployee.itStatus === 'AWAY'
                        ? 'bg-blue-500'
                        : 'bg-zinc-500'
                    )}
                    title={`Duty status: ${viewingEmployee.itStatus}`}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-foreground">{viewingEmployee.name}</h3>
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-muted border border-border text-foreground">
                      {viewingEmployee.employeeId}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {viewingEmployee.designation || 'IT Engineer'} &bull; {viewingEmployee.department || 'Information Technology'}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase">
                      {viewingEmployee.role.replace('_', ' ')}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                        viewingEmployee.employmentStatus === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      )}
                    >
                      {viewingEmployee.employmentStatus === 'Active' ? 'IT Running' : 'EX IT Employee'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setViewingEmployee(null)}
                className="h-8 w-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Contact Information */}
              <div>
                <p className="font-bold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground mb-2">
                  Contact & Communication
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-muted/30 border border-border flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">Email Address</p>
                      <a href={`mailto:${viewingEmployee.email}`} className="font-semibold text-foreground truncate hover:underline block">
                        {viewingEmployee.email}
                      </a>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-muted/30 border border-border flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">Phone Number</p>
                      <a href={`tel:${viewingEmployee.phone}`} className="font-semibold text-foreground truncate hover:underline block">
                        {viewingEmployee.phone || 'N/A'}
                      </a>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-muted/30 border border-border flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                      <PhoneCall className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">PABX Extension</p>
                      <p className="font-mono font-bold text-foreground">
                        {viewingEmployee.extensionNumber ? `Ext ${viewingEmployee.extensionNumber}` : 'Not Assigned'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-muted/30 border border-border flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">Office Location</p>
                      <p className="font-semibold text-foreground">
                        {viewingEmployee.officeLocation || 'Main Office'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service & Tenure */}
              <div>
                <p className="font-bold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground mb-2">
                  Service Timeline & Status
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-muted/30 border border-border">
                    <p className="text-[10px] text-muted-foreground">Joining Date</p>
                    <p className="font-bold text-foreground mt-0.5">{formatDate(viewingEmployee.joiningDate)}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-muted/30 border border-border">
                    <p className="text-[10px] text-muted-foreground">Release / Leaving Date</p>
                    <p className="font-bold text-foreground mt-0.5">
                      {viewingEmployee.leavingDate ? formatDate(viewingEmployee.leavingDate) : 'Currently Active'}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-muted/30 border border-border">
                    <p className="text-[10px] text-muted-foreground">Username</p>
                    <p className="font-mono font-bold text-foreground mt-0.5">{viewingEmployee.username}</p>
                  </div>
                </div>
                {viewingEmployee.remarks && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-muted/20 border border-border">
                    <p className="text-[10px] text-muted-foreground font-semibold">Remarks & Handover Notes:</p>
                    <p className="text-xs text-foreground italic mt-0.5">"{viewingEmployee.remarks}"</p>
                  </div>
                )}
              </div>

              {/* Assigned Computers */}
              <div>
                <p className="font-bold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground mb-2">
                  Assigned Hardware & Workstations
                </p>
                {viewingEmployee.computers && viewingEmployee.computers.length > 0 ? (
                  <div className="space-y-1.5">
                    {viewingEmployee.computers.map((c: any) => (
                      <div key={c.id || c.assetId} className="p-3 rounded-2xl bg-muted/30 border border-border flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Laptop className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-bold text-foreground font-mono">{c.assetId || 'ASSET'}</p>
                            <p className="text-[10px] text-muted-foreground">{c.brand} {c.model} &bull; IP: {c.ipAddress || 'DHCP'}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          {c.status || 'Active'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic text-[11px] p-3 rounded-2xl bg-muted/20 border border-dashed border-border">
                    No computers or workstations currently assigned to this employee.
                  </p>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-card/60">
              <div className="flex items-center gap-2">
                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      const emp = viewingEmployee;
                      setViewingEmployee(null);
                      setAdminResetTarget(emp);
                      setAdminNewPassword('');
                      setAdminResetSuccess(null);
                      setCopiedPassword(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-500/20 transition text-xs"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>Reset Password</span>
                  </button>
                )}
                {canPerformAction('employees', 'edit') && (
                  <button
                    onClick={() => {
                      const emp = viewingEmployee;
                      setViewingEmployee(null);
                      openEditModal(emp);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold transition text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setViewingEmployee(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-foreground transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Password Reset Modal */}
      {adminResetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">Super Admin Password Reset</h3>
                  <p className="text-xs text-muted-foreground">Override password for {adminResetTarget.name}</p>
                </div>
              </div>
              <button
                onClick={() => setAdminResetTarget(null)}
                className="h-8 w-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Target User Summary Card */}
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/70 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-foreground">{adminResetTarget.name}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{adminResetTarget.email}</p>
              </div>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-card border border-border">
                {adminResetTarget.employeeId}
              </span>
            </div>

            {adminResetSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-3">
                <div className="flex items-center gap-2 text-emerald-500 font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Password Reset Successfully!</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Provide this new credential to {adminResetTarget.name}:
                </p>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border font-mono text-sm font-bold text-foreground">
                  <span>{adminResetSuccess}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(adminResetSuccess);
                      setCopiedPassword(true);
                      setTimeout(() => setCopiedPassword(false), 2500);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
                  >
                    {copiedPassword ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedPassword ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <button
                  onClick={() => setAdminResetTarget(null)}
                  className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleAdminResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">New Password</label>
                    <button
                      type="button"
                      onClick={generateStrongPassword}
                      className="text-[11px] text-primary hover:underline font-bold inline-flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Generate Strong</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={adminNewPassword}
                      onChange={(e) => setAdminNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAdminResetTarget(null)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adminResetSubmitting}
                    className="px-5 py-2 rounded-xl bg-amber-500 text-amber-950 font-black text-xs hover:bg-amber-400 transition shadow-md shadow-amber-500/25 disabled:opacity-50 flex items-center gap-2"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>{adminResetSubmitting ? 'Resetting...' : 'Confirm Reset Password'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Self Password Reset Modal (for all members) */}
      {isSelfPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">Change My Password</h3>
                  <p className="text-xs text-muted-foreground">Update your personal account security password</p>
                </div>
              </div>
              <button
                onClick={() => setIsSelfPasswordModalOpen(false)}
                className="h-8 w-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selfError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{selfError}</span>
              </div>
            )}

            <form onSubmit={handleSelfChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Current Password</label>
                <div className="relative">
                  <input
                    type={showSelfCurrentPass ? 'text' : 'password'}
                    required
                    value={selfCurrentPassword}
                    onChange={(e) => setSelfCurrentPassword(e.target.value)}
                    placeholder="Enter your existing password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSelfCurrentPass(!showSelfCurrentPass)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showSelfCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">New Password</label>
                <div className="relative">
                  <input
                    type={showSelfNewPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={selfNewPassword}
                    onChange={(e) => setSelfNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSelfNewPass(!showSelfNewPass)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showSelfNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={selfConfirmPassword}
                  onChange={(e) => setSelfConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSelfPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selfSubmitting}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition shadow-md shadow-primary/25 disabled:opacity-50 flex items-center gap-2"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>{selfSubmitting ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  </AccessGuard>
);
}
