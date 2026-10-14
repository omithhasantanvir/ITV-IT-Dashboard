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
        err.response?.data?.message || err.message || 'Unable to connect to server.'
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
      {/* Animated Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-red-600/20 blur-[130px] pointer-events-none animate-itv-float-1" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-red-800/15 blur-[130px] pointer-events-none animate-itv-float-2" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-indigo-950/10 blur-[140px] pointer-events-none" />

      {/* Subtle Dot Grid */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Centered Clean Login Card */}
      <div className="w-full max-w-sm relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-7 sm:p-8 rounded-3xl bg-slate-900/75 border border-white/10 backdrop-blur-2xl shadow-2xl space-y-6">
          {/* Logo & Brand Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner flex items-center justify-center">
                <ITVLogo className="h-10 w-auto" showText={true} />
              </div>
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                IT Operations Portal
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Independent Television Limited
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Username</label>
              <div className="relative">
                <User className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. omith.hasan"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-slate-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-red-600/25 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Auto-Fill */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400 font-mono">omith.hasan</span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>Fill Admin</span>
            </button>
          </div>

          <p className="text-center text-[10px] text-slate-500">
            © {new Date().getFullYear()} Independent Television
          </p>
        </div>
      </div>
    </div>
  );
}
