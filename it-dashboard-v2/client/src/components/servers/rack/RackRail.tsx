'use client';

import React from 'react';

interface RackRailProps {
  side: 'left' | 'right';
  units?: number;
  highlightedUnits?: number[];
}

/**
 * Standard EIA-310 19-inch Server Rack Vertical Mounting Rail
 * Features authentic square cage-nut holes (3 holes per 1U)
 * and laser-etched silkscreened rack unit numbers (42U down to 1U).
 */
export const RackRail: React.FC<RackRailProps> = ({
  side,
  units = 42,
  highlightedUnits = [],
}) => {
  const isLeft = side === 'left';

  return (
    <div
      className={`absolute inset-y-0 ${
        isLeft ? 'left-0 border-r' : 'right-0 border-l'
      } w-6 sm:w-7 z-20 pointer-events-none select-none flex flex-col bg-gradient-to-b from-[#272932] via-[#1a1b22] to-[#14151a] border-zinc-700/80 shadow-[inset_0_0_4px_rgba(0,0,0,0.8)]`}
    >
      {/* 42U Unit Markings & Cage Nut Holes */}
      {Array.from({ length: units }).map((_, idx) => {
        const uNum = units - idx;
        const isHighlighted = highlightedUnits.includes(uNum);

        return (
          <div
            key={uNum}
            style={{ height: '21px' }}
            className={`w-full h-[21px] flex items-center justify-between px-0.5 sm:px-1 border-b border-zinc-800/80 relative select-none transition-colors duration-150 ${
              isHighlighted ? 'bg-cyan-500/20 text-cyan-300' : 'text-zinc-500'
            }`}
          >
            {/* Left side layout: Number first, then 3 holes */}
            {isLeft ? (
              <>
                {/* 1U Unit Number */}
                <span
                  className={`text-[7px] sm:text-[7.5px] font-mono font-bold tracking-tighter leading-none shrink-0 ${
                    isHighlighted ? 'text-cyan-400 font-black' : 'text-zinc-400/90'
                  }`}
                >
                  {uNum}
                </span>

                {/* 3 Square EIA-310 Cage Nut Holes */}
                <div className="flex flex-col gap-[1.5px] items-center shrink-0">
                  <div className="w-1.5 h-1 sm:w-2 sm:h-1 rounded-[0.5px] bg-[#07080a] border border-zinc-700/80 shadow-[inset_0_1px_1px_rgba(0,0,0,0.9)]" />
                  <div className="w-1.5 h-1 sm:w-2 sm:h-1 rounded-[0.5px] bg-[#07080a] border border-zinc-700/80 shadow-[inset_0_1px_1px_rgba(0,0,0,0.9)]" />
                  <div className="w-1.5 h-1 sm:w-2 sm:h-1 rounded-[0.5px] bg-[#07080a] border border-zinc-700/80 shadow-[inset_0_1px_1px_rgba(0,0,0,0.9)]" />
                </div>
              </>
            ) : (
              /* Right side layout: 3 holes first, then Number */
              <>
                {/* 3 Square EIA-310 Cage Nut Holes */}
                <div className="flex flex-col gap-[1.5px] items-center shrink-0">
                  <div className="w-1.5 h-1 sm:w-2 sm:h-1 rounded-[0.5px] bg-[#07080a] border border-zinc-700/80 shadow-[inset_0_1px_1px_rgba(0,0,0,0.9)]" />
                  <div className="w-1.5 h-1 sm:w-2 sm:h-1 rounded-[0.5px] bg-[#07080a] border border-zinc-700/80 shadow-[inset_0_1px_1px_rgba(0,0,0,0.9)]" />
                  <div className="w-1.5 h-1 sm:w-2 sm:h-1 rounded-[0.5px] bg-[#07080a] border border-zinc-700/80 shadow-[inset_0_1px_1px_rgba(0,0,0,0.9)]" />
                </div>

                {/* 1U Unit Number */}
                <span
                  className={`text-[7px] sm:text-[7.5px] font-mono font-bold tracking-tighter leading-none shrink-0 ${
                    isHighlighted ? 'text-cyan-400 font-black' : 'text-zinc-400/90'
                  }`}
                >
                  {uNum}
                </span>
              </>
            )}

            {/* Subtle horizontal unit separator line */}
            <div className="absolute bottom-0 inset-x-0 h-[1px] bg-zinc-800/80" />
          </div>
        );
      })}
    </div>
  );
};
