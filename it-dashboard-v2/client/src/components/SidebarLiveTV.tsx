'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Tv,
  ExternalLink,
  Maximize2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

export function SidebarLiveTV() {
  const [isExpanded, setIsExpanded] = useState(true);
  const liveVideoId = 'iWq2kH0iq2Q';
  const embedUrl = `https://www.youtube-nocookie.com/embed/${liveVideoId}?autoplay=1&mute=1&playsinline=1&controls=1&rel=0&modestbranding=1`;

  return (
    <div className="border-t border-border/70 bg-gradient-to-b from-card/40 to-card/90">
      {/* Header bar */}
      <div className="px-3.5 py-2 flex items-center justify-between text-xs font-semibold select-none">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
          </span>
          <div className="flex items-center gap-1.5 truncate">
            <Tv className="h-3.5 w-3.5 text-red-500 shrink-0" />
            <span className="font-bold text-[11px] tracking-wide text-foreground truncate">
              LIVE TV
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-red-500/15 text-red-500 font-mono font-extrabold uppercase shrink-0">
              ON-AIR
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Link to dedicated /live page */}
          <Link
            href="/live"
            className="h-6 w-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition"
            title="Open Dedicated Full Live TV Studio"
          >
            <Maximize2 className="h-3 w-3" />
          </Link>

          {/* YouTube external link */}
          <a
            href={`https://www.youtube.com/watch?v=${liveVideoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-6 w-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition"
            title="Open in YouTube"
          >
            <ExternalLink className="h-3 w-3" />
          </a>

          {/* Toggle Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition"
            title={isExpanded ? 'Collapse Player' : 'Expand Player'}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Video stream container */}
      {isExpanded && (
        <div className="px-3 pb-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border/80 bg-black shadow-md group">
            <iframe
              src={embedUrl}
              title="Independent TV Live Stream"
              className="w-full h-full border-0 absolute inset-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          {/* Mini info badge under the video */}
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1 truncate font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Independent 24 &bull; 1080p
            </span>
            <Link
              href="/live"
              className="text-primary hover:underline font-semibold shrink-0"
            >
              Theater Mode &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
