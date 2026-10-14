'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Radio,
  Tv,
  Activity,
  Sparkles,
  Clock,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ITVLogo } from '@/components/ITVLogo';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState('omith.hasan');
  const [password, setPassword] = useState('Welcome@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live Digital Broadcast Clock (Bangladesh Standard Time BST)
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-US', {
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/api/auth/login', { username, password });
      if (res.data.success && res.data.token) {
        login(res.data.token, res.data.user);
        router.push('/');
      } else {
        setError(res.data.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Unable to establish connection to ITV Central Auth Server.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setUsername('omith.hasan');
    setPassword('Welcome@123');
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#07090e] text-slate-100 select-none">
      {/* ======================================================== */}
      {/* ANIMATED AMBIENT BROADCAST GLOW ORBS                     */}
      {/* ======================================================== */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-red-600/25 via-red-500/10 to-transparent blur-3xl pointer-events-none animate-itv-float-1" />
      <div className="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-gradient-to-tl from-indigo-600/20 via-blue-500/10 to-transparent blur-3xl pointer-events-none animate-itv-float-2" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-red-950/10 blur-[140px] pointer-events-none" />

      {/* Cyber Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Subtle Scanline Ray */}
      <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-red-500/[0.04] to-transparent pointer-events-none animate-itv-scanline" />

      {/* ======================================================== */}
      {/* TOP FLOATING BROADCAST STATUS BAR                        */}
      {/* ======================================================== */}
      <div className="absolute top-4 inset-x-4 max-w-4xl mx-auto flex items-center justify-between px-4 py-2 rounded-2xl bg-slate-900/50 backdrop-blur-md border border-white/10 text-xs shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-itv-pulse-live" />
            <span className="font-extrabold text-[10px] tracking-wider text-red-500 uppercase">
              LIVE BROADCAST NOC
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 border-l border-white/10 pl-3">
            <Radio className="h-3 w-3 text-red-400" />
            <span>MCR & PCR FEED: <strong className="text-emerald-400 font-mono">ACTIVE</strong></span>
          </div>
        </div>

        {/* Live BST Clock & Audio Visualizer Bars */}
        <div className="flex items-center gap-3">
          {/* Animated Equalizer Wave */}
          <div className="hidden md:flex items-end gap-0.5 h-3.5 px-1.5 py-0.5 rounded bg-black/40 border border-white/5">
            <span className="w-0.5 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="w-0.5 h-3 bg-red-400 rounded-full animate-bounce" />
            <span className="w-0.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="w-0.5 h-3 bg-amber-400 rounded-full animate-ping" />
            <span className="w-0.5 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-300">
            <Clock className="h-3 w-3 text-slate-400" />
            <span className="font-bold tracking-tight text-white">{timeString || 'BST 24/7'}</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN CYBER CARD CONTAINER                                */}
      {/* ======================================================== */}
      <div className="w-full max-w-md relative z-10 my-12 animate-in fade-in zoom-in-95 duration-300">
        <div className="relative rounded-3xl border border-white/10 bg-slate-950/75 backdrop-blur-2xl shadow-[0_0_80px_rgba(227,30,36,0.12)] p-7 sm:p-8 space-y-6 animate-itv-border-glow">
          {/* Top Brand Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center transform transition hover:scale-105 duration-300">
              <div className="p-3.5 rounded-2xl bg-gradient-to-b from-white/10 via-white/5 to-transparent border border-white/10 shadow-inner flex items-center justify-center">
                <ITVLogo className="h-11 w-auto" showText={true} />
              </div>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
                <span>IT OPERATIONS</span>
                <span className="text-red-500">PORTAL</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Independent Television • Broadcast Network & Infrastructure Control
              </p>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3 rounded-2xl border border-red-500/40 bg-red-500/10 text-red-400 text-xs flex items-start gap-2.5 shadow-sm animate-in shake">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Employee ID */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-red-500" />
                  <span>Username / Employee ID</span>
                </label>
              </div>
              <div className="relative group">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. omith.hasan"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900/60 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/80 transition-all duration-200 group-hover:border-white/20"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-red-500" />
                  <span>Password</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-slate-400 hover:text-red-400 transition flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900/60 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/80 transition-all duration-200 group-hover:border-white/20 font-mono"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-red-600/30 hover:shadow-red-600/50 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Authenticating ITV Security...</span>
                </>
              ) : (
                <>
                  <span>Sign In to NOC Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Admin Box */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Super Admin Access</span>
              </span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 transition flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span>Auto-Fill</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                <span className="text-slate-500 block text-[9px] uppercase">User</span>
                <span className="text-red-400 font-bold truncate block">omith.hasan</span>
              </div>
              <div className="p-2 rounded-lg bg-black/30 border border-white/5">
                <span className="text-slate-500 block text-[9px] uppercase">Pass</span>
                <span className="text-emerald-400 font-bold truncate block">Welcome@123</span>
              </div>
            </div>
          </div>

          {/* Telemetry Footer */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <div className="flex items-center gap-1.5">
              <Cpu className="h-3 w-3 text-slate-400" />
              <span>CORE v2.4</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              <span>TLS 1.3 ENCRYPTED</span>
            </div>
          </div>
        </div>

        {/* Legal / Copyright */}
        <p className="text-center text-[10px] text-slate-500 mt-4 font-sans tracking-wide">
          © {new Date().getFullYear()} Independent Television Limited. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
