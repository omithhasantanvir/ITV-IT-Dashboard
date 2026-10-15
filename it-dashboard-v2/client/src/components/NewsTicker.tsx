'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Pause,
  Play,
  Clock,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsItem {
  id: string;
  category: string;
  title: string;
  link?: string;
}

const INITIAL_ITV_HEADLINES: NewsItem[] = [
  { id: '1', category: 'জাতীয়', title: 'ফ্যাসিবাদের আমলে স্বজনপ্রীতি-দুর্নীতিতে সব প্রতিষ্ঠান ধ্বংস হয়েছে: রাষ্ট্রপতি', link: 'https://www.itvbd.com/national' },
  { id: '2', category: 'স্বাস্থ্য', title: 'ডেঙ্গুতে আরও ১০ জনের মৃত্যু, হাসপাতালে চিকিৎসা নিচ্ছেন সহস্রাধিক রোগী', link: 'https://www.itvbd.com/health' },
  { id: '3', category: 'অর্থনীতি', title: 'সোলার ব্যবহারে ২০ শতাংশ পর্যন্ত বিদ্যুৎ সাশ্রয় সম্ভব: ক্যাব', link: 'https://www.itvbd.com/economy' },
  { id: '4', category: 'আন্তর্জাতিক', title: 'ইরানের পারমাণবিক স্থাপনা নিশ্চিহ্নে আমেরিকার পরিকল্পনা ফাঁস', link: 'https://www.itvbd.com/world' },
  { id: '5', category: 'অর্থনীতি', title: 'নভেম্বরেই জাতীয় গ্রিডে যুক্ত হতে পারে রূপপুর পারমাণবিক বিদ্যুৎকেন্দ্র', link: 'https://www.itvbd.com/economy' },
  { id: '6', category: 'রাজনীতি', title: '২৪ এর বিপ্লবীরাই ওই আন্দোলনকে ধ্বংস করেছে: শামীম হায়দার পাটোয়ারী', link: 'https://www.itvbd.com/politics' },
  { id: '7', category: 'আইন-আদালত', title: 'শেখ হাসিনার দুর্নীতির মামলার অগ্রগতি দ্রুত দৃশ্যমান হবে: দুদক মহাপরিচালক', link: 'https://www.itvbd.com/national' },
  { id: '8', category: 'সারাদেশ', title: 'ব্রাহ্মণবাড়িয়ায় বিনা টিকিটের যাত্রী ধরায় হামলা, স্টেশন মাস্টারসহ আহত ২', link: 'https://www.itvbd.com/country' },
  { id: '9', category: 'আন্তর্জাতিক', title: 'মদিনায় ক্ষেপণাস্ত্র হামলার দাবি সৌদি জোটের', link: 'https://www.itvbd.com/world' },
  { id: '10', category: 'স্বাস্থ্য', title: 'ডেঙ্গুর নতুন টিকা নিয়ে বিশেষজ্ঞদের সঙ্গে পর্যালোচনা করছে স্বাস্থ্য মন্ত্রণালয়', link: 'https://www.itvbd.com/health' },
  { id: '11', category: 'লাইভ সম্প্রচার', title: 'ইন্ডিপেন্ডেন্ট টেলিভিশন ২৪ ঘণ্টা সরাসরি সম্প্রচার চলছে • চোখ রাখুন পর্দায়', link: '/live' },
];

