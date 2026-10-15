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
  badge?: string;
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
      { name: 'New Employee Slip', href: '/slips', icon: FileSpreadsheet, module: 'slips' },
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
    <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-xl flex flex-col justify-between h-screen sticky top-0 overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand header */}
        <div className="h-16 px-4 flex items-center gap-3 border-b border-border shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-10 w-8 flex items-center justify-center shrink-0">
              <img
                src="/itv-logo.png"
                alt="Independent Television Logo"
                className="h-9 w-auto object-contain drop-shadow-[0_2px_8px_rgba(227,30,36,0.45)] transition-transform duration-200 group-hover:scale-105 select-none"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-tight text-foreground font-sans">
                  INDEPENDENT
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-primary text-primary-foreground font-mono font-extrabold shadow-xs">
                  24
                </span>
              </div>
              <span className="text-[9px] tracking-[0.16em] text-primary font-bold uppercase font-mono mt-0.5">
                TELEVISION &bull; IT
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation list (Scrollable) */}
        <nav className="p-4 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
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
                        'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 font-bold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                      )}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
                        <span className="truncate">{item.name}</span>
                      </div>

                      {item.badge && (
                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                          </span>
                          <span
                            className={cn(
                              'text-[9px] font-extrabold font-mono tracking-wider px-1.5 py-0.2 rounded-full shadow-xs',
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-red-600 text-white'
                            )}
                          >
                            {item.badge}
                          </span>
                        </div>
                      )}
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
      <div className="p-3.5 border-t border-border shrink-0 bg-card/40">
        <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(227,30,36,0.6)] shrink-0" />
          <div className="text-xs truncate">
            <p className="font-semibold text-foreground truncate">ITV Operations LAN</p>
            <p className="text-[10px] text-muted-foreground font-mono truncate">Central DB Connected</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
