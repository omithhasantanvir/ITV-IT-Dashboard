'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Computer as ComputerIcon,
  Search,
  HardDrive,
  Cpu,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  User,
  ShieldCheck,
  Disc,
  Layers,
  ArrowRightLeft,
  ExternalLink,
  Laptop,
  Server,
  Monitor,
  Sparkles,
} from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { AccessGuard } from '@/components/AccessGuard';
import { confirmDelete, showSuccessAlert, showErrorAlert } from '@/lib/sweetalert';
import { cn } from '@/lib/utils';

type ActiveTab = 'computers' | 'ssds';

interface ComputerItem {
  id: string;
  assetId: string;
  barcode?: string | null;
  computerType: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  processor?: string | null;
  ram?: string | null;
  storage?: string | null;
  ssd?: string | null;
  monitor?: string | null;
  operatingSystem?: string | null;
  macAddress?: string | null;
  ipAddress?: string | null;
  purchaseDate?: string | null;
  warranty?: string | null;
  location?: string | null;
  department?: string | null;
  status: string;
  condition: string;
  remarks?: string | null;
  assignedUserId?: string | null;
  assignedUser?: {
    id: string;
    name: string;
    employeeId: string;
    email: string;
    department?: string | null;
    designation?: string | null;
  } | null;
  ssds?: SSDItem[];
}

interface SSDItem {
  id: string;
  ssdId: string;
  serialNumber: string;
  brand?: string | null;
  model?: string | null;
  capacity?: string | null;
  interface?: string | null;
  health?: string | null;
  purchaseDate?: string | null;
  warranty?: string | null;
  location?: string | null;
  status: string;
  remarks?: string | null;
  assignedComputerId?: string | null;
  assignedComputer?: {
    id: string;
    assetId: string;
    brand?: string | null;
    model?: string | null;
    computerType?: string | null;
    location?: string | null;
    assignedUser?: {
      name: string;
      employeeId: string;
      department?: string | null;
    } | null;
  } | null;
}

interface EmployeeOption {
  id: string;
  name: string;
  employeeId: string;
  department?: string | null;
  designation?: string | null;
}

