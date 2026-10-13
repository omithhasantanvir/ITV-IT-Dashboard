'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

export const ALL_APP_MODULES = [
  'dashboard',
  'employees',
  'roster',
  'computers',
  'extensions',
  'servers',
  'slips',
  'reports',
  'activity',
  'settings',
] as const;

export type AppModule = (typeof ALL_APP_MODULES)[number];
export type RoleName = 'SUPER_ADMIN' | 'IT_ADMIN' | 'IT_SUPPORT' | 'VIEWER';
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export type RoleMatrix = Record<RoleName, Record<AppModule, ModulePermission>>;

export const createDefaultRoleMatrix = (): RoleMatrix => {
  const matrix: any = {
    SUPER_ADMIN: {},
    IT_ADMIN: {},
    IT_SUPPORT: {},
    VIEWER: {},
  };

  ALL_APP_MODULES.forEach((mod) => {
    // 1. Super Admin: Full Control Everywhere
    matrix.SUPER_ADMIN[mod] = { view: true, create: true, edit: true, delete: true };

    // 2. IT Admin: Broad Management (except system settings)
    matrix.IT_ADMIN[mod] = {
      view: mod !== 'settings',
      create: !['dashboard', 'reports', 'activity', 'settings'].includes(mod),
      edit: !['dashboard', 'reports', 'activity', 'settings'].includes(mod),
      delete: ['computers', 'extensions', 'slips', 'roster'].includes(mod),
    };

    // 3. IT Support: Operational Technician (manage computers, extensions, slips, roster)
    matrix.IT_SUPPORT[mod] = {
      view: !['settings'].includes(mod),
      create: ['roster', 'computers', 'extensions', 'slips'].includes(mod),
      edit: ['roster', 'computers', 'extensions', 'slips'].includes(mod),
      delete: false,
    };

    // 4. Viewer: Strict Read-Only Observability
    matrix.VIEWER[mod] = {
      view: ['dashboard', 'employees', 'roster', 'computers', 'extensions', 'reports'].includes(mod),
      create: false,
      edit: false,
      delete: false,
    };
  });

  return matrix;
};

export const normalizeRoleMatrix = (raw: any): RoleMatrix => {
  const defaults = createDefaultRoleMatrix();
  if (!raw || typeof raw !== 'object') return defaults;

  const result: any = { ...defaults };

  (['SUPER_ADMIN', 'IT_ADMIN', 'IT_SUPPORT', 'VIEWER'] as RoleName[]).forEach((role) => {
    if (!raw[role]) return;

    result[role] = { ...defaults[role] };

    // Check if granular format (raw[role][module]?.view !== undefined)
    const firstMod = ALL_APP_MODULES[0];
    if (raw[role][firstMod] && typeof raw[role][firstMod] === 'object') {
      ALL_APP_MODULES.forEach((mod) => {
        if (raw[role][mod]) {
          result[role][mod] = {
            view: Boolean(raw[role][mod].view),
            create: Boolean(raw[role][mod].create),
            edit: Boolean(raw[role][mod].edit),
            delete: Boolean(raw[role][mod].delete),
          };
        }
      });
    } else if (Array.isArray(raw[role]?.modules)) {
      // Backwards compatibility: migrate from old flat format
      const mods = raw[role].modules;
      ALL_APP_MODULES.forEach((mod) => {
        const hasView = mods.includes(mod);
        result[role][mod] = {
          view: hasView,
          create: hasView && Boolean(raw[role].canCreate),
          edit: hasView && Boolean(raw[role].canEdit),
          delete: hasView && Boolean(raw[role].canDelete),
        };
      });
    }
  });

  return result;
};

export const DEFAULT_ROLE_PERMISSIONS = createDefaultRoleMatrix();

