'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  PhoneCall,
  Search,
  Plus,
  Edit2,
  Trash2,
  Smartphone,
  MapPin,
  Building,
  X,
  User as UserIcon,
  CheckCircle2,
  Phone,
  Hash,
  Info,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import api from '@/lib/api';
import { AccessGuard } from '@/components/AccessGuard';
import { confirmDelete, showSuccessAlert, showErrorAlert } from '@/lib/sweetalert';

interface EmployeeUser {
  id: string;
  name: string;
  employeeId: string;
  department?: string;
  phone?: string;
  email?: string;
  designation?: string;
}

interface ExtensionItem {
  id: string;
  extensionNumber: string;
  holderName?: string | null;
  designation?: string | null;
  customEmployeeId?: string | null;
  mobile?: string | null;
  department?: string | null;
  location?: string | null;
  deskRoom?: string | null;
  status: 'ASSIGNED' | 'AVAILABLE' | 'DISABLED' | 'RESERVED';
  remarks?: string | null;
  employeeId?: string | null;
  employee?: EmployeeUser | null;
  createdAt: string;
}

const initialForm = {
  extensionNumber: '',
  holderName: '',
  designation: '',
  employeeId: '',
  customEmployeeId: '',
  mobile: '',
  department: '',
  deskRoom: '',
  location: '',
  status: 'ASSIGNED' as const,
  remarks: '',
};

