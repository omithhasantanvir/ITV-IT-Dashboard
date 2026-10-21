'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/components/ThemeProvider';
import {
  Sun,
  Moon,
  Search,
  Bell,
  User,
  KeyRound,
  ChevronDown,
  X,
  CheckCircle2,
  AlertCircle,
  Tv,
  ArrowRight,
  Computer,
  Server,
  PhoneCall,
  Calendar,
  FileSpreadsheet,
  QrCode,
  Wrench,
  History,
  Settings,
  Users,
  LifeBuoy,
} from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { AnimatedLogoutButton } from '@/components/AnimatedLogoutButton';

const ROUTE_NAMES: Record<string, { title: string; category: string }> = {
  '/': { title: 'IT Operations Control Center', category: 'Overview' },
  '/employees': { title: 'Employee Directory & Access', category: 'Staff' },
  '/roster': { title: 'Daily Duty Roster', category: 'Operations' },
  '/roster/festival': { title: 'Festival Duty Roster', category: 'Operations' },
  '/computers': { title: 'Computers & Hardware Assets', category: 'Infrastructure' },
  '/extensions': { title: 'PABX Telephony & Extensions', category: 'Infrastructure' },
  '/servers': { title: 'Datacenter Server Fleet Health', category: 'Infrastructure' },
  '/maintenance/night-task': { title: 'Daily Night Task Submission', category: 'Maintenance' },
  '/maintenance/task-submission': { title: 'Scheduled Maintenance Tasks', category: 'Maintenance' },
  '/tickets': { title: 'IT Support Ticket Management & Helpdesk', category: 'Support' },
  '/slips': { title: 'New Employee Onboarding Slips', category: 'Management' },
  '/qrcode': { title: 'QR Code Generator & ITV Portal', category: 'Management' },
  '/reports': { title: 'Operational Analytics & Reports', category: 'Management' },
  '/activity': { title: 'System Activity & Audit Log', category: 'Management' },
  '/settings': { title: 'System & Security Settings', category: 'Administration' },
  '/live': { title: 'Live Broadcast Master Stream', category: 'Broadcast' },
};

