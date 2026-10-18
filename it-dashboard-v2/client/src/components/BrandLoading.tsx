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
      ? { box: 'h-6 w-6', img: 'h-3.5', ring: '-inset-0.5 border' }
      : size === 'lg'
      ? { box: 'h-11 w-11', img: 'h-7', ring: '-inset-1.5 border-2' }
      : { box: 'h-8 w-8', img: 'h-5', ring: '-inset-1 border-2' };

  return (
    <div className={cn('relative inline-flex items-center justify-center shrink-0 select-none', className)}>
      {/* Spinning Crimson Accent Ring */}
      <div
        className={cn(
          'absolute rounded-full border-primary/20 border-t-primary animate-spin [animation-duration:1.2s]',
          dimensions.ring
        )}
      />

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

  // 3. FULLSCREEN MODE (Whole page loads & auth checks)
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl p-6 min-h-screen select-none animate-in fade-in duration-200',
        className
      )}
    >
      {/* Background Soft Glow */}
      <div className="absolute w-44 h-44 rounded-full bg-primary/15 blur-2xl pointer-events-none -z-10 animate-pulse" />

      {/* Animated Logo */}
      <div className="relative flex items-center justify-center">
        {/* Outer Orbit Spinning Ring */}
        <div className="absolute -inset-2.5 rounded-full border-2 border-primary/20 border-t-primary border-r-primary/70 animate-spin [animation-duration:1.6s]" />

        {/* Center ITV Logo Card */}
        <div className="relative h-16 w-16 rounded-2xl bg-card border border-border shadow-2xl flex items-center justify-center p-2.5 animate-pulse">
          <img
            src="/itv-logo.png"
            alt="Independent Television Logo"
            className="h-10 w-auto object-contain drop-shadow-[0_2px_8px_rgba(227,30,36,0.6)]"
          />
        </div>
      </div>

      {/* Brand Identity Typography */}
      <div className="flex flex-col items-center mt-5 text-center">
        <span className="text-[11px] font-black tracking-[0.3em] text-foreground uppercase font-sans">
          INDEPENDENT
        </span>
        <span className="text-[9px] font-mono tracking-widest text-primary font-bold uppercase mt-0.5">
          TELEVISION
        </span>
      </div>

      {/* Status Text */}
      {text && (
        <p className="text-xs text-muted-foreground font-medium mt-3 tracking-wide text-center">
          {text}
        </p>
      )}
      {subtext && (
        <p className="text-[10px] text-muted-foreground/75 font-mono mt-1 tracking-wide text-center">
          {subtext}
        </p>
      )}
    </div>
  );
}

export default BrandLoading;