export function NewsTicker({ className }: { className?: string }) {
  const [headlines, setHeadlines] = useState<NewsItem[]>(INITIAL_ITV_HEADLINES);
  const [isPaused, setIsPaused] = useState(false);
  const [timeStr, setTimeStr] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Live Bangladesh time update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('bn-BD', {
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

  // Fetch real-time live headlines from our API endpoint
  const fetchLiveNews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/news/ticker');
      if (res.ok) {
        const json = await res.json();
        if (json.items && json.items.length > 0) {
          setHeadlines(json.items);
        }
      }
    } catch {
      // Retain fallback headlines smoothly
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveNews();
    // Refresh headlines every 5 minutes
    const newsTimer = setInterval(fetchLiveNews, 5 * 60 * 1000);
    return () => clearInterval(newsTimer);
  }, []);

  return (
    <div
      className={cn(
        'h-10 bg-[#060c18] text-white border-t-2 border-t-amber-400 border-b border-white/10 flex items-center relative overflow-hidden select-none z-20 shadow-md',
        className
      )}
    >
      {/* ============================================================ */}
      {/* Official YouTube ITV Broadcast Lower-Third Badge            */}
      {/* ============================================================ */}
      <div className="h-full px-3.5 bg-gradient-to-r from-[#e31e24] via-red-600 to-[#b91c1c] text-white flex items-center gap-2 font-black text-xs uppercase shrink-0 z-30 shadow-[3px_0_10px_rgba(227,30,36,0.6)]">
        {/* ITV Logo */}
        <img
          src="/itv-logo.png"
          alt="ITV"
          className="h-5 w-auto object-contain drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
        />

        {/* Pulsing Live Dot */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-90" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
        </span>

        {/* Exact YouTube ITV on-screen title: সংবাদ শিরোনাম */}
        <span className="font-bold tracking-tight text-white font-sans text-xs sm:text-[13px] drop-shadow-xs">
          সংবাদ শিরোনাম
        </span>
      </div>

      {/* ============================================================ */}
      {/* Scrolling Ticker Track (Continuous Marquee)                  */}
      {/* ============================================================ */}
      <div
        className="flex-1 overflow-hidden relative h-full flex items-center group cursor-pointer"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        title="মাউস রাখলে টিকার থেমে যাবে (Hover to Pause)"
      >
        <div
          className={cn(
            'flex items-center gap-10 whitespace-nowrap will-change-transform animate-itv-ticker',
            isPaused && '[animation-play-state:paused]'
          )}
          style={{ animationDuration: '45s' }}
        >
          {/* Duplicated array for seamless continuous loop */}
          {[...headlines, ...headlines].map((item, idx) => {
            const isExternal = item.link?.startsWith('http');
            const content = (
              <span className="inline-flex items-center gap-2.5 text-xs sm:text-[13px] font-medium text-slate-100 hover:text-white transition">
                {/* Yellow Category Tag (Matching TV Broadcast) */}
                <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40 text-[10px] tracking-wide">
                  [{item.category || 'সংবাদ'}]
                </span>

                {/* News Title */}
                <span className="font-normal text-white drop-shadow-xs">
                  {item.title}
                </span>

                {/* Broadcast Diamond Separator */}
                <span className="text-red-500 font-black text-xs ml-3 select-none">
                  ❖
                </span>
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

      {/* ============================================================ */}
      {/* Right Controls: Play/Pause, Reload & Bengali Clock          */}
      {/* ============================================================ */}
      <div className="h-full px-3 bg-[#060c18]/95 border-l border-white/10 flex items-center gap-2 text-xs shrink-0 z-30">
        {/* Refresh latest headlines */}
        <button
          onClick={fetchLiveNews}
          disabled={loading}
          className="h-6 w-6 rounded-md hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition"
          title="তাজা সংবাদ রিফ্রেশ করুন (Reload Headlines)"
        >
          <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin text-amber-400')} />
        </button>

        {/* Pause / Resume Ticker */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="h-6 w-6 rounded-md hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition"
          title={isPaused ? 'টিকার চালু করুন (Resume)' : 'টিকার থামান (Pause)'}
        >
          {isPaused ? <Play className="h-3 w-3 fill-current text-emerald-400" /> : <Pause className="h-3 w-3 fill-current" />}
        </button>

        {/* Live Bangladesh Time */}
        {timeStr && (
          <div className="hidden md:flex items-center gap-1.5 font-mono text-[11px] text-amber-300 font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10">
            <Clock className="h-3 w-3 text-red-500 shrink-0" />
            <span>{timeStr}</span>
          </div>
        )}
      </div>
    </div>
  );
}
