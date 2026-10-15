'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useAuth, AppModule } from '@/context/AuthContext';
import { BrandLoading } from '@/components/BrandLoading';

interface AccessGuardProps {
  module: AppModule;
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

export function AccessGuard({
  module,
  children,
  fallbackTitle,
  fallbackMessage,
}: AccessGuardProps) {
  const { hasModuleAccess, loading, user, isSuperAdmin } = useAuth();

  if (loading) {
    return (
      <BrandLoading
        size="md"
        text="Checking Permission Matrix..."
        subtext="Access Governance Engine"
      />
    );
  }

  // Super admin always has access
  if (isSuperAdmin || hasModuleAccess(module)) {
    return <>{children}</>;
  }

  const moduleNames: Record<AppModule, string> = {
    dashboard: 'Dashboard',
    employees: 'Employee Management',
    roster: 'Duty Roster',
    computers: 'Computers & Assets',
    extensions: 'PABX & Extensions',
    servers: 'Server Health Monitoring',
    slips: 'New Employee Slip',
    reports: 'Analytics & Reports',
    activity: 'Activity Log',
    settings: 'System Settings & Access Governance',
  };

  const name = moduleNames[module] || module;

  return (
    <div className="min-h-[65vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 rounded-3xl border border-border bg-card/80 backdrop-blur-xl shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95">
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/10">
          <ShieldAlert className="h-8 w-8" />
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground shadow-xs">
            <Lock className="h-3.5 w-3.5 text-rose-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {fallbackTitle || 'Access Restricted'}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {fallbackMessage || (
              <>
                You do not have permission to view or manage the{' '}
                <strong className="text-foreground">{name}</strong> module. Your current role is{' '}
                <span className="font-mono uppercase font-bold text-primary">
                  {user?.role?.replace('_', ' ') || 'VIEWER'}
                </span>
                .
              </>
            )}
          </p>
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground">
            Please contact Super Admin (<span className="font-semibold text-foreground">Omith Hasan</span>) to grant access to this section.
          </div>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition shadow-md shadow-primary/20"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
