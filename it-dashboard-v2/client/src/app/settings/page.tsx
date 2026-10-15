'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Lock,
  Unlock,
  KeyRound,
  RotateCcw,
  Sparkles,
  LayoutDashboard,
  CalendarDays,
  Computer,
  PhoneCall,
  Server,
  FileSpreadsheet,
  BarChart3,
  History,
  Check,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Plus,
  Pencil,
  Trash2,
  CheckSquare,
  Square,
  SlidersHorizontal,
  X,
  Copy,
  UserCheck,
} from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { confirmAction, showWarningAlert } from '@/lib/sweetalert';
import {
  useAuth,
  AppModule,
  RoleName,
  PermissionAction,
  ModulePermission,
  RoleMatrix,
  createDefaultRoleMatrix,
  ALL_APP_MODULES,
} from '@/context/AuthContext';
import { AccessGuard } from '@/components/AccessGuard';
import { cn } from '@/lib/utils';

interface EmployeeUser {
  id: string;
  employeeId: string;
  name: string;
  username: string;
  email: string;
  role: RoleName;
  department?: string;
  designation?: string;
  profilePhoto?: string;
  employmentStatus?: string;
  customPermissions?: string;
}

const MODULE_META: Record<AppModule, { label: string; icon: any; description: string }> = {
  dashboard: { label: 'Dashboard Overview', icon: LayoutDashboard, description: 'Overview statistics, status widgets & KPI metrics' },
  employees: { label: 'Employee Management', icon: Users, description: 'IT staff directory, contact info & profiles' },
  roster: { label: 'Duty Roster', icon: CalendarDays, description: '3-Shift Daily Roster, Festival Roster & duty swap' },
  computers: { label: 'Computers & Assets', icon: Computer, description: 'Workstations, hardware specs & user allocations' },
  extensions: { label: 'PABX & Extensions', icon: PhoneCall, description: 'Internal telephony directory & floor assignments' },
  servers: { label: 'Server Health Monitoring', icon: Server, description: 'Infrastructure nodes & live latency telemetry' },
  slips: { label: 'New Employee Slip', icon: FileSpreadsheet, description: 'New staff credential slips, portal access & printable forms' },
  reports: { label: 'Analytics & Reports', icon: BarChart3, description: 'Asset distribution charts & departmental audits' },
  activity: { label: 'Activity & Audit Log', icon: History, description: 'System security trails & operational history' },
  settings: { label: 'System Settings & RBAC', icon: Settings, description: 'Global parameters & access permissions matrix' },
};

const ROLES_META: Record<RoleName, { title: string; badge: string; color: string; desc: string }> = {
  SUPER_ADMIN: {
    title: 'Super Admin',
    badge: 'Full Authority',
    color: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    desc: 'Complete unrestricted control over all modules, staff access, security rules & passwords.',
  },
  IT_ADMIN: {
    title: 'IT Admin',
    badge: 'Management Level',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    desc: 'High administrative authority across IT inventory, employees, servers & operational roster.',
  },
  IT_SUPPORT: {
    title: 'IT Support',
    badge: 'Operations Level',
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    desc: 'Day-to-day IT engineering, hardware ticketing, duty shifts & asset maintenance.',
  },
  VIEWER: {
    title: 'Viewer',
    badge: 'Read-Only Level',
    color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    desc: 'Strictly read-only monitoring and reporting observability without write/edit permissions.',
  },
};

