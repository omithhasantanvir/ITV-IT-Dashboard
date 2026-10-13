import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

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

    // Check if new granular format (raw[role][module]?.view !== undefined)
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

export const getSettings = async (_req: Request, res: Response) => {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'default-settings' },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'default-settings',
          companyName: 'IT Management & Asset Control System',
          subtitle: 'Internal IT Operations Dashboard',
          monitoringInterval: '1m',
          allowLANAccess: true,
          rolePermissions: JSON.stringify(DEFAULT_ROLE_PERMISSIONS),
        },
      });
    }

    let parsedPermissions: any = null;
    try {
      if ((settings as any).rolePermissions) {
        parsedPermissions = typeof (settings as any).rolePermissions === 'string'
          ? JSON.parse((settings as any).rolePermissions)
          : (settings as any).rolePermissions;
      }
    } catch {
      parsedPermissions = DEFAULT_ROLE_PERMISSIONS;
    }

    return res.json({
      success: true,
      data: {
        ...settings,
        rolePermissions: normalizeRoleMatrix(parsedPermissions),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve settings.' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { companyName, subtitle, monitoringInterval, allowLANAccess, rolePermissions } = req.body;

    const dataToUpdate: any = {};
    if (companyName !== undefined) dataToUpdate.companyName = companyName;
    if (subtitle !== undefined) dataToUpdate.subtitle = subtitle;
    if (monitoringInterval !== undefined) dataToUpdate.monitoringInterval = monitoringInterval;
    if (allowLANAccess !== undefined) dataToUpdate.allowLANAccess = Boolean(allowLANAccess);
    if (rolePermissions !== undefined) {
      dataToUpdate.rolePermissions = typeof rolePermissions === 'string'
        ? rolePermissions
        : JSON.stringify(rolePermissions);
    }

    const updated = await prisma.settings.upsert({
      where: { id: 'default-settings' },
      update: dataToUpdate,
      create: {
        id: 'default-settings',
        companyName: companyName || 'IT Management & Asset Control System',
        subtitle: subtitle || 'Internal IT Operations Dashboard',
        monitoringInterval: monitoringInterval || '1m',
        allowLANAccess: Boolean(allowLANAccess),
        rolePermissions: typeof rolePermissions === 'string'
          ? rolePermissions
          : JSON.stringify(rolePermissions || DEFAULT_ROLE_PERMISSIONS),
      },
    });

    let parsedPerms: any = null;
    try {
      if ((updated as any).rolePermissions) {
        parsedPerms = typeof (updated as any).rolePermissions === 'string'
          ? JSON.parse((updated as any).rolePermissions)
          : (updated as any).rolePermissions;
      }
    } catch {
      parsedPerms = DEFAULT_ROLE_PERMISSIONS;
    }

    return res.json({
      success: true,
      message: 'Settings and role permissions updated.',
      data: {
        ...updated,
        rolePermissions: normalizeRoleMatrix(parsedPerms),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
};