export default function ComputersPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('computers');

  // Computer states
  const [computers, setComputers] = useState<ComputerItem[]>([]);
  const [loadingComputers, setLoadingComputers] = useState(true);
  const [compSearch, setCompSearch] = useState('');
  const [compStatus, setCompStatus] = useState('');
  const [compType, setCompType] = useState('');

  // SSD states
  const [ssds, setSSDs] = useState<SSDItem[]>([]);
  const [loadingSSDs, setLoadingSSDs] = useState(true);
  const [ssdSearch, setSsdSearch] = useState('');
  const [ssdStatus, setSsdStatus] = useState('');

  // Employees for assignment dropdown
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  // Modals
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<ComputerItem | null>(null);

  const [isSsdModalOpen, setIsSsdModalOpen] = useState(false);
  const [editingSsd, setEditingSsd] = useState<SSDItem | null>(null);

  // Computer Form Data
  const [compForm, setCompForm] = useState({
    assetId: '',
    barcode: '',
    computerType: 'Desktop',
    brand: '',
    model: '',
    serialNumber: '',
    processor: '',
    ram: '',
    storage: '',
    ssd: '',
    monitor: '',
    operatingSystem: 'Windows 11 Pro',
    ipAddress: '',
    macAddress: '',
    location: '',
    department: '',
    status: 'AVAILABLE',
    condition: 'GOOD',
    purchaseDate: '',
    warranty: '',
    remarks: '',
    assignedUserId: '',
  });

  // SSD Form Data
  const [ssdForm, setSsdForm] = useState({
    ssdId: '',
    serialNumber: '',
    brand: 'Samsung',
    model: '',
    capacity: '512GB',
    interface: 'M.2 NVMe PCIe 4.0',
    health: '100% Healthy',
    purchaseDate: '',
    warranty: '3 Years',
    location: '',
    status: 'AVAILABLE',
    remarks: '',
    assignedComputerId: '',
  });

  const [submitting, setSubmitting] = useState(false);

  // Fetch computers
  const fetchComputers = async () => {
    setLoadingComputers(true);
    try {
      const params: any = {};
      if (compSearch) params.search = compSearch;
      if (compStatus) params.status = compStatus;
      if (compType) params.type = compType;

      const res = await api.get('/api/computers', { params });
      setComputers(res.data?.data || []);
    } catch (err) {
      console.error('fetchComputers error:', err);
    } finally {
      setLoadingComputers(false);
    }
  };

  // Fetch SSDs
  const fetchSSDs = async () => {
    setLoadingSSDs(true);
    try {
      const params: any = {};
      if (ssdSearch) params.search = ssdSearch;
      if (ssdStatus) params.status = ssdStatus;

      const res = await api.get('/api/ssds', { params });
      setSSDs(res.data?.data || []);
    } catch (err) {
      console.error('fetchSSDs error:', err);
    } finally {
      setLoadingSSDs(false);
    }
  };

  // Fetch Employees
  const fetchEmployees = async () => {
    try {
      const res = await api.get('/api/employees');
      setEmployees(res.data?.data || []);
    } catch (err) {
      console.error('fetchEmployees error:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchComputers();
    }, 250);
    return () => clearTimeout(timer);
  }, [compSearch, compStatus, compType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSSDs();
    }, 250);
    return () => clearTimeout(timer);
  }, [ssdSearch, ssdStatus]);

  // Handle open Computer Modal
  const handleOpenCompModal = (comp?: ComputerItem) => {
    if (comp) {
      setEditingComp(comp);
      setCompForm({
        assetId: comp.assetId || '',
        barcode: comp.barcode || '',
        computerType: comp.computerType || 'Desktop',
        brand: comp.brand || '',
        model: comp.model || '',
        serialNumber: comp.serialNumber || '',
        processor: comp.processor || '',
        ram: comp.ram || '',
        storage: comp.storage || '',
        ssd: comp.ssd || '',
        monitor: comp.monitor || '',
        operatingSystem: comp.operatingSystem || 'Windows 11 Pro',
        ipAddress: comp.ipAddress || '',
        macAddress: comp.macAddress || '',
        location: comp.location || '',
        department: comp.department || '',
        status: comp.status || 'AVAILABLE',
        condition: comp.condition || 'GOOD',
        purchaseDate: comp.purchaseDate ? comp.purchaseDate.split('T')[0] : '',
        warranty: comp.warranty || '',
        remarks: comp.remarks || '',
        assignedUserId: comp.assignedUserId || '',
      });
    } else {
      setEditingComp(null);
      setCompForm({
        assetId: `PC-${Date.now().toString().slice(-4)}`,
        barcode: '',
        computerType: 'Desktop',
        brand: 'Dell',
        model: 'OptiPlex',
        serialNumber: '',
        processor: 'Intel Core i7',
        ram: '16GB DDR4',
        storage: '512GB NVMe SSD',
        ssd: '',
        monitor: '24" Full HD',
        operatingSystem: 'Windows 11 Pro',
        ipAddress: '',
        macAddress: '',
        location: 'Main IT Office',
        department: 'Broadcast IT',
        status: 'AVAILABLE',
        condition: 'GOOD',
        purchaseDate: new Date().toISOString().split('T')[0],
        warranty: '3 Years',
        remarks: '',
        assignedUserId: '',
      });
    }
    setIsCompModalOpen(true);
  };

  // Submit Computer Form
  const handleSubmitComputer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compForm.assetId.trim()) {
      showErrorAlert('Asset ID is required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingComp) {
        await api.put(`/api/computers/${editingComp.id}`, compForm);
        showSuccessAlert('Computer details updated successfully!');
      } else {
        await api.post('/api/computers', compForm);
        showSuccessAlert('New computer added to inventory successfully!');
      }
      setIsCompModalOpen(false);
      fetchComputers();
    } catch (err: any) {
      showErrorAlert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Computer
  const handleDeleteComputer = async (comp: ComputerItem) => {
    const confirmed = await confirmDelete({
      title: `Delete ${comp.assetId}?`,
      text: `Are you sure you want to permanently remove "${comp.brand || ''} ${comp.model || ''}" from hardware inventory?`,
      confirmButtonText: 'Yes, Delete PC',
    });

    if (!confirmed) return;

    try {
      await api.delete(`/api/computers/${comp.id}`);
      showSuccessAlert(`Computer ${comp.assetId} deleted successfully.`);
      fetchComputers();
    } catch (err: any) {
      showErrorAlert(getErrorMessage(err));
    }
  };

  // Handle open SSD Modal
  const handleOpenSsdModal = (ssd?: SSDItem, preselectedCompId?: string) => {
    if (ssd) {
      setEditingSsd(ssd);
      setSsdForm({
        ssdId: ssd.ssdId || '',
        serialNumber: ssd.serialNumber || '',
        brand: ssd.brand || 'Samsung',
        model: ssd.model || '',
        capacity: ssd.capacity || '512GB',
        interface: ssd.interface || 'M.2 NVMe PCIe 4.0',
        health: ssd.health || '100% Healthy',
        purchaseDate: ssd.purchaseDate ? ssd.purchaseDate.split('T')[0] : '',
        warranty: ssd.warranty || '3 Years',
        location: ssd.location || '',
        status: ssd.status || 'AVAILABLE',
        remarks: ssd.remarks || '',
        assignedComputerId: ssd.assignedComputerId || '',
      });
    } else {
      setEditingSsd(null);
      setSsdForm({
        ssdId: `SSD-${Date.now().toString().slice(-4)}`,
        serialNumber: '',
        brand: 'Samsung',
        model: '980 Pro',
        capacity: '512GB',
        interface: 'M.2 NVMe PCIe 4.0',
        health: '100% Healthy',
        purchaseDate: new Date().toISOString().split('T')[0],
        warranty: '3 Years',
        location: 'IT Store',
        status: preselectedCompId ? 'INSTALLED' : 'AVAILABLE',
        remarks: '',
        assignedComputerId: preselectedCompId || '',
      });
    }
    setIsSsdModalOpen(true);
  };

  // Submit SSD Form
  const handleSubmitSSD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssdForm.ssdId.trim() || !ssdForm.serialNumber.trim()) {
      showErrorAlert('SSD ID and Serial Number are required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingSsd) {
        await api.put(`/api/ssds/${editingSsd.id}`, ssdForm);
        showSuccessAlert('SSD storage drive updated successfully!');
      } else {
        await api.post('/api/ssds', ssdForm);
        showSuccessAlert('New SSD added to storage inventory!');
      }
      setIsSsdModalOpen(false);
      fetchSSDs();
      fetchComputers();
    } catch (err: any) {
      showErrorAlert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Delete SSD
  const handleDeleteSSD = async (ssd: SSDItem) => {
    const confirmed = await confirmDelete({
      title: `Delete SSD ${ssd.ssdId}?`,
      text: `Are you sure you want to delete SSD drive (SN: ${ssd.serialNumber})?`,
      confirmButtonText: 'Yes, Delete SSD',
    });

    if (!confirmed) return;

    try {
      await api.delete(`/api/ssds/${ssd.id}`);
      showSuccessAlert(`SSD ${ssd.ssdId} deleted successfully.`);
      fetchSSDs();
      fetchComputers();
    } catch (err: any) {
      showErrorAlert(getErrorMessage(err));
    }
  };

  // Quick stats
  const stats = useMemo(() => {
    const totalComp = computers.length;
    const assignedComp = computers.filter((c) => c.status === 'ASSIGNED').length;
    const availableComp = computers.filter((c) => c.status === 'AVAILABLE').length;
    const repairComp = computers.filter((c) => c.status === 'REPAIR' || c.status === 'MAINTENANCE').length;

    const totalSsd = ssds.length;
    const installedSsd = ssds.filter((s) => s.status === 'INSTALLED' || s.assignedComputerId).length;
    const availableSsd = ssds.filter((s) => s.status === 'AVAILABLE' || s.status === 'SPARE').length;

    return { totalComp, assignedComp, availableComp, repairComp, totalSsd, installedSsd, availableSsd };
  }, [computers, ssds]);

  return (
    <AccessGuard module="computers">
      <div className="space-y-6">
        {/* Top Header & Navigation */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <span>Computers & Hardware Inventory</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-bold border border-blue-500/20">
                Asset Ops
              </span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage enterprise workstations, desktop PCs, laptops, and dedicated SSD storage drives with employee allocation.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleOpenCompModal()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Add Computer</span>
            </button>
            <button
              onClick={() => handleOpenSsdModal()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition active:scale-95"
            >
              <Disc className="h-4 w-4" />
              <span>Add SSD Drive</span>
            </button>
          </div>
        </div>

        {/* Overview Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-card/70 border border-border/80 shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <ComputerIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Total Workstations</p>
              <p className="text-xl font-bold text-foreground">{stats.totalComp}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-card/70 border border-border/80 shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Assigned to Staff</p>
              <p className="text-xl font-bold text-foreground">{stats.assignedComp}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-card/70 border border-border/80 shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Total SSD Drives</p>
              <p className="text-xl font-bold text-foreground">{stats.totalSsd}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-card/70 border border-border/80 shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Disc className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Installed in PCs</p>
              <p className="text-xl font-bold text-foreground">{stats.installedSsd}</p>
            </div>
          </div>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <button
            onClick={() => setActiveTab('computers')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
              activeTab === 'computers'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <ComputerIcon className="h-4 w-4" />
            <span>Computers & PCs ({computers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ssds')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
              activeTab === 'ssds'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <HardDrive className="h-4 w-4" />
            <span>SSD Storage Inventory ({ssds.length})</span>
          </button>
        </div>

        {/* TAB 1: COMPUTERS TABLE */}
        {activeTab === 'computers' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3.5 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by Asset ID, brand, model, serial number, IP address..."
                  value={compSearch}
                  onChange={(e) => setCompSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                />
              </div>

              <select
                value={compType}
                onChange={(e) => setCompType(e.target.value)}
                aria-label="Filter by computer type"
                className="px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="">All PC Types</option>
                <option value="Desktop">Desktop</option>
                <option value="Laptop">Laptop</option>
                <option value="Workstation">Workstation</option>
                <option value="Server">Server</option>
                <option value="All-in-One">All-in-One</option>
              </select>

              <select
                value={compStatus}
                onChange={(e) => setCompStatus(e.target.value)}
                aria-label="Filter by hardware status"
                className="px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option value="">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="REPAIR">In Repair</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>

            {/* Computers Table */}
            <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-md overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3.5">Asset ID</th>
                      <th className="p-3.5">Brand & Model</th>
                      <th className="p-3.5">Hardware Specs</th>
                      <th className="p-3.5">Assigned Employee</th>
                      <th className="p-3.5">Location & IP</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {loadingComputers ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          Loading computer inventory...
                        </td>
                      </tr>
                    ) : computers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No computers found matching query.
                        </td>
                      </tr>
                    ) : (
                      computers.map((comp) => (
                        <tr key={comp.id} className="hover:bg-muted/30 transition">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              {comp.computerType === 'Laptop' ? (
                                <Laptop className="h-4 w-4 text-blue-500 shrink-0" />
                              ) : comp.computerType === 'Server' ? (
                                <Server className="h-4 w-4 text-purple-500 shrink-0" />
                              ) : (
                                <ComputerIcon className="h-4 w-4 text-indigo-500 shrink-0" />
                              )}
                              <div>
                                <span className="font-mono font-bold text-foreground text-xs block">
                                  {comp.assetId}
                                </span>
                                <span className="text-[10px] text-muted-foreground capitalize">
                                  {comp.computerType}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <p className="font-semibold text-foreground">
                              {comp.brand || 'Generic'} {comp.model}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              SN: {comp.serialNumber || 'N/A'}
                            </p>
                          </td>

                          <td className="p-3.5 space-y-1">
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <Cpu className="h-3 w-3 text-blue-500 shrink-0" />
                              <span>{comp.processor || 'CPU'} &bull; {comp.ram || 'RAM'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <HardDrive className="h-3 w-3 text-indigo-400 shrink-0" />
                              <span>{comp.storage || 'Storage'}</span>
                            </div>
                            {/* Connected SSDs */}
                            {comp.ssds && comp.ssds.length > 0 && (
                              <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                                <Disc className="h-3 w-3" />
                                <span>{comp.ssds.length} SSD Installed ({comp.ssds.map((s) => s.capacity).join(', ')})</span>
                              </div>
                            )}
                          </td>

                          <td className="p-3.5">
                            {comp.assignedUser ? (
                              <div>
                                <p className="font-semibold text-foreground flex items-center gap-1.5">
                                  <User className="h-3 w-3 text-primary" />
                                  <span>{comp.assignedUser.name}</span>
                                </p>
                                <p className="text-[10px] text-muted-foreground pl-4">
                                  {comp.assignedUser.designation || comp.assignedUser.department || 'Staff'}
                                </p>
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground/80 italic bg-muted/40 px-2 py-0.5 rounded">
                                Unassigned
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-[11px] text-muted-foreground">
                            <p>{comp.location || comp.department || '-'}</p>
                            {comp.ipAddress && (
                              <p className="font-mono text-[10px] text-blue-400">{comp.ipAddress}</p>
                            )}
                          </td>

                          <td className="p-3.5">
                            <span
                              className={cn(
                                'text-[10px] font-bold px-2 py-0.5 rounded-md inline-block',
                                comp.status === 'AVAILABLE' && 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
                                comp.status === 'ASSIGNED' && 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
                                comp.status === 'REPAIR' && 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
                                comp.status === 'MAINTENANCE' && 'bg-orange-500/10 text-orange-500 border border-orange-500/20',
                                comp.status === 'RETIRED' && 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                              )}
                            >
                              {comp.status}
                            </span>
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenCompModal(comp)}
                                title="Edit Computer Information"
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 transition"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenSsdModal(undefined, comp.id)}
                                title="Install/Attach SSD into this PC"
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 transition"
                              >
                                <Disc className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteComputer(comp)}
                                title="Delete Computer"
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition"
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

        {/* TAB 2: SSD STORAGE INVENTORY */}
        {activeTab === 'ssds' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3.5 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by SSD ID, Serial Number, brand, capacity, location..."
                  value={ssdSearch}
                  onChange={(e) => setSsdSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                />
              </div>

              <select
                value={ssdStatus}
                onChange={(e) => setSsdStatus(e.target.value)}
                aria-label="Filter by SSD status"
                className="px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="">All SSD Statuses</option>
                <option value="AVAILABLE">Available / Spare</option>
                <option value="INSTALLED">Installed in PC</option>
                <option value="FAULTY">Faulty</option>
                <option value="WARRANTY">In Warranty</option>
                <option value="DISPOSED">Disposed</option>
              </select>
            </div>

            {/* SSD Table */}
            <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-md overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3.5">SSD ID</th>
                      <th className="p-3.5">Brand & Model</th>
                      <th className="p-3.5">Capacity & Interface</th>
                      <th className="p-3.5">Health Status</th>
                      <th className="p-3.5">Installed in PC</th>
                      <th className="p-3.5">Location / Shelf</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {loadingSSDs ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                          Loading SSD storage inventory...
                        </td>
                      </tr>
                    ) : ssds.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                          No SSD drives registered. Click "+ Add SSD Drive" to register your first drive.
                        </td>
                      </tr>
                    ) : (
                      ssds.map((ssd) => (
                        <tr key={ssd.id} className="hover:bg-muted/30 transition">
                          <td className="p-3.5 font-mono font-bold text-foreground">
                            <div className="flex items-center gap-2">
                              <Disc className="h-4 w-4 text-indigo-500 shrink-0" />
                              <div>
                                <span className="text-xs block">{ssd.ssdId}</span>
                                <span className="text-[10px] text-muted-foreground font-normal">
                                  SN: {ssd.serialNumber}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <p className="font-semibold text-foreground">{ssd.brand || 'Generic'} {ssd.model}</p>
                            {ssd.warranty && (
                              <p className="text-[10px] text-muted-foreground">Warranty: {ssd.warranty}</p>
                            )}
                          </td>

                          <td className="p-3.5">
                            <span className="font-bold text-foreground text-xs">{ssd.capacity || 'N/A'}</span>
                            <p className="text-[10px] text-muted-foreground">{ssd.interface || 'M.2 NVMe'}</p>
                          </td>

                          <td className="p-3.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{ssd.health || '100%'}</span>
                            </span>
                          </td>

                          <td className="p-3.5">
                            {ssd.assignedComputer ? (
                              <div>
                                <p className="font-semibold text-foreground flex items-center gap-1.5">
                                  <ComputerIcon className="h-3 w-3 text-blue-500" />
                                  <span>{ssd.assignedComputer.assetId}</span>
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {ssd.assignedComputer.brand} {ssd.assignedComputer.model}
                                  {ssd.assignedComputer.assignedUser && ` • ${ssd.assignedComputer.assignedUser.name}`}
                                </p>
                              </div>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                Spare / Storage Box
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-[11px] text-muted-foreground">
                            {ssd.location || '-'}
                          </td>

                          <td className="p-3.5">
                            <span
                              className={cn(
                                'text-[10px] font-bold px-2 py-0.5 rounded-md inline-block',
                                ssd.status === 'INSTALLED' && 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
                                ssd.status === 'AVAILABLE' && 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
                                ssd.status === 'SPARE' && 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20',
                                ssd.status === 'FAULTY' && 'bg-rose-500/10 text-rose-500 border border-rose-500/20',
                                ssd.status === 'WARRANTY' && 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              )}
                            >
                              {ssd.status}
                            </span>
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenSsdModal(ssd)}
                                title="Edit SSD Information"
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 transition"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSSD(ssd)}
                                title="Delete SSD"
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition"
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
        {/* ADD / EDIT COMPUTER MODAL                                */}
        {/* ======================================================== */}
        {isCompModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                    <ComputerIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {editingComp ? 'Edit Computer Information' : 'Add New Computer / Workstation'}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Register hardware specifications, user assignment & network info.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCompModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Form Body */}
              <form onSubmit={handleSubmitComputer} className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* 1. Identity */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5" />
                    <span>Identity & Hardware Class</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">
                        Asset ID <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={compForm.assetId}
                        onChange={(e) => setCompForm({ ...compForm, assetId: e.target.value })}
                        placeholder="e.g. PC-001"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">Computer Type</label>
                      <select
                        value={compForm.computerType}
                        onChange={(e) => setCompForm({ ...compForm, computerType: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="Desktop">Desktop</option>
                        <option value="Laptop">Laptop</option>
                        <option value="Workstation">Workstation</option>
                        <option value="Server">Server</option>
                        <option value="All-in-One">All-in-One</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">Serial Number</label>
                      <input
                        type="text"
                        value={compForm.serialNumber}
                        onChange={(e) => setCompForm({ ...compForm, serialNumber: e.target.value })}
                        placeholder="e.g. SN-894728"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">Brand</label>
                      <input
                        type="text"
                        value={compForm.brand}
                        onChange={(e) => setCompForm({ ...compForm, brand: e.target.value })}
                        placeholder="e.g. Dell, HP, Lenovo"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">Model</label>
                      <input
                        type="text"
                        value={compForm.model}
                        onChange={(e) => setCompForm({ ...compForm, model: e.target.value })}
                        placeholder="e.g. OptiPlex 7090"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">Barcode</label>
                      <input
                        type="text"
                        value={compForm.barcode}
                        onChange={(e) => setCompForm({ ...compForm, barcode: e.target.value })}
                        placeholder="e.g. BC-10492"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Specs */}
                <div className="space-y-3 pt-2 border-t border-border/80">
                  <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-2">
                    <Cpu className="h-3.5 w-3.5" />
                    <span>Hardware Specifications</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">Processor (CPU)</label>
                      <input
                        type="text"
                        value={compForm.processor}
                        onChange={(e) => setCompForm({ ...compForm, processor: e.target.value })}
                        placeholder="e.g. Intel Core i7-12700"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">RAM / Memory</label>
                      <input
                        type="text"
                        value={compForm.ram}
                        onChange={(e) => setCompForm({ ...compForm, ram: e.target.value })}
                        placeholder="e.g. 16GB DDR4"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">Storage / Disk</label>
                      <input
                        type="text"
                        value={compForm.storage}
                        onChange={(e) => setCompForm({ ...compForm, storage: e.target.value })}
                        placeholder="e.g. 512GB NVMe + 1TB HDD"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">Monitor / Display</label>
                      <input
                        type="text"
                        value={compForm.monitor}
                        onChange={(e) => setCompForm({ ...compForm, monitor: e.target.value })}
                        placeholder="e.g. Dell 24-inch IPS Full HD"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">Operating System</label>
                      <input
                        type="text"
                        value={compForm.operatingSystem}
                        onChange={(e) => setCompForm({ ...compForm, operatingSystem: e.target.value })}
                        placeholder="e.g. Windows 11 Pro"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Assignment & Location */}
                <div className="space-y-3 pt-2 border-t border-border/80">
                  <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    <span>Employee Assignment & Location</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">Assigned Employee</label>
                      <select
                        value={compForm.assignedUserId}
                        onChange={(e) => {
                          const uid = e.target.value;
                          const selectedEmp = employees.find((em) => em.id === uid);
                          setCompForm({
                            ...compForm,
                            assignedUserId: uid,
                            department: selectedEmp?.department || compForm.department,
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="">-- Unassigned (Stock / Pool) --</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.designation || emp.department || emp.employeeId})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">Department</label>
                      <input
                        type="text"
                        value={compForm.department}
                        onChange={(e) => setCompForm({ ...compForm, department: e.target.value })}
                        placeholder="e.g. Broadcast IT, News, Editing"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">Physical Location</label>
                      <input
                        type="text"
                        value={compForm.location}
                        onChange={(e) => setCompForm({ ...compForm, location: e.target.value })}
                        placeholder="e.g. Floor 2 Desk 12, MCR"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">IP Address</label>
                      <input
                        type="text"
                        value={compForm.ipAddress}
                        onChange={(e) => setCompForm({ ...compForm, ipAddress: e.target.value })}
                        placeholder="e.g. 192.168.10.45"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-blue-500/40 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">MAC Address</label>
                      <input
                        type="text"
                        value={compForm.macAddress}
                        onChange={(e) => setCompForm({ ...compForm, macAddress: e.target.value })}
                        placeholder="e.g. 00:1A:2B:3C:4D:5E"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-blue-500/40 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Status & Lifecycle */}
                <div className="space-y-3 pt-2 border-t border-border/80">
                  <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Status & Warranty</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">Status</label>
                      <select
                        value={compForm.status}
                        onChange={(e) => setCompForm({ ...compForm, status: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="REPAIR">In Repair</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="RETIRED">Retired</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">Condition</label>
                      <select
                        value={compForm.condition}
                        onChange={(e) => setCompForm({ ...compForm, condition: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-blue-500/40"
                      >
                        <option value="EXCELLENT">Excellent</option>
                        <option value="GOOD">Good</option>
                        <option value="FAIR">Fair</option>
                        <option value="POOR">Poor</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-foreground block mb-1">Warranty Period</label>
                      <input
                        type="text"
                        value={compForm.warranty}
                        onChange={(e) => setCompForm({ ...compForm, warranty: e.target.value })}
                        placeholder="e.g. 3 Years (Valid till 2027)"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">Remarks / Internal Notes</label>
                    <textarea
                      rows={2}
                      value={compForm.remarks}
                      onChange={(e) => setCompForm({ ...compForm, remarks: e.target.value })}
                      placeholder="Add any specific notes or allocation remarks..."
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsCompModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition active:scale-95 disabled:opacity-60"
                  >
                    {submitting ? 'Saving...' : editingComp ? 'Update Computer' : 'Save Computer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ADD / EDIT SSD MODAL                                     */}
        {/* ======================================================== */}
        {isSsdModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                    <Disc className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {editingSsd ? 'Edit SSD Drive Information' : 'Add New SSD Storage Drive'}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Register solid-state drive specs and link to a host PC / workstation.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSsdModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Form Body */}
              <form onSubmit={handleSubmitSSD} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">
                      SSD ID / Asset Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={ssdForm.ssdId}
                      onChange={(e) => setSsdForm({ ...ssdForm, ssdId: e.target.value })}
                      placeholder="e.g. SSD-01"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">
                      Serial Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={ssdForm.serialNumber}
                      onChange={(e) => setSsdForm({ ...ssdForm, serialNumber: e.target.value })}
                      placeholder="e.g. S4A9NX0M123456"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-indigo-500/40 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">Brand</label>
                    <select
                      value={ssdForm.brand}
                      onChange={(e) => setSsdForm({ ...ssdForm, brand: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-indigo-500/40"
                    >
                      <option value="Samsung">Samsung</option>
                      <option value="Kingston">Kingston</option>
                      <option value="Western Digital">Western Digital</option>
                      <option value="Crucial">Crucial</option>
                      <option value="Lexar">Lexar</option>
                      <option value="Transcend">Transcend</option>
                      <option value="Corsair">Corsair</option>
                      <option value="SanDisk">SanDisk</option>
                      <option value="Kioxia">Kioxia</option>
                      <option value="Generic">Other / Generic</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">Model</label>
                    <input
                      type="text"
                      value={ssdForm.model}
                      onChange={(e) => setSsdForm({ ...ssdForm, model: e.target.value })}
                      placeholder="e.g. 980 Pro, NV2, SN580"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">Capacity</label>
                    <select
                      value={ssdForm.capacity}
                      onChange={(e) => setSsdForm({ ...ssdForm, capacity: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-indigo-500/40"
                    >
                      <option value="128GB">128 GB</option>
                      <option value="256GB">256 GB</option>
                      <option value="500GB">500 GB</option>
                      <option value="512GB">512 GB</option>
                      <option value="1TB">1 TB</option>
                      <option value="2TB">2 TB</option>
                      <option value="4TB">4 TB</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">Interface Type</label>
                    <select
                      value={ssdForm.interface}
                      onChange={(e) => setSsdForm({ ...ssdForm, interface: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-indigo-500/40"
                    >
                      <option value="M.2 NVMe PCIe 4.0">M.2 NVMe PCIe 4.0</option>
                      <option value="M.2 NVMe PCIe 3.0">M.2 NVMe PCIe 3.0</option>
                      <option value="SATA III 2.5-inch">SATA III 2.5-inch</option>
                      <option value="External USB-C SSD">External USB-C SSD</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">Drive Health</label>
                    <select
                      value={ssdForm.health}
                      onChange={(e) => setSsdForm({ ...ssdForm, health: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-indigo-500/40"
                    >
                      <option value="100% Healthy">100% Healthy</option>
                      <option value="95% Normal">95% Normal</option>
                      <option value="80% Warning">80% Warning</option>
                      <option value="Faulty">Faulty / Degraded</option>
                    </select>
                  </div>
                </div>

                {/* PC Linking */}
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
                  <label className="text-[11px] font-bold text-indigo-500 flex items-center gap-1.5 uppercase tracking-wider">
                    <ComputerIcon className="h-3.5 w-3.5" />
                    <span>Install In Computer / Link to PC</span>
                  </label>
                  <select
                    value={ssdForm.assignedComputerId}
                    onChange={(e) => {
                      const compId = e.target.value;
                      setSsdForm({
                        ...ssdForm,
                        assignedComputerId: compId,
                        status: compId ? 'INSTALLED' : 'AVAILABLE',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:ring-2 focus:ring-indigo-500/40"
                  >
                    <option value="">-- Spare / Not Installed in any PC --</option>
                    {computers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.assetId} - {c.brand} {c.model} {c.assignedUser ? `(Assigned: ${c.assignedUser.name})` : '(Unassigned)'}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground">
                    Selecting a computer will automatically bind this SSD to the PC and mark it as "INSTALLED".
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">Status</label>
                    <select
                      value={ssdForm.status}
                      onChange={(e) => setSsdForm({ ...ssdForm, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-indigo-500/40"
                    >
                      <option value="AVAILABLE">Available / Spare</option>
                      <option value="INSTALLED">Installed in PC</option>
                      <option value="FAULTY">Faulty</option>
                      <option value="WARRANTY">In Warranty</option>
                      <option value="DISPOSED">Disposed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">Shelf / Box Location</label>
                    <input
                      type="text"
                      value={ssdForm.location}
                      onChange={(e) => setSsdForm({ ...ssdForm, location: e.target.value })}
                      placeholder="e.g. IT Store Shelf B"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-foreground block mb-1">Warranty Period</label>
                    <input
                      type="text"
                      value={ssdForm.warranty}
                      onChange={(e) => setSsdForm({ ...ssdForm, warranty: e.target.value })}
                      placeholder="e.g. 5 Years"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground block mb-1">Remarks</label>
                  <textarea
                    rows={2}
                    value={ssdForm.remarks}
                    onChange={(e) => setSsdForm({ ...ssdForm, remarks: e.target.value })}
                    placeholder="Notes on usage, purchase invoice, or partition info..."
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsSsdModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition active:scale-95 disabled:opacity-60"
                  >
                    {submitting ? 'Saving...' : editingSsd ? 'Update SSD' : 'Save SSD'}
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
