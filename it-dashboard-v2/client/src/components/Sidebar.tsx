'use client';

import React, { useState, useEffect } from 'react';
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
  CalendarDays,
  Calendar,
  Sparkles,
  ChevronDown,
  Moon,
  Wrench,
  QrCode,
  ChevronLeft,
  ChevronRight,
  Radio,
  LogOut,
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
    title: 'MAINTENANCE TASK',
    items: [
      {
        name: 'Daily Night Task',
        href: '/maintenance/night-task',
        icon: Moon,
        module: 'dashboard',
      },
      {
        name: 'Maintenance Schedule',
        href: '/maintenance/task-submission',
        icon: Wrench,
        module: 'dashboard',
      },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { name: 'New Employee Slip', href: '/slips', icon: FileSpreadsheet, module: 'slips' },
      { name: 'QR Code Generator', href: '/qrcode', icon: QrCode, module: 'dashboard' },
      { name: 'Analytics & Reports', href: '/reports', icon: BarChart3, module: 'reports' },
      { name: 'Activity Log', href: '/activity', icon: History, module: 'activity' },
      { name: 'System Settings', href: '/settings', icon: Settings, module: 'settings' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasModuleAccess, user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Read saved collapse state
  useEffect(() => {
    try {
      const saved = localStorage.getItem('itv_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // fallback
    }
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem('itv_sidebar_collapsed', String(next));
    } catch {
      // fallback
    }
  };

  return (
    <aside
      className={cn(
        'border-r border-border bg-card/95 backdrop-blur-md flex flex-col justify-between h-screen sticky top-0 overflow-hidden transition-all duration-200 z-30 select-none',
        isCollapsed ? 'w-[70px]' : 'w-64'
      )}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand header */}
        <div className="h-16 px-3.5 flex items-center justify-between border-b border-border shrink-0">
          <Link href="/" className="flex items-center gap-2.5 min-w-0 group" title="Independent Television IT Platform">
            <div className="h-9 w-8 flex items-center justify-center shrink-0">
              <img
                src="/itv-logo.png"
                alt="ITV Logo"
                className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col leading-tight min-w-0 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-tight text-foreground font-sans truncate">
                    INDEPENDENT
                  </span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-primary text-primary-foreground font-mono font-extrabold shadow-2xs">
                    24
                  </span>
                </div>
                <span className="text-[9px] tracking-[0.14em] text-primary font-bold uppercase font-mono mt-0.5 truncate">
                  TELEVISION &bull; IT
                </span>
              </div>
            )}
          </Link>

          {/* Collapse Toggle Button */}
          <button
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="h-7 w-7 rounded-lg border border-border/80 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shrink-0"
            title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Navigation list (Scrollable) */}
        <nav className="p-2.5 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter((item) => hasModuleAccess(item.module));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                {!isCollapsed ? (
                  <p className="px-3 py-1 text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase">
                    {section.title}
                  </p>
                ) : (
                  <div className="my-2 border-t border-border/60 mx-2" />
                )}

                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isParentActive =
                      item.href === '/roster' ? pathname.startsWith('/roster') : pathname === item.href;

                    // Collapsed Tooltip Mode
                    if (isCollapsed) {
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={item.name}
                          className={cn(
                            'h-10 w-full flex items-center justify-center rounded-lg transition-all relative group',
                            isParentActive
                              ? 'bg-primary/10 text-primary font-bold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                          )}
                        >
                          <Icon className={cn('h-4 w-4 shrink-0', isParentActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                          {isParentActive && (
                            <span className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r" />
                          )}
                          {item.badge && (
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                          )}
                        </Link>
                      );
                    }

                    // Expanded Subitems
                    if (item.subItems) {
                      return (
                        <div key={item.name} className="space-y-0.5">
                          <Link
                            href={item.href}
                            className={cn(
                              'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                              isParentActive
                                ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary pl-2.5'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                            )}
                          >
                            <div className="flex items-center gap-2.5">
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
                            <div className="pl-6 pr-1 space-y-0.5 pt-0.5 border-l-2 border-border ml-4">
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
                                      'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
                                      isSubActive
                                        ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                                    )}
                                  >
                                    {SubIcon && <SubIcon className="h-3 w-3 shrink-0" />}
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
                            ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
                          <span className="truncate">{item.name}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={cn(
                              'text-[9px] font-bold font-mono px-1.5 py-0.2 rounded-full',
                              isActive ? 'bg-white/20 text-white' : 'bg-red-500/15 text-red-500 font-extrabold'
                            )}
                          >
                            {item.badge}
                          </span>
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

      {/* Network Operations Status Footer & Sign Out */}
      <div className="p-2.5 border-t border-border shrink-0 bg-muted/20 space-y-2">
        {!isCollapsed ? (
          <>
            <div className="p-2 rounded-lg bg-card border border-border/80 flex items-center gap-2.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <div className="text-xs truncate min-w-0">
                <p className="font-semibold text-foreground truncate text-[11px]">ITV Central LAN</p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">10.1.0.0/16 Active</p>
              </div>
            </div>

            {user && (
              <button
                type="button"
                onClick={() => logout()}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 border border-transparent transition-all duration-150 cursor-pointer"
                title="Sign Out of ITV Operations"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                <span>Sign Out</span>
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <div title="ITV Central LAN 10.1.0.0/16 Active" className="p-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
            {user && (
              <button
                type="button"
                onClick={() => logout()}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 border border-transparent transition-all duration-150 cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="h-4 w-4 shrink-0" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
