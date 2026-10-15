'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Radio,
  Sparkles,
  Flame,
  Pause,
  Play,
  Volume2,
  Tv,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TickerItem {
  id: string;
  tag: string;
  tagColor?: string;
  text: string;
  link?: string;
}

const DEFAULT_NEWS_ITEMS: TickerItem[] = [
  {
    id: '1',
    tag: 'লাইভ সম্প্রচার',
    tagColor: 'bg-red-500',
    text: 'ইন্ডিপেন্ডেন্ট টেলিভিশন ২৪ ঘণ্টা সরাসরি সম্প্রচার চলছে • চোখ রাখুন পর্দায়',
    link: '/live',
  },
  {
    id: '2',
    tag: 'BS-1 SATELLITE',
    tagColor: 'bg-emerald-500',
    text: 'বঙ্গবন্ধু স্যাটেলাইট-১ (BS-1 @ 93.5°E) আপলিংক ও ডিজিটাল ব্রডকাস্ট স্ট্রিম ১০০% সচল',
    link: '/servers',
  },
  {
    id: '3',
    tag: 'MCR & IT OPERATIONS',
    tagColor: 'bg-blue-500',
    text: 'সেন্ট্রাল ডাটা সেন্টার, কোর নিউজরুম সার্ভার ও গ্রাস ভ্যালি প্লেআউট সিস্টেম সম্পূর্ণ সক্রিয়',
    link: '/servers',
  },
  {
    id: '4',
    tag: 'DUTY ROSTER',
    tagColor: 'bg-amber-500',
    text: 'আইটি সাপোর্ট ও ব্রডকাস্ট টেকনিক্যাল টিম ২৪/৭ শিফট রোস্টার অনুযায়ী দায়িত্বে নিয়োজিত',
    link: '/roster',
  },
  {
    id: '5',
    tag: 'INDEPENDENT 24',
    tagColor: 'bg-purple-500',
    text: 'সবার আগে সর্বশেষ সঠিক দেশ-বিদেশের সংবাদ ও বিশ্লেষণ • Independent Television',
    link: 'https://independent24.com',
  },
  {
    id: '6',
    tag: 'ASSET MANAGEMENT',
    tagColor: 'bg-rose-500',
    text: 'নতুন কর্মী আইটি ইকুইপমেন্ট ও কম্পিউটার অ্যাসেট অ্যালোকেশন ডিজিটাল ট্র্যাকিং চালু রয়েছে',
    link: '/slips',
  },
];

export function NewsTicker({ className }: { className?: string }) {
  const [isPaused, setIsPaused] = useState(false);
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn(
        'h-9 bg-slate-950 text-white border-b border-red-500/25 flex items-center relative overflow-hidden select-none z-10 shadow-sm',
        className
      )}
    >
      {/* Left Badge: BREAKING / LIVE BULLETIN */}
      <div className="h-full px-3.5 bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center gap-2 font-black text-[11px] tracking-wider uppercase shrink-0 z-20 shadow-[4px_0_12px_rgba(220,38,38,0.4)]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
        <Flame className="h-3.5 w-3.5 fill-white text-white shrink-0 animate-pulse" />
        <span className="font-mono">LIVE BULLETIN</span>
      </div>

      {/* Scrolling Ticker Track */}
      <div
        className="flex-1 overflow-hidden relative h-full flex items-center group cursor-default"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className={cn(
            'flex items-center gap-8 whitespace-nowrap will-change-transform animate-itv-ticker',
            isPaused && '[animation-play-state:paused]'
          )}
          style={{ animationDuration: '40s' }}
        >
          {/* Duplicate twice to ensure seamless continuous infinite scrolling */}
          {[...DEFAULT_NEWS_ITEMS, ...DEFAULT_NEWS_ITEMS].map((item, idx) => {
            const isExternal = item.link?.startsWith('http');
            const content = (
              <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-200 hover:text-white transition">
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded text-[9px] font-extrabold font-mono text-white tracking-wider uppercase',
                    item.tagColor || 'bg-red-500'
                  )}
                >
                  {item.tag}
                </span>
                <span className="tracking-wide">{item.text}</span>
                <span className="text-red-500 font-bold ml-4">◆</span>
              </span>
            );

            if (item.link) {
              return isExternal ? (
                <a
                  key={`${item.id}-${idx}`}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center"
                >
                  {content}
                </a>
              ) : (
                <Link key={`${item.id}-${idx}`} href={item.link} className="hover:underline flex items-center">
                  {content}
                </Link>
              );
            }

            return <span key={`${item.id}-${idx}`}>{content}</span>;
          })}
        </div>
      </div>

      {/* Right Controls: Play/Pause & Live Clock */}
      <div className="h-full px-3 bg-slate-950/95 border-l border-white/10 flex items-center gap-2.5 text-xs shrink-0 z-20">
        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="h-6 w-6 rounded-md hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition"
          title={isPaused ? 'Resume Ticker Scroll' : 'Pause Ticker Scroll'}
        >
          {isPaused ? <Play className="h-3 w-3 fill-current" /> : <Pause className="h-3 w-3 fill-current" />}
        </button>

        {/* Live Clock */}
        {timeStr && (
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-slate-300 font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10">
            <Clock className="h-3 w-3 text-red-400 shrink-0" />
            <span>{timeStr}</span>
          </div>
        )}
      </div>
    </div>
  );
}
