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

  // 3. FULLSCREEN MODE (Clean logo-only with skeleton shimmer wave)
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl p-6 min-h-screen select-none animate-in fade-in duration-200',
        className
      )}
    >
      {/* Background Ambient Glow */}
      <div className="absolute w-52 h-52 rounded-full bg-primary/20 blur-3xl pointer-events-none -z-10 animate-pulse [animation-duration:3s]" />

      {/* Animated Logo Container with Skeleton Shimmer Sweep (No spinner) */}
      <div className="relative flex items-center justify-center">
        {/* Center ITV Logo Card with Skeleton Effect */}
        <div className="relative h-20 w-20 rounded-2xl bg-card border border-border shadow-2xl flex items-center justify-center p-3.5 overflow-hidden select-none">
          {/* ITV Logo */}
          <img
            src="/itv-logo.png"
            alt="ITV Logo"
            className="h-11 w-auto object-contain select-none drop-shadow-[0_2px_10px_rgba(227,30,36,0.55)] relative z-10"
          />

          {/* Skeleton Shimmer Wave Passing Over the Logo */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-20">
            <div className="absolute -inset-full animate-skeleton-sweep bg-gradient-to-r from-transparent via-white/40 dark:via-white/30 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrandLoading;
