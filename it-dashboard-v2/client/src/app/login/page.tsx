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
  Server,
  Layers,
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

  // Live Digital Broadcast Clock
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#08090e] text-slate-100 select-none overflow-hidden relative">
      {/* Dynamic Background Mesh Glows */}
      <div className="absolute top-0 left-0 w-[45rem] h-[45rem] bg-gradient-to-br from-red-600/15 via-red-900/10 to-transparent blur-[120px] pointer-events-none animate-itv-float-1" />
      <div className="absolute bottom-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-tl from-indigo-700/15 via-blue-900/10 to-transparent blur-[120px] pointer-events-none animate-itv-float-2" />

      {/* Cyber Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* ========================================================================= */}
      {/* LEFT PANE: BROADCAST HERO & ITV SHOWCASE (Desktop 55% / Collapses on mobile)*/}
      {/* ========================================================================= */}
      <div className="relative flex-1 lg:flex-[1.2] p-8 lg:p-16 flex flex-col justify-between z-10 border-b lg:border-b-0 lg:border-r border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <ITVLogo className="h-10 sm:h-12 w-auto" showText={true} />
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/15 border border-red-500/30 text-red-400 text-xs font-semibold backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-itv-pulse-live" />
            <span className="tracking-wider uppercase text-[10px] font-extrabold font-mono">
              24/7 ON-AIR NOC
            </span>
          </div>
        </div>

        {/* Center Headline & Features */}
        <div className="my-10 lg:my-auto max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 backdrop-blur-md">
            <Tv className="h-4 w-4 text-red-500" />
            <span className="font-semibold tracking-wide">Independent Television Network Operations</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15]">
            Empowering 24/7{' '}
            <span className="bg-gradient-to-r from-red-500 via-rose-400 to-amber-300 bg-clip-text text-transparent">
              Broadcast Media
            </span>{' '}
            & Infrastructure.
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
            Unified mission-critical management for Master Control Rooms (MCR), Production Control (PCR), Enterprise IT Assets, High-Density Storage Drives & Broadcast Engineers.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-red-500/40 transition-colors backdrop-blur-xs group">
              <div className="h-8 w-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <Radio className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-xs text-white">MCR Automation</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Live video routing, playout & satellite telemetry.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 transition-colors backdrop-blur-xs group">
              <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <Server className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-xs text-white">IT Asset Control</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Hardware, workstation hostnames & SSD storage binder.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 transition-colors backdrop-blur-xs group">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-xs text-white">Zero-Trust Guard</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Role-based ACL, audit tracking & active directory sync.</p>
            </div>
          </div>
        </div>

        {/* Bottom Ticker Tape */}
        <div className="pt-6 border-t border-white/10">
          <div className="overflow-hidden relative rounded-xl bg-black/40 border border-white/5 py-2 px-3">
            <div className="flex items-center gap-6 whitespace-nowrap animate-itv-ticker text-xs font-mono text-slate-400">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                <strong className="text-white">ITV MCR:</strong> ON AIR
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">SERVER NODES: 100% HEALTHY</span>
              <span>•</span>
              <span>TRANSMISSION: SATELLITE & DIGITAL OTT SECURED</span>
              <span>•</span>
              <span className="text-amber-400 font-semibold">BST CLOCK: {currentTime || 'LIVE'}</span>
              <span>•</span>
              <span className="text-slate-300">INDEPENDENT TELEVISION DHAKA NOC</span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                <strong className="text-white">ITV MCR:</strong> ON AIR
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">SERVER NODES: 100% HEALTHY</span>
              <span>•</span>
              <span>TRANSMISSION: SATELLITE & DIGITAL OTT SECURED</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT PANE: LOGIN FORM (Focused, Clean, Pristine Glass Card)              */}
      {/* ========================================================================= */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md space-y-6">
          {/* Card Wrapper */}
          <div className="p-8 sm:p-9 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-2xl shadow-2xl space-y-6">
            {/* Header */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                <span>IT Operations Portal</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">Sign In to Dashboard</h2>
              <p className="text-xs text-slate-400">
                Please enter your Independent TV authorized credentials to proceed.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-start gap-2.5 animate-in shake">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200 block">
                  Username or Employee ID
                </label>
                <div className="relative group">
                  <User className="h-4 w-4 absolute left-3.5 top-3 text-slate-400 group-focus-within:text-red-400 transition-colors" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. omith.hasan"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="h-4 w-4 absolute left-3.5 top-3 text-slate-400 group-focus-within:text-red-400 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/30 hover:shadow-red-600/50 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Validating Network Token...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to NOC Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Auto-Fill Demo Credentials */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Default Super Admin</span>
                </span>
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 transition flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <span>1-Click Auto-Fill</span>
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

            {/* Card Security Tagline */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
              <span className="flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                <span>ITV NOC v2.4</span>
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                <span>256-BIT SSL ENCRYPTED</span>
              </span>
            </div>
          </div>

          {/* Footer copyright */}
          <p className="text-center text-[10px] text-slate-500 font-medium">
            © {new Date().getFullYear()} Independent Television Limited. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
