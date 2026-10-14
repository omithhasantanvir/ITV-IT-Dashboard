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
  Lightbulb,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ITVLogo } from '@/components/ITVLogo';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  // Lamp state: false = light off (room dark), true = light on (ITV logo lamp glowing, login form revealed)
  const [isLampOn, setIsLampOn] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  // Form states
  const [username, setUsername] = useState('omith.hasan');
  const [password, setPassword] = useState('Welcome@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Realistic light switch click sound via Web Audio API
  const playClickSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio fallback silent
    }
  };

  const toggleLamp = () => {
    playClickSound();
    setIsPulling(true);
    setTimeout(() => {
      setIsPulling(false);
      setIsLampOn((prev) => !prev);
    }, 180);
  };

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
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 select-none relative overflow-hidden transition-colors duration-1000 ease-in-out ${
        isLampOn ? 'bg-[#0b0d14]' : 'bg-[#040508]'
      }`}
    >
      {/* Background ambient radial glow when ITV logo lamp is ON */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
          isLampOn ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background:
            'radial-gradient(circle at 35% 35%, rgba(239, 68, 68, 0.16) 0%, rgba(220, 38, 38, 0.06) 45%, transparent 75%)',
        }}
      />

      {/* Floating ITV broadcast particles / embers (only when light is ON) */}
      {isLampOn && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {[
            { top: '24%', left: '26%', delay: '0s', dur: '4s', size: 5, color: '#ef4444' },
            { top: '36%', left: '32%', delay: '1s', dur: '5s', size: 4, color: '#f87171' },
            { top: '48%', left: '24%', delay: '2s', dur: '6s', size: 6, color: '#fbbf24' },
            { top: '62%', left: '34%', delay: '0.5s', dur: '4.5s', size: 4, color: '#ef4444' },
            { top: '74%', left: '28%', delay: '1.5s', dur: '5.5s', size: 5, color: '#fca5a5' },
            { top: '30%', left: '46%', delay: '2.5s', dur: '4.8s', size: 4, color: '#ef4444' },
            { top: '44%', left: '56%', delay: '0.8s', dur: '5.2s', size: 5, color: '#fbbf24' },
            { top: '56%', left: '64%', delay: '1.8s', dur: '6.2s', size: 6, color: '#ef4444' },
            { top: '28%', left: '68%', delay: '0.3s', dur: '4.2s', size: 4, color: '#f87171' },
            { top: '72%', left: '54%', delay: '2.2s', dur: '5.8s', size: 5, color: '#ef4444' },
            { top: '22%', left: '38%', delay: '1.2s', dur: '4s', size: 3, color: '#fca5a5' },
            { top: '66%', left: '44%', delay: '2.8s', dur: '6.5s', size: 4, color: '#fbbf24' },
          ].map((pt, i) => (
            <span
              key={i}
              className="absolute rounded-full blur-[0.5px] animate-pulse"
              style={{
                top: pt.top,
                left: pt.left,
                width: `${pt.size}px`,
                height: `${pt.size}px`,
                backgroundColor: pt.color,
                boxShadow: `0 0 10px 2px ${pt.color}`,
                animationDuration: pt.dur,
                animationDelay: pt.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* Main Stage: ITV Logo Lamp + Login Card */}
      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-14 relative z-20">
        
        {/* ======================================================== */}
        {/* LEFT / CENTER: THE INDEPENDENT TV LOGO LAMP              */}
        {/* ======================================================== */}
        <div className="flex flex-col items-center justify-center relative select-none">
          
          {/* Light cone beam extending downwards from the ITV logo lamp head */}
          <div
            className={`absolute top-[160px] w-[340px] sm:w-[480px] h-[460px] sm:h-[520px] pointer-events-none transition-all duration-700 ease-out z-0 ${
              isLampOn
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-95 pointer-events-none'
            }`}
            style={{
              clipPath: 'polygon(46% 0%, 54% 0%, 100% 100%, 0% 100%)',
              background:
                'linear-gradient(180deg, rgba(239, 68, 68, 0.55) 0%, rgba(220, 38, 38, 0.28) 35%, rgba(244, 63, 94, 0.12) 70%, rgba(239, 68, 68, 0.01) 100%)',
              filter: 'blur(1px)',
            }}
          />

          {/* Floor Light Glow Pool (At base of the lamp light) */}
          <div
            className={`absolute top-[500px] sm:top-[540px] w-80 sm:w-[420px] h-28 rounded-full pointer-events-none transition-opacity duration-700 ${
              isLampOn ? 'opacity-90' : 'opacity-0'
            }`}
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.45) 0%, rgba(220, 38, 38, 0.18) 50%, transparent 80%)',
            }}
          />

          {/* Interactive ITV Lamp Unit */}
          <div
            onClick={toggleLamp}
            className="relative cursor-pointer group flex flex-col items-center transition-transform hover:scale-[1.02] active:scale-[0.99] z-20"
            title={isLampOn ? 'Click ITV Logo Lamp to switch OFF' : 'Click ITV Logo Lamp to switch ON'}
          >
            {/* Click / Pulse Hint (Shown prominently when light is OFF) */}
            {!isLampOn && (
              <div className="absolute -top-12 sm:-top-14 flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/20 border border-red-500/40 text-red-300 text-xs sm:text-sm font-semibold tracking-wide animate-bounce shadow-[0_0_20px_rgba(239,68,68,0.35)]">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <span>Click ITV Logo to Turn On Light</span>
              </div>
            )}

            {/* Top Lamp Finial & Suspension Bracket */}
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-3 rounded-t-md transition-colors duration-500 ${
                  isLampOn ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]' : 'bg-slate-700'
                }`}
              />
              <div
                className={`w-14 h-2 rounded-full transition-colors duration-500 ${
                  isLampOn ? 'bg-red-600' : 'bg-slate-800'
                }`}
              />
            </div>

            {/* THE ITV LOGO AS THE LAMP HEAD */}
            <div className="relative mt-1 flex items-center justify-center">
              {/* Radial Neon Backlight Glow (Active when ON) */}
              <div
                className={`absolute w-36 h-48 rounded-full blur-2xl transition-all duration-700 ${
                  isLampOn
                    ? 'opacity-100 bg-red-600/70 scale-125'
                    : 'opacity-20 bg-red-950/40 scale-90'
                }`}
              />

              {/* Glowing Aura Ring Frame around Logo */}
              <div
                className={`relative p-3.5 rounded-3xl backdrop-blur-md transition-all duration-500 flex items-center justify-center ${
                  isLampOn
                    ? 'bg-red-950/40 border-2 border-red-500/80 shadow-[0_0_40px_rgba(239,68,68,0.6),inset_0_0_20px_rgba(239,68,68,0.4)]'
                    : 'bg-black/50 border border-white/10 shadow-lg'
                }`}
              >
                {/* The ITV Logo as the Light Source */}
                <img
                  src="/itv-logo.png"
                  alt="Independent Television Lamp Head"
                  className={`w-20 sm:w-24 h-auto object-contain transition-all duration-500 select-none ${
                    isLampOn
                      ? 'brightness-125 drop-shadow-[0_0_30px_rgba(239,68,68,1)] filter scale-105'
                      : 'brightness-50 grayscale-[40%] contrast-125 opacity-60 group-hover:opacity-80 group-hover:brightness-75'
                  }`}
                />

                {/* Subtitle brand tag inside logo housing */}
                <div className="absolute -bottom-2.5 px-2 py-0.5 rounded-full bg-red-600 text-white font-mono text-[9px] font-black uppercase tracking-wider shadow-md">
                  ITV 24
                </div>
              </div>
            </div>

            {/* Lamp Base Light Emitter & Lens */}
            <div className="mt-3 flex flex-col items-center">
              <div
                className={`w-20 h-3 rounded-full transition-all duration-500 ${
                  isLampOn
                    ? 'bg-gradient-to-r from-red-400 via-rose-300 to-red-400 shadow-[0_0_25px_rgba(239,68,68,0.9)]'
                    : 'bg-slate-800'
                }`}
              />
            </div>

            {/* Interactive Pull String / Cord */}
            <div
              className="relative flex flex-col items-center transition-transform duration-200 mt-0.5"
              style={{
                transform: isPulling ? 'translateY(14px)' : 'translateY(0)',
              }}
            >
              {/* String / Chain */}
              <div
                className={`w-0.5 h-14 transition-colors duration-300 border-l ${
                  isLampOn ? 'border-red-400 border-dashed' : 'border-slate-600 border-dashed'
                }`}
              />
              {/* Pull Handle / Bead */}
              <div
                className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 ${
                  isLampOn
                    ? 'bg-red-500 border-rose-300 shadow-[0_0_12px_rgba(239,68,68,0.9)] scale-110'
                    : 'bg-slate-600 border-slate-400 animate-pulse'
                }`}
              />
            </div>

            {/* Floor Lamp Stand / Metallic Rod */}
            <div
              className={`w-1.5 h-48 rounded-full transition-colors duration-500 -mt-16 ${
                isLampOn ? 'bg-gradient-to-b from-red-500 via-red-900 to-slate-800' : 'bg-slate-800'
              }`}
            />

            {/* Lamp Floor Base */}
            <div className="flex flex-col items-center -mt-0.5">
              <div
                className={`w-12 h-2 rounded-t-md transition-colors duration-500 ${
                  isLampOn ? 'bg-red-950 border-t border-red-500/40' : 'bg-slate-800'
                }`}
              />
              <div
                className={`w-28 h-3.5 rounded-full transition-colors duration-500 border ${
                  isLampOn
                    ? 'bg-slate-900 border-red-600/50 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                    : 'bg-slate-950 border-slate-800'
                }`}
              />
            </div>
          </div>

          {/* Interactive Helper Toggle Button */}
          <button
            type="button"
            onClick={toggleLamp}
            className={`mt-3 inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold transition-all ${
              isLampOn
                ? 'bg-red-600/20 text-red-300 border border-red-500/40 hover:bg-red-600/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Lightbulb className={`w-3.5 h-3.5 ${isLampOn ? 'text-red-400 fill-red-400' : ''}`} />
            <span>{isLampOn ? 'ITV Lamp is ON (Click to turn OFF)' : 'ITV Lamp is OFF (Click to turn ON)'}</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* RIGHT: SLEEK GLASSMORPHIC LOGIN FORM (ILLUMINATED)       */}
        {/* ======================================================== */}
        <div
          className={`w-full max-w-md transition-all duration-700 ease-out z-20 ${
            isLampOn
              ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
              : 'opacity-0 translate-y-6 scale-95 pointer-events-none'
          }`}
        >
          <div className="rounded-3xl bg-[#121420]/90 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_40px_rgba(239,68,68,0.15)] relative overflow-hidden">
            {/* Subtle top red accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />

            {/* ITV Header & Welcome Back */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="mb-2 flex items-center justify-center">
                <ITVLogo size="md" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome Back
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs">
                Independent Television • IT Operations & Central Dashboard
              </p>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Enter your username"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1c1f30]/90 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#1c1f30]/90 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Auto-Fill Admin */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none hover:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/20 bg-[#1c1f30] text-red-600 focus:ring-red-500/20 focus:ring-offset-0"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="text-red-400 hover:text-red-300 hover:underline font-medium flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-fill Admin</span>
                </button>
              </div>

              {/* Submit Button (ITV Signature Red-to-Rose Gradient) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-[0_10px_25px_-5px_rgba(220,38,38,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Footer */}
            <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ITV Central Server</span>
              </span>
              <span>omith.hasan • Admin</span>
            </div>
          </div>
        </div>

      </div>

      {/* Footer copyright */}
      <div className="mt-8 text-center text-xs text-slate-600 z-10">
        © {new Date().getFullYear()} Independent Television Ltd. All Rights Reserved.
      </div>
    </div>
  );
}
