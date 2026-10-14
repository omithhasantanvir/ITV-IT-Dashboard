'use client';

import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  Tv,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ITVLogo } from '@/components/ITVLogo';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  // Lamp state: false = light off (room dark), true = light on (login form revealed)
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
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.05);

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
        isLampOn ? 'bg-[#0f111a]' : 'bg-[#050608]'
      }`}
    >
      {/* Background radial ambient when light is on */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
          isLampOn ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background:
            'radial-gradient(circle at 35% 35%, rgba(251, 191, 36, 0.12) 0%, rgba(245, 158, 11, 0.04) 40%, transparent 80%)',
        }}
      />

      {/* Floating fireflies / warm dust particles (only when light is ON) */}
      {isLampOn && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {[
            { top: '22%', left: '28%', delay: '0s', dur: '4s', size: 5 },
            { top: '35%', left: '32%', delay: '1s', dur: '5s', size: 4 },
            { top: '48%', left: '26%', delay: '2s', dur: '6s', size: 6 },
            { top: '60%', left: '34%', delay: '0.5s', dur: '4.5s', size: 4 },
            { top: '72%', left: '30%', delay: '1.5s', dur: '5.5s', size: 5 },
            { top: '28%', left: '48%', delay: '2.5s', dur: '4.8s', size: 4 },
            { top: '42%', left: '55%', delay: '0.8s', dur: '5.2s', size: 5 },
            { top: '58%', left: '62%', delay: '1.8s', dur: '6.2s', size: 6 },
            { top: '30%', left: '68%', delay: '0.3s', dur: '4.2s', size: 4 },
            { top: '75%', left: '52%', delay: '2.2s', dur: '5.8s', size: 5 },
            { top: '20%', left: '40%', delay: '1.2s', dur: '4s', size: 3 },
            { top: '65%', left: '42%', delay: '2.8s', dur: '6.5s', size: 4 },
          ].map((pt, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-amber-300 blur-[0.5px] animate-pulse"
              style={{
                top: pt.top,
                left: pt.left,
                width: `${pt.size}px`,
                height: `${pt.size}px`,
                boxShadow: '0 0 10px 2px rgba(251, 191, 36, 0.85)',
                animationDuration: pt.dur,
                animationDelay: pt.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* Main Stage: Lamp + Login Card */}
      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-12 relative z-20">
        
        {/* ======================================================== */}
        {/* LEFT / CENTER: THE INTERACTIVE LAMP                     */}
        {/* ======================================================== */}
        <div className="flex flex-col items-center justify-center relative select-none">
          {/* Light cone beam extending downwards from the lamp shade */}
          <div
            className={`absolute top-[110px] w-[340px] sm:w-[460px] h-[480px] sm:h-[540px] pointer-events-none transition-all duration-700 ease-out z-0 ${
              isLampOn
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-95 pointer-events-none'
            }`}
            style={{
              clipPath: 'polygon(46% 0%, 54% 0%, 100% 100%, 0% 100%)',
              background:
                'linear-gradient(180deg, rgba(254, 240, 138, 0.55) 0%, rgba(251, 191, 36, 0.28) 35%, rgba(245, 158, 11, 0.12) 70%, rgba(217, 119, 6, 0.01) 100%)',
              filter: 'blur(1px)',
            }}
          />

          {/* Floor Light Glow Pool (At base of the lamp light) */}
          <div
            className={`absolute top-[480px] sm:top-[540px] w-80 sm:w-96 h-28 rounded-full pointer-events-none transition-opacity duration-700 ${
              isLampOn ? 'opacity-80' : 'opacity-0'
            }`}
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(251, 191, 36, 0.4) 0%, rgba(245, 158, 11, 0.15) 50%, transparent 80%)',
            }}
          />

          {/* Interactive Lamp SVG Graphic */}
          <div
            onClick={toggleLamp}
            className="relative cursor-pointer group flex flex-col items-center transition-transform hover:scale-[1.02] active:scale-[0.99] z-20"
            title={isLampOn ? 'Click lamp to switch OFF' : 'Click lamp to switch ON'}
          >
            {/* Click / Pulse Hint (Shown prominently when light is OFF) */}
            {!isLampOn && (
              <div className="absolute -top-12 sm:-top-14 flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-semibold tracking-wide animate-bounce shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                <Lightbulb className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>Click Lamp to Turn On Light</span>
              </div>
            )}

            <svg
              width="240"
              height="440"
              viewBox="0 0 240 440"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-2xl overflow-visible"
            >
              {/* Lamp Shade Glowing Aura (When ON) */}
              {isLampOn && (
                <circle
                  cx="120"
                  cy="110"
                  r="65"
                  fill="#fef08a"
                  className="blur-2xl opacity-80"
                />
              )}

              {/* Lampshade Top Finial */}
              <rect
                x="115"
                y="52"
                width="10"
                height="14"
                rx="3"
                fill={isLampOn ? '#fbbf24' : '#334155'}
                className="transition-colors duration-500"
              />

              {/* Lampshade (Trapezoid / Dome) */}
              <path
                d="M75 116 L92 64 C93 61 96 59 100 59 L140 59 C144 59 147 61 148 64 L165 116 C167 122 162 127 156 127 L84 127 C78 127 73 122 75 116 Z"
                fill={
                  isLampOn
                    ? 'url(#shadeGradientOn)'
                    : 'url(#shadeGradientOff)'
                }
                stroke={isLampOn ? '#fde047' : '#475569'}
                strokeWidth="2.5"
                className="transition-all duration-500"
              />

              {/* Inner Light Bulb Glow (Bottom of shade) */}
              <ellipse
                cx="120"
                cy="124"
                rx="34"
                ry="10"
                fill={isLampOn ? '#ffffff' : '#1e293b'}
                className="transition-colors duration-300"
                filter={isLampOn ? 'url(#bulbGlow)' : undefined}
              />

              {/* Pull Chain / String */}
              <g
                className="transition-transform duration-200"
                style={{
                  transform: isPulling ? 'translateY(12px)' : 'translateY(0)',
                  transformOrigin: '144px 126px',
                }}
              >
                {/* Chain line */}
                <line
                  x1="144"
                  y1="126"
                  x2="144"
                  y2="178"
                  stroke={isLampOn ? '#fef08a' : '#64748b'}
                  strokeWidth="2"
                  strokeDasharray="2 3"
                />
                {/* Pull Bead / Toggle Handle */}
                <circle
                  cx="144"
                  cy="183"
                  r="6"
                  fill={isLampOn ? '#f59e0b' : '#94a3b8'}
                  stroke={isLampOn ? '#fef08a' : '#cbd5e1'}
                  strokeWidth="1.5"
                  className={
                    !isLampOn ? 'animate-pulse hover:scale-125 transition-transform' : ''
                  }
                />
              </g>

              {/* Lamp Pole / Rod */}
              <rect
                x="117.5"
                y="126"
                width="5"
                height="270"
                rx="2.5"
                fill={isLampOn ? 'url(#poleGradientOn)' : 'url(#poleGradientOff)'}
                className="transition-colors duration-500"
              />

              {/* Base Pedestal Top Step */}
              <ellipse
                cx="120"
                cy="396"
                rx="28"
                ry="6"
                fill={isLampOn ? '#78350f' : '#1e293b'}
              />

              {/* Base Bottom Oval Pedestal */}
              <ellipse
                cx="120"
                cy="404"
                rx="52"
                ry="10"
                fill={isLampOn ? 'url(#baseGradientOn)' : 'url(#baseGradientOff)'}
                stroke={isLampOn ? '#b45309' : '#334155'}
                strokeWidth="2"
              />

              {/* Gradients & Filters */}
              <defs>
                <linearGradient id="shadeGradientOn" x1="120" y1="59" x2="120" y2="127" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#451a03" />
                  <stop offset="60%" stopColor="#78350f" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>

                <linearGradient id="shadeGradientOff" x1="120" y1="59" x2="120" y2="127" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>

                <linearGradient id="poleGradientOn" x1="117" y1="126" x2="123" y2="396" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="30%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#78350f" />
                </linearGradient>

                <linearGradient id="poleGradientOff" x1="117" y1="126" x2="123" y2="396" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>

                <linearGradient id="baseGradientOn" x1="120" y1="394" x2="120" y2="414" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#b45309" />
                  <stop offset="100%" stopColor="#451a03" />
                </linearGradient>

                <linearGradient id="baseGradientOff" x1="120" y1="394" x2="120" y2="414" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>

                <filter id="bulbGlow" x="70" y="100" width="100" height="48" filterUnits="userSpaceOnUse">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
            </svg>
          </div>

          {/* Interactive Lamp Toggle Button Helper */}
          <button
            type="button"
            onClick={toggleLamp}
            className={`mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              isLampOn
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Lightbulb className={`w-3.5 h-3.5 ${isLampOn ? 'text-amber-400 fill-amber-400' : ''}`} />
            <span>{isLampOn ? 'Light is ON (Click to turn OFF)' : 'Light is OFF (Click to turn ON)'}</span>
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
          <div className="rounded-3xl bg-[#141622]/90 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_40px_rgba(251,191,36,0.12)] relative overflow-hidden">
            {/* Subtle top warm accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1f2333]/90 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
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
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#1f2333]/90 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all font-mono"
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
                    className="rounded border-white/20 bg-[#1f2333] text-amber-500 focus:ring-amber-400/20 focus:ring-offset-0"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="text-amber-400 hover:text-amber-300 hover:underline font-medium flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-fill Admin</span>
                </button>
              </div>

              {/* Submit Button (Amber / Golden Pill, matching CodeByGaurav's Yellow Button) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-[0_10px_25px_-5px_rgba(245,158,11,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
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
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>NOC Central Server</span>
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
