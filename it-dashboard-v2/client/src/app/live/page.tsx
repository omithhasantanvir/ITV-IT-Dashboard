'use client';

import React from 'react';
import Link from 'next/link';
import {
  Tv,
  Radio,
  ExternalLink,
  Signal,
  Wifi,
  Sparkles,
  Users,
  ShieldCheck,
  Activity,
  Maximize2,
  Clock,
  ArrowLeft,
  Volume2,
} from 'lucide-react';
import { AccessGuard } from '@/components/AccessGuard';

export default function LiveTVPage() {
  const liveVideoId = 'iWq2kH0iq2Q';
  const embedUrl = `https://www.youtube-nocookie.com/embed/${liveVideoId}?autoplay=1&mute=0&playsinline=1&controls=1&rel=0&modestbranding=1`;

  return (
    <AccessGuard module="dashboard">
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="h-8 w-8 rounded-lg border border-border bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center shadow-xs">
                  <Tv className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                    <span>Independent Television</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold uppercase shadow-sm">
                      24/7 LIVE
                    </span>
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    National High-Definition Transmission &bull; Live Studio Master Feed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Uplink Healthy (1080p60)</span>
            </span>

            <a
              href={`https://www.youtube.com/watch?v=${liveVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Watch on YouTube</span>
            </a>
          </div>
        </div>

        {/* Studio Main View Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main 16:9 Cinema / Theater Screen */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-primary/30 bg-card shadow-2xl overflow-hidden">
              {/* Studio Top Control Strip */}
              <div className="px-5 py-3.5 bg-gradient-to-r from-slate-950 via-zinc-900 to-slate-950 border-b border-white/10 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="/itv-logo.png"
                    alt="Independent TV Logo"
                    className="h-7 w-auto object-contain drop-shadow-[0_2px_8px_rgba(239,68,68,0.8)]"
                  />
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
                    </span>
                    <span className="text-xs font-black font-mono tracking-wider text-red-400">
                      ON AIR &bull; BANGLADESH
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-300 font-mono">
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10">
                    <Radio className="h-3 w-3 text-red-400 animate-pulse" />
                    <span>CH 24 PRIMARY</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-emerald-400">
                    LOW LATENCY
                  </span>
                </div>
              </div>

              {/* Theater Video Frame */}
              <div className="relative aspect-video w-full bg-black">
                <iframe
                  src={embedUrl}
                  title="Independent Television YouTube Live Master Feed"
                  className="w-full h-full border-0 absolute inset-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              {/* Player Bottom Info Strip */}
              <div className="px-5 py-3 bg-card border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2 truncate">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-semibold text-foreground truncate">
                    Independent Television &bull; 24 Hours News &amp; Current Affairs
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono">
                  <span>Sat: Bangabandhu-1</span>
                  <span>Audio: Stereo PCM</span>
                </div>
              </div>
            </div>

            {/* Quick Channel Info Banner */}
            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Volume2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Continuous IT Operations &amp; Live Monitoring</p>
                  <p className="text-muted-foreground text-[11px]">
                    This broadcast is monitored 24/7 by the Broadcast Operations &amp; IT Central Control Room.
                  </p>
                </div>
              </div>
              <Link
                href="/"
                className="px-3.5 py-1.5 rounded-lg border border-border hover:bg-muted font-semibold text-foreground transition text-center shrink-0 shadow-2xs"
              >
                Go to Overview
              </Link>
            </div>
          </div>

          {/* Telemetry & Studio Roster Column */}
          <div className="lg:col-span-4 space-y-4">
            {/* Live Telemetry Card */}
            <div className="p-5 rounded-xl border border-border bg-card shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Signal className="h-4 w-4 text-primary" />
                  <span>Broadcast Transmission Telemetry</span>
                </h3>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Master Feed Status</span>
                  <span className="font-bold font-mono text-emerald-400">ACTIVE ON-AIR</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Output Quality</span>
                  <span className="font-bold font-mono text-foreground">1080p FHD (50 fps)</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Satellite Uplink</span>
                  <span className="font-bold font-mono text-emerald-400">BS-1 (93.5°E) Lock</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Broadcast Engine</span>
                  <span className="font-bold font-mono text-foreground">Harmonic Spectrum X</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Latency</span>
                  <span className="font-bold font-mono text-foreground">1.8s (Edge CDN)</span>
                </div>
              </div>
            </div>

            {/* Quick Links & Safety Check */}
            <div className="p-5 rounded-xl border border-border bg-card shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>IT Operations Hub</span>
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Need to file an equipment ticket or report broadcast interruption?
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/servers"
                  className="p-2.5 rounded-lg border border-border bg-card hover:bg-muted text-center text-xs font-semibold transition shadow-2xs"
                >
                  Server Health
                </Link>
                <Link
                  href="/slips"
                  className="p-2.5 rounded-lg border border-border bg-card hover:bg-muted text-center text-xs font-semibold transition shadow-2xs"
                >
                  Employee Slips
                </Link>
                <Link
                  href="/roster"
                  className="p-2.5 rounded-lg border border-border bg-card hover:bg-muted text-center text-xs font-semibold transition shadow-2xs"
                >
                  Duty Roster
                </Link>
                <Link
                  href="/computers"
                  className="p-2.5 rounded-lg border border-border bg-card hover:bg-muted text-center text-xs font-semibold transition shadow-2xs"
                >
                  IT Assets
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AccessGuard>
  );
}
