'use client';

import React from 'react';
import { RackEquipment, U_HEIGHT_PX } from './RackTypes';
import { Database, HardDrive } from 'lucide-react';

interface StorageArrayProps {
  equipment: RackEquipment;
}

export const StorageArray: React.FC<StorageArrayProps> = ({ equipment }) => {
  const heightPx = equipment.uHeight * U_HEIGHT_PX;
  const is4U = equipment.uHeight >= 4;
  const driveCount = equipment.driveBayCount || (is4U ? 24 : 12);
  const rows = is4U ? 4 : 2;
  const cols = Math.ceil(driveCount / rows);

  return (
    <div
      style={{ height: `${heightPx}px` }}
      className="w-full relative px-1 py-0.5 border-b border-zinc-800/80 transition-all select-none"
    >
      <div className="w-full h-full rounded-[2px] bg-gradient-to-r from-[#171922] via-[#0f1015] to-[#171922] border border-zinc-700/80 flex items-center justify-between px-1.5 shadow-inner overflow-hidden">
        {/* Left Mounting Ear & Handle */}
        <div className="flex items-center gap-1 shrink-0 h-full py-1">
          <div className="w-2.5 h-full py-0.5 flex flex-col justify-between items-center bg-[#242730] rounded-[1px] border border-zinc-600 shadow-sm shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900" />
          </div>

          <div
            className="w-1.5 sm:w-2 h-full rounded-[1px] border border-zinc-600 shrink-0 shadow-sm"
            style={{
              background: 'linear-gradient(90deg, #9ca3af 0%, #f3f4f6 35%, #e5e7eb 65%, #6b7280 100%)',
            }}
          />

          {/* Left SAN Controller Status Tag */}
          <div className="hidden sm:flex flex-col justify-between h-full py-0.5 text-[6.5px] font-mono leading-tight pl-0.5">
            <span className="text-cyan-400 font-bold flex items-center gap-0.5">
              <Database className="w-2 h-2" />
              SAN ARRAY
            </span>
            <span className="text-zinc-400 font-semibold truncate max-w-[70px]">
              {equipment.vendor}
            </span>
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_3px_#34d399]" />
              <span className="text-[5.5px] text-zinc-500">CTRL A+B OK</span>
            </div>
          </div>
        </div>

        {/* High-Density Drive Caddy Matrix */}
        <div className="flex-1 mx-2 h-full py-1 flex items-center justify-center">
          <div className="w-full h-full bg-[#07080a] p-1 rounded border border-zinc-800 flex flex-col justify-between shadow-inner">
            {Array.from({ length: rows }).map((_, rIdx) => (
              <div key={rIdx} className="flex-1 flex items-center gap-1 justify-between my-[1px]">
                {Array.from({ length: cols }).map((_, cIdx) => {
                  const bayNum = rIdx * cols + cIdx + 1;
                  return (
                    <div
                      key={bayNum}
                      className="flex-1 h-full min-h-[10px] rounded-[1px] bg-[#161822] border border-zinc-700/80 flex items-center justify-between px-1 shadow-sm"
                      title={`SAS Hot-Swap Drive ${bayNum}: Online • RAID-6`}
                    >
                      {/* Release Latch */}
                      <div className="w-1 h-2 rounded-[0.5px] bg-gradient-to-b from-sky-400 to-blue-700 shadow-sm" />
                      {/* Drive Number */}
                      <span className="text-[5.5px] font-mono text-zinc-400 font-bold hidden md:inline">
                        {String(bayNum).padStart(2, '0')}
                      </span>
                      {/* Drive Activity Flicker LED */}
                      <div className="w-1 h-1 rounded-full bg-emerald-400 animate-drive-flicker" />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Right Handle & Ear */}
        <div className="flex items-center gap-1 shrink-0 h-full py-1">
          <div
            className="w-1.5 sm:w-2 h-full rounded-[1px] border border-zinc-600 shrink-0 shadow-sm"
            style={{
              background: 'linear-gradient(90deg, #9ca3af 0%, #f3f4f6 35%, #e5e7eb 65%, #6b7280 100%)',
            }}
          />

          <div className="w-2.5 h-full py-0.5 flex flex-col justify-between items-center bg-[#242730] rounded-[1px] border border-zinc-600 shadow-sm shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900" />
          </div>
        </div>
      </div>
    </div>
  );
};
