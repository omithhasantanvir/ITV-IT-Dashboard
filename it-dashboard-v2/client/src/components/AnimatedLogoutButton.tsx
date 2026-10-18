'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface AnimatedLogoutButtonProps {
  onClick?: () => void;
  className?: string;
  label?: string;
  variant?: 'dropdown' | 'sidebar' | 'standalone';
}

export function AnimatedLogoutButton({
  onClick,
  className,
  label = 'Sign Out',
  variant = 'dropdown',
}: AnimatedLogoutButtonProps) {
  const { logout } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isFalling, setIsFalling] = useState(false);
  const [doorSlammed, setDoorSlammed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [fallingCoords, setFallingCoords] = useState<{ x: number; y: number } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const characterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isFalling) return;

    // Grab precise viewport coordinates of the character or button
    if (characterRef.current) {
      const rect = characterRef.current.getBoundingClientRect();
      setFallingCoords({ x: rect.left, y: rect.top });
    } else if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setFallingCoords({ x: rect.right - 28, y: rect.top + rect.height / 2 - 10 });
    }

    setIsFalling(true);

    // After 140ms of stepping out, the door slams shut behind him with a BANG
    setTimeout(() => {
      setDoorSlammed(true);
    }, 140);

    // After tumbling all the way to the bottom of the screen (~920ms), trigger logout
    setTimeout(() => {
      if (onClick) {
        onClick();
      } else {
        logout();
      }
    }, 920);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onMouseEnter={() => !isFalling && setIsHovered(true)}
        onMouseLeave={() => !isFalling && setIsHovered(false)}
        className={cn(
          'group relative flex items-center justify-between rounded-lg font-medium transition-all duration-300 cursor-pointer select-none overflow-hidden active:scale-[0.98]',
          variant === 'dropdown' &&
            'w-full px-3 py-2 bg-slate-900/90 hover:bg-slate-900 text-white border border-slate-700/70 hover:border-primary/60 shadow-sm hover:shadow-md hover:shadow-primary/20 text-xs',
          variant === 'sidebar' &&
            'w-full px-4 py-2.5 bg-gradient-to-r from-slate-900 to-slate-950 hover:from-slate-850 hover:to-slate-900 text-white border border-slate-800 hover:border-primary/50 shadow-xs hover:shadow-md hover:shadow-primary/15 text-xs',
          variant === 'standalone' &&
            'px-5 py-2.5 bg-slate-900 hover:bg-slate-850 text-white border border-slate-700 hover:border-primary shadow-md text-sm',
          isFalling && 'opacity-90 pointer-events-none border-primary/80 shadow-primary/30',
          className
        )}
        aria-label={label}
      >
        {/* Subtle ambient hover background glow */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-r from-red-600/10 via-rose-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none',
            isFalling && 'opacity-100 from-red-600/20 via-rose-500/20 to-orange-500/20'
          )}
        />

        {/* Button Text */}
        <div className="flex items-center gap-2 relative z-10">
          <span
            className={cn(
              'font-semibold tracking-wide transition-all duration-300',
              isHovered ? '-translate-x-0.5 text-red-200' : 'text-slate-100',
              isFalling && 'text-red-400'
            )}
          >
            {isFalling ? 'Signing Out...' : label}
          </span>
        </div>

        {/* 3D Animated Doorway & Character Component */}
        <div className="relative flex items-center justify-center shrink-0 pl-3">
          {/* Perspective container */}
          <div
            className={cn(
              'relative w-6 h-8 rounded-md transition-transform',
              doorSlammed && 'animate-door-slam'
            )}
            style={{
              perspective: '220px',
              perspectiveOrigin: '20% 50%',
            }}
          >
            {/* Doorway Frame & Interior Light Cavity */}
            <div
              className={cn(
                'absolute inset-0 rounded-[4px] border-2 transition-all duration-300 overflow-hidden flex items-center justify-center',
                !doorSlammed && (isHovered || isFalling)
                  ? 'border-red-500 bg-slate-950 shadow-[inset_0_0_8px_rgba(239,68,68,0.7)]'
                  : 'border-slate-600 bg-slate-950/80'
              )}
            >
              {/* Interior glowing aperture when door is open */}
              <div
                className={cn(
                  'absolute inset-0 bg-[radial-gradient(ellipse_at_35%_50%,rgba(239,68,68,0.85)_0%,rgba(220,38,38,0.45)_55%,rgba(15,23,42,0.9)_100%)] transition-opacity duration-200',
                  !doorSlammed && (isHovered || isFalling) ? 'opacity-100 animate-door-light' : 'opacity-0'
                )}
              />

              {/* Threshold Floor Beam */}
              <div
                className={cn(
                  'absolute -bottom-1 -right-2 w-7 h-3 bg-red-500/40 blur-[3px] rounded-full transition-opacity duration-200 pointer-events-none',
                  !doorSlammed && (isHovered || isFalling) ? 'opacity-100' : 'opacity-0'
                )}
              />
            </div>

            {/* 3D Hinged Door */}
            <div
              className={cn(
                'absolute inset-0 rounded-[3px] bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 border border-blue-400/60 shadow-md origin-left ease-out transition-transform',
                doorSlammed
                  ? 'rotate-0 duration-150 ease-in'
                  : isHovered || isFalling
                  ? 'rotate-[-62deg] duration-300'
                  : 'rotate-0 duration-300'
              )}
              style={{
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                transformOrigin: 'left center',
              }}
            >
              {/* Door Panel Insets */}
              <div className="absolute inset-0.5 rounded-[2px] flex flex-col justify-between p-0.5 border border-white/20">
                <div className="h-2 rounded-[1.5px] bg-white/10" />
                <div className="h-2.5 rounded-[1.5px] bg-white/10" />
              </div>

              {/* Brass Metallic Door Knob */}
              <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-300 border border-amber-500 shadow-[0_0_4px_#f59e0b]" />
            </div>

            {/* Comic BANG burst when door slams */}
            {doorSlammed && (
              <div className="absolute -top-1 -right-2 pointer-events-none z-30 animate-bang">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-300 drop-shadow-[0_0_4px_#f59e0b]" fill="currentColor">
                  <polygon points="12,1 15,8 23,9 17,14 19,22 12,18 5,22 7,14 1,9 9,8" />
                </svg>
              </div>
            )}

            {/* Regular in-button walking character (visible on hover, hides once falling starts) */}
            <div
              ref={characterRef}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 left-1 z-20 pointer-events-none transition-all',
                isFalling
                  ? 'opacity-0'
                  : isHovered
                  ? 'translate-x-3.5 opacity-100 duration-300 ease-out'
                  : '-translate-x-1.5 opacity-0 scale-75 duration-200'
              )}
            >
              <WalkingPerson isWalking={isHovered} />
            </div>
          </div>
        </div>
      </button>

      {/* Global Falling Portal: Character falls completely off the screen to the bottom of website */}
      {isMounted &&
        isFalling &&
        fallingCoords &&
        createPortal(
          <div
            className="fixed pointer-events-none z-[999999]"
            style={{
              left: `${fallingCoords.x}px`,
              top: `${fallingCoords.y}px`,
            }}
          >
            <div className="animate-gravity-fall">
              <PanickingFallingPerson />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

/**
 * Standard Walking Silhouette Character
 */
function WalkingPerson({ isWalking }: { isWalking: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(
        'w-4 h-4 text-white filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] overflow-visible',
        isWalking && 'animate-walk-bob'
      )}
      fill="currentColor"
    >
      <circle cx="12" cy="4.2" r="2.2" />
      <path d="M10.8 7.2 H13.2 V13.5 H10.8 Z" rx="0.8" />
      <g className={cn(isWalking && 'animate-arm-left')}>
        <path d="M10.8 7.8 L7.6 11.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </g>
      <g className={cn(isWalking && 'animate-arm-right')}>
        <path d="M13.2 7.8 L16.4 11.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </g>
      <g className={cn(isWalking && 'animate-leg-left')}>
        <path d="M11.2 13.5 L8.8 19.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </g>
      <g className={cn(isWalking && 'animate-leg-right')}>
        <path d="M12.8 13.5 L15.2 19.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/**
 * Panicking / Flailing Silhouette Character Tumbling Downwards
 */
function PanickingFallingPerson() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5 text-white filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] overflow-visible"
      fill="currentColor"
    >
      {/* Head */}
      <circle cx="12" cy="4.2" r="2.3" />

      {/* Torso */}
      <path d="M10.8 7.2 H13.2 V13.5 H10.8 Z" rx="0.8" />

      {/* Frantically flailing arms thrown up into the air */}
      <g className="animate-arm-flail-left">
        <path d="M10.8 7.8 L6.2 3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </g>
      <g className="animate-arm-flail-right">
        <path d="M13.2 7.8 L17.8 3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </g>

      {/* Frantically kicking legs */}
      <g className="animate-leg-flail-left">
        <path d="M11.2 13.5 L7.2 20.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g className="animate-leg-flail-right">
        <path d="M12.8 13.5 L16.8 20.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