const SEARCH_SHORTCUTS = [
  { name: 'Dashboard Overview', href: '/', icon: Computer, category: 'Navigation' },
  { name: 'Employee Directory', href: '/employees', icon: Users, category: 'Staff' },
  { name: 'Computers & Assets', href: '/computers', icon: Computer, category: 'Hardware' },
  { name: 'Server Health Monitoring', href: '/servers', icon: Server, category: 'Datacenter' },
  { name: 'Scheduled Maintenance Tasks', href: '/maintenance/task-submission', icon: Wrench, category: 'Operations' },
  { name: 'Daily Night Task', href: '/maintenance/night-task', icon: Calendar, category: 'Operations' },
  { name: 'PABX Extensions', href: '/extensions', icon: PhoneCall, category: 'Telephony' },
  { name: 'Support Tickets & Helpdesk', href: '/tickets', icon: LifeBuoy, category: 'Support' },
  { name: 'New Employee Slip', href: '/slips', icon: FileSpreadsheet, category: 'Management' },
  { name: 'QR Code Generator', href: '/qrcode', icon: QrCode, category: 'Management' },
  { name: 'Live Activity Audit', href: '/activity', icon: History, category: 'Security' },
  { name: 'System Settings', href: '/settings', icon: Settings, category: 'Admin' },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Dropdown & Modal states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiveTVModalOpen, setIsLiveTVModalOpen] = useState(false);

  // Change Password state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setError('Current and new passwords are required.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setSuccessToast(res.data?.message || 'Password changed successfully!');
      setTimeout(() => setSuccessToast(null), 3500);
      setIsChangePasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const currentModule = ROUTE_NAMES[pathname] || { title: 'Operations Management', category: 'Platform' };

  const filteredShortcuts = SEARCH_SHORTCUTS.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-600 text-white font-medium text-xs shadow-2xl animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      <header className="h-16 border-b border-border bg-card/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 select-none">
        {/* Left: Dynamic Module Title & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono truncate">
              {currentModule.category}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate">
              {currentModule.title}
            </h2>
          </div>

          {/* Live TV Button */}
          <button
            onClick={() => setIsLiveTVModalOpen(true)}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white border border-red-600/20 text-[11px] font-bold tracking-wide transition-all shadow-2xs group cursor-pointer ml-2 shrink-0"
            title="Watch Independent Television Live Stream"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 group-hover:bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600 group-hover:bg-white" />
            </span>
            <Tv className="h-3 w-3" />
            <span>Live TV</span>
          </button>
        </div>

        {/* Center: Global Search Bar (Desktop Trigger) */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted/70 text-muted-foreground text-xs transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />
              <span>Jump to module, server, or task...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-background border border-border rounded text-muted-foreground font-bold">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Actions, Notifications, Theme, User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Mobile Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="lg:hidden h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition"
            title="Search"
          >
            <Search className="h-3.5 w-3.5" />
          </button>

          {/* Operational Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition relative"
              title="Operational Notifications"
            >
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-card" />
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-card shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Operations Center Alerts
                  </span>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    Normal
                  </span>
                </div>

                <div className="space-y-2 mt-2 text-xs">
                  <div className="p-2 rounded-lg bg-muted/40 border border-border/80">
                    <p className="font-semibold text-foreground">Datacenter Fleet Monitored</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Core broadcast & database servers responding with zero latency alarms.
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40 border border-border/80">
                    <p className="font-semibold text-foreground">Upcoming Maintenance</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      GV Quarterly Maintenance scheduled for 2026-10-19 (04:00 AM window).
                    </p>
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-border flex justify-end">
                  <Link
                    href="/maintenance/task-submission"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>View Schedule</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          {/* User Profile Dropdown */}
          {user ? (
            <div className="relative pl-1" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/60 transition shadow-2xs focus:outline-none"
              >
                <div className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0 overflow-hidden border border-border">
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover object-top" />
                  ) : (
                    user.name?.charAt(0) || 'U'
                  )}
                </div>
                <div className="text-left text-xs hidden sm:block">
                  <p className="font-semibold text-foreground leading-none truncate max-w-[110px]">{user.name}</p>
                  <p className="text-[9px] text-muted-foreground capitalize leading-none mt-0.5">
                    {user.role?.replace('_', ' ').toLowerCase()}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    'h-3 w-3 text-muted-foreground transition-transform duration-200',
                    isDropdownOpen && 'rotate-180'
                  )}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-card shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/80 mb-1">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase shrink-0 overflow-hidden border border-border">
                        {user.profilePhoto ? (
                          <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover object-top" />
                        ) : (
                          user.name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
                        <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary uppercase">
                          {user.role?.replace('_', ' ')}
                        </span>
                        <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">
                          {user.email || user.username}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsChangePasswordOpen(true);
                      setError(null);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-muted/80 transition-colors"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Change Password</span>
                  </button>

                  <div className="my-1 border-t border-border" />

                  <AnimatedLogoutButton
                    variant="dropdown"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Global Command Palette / Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-3 border-b border-border flex items-center gap-2.5">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type a module name or shortcut..."
                className="w-full text-xs bg-transparent border-0 text-foreground focus:outline-none"
              />
              <kbd className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                ESC
              </kbd>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-2 max-h-72 overflow-y-auto space-y-1">
              {filteredShortcuts.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-xs hover:bg-muted text-foreground transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1 rounded bg-muted text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">{item.category}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Live TV Modal */}
      {isLiveTVModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-card border border-border w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tv className="h-4 w-4 text-red-500" />
                <span className="text-xs font-bold text-foreground">Independent Television Live Feed</span>
              </div>
              <button onClick={() => setIsLiveTVModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                src="https://www.youtube-nocookie.com/embed/iWq2kH0iq2Q?autoplay=1&mute=0"
                title="ITV Live"
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border w-full max-w-sm rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Change Password</h3>
              </div>
              <button onClick={() => setIsChangePasswordOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-muted/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
