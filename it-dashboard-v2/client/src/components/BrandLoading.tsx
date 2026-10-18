'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface BrandLoadingProps {
  size?: 'inline' | 'sm' | 'md' | 'fullscreen';
  text?: string;
  subtext?: string;
  className?: string;
}

/**
 * Compact animated ITV logo spinner for inline use
 */
export function ITVLogoSpinner({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const dimensions =
    size === 'sm'
      ? { box: 'h-6 w-6', img: 'h-3.5' }
      : size === 'lg'
      ? { box: 'h-11 w-11', img: 'h-7' }
      : { box: 'h-8 w-8', img: 'h-5' };

  return (
    <div className={cn('relative inline-flex items-center justify-center shrink-0 select-none', className)}>
      {/* ITV Logo Container */}
      <div
        className={cn(
          'rounded-full bg-card border border-border/80 flex items-center justify-center shadow-xs',
          dimensions.box
        )}
      >
        <img
          src="/itv-logo.png"
          alt="ITV Loading"
          className={cn('w-auto object-contain animate-pulse select-none drop-shadow-[0_1px_4px_rgba(227,30,36,0.5)]', dimensions.img)}
        />
      </div>
    </div>
  );
}

/**
 * Main BrandLoading component supporting inline (table rows, cards) and fullscreen modes
 */
export function BrandLoading({
  size = 'inline',
  text,
  subtext,
  className,
}: BrandLoadingProps) {
  // 1. INLINE MODE (Exact replacement for marked table row spinners)
  if (size === 'inline') {
    return (
      <div className={cn('inline-flex items-center justify-center gap-2.5 py-4 text-xs select-none animate-in fade-in', className)}>
        <ITVLogoSpinner size="md" />
        {text && <span className="font-semibold text-muted-foreground">{text}</span>}
      </div>
    );
  }

  // 2. COMPACT STACKED MODE
  if (size === 'sm' || size === 'md') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-2 py-6 select-none animate-in fade-in', className)}>
        <ITVLogoSpinner size={size === 'sm' ? 'sm' : 'lg'} />
        {text && <span className="text-xs font-semibold text-muted-foreground mt-1">{text}</span>}
      </div>
    );
  }

  // 3. FULLSCREEN MODE (Clean logo-only with skeleton shimmer wave matching Light & Dark themes)
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/95 dark:bg-background/95 backdrop-blur-xl p-6 min-h-screen select-none animate-in fade-in duration-200 transition-colors',
        className
      )}
    >
      {/* Background Ambient Glow */}
      <div className="absolute w-56 h-56 rounded-full bg-rose-500/15 dark:bg-primary/20 blur-3xl pointer-events-none -z-10 animate-pulse [animation-duration:3s]" />

      {/* Animated Logo Container with Skeleton Shimmer Sweep (No spinner) */}
      <div className="relative flex items-center justify-center">
        {/* Center ITV Logo Card with Skeleton Effect matching Light & Dark themes */}
        <div className="relative h-20 w-20 sm:h-22 sm:w-22 rounded-2xl bg-white dark:bg-card border border-slate-200/90 dark:border-border shadow-[0_10px_35px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_45px_rgba(0,0,0,0.7)] flex items-center justify-center p-3.5 sm:p-4 overflow-hidden select-none transition-colors">
          {/* ITV Logo */}
          <img
            src="/itv-logo.png"
            alt="ITV Logo"
            className="h-11 w-auto object-contain select-none drop-shadow-[0_2px_8px_rgba(227,30,36,0.35)] dark:drop-shadow-[0_2px_12px_rgba(227,30,36,0.55)] relative z-10"
          />

          {/* Skeleton Shimmer Wave Passing Over the Logo */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-20">
            {/* Silvery sweep for light mode, radiant glow for dark mode */}
            <div className="absolute -inset-full animate-skeleton-sweep bg-gradient-to-r from-transparent via-slate-400/35 dark:via-white/30 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrandLoading;