export default function ExtensionsPage() {
  const [extensions, setExtensions] = useState<ExtensionItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchExtensions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/extensions', {
        params: {
          search: search || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        },
      });
      setExtensions(res.data?.data || []);
    } catch (err: any) {
      console.error('Failed to fetch extensions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/api/users', { params: { status: 'Active' } });
      setEmployees(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch employee list:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => {
      fetchExtensions();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = extensions.length;
    const assigned = extensions.filter((e) => e.status === 'ASSIGNED').length;
    const available = extensions.filter((e) => e.status === 'AVAILABLE').length;
    const disabled = extensions.filter((e) => e.status === 'DISABLED' || e.status === 'RESERVED').length;
    return { total, assigned, available, disabled };
  }, [extensions]);

  // Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(extensions.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedExtensions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return extensions.slice(start, start + pageSize);
  }, [extensions, currentPage, pageSize]);

  const startIndex = extensions.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, extensions.length);

  // Open modal for Adding
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEdit = (ext: ExtensionItem) => {
    setEditingId(ext.id);
    const empCode = ext.customEmployeeId || ext.employee?.employeeId || '';
    setFormData({
      extensionNumber: ext.extensionNumber,
      holderName: ext.holderName || ext.employee?.name || '',
      designation: ext.designation || ext.employee?.designation || '',
      employeeId: empCode,
      customEmployeeId: empCode,
      mobile: ext.mobile || ext.employee?.phone || '',
      department: ext.department || ext.employee?.department || '',
      deskRoom: ext.deskRoom || '',
      location: ext.location || '',
      status: ext.status as any,
      remarks: ext.remarks || '',
    });
    setIsModalOpen(true);
  };

  const handleEmployeeIdChange = (val: string) => {
    const trimmed = val.trim();
    const matched = employees.find(
      (emp) => emp.employeeId?.toLowerCase() === trimmed.toLowerCase()
    );

    if (matched) {
      setFormData((prev) => ({
        ...prev,
        employeeId: val,
        customEmployeeId: val,
        holderName: matched.name || prev.holderName,
        designation: matched.designation || prev.designation,
        department: matched.department || prev.department,
        mobile: matched.phone || prev.mobile,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        employeeId: val,
        customEmployeeId: val,
      }));
    }
  };

  // Submit Add / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.extensionNumber.trim()) {
      showErrorAlert('Extension Number is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        extensionNumber: formData.extensionNumber.trim(),
        holderName: formData.holderName.trim() || undefined,
        designation: formData.designation.trim() || undefined,
        customEmployeeId: formData.customEmployeeId.trim() || undefined,
        employeeId: formData.customEmployeeId.trim() || undefined,
        mobile: formData.mobile.trim() || undefined,
        department: formData.department.trim() || undefined,
        deskRoom: formData.deskRoom.trim() || undefined,
        location: formData.location.trim() || undefined,
        status: formData.status,
        remarks: formData.remarks.trim() || undefined,
      };

      if (editingId) {
        await api.put(`/api/extensions/${editingId}`, payload);
        showSuccessAlert(`Extension ${formData.extensionNumber} updated successfully.`);
      } else {
        await api.post('/api/extensions', payload);
        showSuccessAlert(`Extension ${formData.extensionNumber} created successfully.`);
      }

      setIsModalOpen(false);
      fetchExtensions();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Operation failed.';
      showErrorAlert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Extension
  const handleDelete = async (ext: ExtensionItem) => {
    const holder = ext.employee?.name || ext.holderName || 'this line';
    const confirmed = await confirmDelete({
      title: `Delete Ext. ${ext.extensionNumber}?`,
      text: `Are you sure you want to permanently delete PABX extension "${ext.extensionNumber}" (${holder})?`,
      confirmButtonText: 'Yes, Delete Extension',
    });

    if (!confirmed) return;

    try {
      await api.delete(`/api/extensions/${ext.id}`);
      showSuccessAlert(`Extension ${ext.extensionNumber} deleted.`);
      fetchExtensions();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete extension.';
      showErrorAlert(msg);
    }
  };

  return (
    <AccessGuard module="extensions">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <PhoneCall className="h-6 w-6" />
              </span>
              PABX & Extension Directory
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage company intercom lines, desk phones, key contact extensions, and mobile numbers.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 hover:opacity-90 active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            Add Extension
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Hash className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Lines</p>
              <p className="text-xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Assigned</p>
              <p className="text-xl font-bold text-foreground">{stats.assigned}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Available</p>
              <p className="text-xl font-bold text-foreground">{stats.available}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-500/10 text-slate-400 flex items-center justify-center font-bold">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Reserved/Other</p>
              <p className="text-xl font-bold text-foreground">{stats.disabled}</p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="h-4 w-4 absolute left-3.5 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by extension number, line holder, employee ID, department, mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-44 px-3 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-md overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="p-4">Extension</th>
                  <th className="p-4">Line Holder</th>
                  <th className="p-4">Designation</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Mobile</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      <div className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Loading extension directory...
                      </div>
                    </td>
                  </tr>
                ) : extensions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-muted-foreground">
                      <p className="font-medium text-foreground">No extension numbers found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Try adjusting your search or add a new extension using the "+ Add Extension" button above.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedExtensions.map((ext) => (
                    <tr key={ext.id} className="hover:bg-muted/30 transition group">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                            <Phone className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-mono font-bold text-sm text-foreground">
                              {ext.extensionNumber}
                            </span>
                            {ext.remarks && (
                              <p className="text-[10px] text-muted-foreground line-clamp-1">{ext.remarks}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <span>{ext.employee?.name || ext.holderName || 'Unassigned'}</span>
                          {(ext.customEmployeeId || ext.employee?.employeeId) && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                              {ext.customEmployeeId || ext.employee?.employeeId}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-[11px] text-muted-foreground font-medium">
                        {ext.designation || ext.employee?.designation || '-'}
                      </td>
                      <td className="p-4 text-[11px] text-muted-foreground">
                        {ext.department || ext.employee?.department || '-'}
                      </td>
                      <td className="p-4 font-mono text-[11px] text-muted-foreground">
                        {ext.mobile ? (
                          <div className="flex items-center gap-1.5">
                            <Smartphone className="h-3.5 w-3.5 text-muted-foreground/70" />
                            <span>{ext.mobile}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            ext.status === 'ASSIGNED'
                              ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                              : ext.status === 'AVAILABLE'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}
                        >
                          {ext.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(ext)}
                            className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/40 transition active:scale-95"
                            title="Edit Extension"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(ext)}
                            className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-red-500 hover:border-red-500/40 transition active:scale-95"
                            title="Delete Extension"
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

          {/* Pagination Controls Footer */}
          {!loading && extensions.length > 0 && (
            <div className="p-4 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>
                  Showing <strong className="text-foreground font-semibold">{startIndex}</strong> to{' '}
                  <strong className="text-foreground font-semibold">{endIndex}</strong> of{' '}
                  <strong className="text-foreground font-semibold">{extensions.length}</strong> extensions
                </span>

                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-[11px] text-muted-foreground">Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="First page"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        return (
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1
                        );
                      })
                      .map((page, idx, arr) => {
                        const prevPage = arr[idx - 1];
                        const showEllipsis = prevPage && page - prevPage > 1;
                        return (
                          <React.Fragment key={page}>
                            {showEllipsis && (
                              <span className="px-1 text-xs text-muted-foreground">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${
                                currentPage === page
                                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                                  : 'border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    title="Last page"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add / Edit Extension Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <PhoneCall className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {editingId ? 'Edit PABX Extension' : 'Add New PABX Extension'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {editingId ? 'Update details of this line' : 'Enter internal intercom / PABX line information'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Extension Number */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Extension Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 30200 or 1101"
                      value={formData.extensionNumber}
                      onChange={(e) => setFormData({ ...formData, extensionNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    >
                      <option value="ASSIGNED">ASSIGNED</option>
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="RESERVED">RESERVED</option>
                      <option value="DISABLED">DISABLED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Employee ID */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 101493"
                      value={formData.customEmployeeId}
                      onChange={(e) => handleEmployeeIdChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>

                  {/* Holder Name */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Line Holder Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. M Shamsur Rahman or Front Desk"
                      value={formData.holderName}
                      onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Designation */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Broadcast Engineer, Manager"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Broadcast Technology"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Mobile Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 01711522049"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>

                  {/* Office Location */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Office Location</label>
                    <input
                      type="text"
                      placeholder="e.g. HQ Tejgaon, Floor 3"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Direct hunting line, Analog set, VIP contact"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-foreground hover:bg-muted/50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 hover:opacity-90 active:scale-95 disabled:opacity-50 transition flex items-center gap-2"
                  >
                    {submitting && (
                      <span className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    )}
                    {editingId ? 'Update Extension' : 'Save Extension'}
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
