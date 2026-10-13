'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Computer,
  PhoneCall,
  Server,
  FileSpreadsheet,
  BarChart3,
  History,
  Settings,
  ShieldCheck,
  CalendarDays,
  Calendar,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, AppModule } from '@/context/AuthContext';

export interface NavItem {
  name: string;
  href: string;
  icon: any;
  module: AppModule;
  subItems?: { name: string; href: string; icon?: any }[];
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard, module: 'dashboard' },
      { name: 'Employees', href: '/employees', icon: Users, module: 'employees' },
      {
        name: 'Duty Roster',
        href: '/roster',
        icon: CalendarDays,
        module: 'roster',
        subItems: [
          { name: 'Daily Roster', href: '/roster', icon: Calendar },
          { name: 'Festival Roster', href: '/roster/festival', icon: Sparkles },
        ],
      },
    ],
  },
  {
    title: 'INFRASTRUCTURE',
    items: [
      { name: 'Computers & Assets', href: '/computers', icon: Computer, module: 'computers' },
      { name: 'PABX & Extensions', href: '/extensions', icon: PhoneCall, module: 'extensions' },
      { name: 'Server Health', href: '/servers', icon: Server, module: 'servers' },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { name: 'Asset Slips', href: '/slips', icon: FileSpreadsheet, module: 'slips' },
      { name: 'Analytics & Reports', href: '/reports', icon: BarChart3, module: 'reports' },
      { name: 'Activity Log', href: '/activity', icon: History, module: 'activity' },
      { name: 'System Settings', href: '/settings', icon: Settings, module: 'settings' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasModuleAccess } = useAuth();

  return (
    <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-xl flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Brand header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-border">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
              IT Ops Control
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500">v2</span>
            </h1>
            <p className="text-[11px] text-muted-foreground font-medium">Next.js &bull; Express &bull; Prisma</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-6">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter((item) => hasModuleAccess(item.module));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1.5">
                <p className="px-3 text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isParentActive = item.href === '/roster' ? pathname.startsWith('/roster') : pathname === item.href;

                  if (item.subItems) {
                    return (
                      <div key={item.name} className="space-y-1">
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                            isParentActive
                              ? 'bg-primary/10 text-primary font-bold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={cn('h-4 w-4 shrink-0', isParentActive ? 'text-primary' : 'text-muted-foreground')} />
                            <span>{item.name}</span>
                          </div>
                          <ChevronDown
                            className={cn(
                              'h-3.5 w-3.5 transition-transform duration-200',
                              isParentActive ? 'rotate-0 text-primary' : '-rotate-90 opacity-60'
                            )}
                          />
                        </Link>

                        {/* Sub Items */}
                        {isParentActive && (
                          <div className="pl-6 pr-1 space-y-1 pt-0.5 border-l-2 border-primary/20 ml-4">
                            {item.subItems.map((sub) => {
                              const SubIcon = sub.icon;
                              const isSubActive =
                                sub.href === '/roster'
                                  ? pathname === '/roster'
                                  : pathname.startsWith(sub.href);
                              return (
                                <Link
                                  key={sub.name}
                                  href={sub.href}
                                  className={cn(
                                    'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                                    isSubActive
                                      ? 'bg-primary text-primary-foreground font-bold shadow-sm shadow-primary/25'
                                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                                  )}
                                >
                                  {SubIcon && <SubIcon className="h-3.5 w-3.5 shrink-0" />}
                                  <span>{sub.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
        </nav>
      </div>

      {/* Network Badge */}
      <div className="p-4 border-t border-border">
        <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="text-xs">
            <p className="font-semibold text-foreground">PostgreSQL Active</p>
            <p className="text-[10px] text-muted-foreground">Local LAN Sync</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