export interface User {
  id: string;
  employeeId: string;
  name: string;
  username: string;
  email: string;
  role: RoleName;
  department?: string;
  designation?: string;
  extensionNumber?: string;
  phone?: string;
  isITTeam?: boolean;
  itStatus?: 'AVAILABLE' | 'BUSY' | 'AWAY' | 'OFFLINE';
  profilePhoto?: string;
  customPermissions?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isITAdmin: boolean;
  permissions: RoleMatrix;
  hasPermission: (module: AppModule, action?: PermissionAction) => boolean;
  hasModuleAccess: (module: AppModule) => boolean;
  canPerformAction: (module: AppModule, action: PermissionAction) => boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  updateRolePermissions: (newMatrix: RoleMatrix) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<RoleMatrix>(DEFAULT_ROLE_PERMISSIONS);

  // Load saved session
  useEffect(() => {
    const savedToken = localStorage.getItem('it_token');
    const savedUser = localStorage.getItem('it_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('it_token');
        localStorage.removeItem('it_user');
      }
    }
    setLoading(false);
  }, []);

  // Fetch live role permissions from settings
  const refreshPermissions = async () => {
    try {
      const res = await api.get('/api/settings');
      if (res.data?.data?.rolePermissions) {
        setPermissions(normalizeRoleMatrix(res.data.data.rolePermissions));
      }
    } catch (e) {
      // Keep defaults on network error
    }
  };

  useEffect(() => {
    refreshPermissions();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('it_token', newToken);
    localStorage.setItem('it_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('it_token');
    localStorage.removeItem('it_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/api/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('it_user', JSON.stringify(res.data.user));
      }
    } catch (e) {
      // ignore
    }
  };

  // Determine administrative roles
  const isSuperAdmin = Boolean(
    user && (
      user.role === 'SUPER_ADMIN' ||
      user.username === 'omith.hasan' ||
      user.email?.toLowerCase().startsWith('omith')
    )
  );

  const isITAdmin = Boolean(isSuperAdmin || user?.role === 'IT_ADMIN');

  // Check specific module action permission (view, create, edit, delete)
  const hasPermission = (module: AppModule, action: PermissionAction = 'view'): boolean => {
    if (isSuperAdmin) return true;
    if (!user) return false;

    // 1. Check Individual User Custom Permissions (Override role defaults)
    if (user.customPermissions && typeof user.customPermissions === 'string' && user.customPermissions.trim()) {
      try {
        const parsed = JSON.parse(user.customPermissions);
        if (parsed && typeof parsed === 'object' && parsed[module] && parsed[module][action] !== undefined) {
          return Boolean(parsed[module][action]);
        }
      } catch (e) {
        // Fall back to role permissions
      }
    } else if (user.customPermissions && typeof user.customPermissions === 'object') {
      const userPerms = user.customPermissions as any;
      if (userPerms[module] && userPerms[module][action] !== undefined) {
        return Boolean(userPerms[module][action]);
      }
    }

    // 2. Fall back to Role Permissions Matrix
    const rolePerms = permissions[user.role] || DEFAULT_ROLE_PERMISSIONS[user.role];
    if (!rolePerms || !rolePerms[module]) return false;
    return Boolean(rolePerms[module][action]);
  };

  // Check if current user has access to view a module
  const hasModuleAccess = (module: AppModule): boolean => {
    return hasPermission(module, 'view');
  };

  // Alias for action checking
  const canPerformAction = (module: AppModule, action: PermissionAction): boolean => {
    return hasPermission(module, action);
  };

  // Update role permissions (Super Admin only)
  const updateRolePermissions = async (newMatrix: RoleMatrix): Promise<boolean> => {
    try {
      const res = await api.put('/api/settings', { rolePermissions: newMatrix });
      if (res.data?.success) {
        setPermissions(normalizeRoleMatrix(res.data.data?.rolePermissions || newMatrix));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to save role permissions:', err);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isSuperAdmin,
        isITAdmin,
        permissions,
        hasPermission,
        hasModuleAccess,
        canPerformAction,
        login,
        logout,
        refreshUser,
        refreshPermissions,
        updateRolePermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