export default function SettingsPage() {
  const { user, isSuperAdmin, updateRolePermissions } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'PERMISSIONS' | 'USERS' | 'SYSTEM'>('PERMISSIONS');

  // Selected Role for Granular Matrix
  const [selectedRole, setSelectedRole] = useState<RoleName>('IT_ADMIN');

  // Matrix State (Role -> Module -> { view, create, edit, delete })
  const [matrix, setMatrix] = useState<RoleMatrix>(createDefaultRoleMatrix());
  const [savingMatrix, setSavingMatrix] = useState(false);

  // Users State
  const [usersList, setUsersList] = useState<EmployeeUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Individual User Custom Permissions State
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<EmployeeUser | null>(null);
  const [userCustomMatrix, setUserCustomMatrix] = useState<Record<AppModule, ModulePermission>>(() => {
    const init: any = {};
    ALL_APP_MODULES.forEach((mod) => {
      init[mod] = { view: false, create: false, edit: false, delete: false };
    });
    return init;
  });
  const [isInheritingRole, setIsInheritingRole] = useState(true);
  const [savingUserPerms, setSavingUserPerms] = useState(false);

  // System Configuration State
  const [companyName, setCompanyName] = useState('IT Management & Asset Control System');
  const [subtitle, setSubtitle] = useState('Internal IT Operations Dashboard');
  const [monitoringInterval, setMonitoringInterval] = useState('1m');
  const [allowLANAccess, setAllowLANAccess] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch initial settings & permissions
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/api/settings');
        if (res.data?.data) {
          const s = res.data.data;
          setCompanyName(s.companyName || 'IT Management & Asset Control System');
          setSubtitle(s.subtitle || 'Internal IT Operations Dashboard');
          setMonitoringInterval(s.monitoringInterval || '1m');
          setAllowLANAccess(Boolean(s.allowLANAccess));
          if (s.rolePermissions) {
            setMatrix(s.rolePermissions);
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    fetchSettings();
  }, []);

  // Fetch users list for role assignment
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await api.get('/api/users');
      setUsersList(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'USERS') {
      fetchUsers();
    }
  }, [activeTab]);

  // Toggle individual permission checkbox for (role, module, action)
  const handleTogglePermission = (
    role: RoleName,
    mod: AppModule,
    action: PermissionAction
  ) => {
    if (role === 'SUPER_ADMIN') return; // Super admin locked as full permissions

    setMatrix((prev) => {
      const roleObj = prev[role] || createDefaultRoleMatrix()[role];
      const modObj = roleObj[mod] || { view: false, create: false, edit: false, delete: false };
      const currentVal = modObj[action];

      const newModObj = { ...modObj, [action]: !currentVal };

      // If user checks create, edit, or delete, automatically ensure view is checked
      if (!currentVal && action !== 'view') {
        newModObj.view = true;
      }
      // If user unchecks view, automatically uncheck create, edit, and delete
      if (currentVal && action === 'view') {
        newModObj.create = false;
        newModObj.edit = false;
        newModObj.delete = false;
      }

      return {
        ...prev,
        [role]: {
          ...roleObj,
          [mod]: newModObj,
        },
      };
    });
  };

  // Quick preset for a specific module row
  const handleSetRowPreset = (role: RoleName, mod: AppModule, preset: 'ALL' | 'VIEW_ONLY' | 'NONE') => {
    if (role === 'SUPER_ADMIN') return;

    setMatrix((prev) => {
      const roleObj = prev[role] || createDefaultRoleMatrix()[role];
      let newModObj: ModulePermission;

      if (preset === 'ALL') {
        newModObj = { view: true, create: true, edit: true, delete: true };
      } else if (preset === 'VIEW_ONLY') {
        newModObj = { view: true, create: false, edit: false, delete: false };
      } else {
        newModObj = { view: false, create: false, edit: false, delete: false };
      }

      return {
        ...prev,
        [role]: {
          ...roleObj,
          [mod]: newModObj,
        },
      };
    });
  };

  // Toggle an entire action column for the selected role
  const handleToggleColumn = (role: RoleName, action: PermissionAction) => {
    if (role === 'SUPER_ADMIN') return;

    setMatrix((prev) => {
      const roleObj = prev[role] || createDefaultRoleMatrix()[role];
      // Check if all are currently true
      const allActive = ALL_APP_MODULES.every((mod) => roleObj[mod]?.[action]);
      const newVal = !allActive;

      const updatedRoleObj: any = { ...roleObj };
      ALL_APP_MODULES.forEach((mod) => {
        const currentMod = updatedRoleObj[mod] || { view: false, create: false, edit: false, delete: false };
        const updatedMod = { ...currentMod, [action]: newVal };
        if (newVal && action !== 'view') {
          updatedMod.view = true;
        }
        if (!newVal && action === 'view') {
          updatedMod.create = false;
          updatedMod.edit = false;
          updatedMod.delete = false;
        }
        updatedRoleObj[mod] = updatedMod;
      });

      return {
        ...prev,
        [role]: updatedRoleObj,
      };
    });
  };

  // Save Role Permissions Matrix
  const handleSavePermissions = async () => {
    setSavingMatrix(true);
    try {
      const ok = await updateRolePermissions(matrix);
      if (ok) {
        showToast('Granular View/Create/Edit/Delete permissions saved and active system-wide!');
      } else {
        showToast('Failed to save permissions. Please check network connection.', 'error');
      }
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSavingMatrix(false);
    }
  };

  // Reset to Factory Default Permissions
  const handleResetDefaults = async () => {
    const confirmed = await confirmAction({
      title: 'Restore Factory Defaults?',
      text: 'Are you sure you want to restore recommended factory default role permissions?',
      icon: 'warning',
      confirmButtonText: 'Yes, Restore Defaults',
      isDanger: true,
    });
    if (!confirmed) return;
    setMatrix(createDefaultRoleMatrix());
    showToast('Reset to default template. Click "Save Permissions" to commit changes.');
  };

  // Change individual user role
  const handleUpdateUserRole = async (targetUser: EmployeeUser, newRole: RoleName) => {
    if (targetUser.username === 'omith.hasan' && newRole !== 'SUPER_ADMIN') {
      showWarningAlert(
        'Security Protection',
        'Primary Super Admin (omith.hasan) cannot be demoted.'
      );
      return;
    }

    const confirmed = await confirmAction({
      title: 'Update User Role?',
      text: `Are you sure you want to update ${targetUser.name}'s role to ${newRole}?`,
      icon: 'question',
      confirmButtonText: 'Yes, Update Role',
    });
    if (!confirmed) {
      return;
    }

    setUpdatingUserId(targetUser.id);
    try {
      const res = await api.put(`/api/users/${targetUser.id}`, {
        role: newRole,
      });

      if (res.data?.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
        );
        showToast(`Role updated for ${targetUser.name} to ${newRole}!`);
      } else {
        showToast(res.data?.message || 'Failed to update user role.', 'error');
      }
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Open Individual User Permissions Modal
  const handleOpenUserPerms = (emp: EmployeeUser) => {
    setSelectedUserForPerms(emp);

    if (emp.customPermissions && emp.customPermissions.trim() && emp.customPermissions !== '{}') {
      try {
        const parsed = JSON.parse(emp.customPermissions);
        const fullMatrix: any = {};
        ALL_APP_MODULES.forEach((mod) => {
          fullMatrix[mod] = {
            view: Boolean(parsed[mod]?.view),
            create: Boolean(parsed[mod]?.create),
            edit: Boolean(parsed[mod]?.edit),
            delete: Boolean(parsed[mod]?.delete),
          };
        });
        setUserCustomMatrix(fullMatrix);
        setIsInheritingRole(false);
        return;
      } catch (e) {
        // Fall back to role
      }
    }

    // Default: copy current role permissions
    const roleDefault = matrix[emp.role] || createDefaultRoleMatrix()[emp.role];
    const fullMatrix: any = {};
    ALL_APP_MODULES.forEach((mod) => {
      fullMatrix[mod] = {
        view: Boolean(roleDefault[mod]?.view),
        create: Boolean(roleDefault[mod]?.create),
        edit: Boolean(roleDefault[mod]?.edit),
        delete: Boolean(roleDefault[mod]?.delete),
      };
    });
    setUserCustomMatrix(fullMatrix);
    setIsInheritingRole(true);
  };

  // Toggle user permission checkbox
  const handleToggleUserPermission = (mod: AppModule, action: PermissionAction) => {
    setIsInheritingRole(false);
    setUserCustomMatrix((prev) => {
      const current = prev[mod] || { view: false, create: false, edit: false, delete: false };
      const currentVal = current[action];
      const updated = { ...current, [action]: !currentVal };

      if (!currentVal && action !== 'view') {
        updated.view = true;
      }
      if (currentVal && action === 'view') {
        updated.create = false;
        updated.edit = false;
        updated.delete = false;
      }

      return {
        ...prev,
        [mod]: updated,
      };
    });
  };

  // Set preset for a module row
  const handleSetUserRowPreset = (mod: AppModule, preset: 'ALL' | 'VIEW_ONLY' | 'NONE') => {
    setIsInheritingRole(false);
    setUserCustomMatrix((prev) => {
      let updated: ModulePermission;
      if (preset === 'ALL') {
        updated = { view: true, create: true, edit: true, delete: true };
      } else if (preset === 'VIEW_ONLY') {
        updated = { view: true, create: false, edit: false, delete: false };
      } else {
        updated = { view: false, create: false, edit: false, delete: false };
      }
      return {
        ...prev,
        [mod]: updated,
      };
    });
  };

  // Toggle entire column for this user
  const handleToggleUserColumn = (action: PermissionAction) => {
    setIsInheritingRole(false);
    setUserCustomMatrix((prev) => {
      const allActive = ALL_APP_MODULES.every((mod) => prev[mod]?.[action]);
      const newVal = !allActive;
      const updated: any = { ...prev };

      ALL_APP_MODULES.forEach((mod) => {
        const currentMod = updated[mod] || { view: false, create: false, edit: false, delete: false };
        const updatedMod = { ...currentMod, [action]: newVal };
        if (newVal && action !== 'view') {
          updatedMod.view = true;
        }
        if (!newVal && action === 'view') {
          updatedMod.create = false;
          updatedMod.edit = false;
          updatedMod.delete = false;
        }
        updated[mod] = updatedMod;
      });

      return updated;
    });
  };

  // Copy role defaults into custom editor
  const handleCopyRoleDefaultsToUser = () => {
    if (!selectedUserForPerms) return;
    const roleDefault = matrix[selectedUserForPerms.role] || createDefaultRoleMatrix()[selectedUserForPerms.role];
    const fullMatrix: any = {};
    ALL_APP_MODULES.forEach((mod) => {
      fullMatrix[mod] = {
        view: Boolean(roleDefault[mod]?.view),
        create: Boolean(roleDefault[mod]?.create),
        edit: Boolean(roleDefault[mod]?.edit),
        delete: Boolean(roleDefault[mod]?.delete),
      };
    });
    setUserCustomMatrix(fullMatrix);
    setIsInheritingRole(false);
    showToast(`Copied ${ROLES_META[selectedUserForPerms.role].title} role defaults into editor.`);
  };

  // Reset user to inherit role defaults
  const handleResetUserToRoleDefault = async () => {
    if (!selectedUserForPerms) return;
    setSavingUserPerms(true);
    try {
      const res = await api.put(`/api/users/${selectedUserForPerms.id}`, {
        customPermissions: '',
      });
      if (res.data?.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === selectedUserForPerms.id ? { ...u, customPermissions: '' } : u))
        );
        showToast(`${selectedUserForPerms.name} is now inheriting ${ROLES_META[selectedUserForPerms.role].title} role defaults!`);
        setSelectedUserForPerms(null);
      } else {
        showToast(res.data?.message || 'Failed to reset permissions.', 'error');
      }
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSavingUserPerms(false);
    }
  };

  // Save custom user permissions
  const handleSaveUserPermissions = async () => {
    if (!selectedUserForPerms) return;
    setSavingUserPerms(true);
    try {
      const payloadString = JSON.stringify(userCustomMatrix);
      const res = await api.put(`/api/users/${selectedUserForPerms.id}`, {
        customPermissions: payloadString,
      });
      if (res.data?.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === selectedUserForPerms.id ? { ...u, customPermissions: payloadString } : u))
        );
        showToast(`Individual permissions saved for ${selectedUserForPerms.name}!`);
        setSelectedUserForPerms(null);
      } else {
        showToast(res.data?.message || 'Failed to save individual permissions.', 'error');
      }
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSavingUserPerms(false);
    }
  };

  // Save System Configuration
  const handleSaveSystemConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await api.put('/api/settings', {
        companyName,
        subtitle,
        monitoringInterval,
        allowLANAccess,
      });
      if (res.data?.success) {
        showToast('System configuration saved successfully!');
      } else {
        showToast('Failed to save settings.', 'error');
      }
    } catch (err: any) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (userSearch) {
        const q = userSearch.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.employeeId.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [usersList, roleFilter, userSearch]);

  const currentRoleMatrix = matrix[selectedRole] || createDefaultRoleMatrix()[selectedRole];
  const isSuper = selectedRole === 'SUPER_ADMIN';

  return (
    <AccessGuard
      module="settings"
      fallbackTitle="Super Admin Authority Required"
      fallbackMessage="Only the primary Super Admin (IT Lead) has authority to manage System Settings and Role-Based Access Governance."
    >
      <div className="space-y-6 max-w-7xl">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-border bg-gradient-to-r from-card via-card to-primary/5 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-xs">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <span>Role & Permission Access Management</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase">
                    Super Admin Controlled
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  Configure granular View, Create, Edit/Modify, and Delete permission checkboxes across every system module.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Active Super Admin Badge */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-muted/40 border border-border/80 shrink-0">
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover object-top" />
              ) : (
                user?.name?.charAt(0) || 'A'
              )}
            </div>
            <div className="text-left text-xs">
              <p className="font-bold text-foreground leading-tight">{user?.name || 'Omith Hasan'}</p>
              <p className="text-[10px] text-muted-foreground">Super Administrator</p>
            </div>
          </div>
        </div>

        {/* Global Toast Notification */}
        {toast && (
          <div
            className={cn(
              'p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 shadow-lg animate-in fade-in slide-in-from-top-2',
              toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
            )}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span className="font-semibold">{toast.message}</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <button
            onClick={() => setActiveTab('PERMISSIONS')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
              activeTab === 'PERMISSIONS'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Role Permissions Checkboxes</span>
          </button>

          <button
            onClick={() => setActiveTab('USERS')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
              activeTab === 'USERS'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Staff Role Assignment</span>
          </button>

          <button
            onClick={() => setActiveTab('SYSTEM')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
              activeTab === 'SYSTEM'
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>System Configuration</span>
          </button>
        </div>

        {/* TAB 1: ROLE PERMISSIONS CHECKBOX MATRIX */}
        {activeTab === 'PERMISSIONS' && (
          <div className="space-y-5">
            {/* Role Selector Tabs & Action Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-3xl border border-border bg-card shadow-xs">
              {/* Role Select Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase mr-1">Select Role:</span>
                {(['SUPER_ADMIN', 'IT_ADMIN', 'IT_SUPPORT', 'VIEWER'] as RoleName[]).map((r) => {
                  const meta = ROLES_META[r];
                  const isCurrent = selectedRole === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={cn(
                        'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border',
                        isCurrent
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/70 border-border/80'
                      )}
                    >
                      <span>{meta.title}</span>
                      <span
                        className={cn(
                          'text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase',
                          isCurrent ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {meta.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-3.5 py-2 rounded-xl border border-border bg-muted/40 hover:bg-muted text-muted-foreground text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  disabled={savingMatrix}
                  onClick={handleSavePermissions}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 transition shadow-md shadow-primary/25 disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{savingMatrix ? 'Saving...' : 'Save Permissions'}</span>
                </button>
              </div>
            </div>

            {/* Role Header Banner */}
            <div className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">
                    Configuring Permissions for: {ROLES_META[selectedRole].title}
                  </span>
                  <span
                    className={cn(
                      'text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase',
                      ROLES_META[selectedRole].color
                    )}
                  >
                    {ROLES_META[selectedRole].badge}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {ROLES_META[selectedRole].desc}
                </p>
              </div>

              {isSuper && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold shrink-0">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Super Admin has permanent full authority</span>
                </div>
              )}
            </div>

            {/* Checkbox Matrix Table */}
            <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                      <th className="p-4 min-w-[260px]">Application Module</th>

                      {/* View Access Column */}
                      <th className="p-4 text-center min-w-[130px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="flex items-center gap-1 text-sky-500 font-bold">
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Access</span>
                          </span>
                          {!isSuper && (
                            <button
                              type="button"
                              onClick={() => handleToggleColumn(selectedRole, 'view')}
                              className="text-[9px] text-muted-foreground hover:text-foreground font-semibold underline"
                            >
                              Toggle All
                            </button>
                          )}
                        </div>
                      </th>

                      {/* Create Access Column */}
                      <th className="p-4 text-center min-w-[130px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="flex items-center gap-1 text-emerald-500 font-bold">
                            <Plus className="h-3.5 w-3.5" />
                            <span>Create / Add</span>
                          </span>
                          {!isSuper && (
                            <button
                              type="button"
                              onClick={() => handleToggleColumn(selectedRole, 'create')}
                              className="text-[9px] text-muted-foreground hover:text-foreground font-semibold underline"
                            >
                              Toggle All
                            </button>
                          )}
                        </div>
                      </th>

                      {/* Edit / Modify Column */}
                      <th className="p-4 text-center min-w-[140px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="flex items-center gap-1 text-amber-500 font-bold">
                            <Pencil className="h-3.5 w-3.5" />
                            <span>Edit / Modify</span>
                          </span>
                          {!isSuper && (
                            <button
                              type="button"
                              onClick={() => handleToggleColumn(selectedRole, 'edit')}
                              className="text-[9px] text-muted-foreground hover:text-foreground font-semibold underline"
                            >
                              Toggle All
                            </button>
                          )}
                        </div>
                      </th>

                      {/* Delete Column */}
                      <th className="p-4 text-center min-w-[130px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="flex items-center gap-1 text-rose-500 font-bold">
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete Access</span>
                          </span>
                          {!isSuper && (
                            <button
                              type="button"
                              onClick={() => handleToggleColumn(selectedRole, 'delete')}
                              className="text-[9px] text-muted-foreground hover:text-foreground font-semibold underline"
                            >
                              Toggle All
                            </button>
                          )}
                        </div>
                      </th>

                      {/* Quick Presets */}
                      <th className="p-4 text-right min-w-[180px]">Quick Row Presets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {ALL_APP_MODULES.map((mod) => {
                      const meta = MODULE_META[mod];
                      const Icon = meta.icon;
                      const perm = currentRoleMatrix[mod] || {
                        view: false,
                        create: false,
                        edit: false,
                        delete: false,
                      };

                      return (
                        <tr key={mod} className="hover:bg-muted/20 transition">
                          {/* Module Info */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-xs">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-bold text-foreground text-xs leading-tight">
                                  {meta.label}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {meta.description}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* 1. VIEW CHECKBOX */}
                          <td className="p-4 text-center">
                            <label className="inline-flex items-center justify-center p-2 rounded-xl hover:bg-muted/40 cursor-pointer transition">
                              <input
                                type="checkbox"
                                disabled={isSuper}
                                checked={isSuper || perm.view}
                                onChange={() => handleTogglePermission(selectedRole, mod, 'view')}
                                className={cn(
                                  'h-4 w-4 rounded border-border text-primary focus:ring-primary transition cursor-pointer',
                                  isSuper && 'opacity-60 cursor-not-allowed'
                                )}
                              />
                            </label>
                          </td>

                          {/* 2. CREATE CHECKBOX */}
                          <td className="p-4 text-center">
                            <label className="inline-flex items-center justify-center p-2 rounded-xl hover:bg-muted/40 cursor-pointer transition">
                              <input
                                type="checkbox"
                                disabled={isSuper}
                                checked={isSuper || perm.create}
                                onChange={() => handleTogglePermission(selectedRole, mod, 'create')}
                                className={cn(
                                  'h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500 transition cursor-pointer',
                                  isSuper && 'opacity-60 cursor-not-allowed'
                                )}
                              />
                            </label>
                          </td>

                          {/* 3. EDIT / MODIFY CHECKBOX */}
                          <td className="p-4 text-center">
                            <label className="inline-flex items-center justify-center p-2 rounded-xl hover:bg-muted/40 cursor-pointer transition">
                              <input
                                type="checkbox"
                                disabled={isSuper}
                                checked={isSuper || perm.edit}
                                onChange={() => handleTogglePermission(selectedRole, mod, 'edit')}
                                className={cn(
                                  'h-4 w-4 rounded border-border text-amber-600 focus:ring-amber-500 transition cursor-pointer',
                                  isSuper && 'opacity-60 cursor-not-allowed'
                                )}
                              />
                            </label>
                          </td>

                          {/* 4. DELETE CHECKBOX */}
                          <td className="p-4 text-center">
                            <label className="inline-flex items-center justify-center p-2 rounded-xl hover:bg-muted/40 cursor-pointer transition">
                              <input
                                type="checkbox"
                                disabled={isSuper}
                                checked={isSuper || perm.delete}
                                onChange={() => handleTogglePermission(selectedRole, mod, 'delete')}
                                className={cn(
                                  'h-4 w-4 rounded border-border text-rose-600 focus:ring-rose-500 transition cursor-pointer',
                                  isSuper && 'opacity-60 cursor-not-allowed'
                                )}
                              />
                            </label>
                          </td>

                          {/* Quick Presets for this Row */}
                          <td className="p-4 text-right">
                            {isSuper ? (
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                Full Control
                              </span>
                            ) : (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSetRowPreset(selectedRole, mod, 'ALL')}
                                  className="px-2 py-1 rounded-lg border border-border bg-card hover:bg-primary/10 hover:text-primary text-[10px] font-semibold transition"
                                  title="Check all 4 permissions (View, Create, Edit, Delete)"
                                >
                                  Full CRUD
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetRowPreset(selectedRole, mod, 'VIEW_ONLY')}
                                  className="px-2 py-1 rounded-lg border border-border bg-card hover:bg-sky-500/10 hover:text-sky-500 text-[10px] font-semibold transition"
                                  title="Check View only (disables create, edit, delete)"
                                >
                                  View Only
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetRowPreset(selectedRole, mod, 'NONE')}
                                  className="px-2 py-1 rounded-lg border border-border bg-card hover:bg-rose-500/10 hover:text-rose-500 text-[10px] font-semibold transition"
                                  title="Uncheck all permissions"
                                >
                                  None
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Save Bar */}
            <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Changes to checkboxes are applied immediately to staff members with the{' '}
                <strong className="text-foreground">{ROLES_META[selectedRole].title}</strong> role once saved.
              </p>
              <button
                type="button"
                disabled={savingMatrix}
                onClick={handleSavePermissions}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center gap-2 transition shadow-lg shadow-primary/25 disabled:opacity-50 shrink-0"
              >
                <Save className="h-4 w-4" />
                <span>{savingMatrix ? 'Saving Changes...' : 'Save Permissions Matrix'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: STAFF ROLE ASSIGNMENT */}
        {activeTab === 'USERS' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-card/60">
              <div className="relative w-full sm:w-72">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search staff name, ID or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-muted/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="ALL">All Roles ({usersList.length})</option>
                  <option value="SUPER_ADMIN">Super Admins</option>
                  <option value="IT_ADMIN">IT Admins</option>
                  <option value="IT_SUPPORT">IT Support Engineers</option>
                  <option value="VIEWER">Viewers</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                    <th className="p-4">Staff Member</th>
                    <th className="p-4">Employee ID & Email</th>
                    <th className="p-4">Department & Designation</th>
                    <th className="p-4">Assigned Role</th>
                    <th className="p-4">Permission Mode</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Loading staff list...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No employees found matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((emp) => {
                      const isPrimaryAdmin = emp.username === 'omith.hasan';
                      const meta = ROLES_META[emp.role] || ROLES_META.IT_SUPPORT;
                      const hasCustom = Boolean(
                        emp.customPermissions &&
                        emp.customPermissions.trim() &&
                        emp.customPermissions !== '{}'
                      );

                      return (
                        <tr key={emp.id} className="hover:bg-muted/20 transition">
                          {/* Member */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 min-w-9 min-h-9 aspect-square rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center shrink-0">
                                {emp.profilePhoto ? (
                                  <img
                                    src={emp.profilePhoto}
                                    alt={emp.name}
                                    className="w-full h-full object-cover object-top"
                                  />
                                ) : (
                                  <span className="font-bold text-xs uppercase text-primary">
                                    {emp.name.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-foreground leading-tight">{emp.name}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">@{emp.username}</p>
                              </div>
                            </div>
                          </td>

                          {/* ID & Email */}
                          <td className="p-4">
                            <p className="font-mono font-semibold text-foreground">{emp.employeeId}</p>
                            <p className="text-[11px] text-muted-foreground">{emp.email}</p>
                          </td>

                          {/* Department & Designation */}
                          <td className="p-4">
                            <p className="font-semibold text-foreground">{emp.designation || 'IT Engineer'}</p>
                            <p className="text-[10px] text-muted-foreground">{emp.department || 'Information Technology'}</p>
                          </td>

                          {/* Current Role Badge */}
                          <td className="p-4">
                            <span
                              className={cn(
                                'inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase',
                                meta.color
                              )}
                            >
                              {meta.title}
                            </span>
                          </td>

                          {/* Permission Mode Status */}
                          <td className="p-4">
                            {hasCustom ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25 text-[10px] font-bold shadow-xs">
                                <Sparkles className="h-3 w-3 shrink-0" />
                                <span>Custom Overrides</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border text-[10px] font-medium">
                                <Shield className="h-3 w-3 shrink-0" />
                                <span>Role Defaults</span>
                              </div>
                            )}
                          </td>

                          {/* Actions (Role Selector & Individual Permissions Button) */}
                          <td className="p-4 text-right">
                            {isPrimaryAdmin ? (
                              <span className="text-[11px] text-amber-500 font-bold flex items-center justify-end gap-1">
                                <Lock className="h-3 w-3" /> Super Admin Protected
                              </span>
                            ) : (
                              <div className="inline-flex items-center justify-end gap-2">
                                <select
                                  disabled={updatingUserId === emp.id}
                                  value={emp.role}
                                  onChange={(e) =>
                                    handleUpdateUserRole(emp, e.target.value as RoleName)
                                  }
                                  className="px-2.5 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer hover:border-primary/50 transition"
                                >
                                  <option value="SUPER_ADMIN">Super Admin</option>
                                  <option value="IT_ADMIN">IT Admin</option>
                                  <option value="IT_SUPPORT">IT Support</option>
                                  <option value="VIEWER">Viewer</option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() => handleOpenUserPerms(emp)}
                                  className={cn(
                                    'px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border shadow-xs',
                                    hasCustom
                                      ? 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 border-purple-500/30'
                                      : 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/25'
                                  )}
                                  title={`Configure granular checkboxes for ${emp.name}`}
                                >
                                  <KeyRound className="h-3.5 w-3.5" />
                                  <span>{hasCustom ? 'Edit Perms' : 'Customize'}</span>
                                </button>

                                {updatingUserId === emp.id && (
                                  <span className="text-[10px] text-muted-foreground animate-pulse">Saving...</span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SYSTEM CONFIGURATION */}
        {activeTab === 'SYSTEM' && (
          <form
            onSubmit={handleSaveSystemConfig}
            className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-5 max-w-2xl"
          >
            <div className="border-b border-border pb-3">
              <h2 className="text-sm font-bold text-foreground">Global Application & Network Setup</h2>
              <p className="text-xs text-muted-foreground">
                Set company branding, telemetry ping frequency, and LAN accessibility.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Application Title / Branding</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Subtitle / Department Tagline</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Background Node Probe Interval</label>
              <select
                value={monitoringInterval}
                onChange={(e) => setMonitoringInterval(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="30s">30 seconds (High frequency)</option>
                <option value="1m">1 minute (Recommended)</option>
                <option value="5m">5 minutes (Low network overhead)</option>
                <option value="10m">10 minutes</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-border">
              <div>
                <p className="text-xs font-semibold text-foreground">Local LAN Inbound Access</p>
                <p className="text-[11px] text-muted-foreground">Allow office devices to access the portal across subnet</p>
              </div>
              <input
                type="checkbox"
                checked={allowLANAccess}
                onChange={(e) => setAllowLANAccess(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={savingConfig}
              className="py-2.5 px-5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center gap-2 transition shadow-md shadow-primary/20 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{savingConfig ? 'Saving...' : 'Save Configurations'}</span>
            </button>
          </form>
        )}

        {/* MODAL: INDIVIDUAL USER CUSTOM PERMISSIONS */}
        {selectedUserForPerms && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl overflow-hidden border border-border bg-muted flex items-center justify-center shrink-0">
                    {selectedUserForPerms.profilePhoto ? (
                      <img
                        src={selectedUserForPerms.profilePhoto}
                        alt={selectedUserForPerms.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <span className="font-bold text-sm uppercase text-primary">
                        {selectedUserForPerms.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-foreground leading-tight">
                        {selectedUserForPerms.name}
                      </h3>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase',
                          ROLES_META[selectedUserForPerms.role]?.color
                        )}
                      >
                        {ROLES_META[selectedUserForPerms.role]?.title}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 font-mono">
                      <span>ID: {selectedUserForPerms.employeeId}</span>
                      <span>•</span>
                      <span>@{selectedUserForPerms.username}</span>
                      <span>•</span>
                      <span>{selectedUserForPerms.email}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedUserForPerms(null)}
                  className="h-8 w-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                {/* Status Notice */}
                <div
                  className={cn(
                    'p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs',
                    isInheritingRole
                      ? 'bg-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400'
                      : 'bg-purple-500/5 border-purple-500/20 text-purple-600 dark:text-purple-400'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isInheritingRole ? (
                      <Shield className="h-4 w-4 shrink-0" />
                    ) : (
                      <Sparkles className="h-4 w-4 shrink-0" />
                    )}
                    <span>
                      {isInheritingRole ? (
                        <>
                          Currently viewing default <strong>{ROLES_META[selectedUserForPerms.role]?.title}</strong> permissions. Changing any checkbox activates custom user overrides.
                        </>
                      ) : (
                        <>
                          <strong>Individual User Overrides Active:</strong> This user will use these specific permissions instead of the {ROLES_META[selectedUserForPerms.role]?.title} role defaults.
                        </>
                      )}
                    </span>
                  </div>

                  {selectedUserForPerms.customPermissions && selectedUserForPerms.customPermissions.trim() && (
                    <button
                      type="button"
                      disabled={savingUserPerms}
                      onClick={handleResetUserToRoleDefault}
                      className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground text-[11px] font-semibold flex items-center gap-1 transition shrink-0"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Revert to Role</span>
                    </button>
                  )}
                </div>

                {/* Quick Presets Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl border border-border bg-muted/20">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase mr-1">Quick Tools:</span>
                    <button
                      type="button"
                      onClick={handleCopyRoleDefaultsToUser}
                      className="px-2.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 transition"
                      title="Copy default permissions of their role"
                    >
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Copy Role Defaults</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsInheritingRole(false);
                        const full: any = {};
                        ALL_APP_MODULES.forEach((mod) => {
                          full[mod] = { view: true, create: true, edit: true, delete: true };
                        });
                        setUserCustomMatrix(full);
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                      <span>Full CRUD (All)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsInheritingRole(false);
                        const none: any = {};
                        ALL_APP_MODULES.forEach((mod) => {
                          none[mod] = { view: false, create: false, edit: false, delete: false };
                        });
                        setUserCustomMatrix(none);
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Square className="h-3.5 w-3.5" />
                      <span>Revoke All</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-muted-foreground">
                    10 Modules Configurable
                  </span>
                </div>

                {/* Granular User Permissions Table */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                        <th className="p-3.5 w-60">System Module</th>
                        <th className="p-3.5 text-center w-28">
                          <button
                            type="button"
                            onClick={() => handleToggleUserColumn('view')}
                            className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline uppercase"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View</span>
                          </button>
                        </th>
                        <th className="p-3.5 text-center w-28">
                          <button
                            type="button"
                            onClick={() => handleToggleUserColumn('create')}
                            className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline uppercase"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Create</span>
                          </button>
                        </th>
                        <th className="p-3.5 text-center w-28">
                          <button
                            type="button"
                            onClick={() => handleToggleUserColumn('edit')}
                            className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline uppercase"
                          >
                            <Pencil className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                        </th>
                        <th className="p-3.5 text-center w-28">
                          <button
                            type="button"
                            onClick={() => handleToggleUserColumn('delete')}
                            className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:underline uppercase"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        </th>
                        <th className="p-3.5 text-right w-48">Presets</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {ALL_APP_MODULES.map((mod) => {
                        const meta = MODULE_META[mod];
                        const Icon = meta.icon;
                        const perm = userCustomMatrix[mod] || { view: false, create: false, edit: false, delete: false };

                        return (
                          <tr key={mod} className="hover:bg-muted/20 transition">
                            <td className="p-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                  <Icon className="h-3.5 w-3.5" />
                                </div>
                                <div>
                                  <p className="font-bold text-foreground text-xs leading-tight">{meta.label}</p>
                                  <p className="text-[10px] text-muted-foreground">{meta.description}</p>
                                </div>
                              </div>
                            </td>

                            {/* View */}
                            <td className="p-3.5 text-center">
                              <label className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-muted/40 cursor-pointer transition">
                                <input
                                  type="checkbox"
                                  checked={perm.view}
                                  onChange={() => handleToggleUserPermission(mod, 'view')}
                                  className="h-4 w-4 rounded border-border text-sky-600 focus:ring-sky-500 cursor-pointer"
                                />
                              </label>
                            </td>

                            {/* Create */}
                            <td className="p-3.5 text-center">
                              <label className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-muted/40 cursor-pointer transition">
                                <input
                                  type="checkbox"
                                  checked={perm.create}
                                  onChange={() => handleToggleUserPermission(mod, 'create')}
                                  className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                              </label>
                            </td>

                            {/* Edit */}
                            <td className="p-3.5 text-center">
                              <label className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-muted/40 cursor-pointer transition">
                                <input
                                  type="checkbox"
                                  checked={perm.edit}
                                  onChange={() => handleToggleUserPermission(mod, 'edit')}
                                  className="h-4 w-4 rounded border-border text-amber-600 focus:ring-amber-500 cursor-pointer"
                                />
                              </label>
                            </td>

                            {/* Delete */}
                            <td className="p-3.5 text-center">
                              <label className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-muted/40 cursor-pointer transition">
                                <input
                                  type="checkbox"
                                  checked={perm.delete}
                                  onChange={() => handleToggleUserPermission(mod, 'delete')}
                                  className="h-4 w-4 rounded border-border text-rose-600 focus:ring-rose-500 cursor-pointer"
                                />
                              </label>
                            </td>

                            {/* Presets */}
                            <td className="p-3.5 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSetUserRowPreset(mod, 'ALL')}
                                  className="px-2 py-1 rounded-lg border border-border bg-card hover:bg-primary/10 hover:text-primary text-[10px] font-semibold transition"
                                >
                                  Full
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetUserRowPreset(mod, 'VIEW_ONLY')}
                                  className="px-2 py-1 rounded-lg border border-border bg-card hover:bg-sky-500/10 hover:text-sky-500 text-[10px] font-semibold transition"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetUserRowPreset(mod, 'NONE')}
                                  className="px-2 py-1 rounded-lg border border-border bg-card hover:bg-rose-500/10 hover:text-rose-500 text-[10px] font-semibold transition"
                                >
                                  None
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={savingUserPerms}
                  onClick={handleResetUserToRoleDefault}
                  className="px-3.5 py-2 rounded-xl border border-border hover:bg-muted text-muted-foreground text-xs font-semibold flex items-center gap-1.5 transition w-full sm:w-auto justify-center"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset to Role Defaults</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    disabled={savingUserPerms}
                    onClick={() => setSelectedUserForPerms(null)}
                    className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingUserPerms}
                    onClick={handleSaveUserPermissions}
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center gap-2 transition shadow-md shadow-primary/25 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{savingUserPerms ? 'Saving Permissions...' : 'Save User Permissions'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AccessGuard>
  );
}
