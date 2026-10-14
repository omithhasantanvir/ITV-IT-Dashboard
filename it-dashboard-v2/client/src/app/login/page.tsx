'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
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
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError(res.data.message || 'Login failed. Please check credentials.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || 'Unable to connect to ITV Central Server.'
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-[#0b0f19] text-white select-none relative overflow-x-hidden">
      {/* Background Glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header Text (As seen in the YouTube Short) */}
      <div className="text-center mb-6 z-10 animate-in fade-in duration-300">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
          <span>Creative Login Form</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-600 text-white font-mono font-extrabold uppercase">
            ITV 24
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Independent Television • IT Operations & Asset Control Portal
        </p>
      </div>

      {/* Main Dual-Column Gradient Card (Exact layout from the video) */}
      <div className="w-full max-w-3xl rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 shadow-[0_20px_60px_-15px_rgba(37,99,235,0.4)] border border-white/20 p-6 sm:p-10 relative z-10 animate-in zoom-in-95 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left Column: 3D Character Mascot (Matching video) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center relative">
            <div className="relative group">
              {/* Soft character spotlight */}
              <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl transform scale-90 group-hover:scale-105 transition-transform" />
              
              <div className="relative rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-3 shadow-xl overflow-hidden flex items-center justify-center">
                <img
                  src="/itv-engineer-3d.png"
                  alt="ITV 3D Broadcast Engineer"
                  className="w-48 sm:w-56 h-auto object-contain drop-shadow-2xl mix-blend-multiply transform transition hover:scale-105 duration-300"
                />
              </div>

              {/* Status Pill Badge below mascot */}
              <div className="mt-3 flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[10px] font-semibold text-white shadow-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>NOC Engineer • Omith</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean White Form (Matching video) */}
          <div className="md:col-span-7 space-y-5">
            {/* Form Title & Logo */}
            <div>
              <div className="mb-2">
                <ITVLogo className="h-8 w-auto" showText={true} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Sign In
              </h1>
              <p className="text-xs text-blue-100 font-medium mt-1">
                Welcome back! Please enter your details to proceed.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-400/50 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form Controls */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Username Input */}
              <div className="space-y-1">
                <div className="relative">
                  <User className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username or Employee ID"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:ring-3 focus:ring-blue-300 shadow-sm transition"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-xs font-mono focus:outline-none focus:ring-3 focus:ring-blue-300 shadow-sm transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Auto Fill */}
              <div className="flex items-center justify-between text-xs text-blue-100 pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/30 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span className="text-[11px] font-medium">Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="text-[11px] font-semibold text-white hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 text-amber-300" />
                  <span>Auto-Fill Admin</span>
                </button>
              </div>

              {/* Submit Button (Vibrant Action Button like in the video) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-white font-bold text-xs shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-1"
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Code Window (Matching the exact video thumbnail snippet!) */}
      <div className="w-full max-w-3xl mt-6 rounded-2xl bg-[#141926] border border-white/10 shadow-xl p-4 font-mono text-xs z-10 animate-in fade-in duration-500">
        {/* macOS Window Controls */}
        <div className="flex items-center gap-2 pb-3 border-b border-white/5">
          <span className="h-3 w-3 rounded-full bg-red-500 inline-block" />
          <span className="h-3 w-3 rounded-full bg-amber-500 inline-block" />
          <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
          <span className="text-[11px] text-slate-400 font-sans ml-2">itv_operations_portal.html</span>
        </div>

        {/* Code Content */}
        <div className="pt-3 text-[11px] sm:text-xs leading-relaxed overflow-x-auto text-slate-300">
          <p>
            <span className="text-rose-400">&lt;div</span> <span className="text-amber-300">class</span>=<span className="text-emerald-400">&quot;itv_network_portal&quot;</span>
          </p>
          <p className="pl-4">
            <span className="text-amber-300">channel</span>=<span className="text-emerald-400">&quot;Independent Television (ITV 24)&quot;</span>
          </p>
          <p className="pl-4">
            <span className="text-amber-300">portal</span>=<span className="text-emerald-400">&quot;IT Operations &amp; Asset Control&quot;</span>
          </p>
          <p className="pl-4">
            <span className="text-amber-300">status</span>=<span className="text-emerald-400">&quot;24/7 ON-AIR NOC&quot;</span>
          </p>
          <p className="pl-4">
            <span className="text-amber-300">security</span>=<span className="text-emerald-400">&quot;TLS 1.3 Active&quot;</span>
          </p>
          <p className="pl-4">
            <span className="text-amber-300">fullPage</span>=<span className="text-indigo-400">&quot;true&quot;&gt;</span>
          </p>
          <p>
            <span className="text-rose-400">&lt;/div&gt;</span>
          </p>
        </div>
      </div>

      {/* Copyright */}
      <p className="text-[10px] text-slate-500 mt-6 font-sans">
        © {new Date().getFullYear()} Independent Television Limited. All Rights Reserved.
      </p>
    </div>
  );
}
