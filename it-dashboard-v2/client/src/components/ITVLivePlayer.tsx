'use client';

import React, { useState } from 'react';
import {
  Tv,
  Radio,
  ExternalLink,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
  Signal,
  Wifi,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ITVLivePlayerProps {
  className?: string;
  isFloating?: boolean;
  onToggleFloating?: () => void;
}

export function ITVLivePlayer({
  className,
  isFloating = false,
  onToggleFloating,
}: ITVLivePlayerProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const liveVideoId = 'iWq2kH0iq2Q';

  // Embed URL with autoplay and muted (required by all modern browsers for immediate autoplay)
  const embedUrl = `https://www.youtube-nocookie.com/embed/${liveVideoId}?autoplay=1&mute=1&playsinline=1&controls=1&rel=0&modestbranding=1`;

  if (isFloating && isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-5 right-5 z-40 px-4 py-2.5 rounded-2xl bg-slate-950/95 border border-primary/50 text-white shadow-2xl flex items-center gap-2.5 backdrop-blur-xl hover:scale-105 transition-all group animate-in fade-in slide-in-from-bottom-2"
        title="Restore ITV Live Stream"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
        </span>
        <img src="/itv-logo.png" alt="ITV" className="h-4.5 w-auto object-contain" />
        <span className="text-xs font-bold font-mono tracking-wider">ITV LIVE</span>
        <Maximize2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-white transition" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        'rounded-3xl border border-primary/25 bg-card/85 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300 relative group',
        isFloating
          ? 'fixed bottom-5 right-5 z-40 w-[360px] sm:w-[420px] shadow-primary/20 ring-1 ring-primary/40 animate-in fade-in slide-in-from-bottom-4'
          : 'w-full',
        className
      )}
    >
      {/* Top Studio Monitor Bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-950 via-zinc-900 to-slate-950 border-b border-white/10 text-white flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          {/* ITV Logo */}
          <img
            src="/itv-logo.png"
            alt="ITV Logo"
            className="h-6 w-auto object-contain drop-shadow-[0_1px_6px_rgba(239,68,68,0.7)]"
          />

          {/* On-Air Live Pulsing Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-[10px] font-black font-mono tracking-wider shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
            </span>
            <span>LIVE TRANSMISSION</span>
          </div>
        </div>

        {/* Right Tools & Floating Controls */}
        <div className="flex items-center gap-1.5">
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-400 font-mono font-medium px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
            <Wifi className="h-2.5 w-2.5 text-emerald-400" /> 1080p Feed
          </span>

          {/* Open on YouTube */}
          <a
            href={`https://www.youtube.com/watch?v=${liveVideoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition"
            title="Open Live on YouTube in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          {/* Minimize if floating */}
          {isFloating && (
            <button
              onClick={() => setIsMinimized(true)}
              className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition"
              title="Minimize to floating pill"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Toggle Floating PiP mode */}
          {onToggleFloating && (
            <button
              onClick={onToggleFloating}
              className="h-7 w-7 rounded-lg bg-white/5 hover:bg-primary/20 text-slate-300 hover:text-primary flex items-center justify-center transition"
              title={isFloating ? 'Dock to Dashboard' : 'Pop out floating player'}
            >
              {isFloating ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Video Stream Container (16:9 Aspect Ratio) */}
      <div className="relative aspect-video w-full bg-black overflow-hidden shadow-inner">
        <iframe
          src={embedUrl}
          title="Independent Television YouTube Live Stream"
          className="w-full h-full border-0 absolute inset-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      {/* Bottom Telemetry & Audio Notice Strip */}
      <div className="px-4 py-2 bg-muted/40 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground select-none">
        <div className="flex items-center gap-2 truncate">
          <Radio className="h-3.5 w-3.5 text-primary shrink-0 animate-pulse" />
          <span className="font-semibold text-foreground truncate">
            Independent 24 &bull; National Broadcast
          </span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground shrink-0 hidden sm:inline-block">
          Auto-Plays 24/7 &bull; Unmute anytime
        </span>
      </div>
    </div>
  );
}

export default ITVLivePlayer;
