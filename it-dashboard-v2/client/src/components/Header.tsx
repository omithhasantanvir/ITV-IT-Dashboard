'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/components/ThemeProvider';
import {
  Sun,
  Moon,
  LogOut,
  User,
  KeyRound,
  Lock,
  ChevronDown,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Tv,
  Radio,
  ExternalLink,
  Maximize2,
} from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { AnimatedLogoutButton } from '@/components/AnimatedLogoutButton';

export function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live TV Modal state
  const [isLiveTVModalOpen, setIsLiveTVModalOpen] = useState(false);

  // Change Password Modal state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle password change submission
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

  return (
    <>
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500 text-white font-medium text-xs shadow-2xl shadow-emerald-500/30 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      <header className="h-16 border-b border-border bg-card/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5">
            <span>Operations Management Platform</span>
            <button
              onClick={() => setIsLiveTVModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/25 hover:border-red-600 text-[11px] font-bold tracking-wide transition-all shadow-xs group cursor-pointer active:scale-95"
              title="Click to Watch Independent Television Live"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 group-hover:bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600 group-hover:bg-white" />
              </span>
              <Tv className="h-3 w-3" />
              <span>Live TV</span>
            </button>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Dark/Light mode toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="h-9 w-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* User profile dropdown */}
          {user ? (
            <div className="relative pl-1" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted/60 transition shadow-xs focus:outline-none"
              >
                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0 overflow-hidden border border-border/50">
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover object-top" />
                  ) : (
                    user.name?.charAt(0) || 'U'
                  )}
                </div>
                <div className="text-left text-xs hidden sm:block">
                  <p className="font-semibold text-foreground leading-tight truncate max-w-[120px]">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize leading-tight">
                    {user.role?.replace('_', ' ').toLowerCase()}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
                    isDropdownOpen && 'rotate-180'
                  )}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-card shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                  {/* Profile Summary Card */}
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/60 mb-1 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase shrink-0 overflow-hidden border border-border/60">
                        {user.profilePhoto ? (
                          <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover object-top" />
                        ) : (
                          user.name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary uppercase">
                            {user.role?.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate font-mono">{user.email || user.username}</p>
                        <p className="text-[10px] text-muted-foreground">ID: {user.employeeId}</p>
                      </div>
                    </div>
                  </div>

                  {/* Change Password Option */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsChangePasswordOpen(true);
                      setError(null);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition text-left"
                  >
                    <KeyRound className="h-4 w-4 text-amber-500" />
                    <span>Change Password</span>
                  </button>

                  {/* View My Directory Profile */}
                  <Link
                    href="/employees"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition text-left"
                  >
                    <User className="h-4 w-4 text-primary" />
                    <span>Employee Directory</span>
                  </Link>

                  <div className="my-1 border-t border-border" />

                  {/* Sign Out Option */}
                  <div className="pt-1">
                    <AnimatedLogoutButton
                      variant="dropdown"
                      label="Sign Out"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <a
              href="/login"
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
            >
              Sign In
            </a>
          )}
        </div>
      </header>

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">Change Password</h3>
                  <p className="text-xs text-muted-foreground">Update password for {user?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsChangePasswordOpen(false)}
                className="h-8 w-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition shadow-md shadow-primary/25 disabled:opacity-50 flex items-center gap-2"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>{submitting ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Live TV Modal Dialog                                     */}
      {/* ======================================================== */}
      {isLiveTVModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          {/* Backdrop Click to close */}
          <div
            className="fixed inset-0"
            onClick={() => setIsLiveTVModalOpen(false)}
          />

          <div className="relative w-full max-w-4xl rounded-3xl border border-red-500/30 bg-slate-950 text-white shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-slate-950 via-zinc-900 to-slate-950 border-b border-white/10 flex items-center justify-between select-none">
              <div className="flex items-center gap-3">
                <img
                  src="/itv-logo.png"
                  alt="ITV Logo"
                  className="h-7 w-auto object-contain drop-shadow-[0_2px_8px_rgba(239,68,68,0.8)]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
                    </span>
                    <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                      <span>Independent Television</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold uppercase">
                        LIVE ON-AIR
                      </span>
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    24/7 National Broadcast &bull; 1080p Full HD Feed
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <Link
                  href="/live"
                  onClick={() => setIsLiveTVModalOpen(false)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
                  title="Open Dedicated Studio Page"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Theater Mode</span>
                </Link>

                <a
                  href="https://www.youtube.com/watch?v=iWq2kH0iq2Q"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
                  title="Watch on YouTube"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>

                <button
                  onClick={() => setIsLiveTVModalOpen(false)}
                  className="h-8 w-8 rounded-xl bg-white/10 hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center transition"
                  title="Close (Esc)"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Video container (16:9 Aspect Ratio) */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src="https://www.youtube-nocookie.com/embed/iWq2kH0iq2Q?autoplay=1&mute=0&playsinline=1&controls=1&rel=0&modestbranding=1"
                title="Independent Television YouTube Live Stream"
                className="w-full h-full border-0 absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Modal Bottom Status Bar */}
            <div className="px-5 py-3 bg-zinc-950 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2 truncate">
                <Radio className="h-3.5 w-3.5 text-red-500 animate-pulse shrink-0" />
                <span className="truncate">Central MCR Satellite Uplink: Bangabandhu-1 (93.5°E) Lock</span>
              </div>
              <Link
                href="/live"
                onClick={() => setIsLiveTVModalOpen(false)}
                className="text-red-400 hover:text-red-300 font-semibold transition shrink-0 ml-3"
              >
                Go to Dedicated Studio Page &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
