'use client';

import React from 'react';
import { RackEquipment, U_HEIGHT_PX } from './RackTypes';
import { Zap, ShieldCheck } from 'lucide-react';

interface PowerEquipmentProps {
  equipment: RackEquipment;
}

export const PowerEquipment: React.FC<PowerEquipmentProps> = ({ equipment }) => {
  const isUps = equipment.category === 'ups';
  const heightPx = equipment.uHeight * U_HEIGHT_PX;

  if (isUps) {
    return (
      <div
        style={{ height: `${heightPx}px` }}
        className="w-full relative px-1 py-0.5 border-b border-zinc-800/80 transition-all select-none overflow-hidden min-w-0"
      >
        <div className="w-full h-full rounded-[2px] bg-gradient-to-r from-[#171821] via-[#0f1015] to-[#171821] border border-zinc-700/80 flex items-center justify-between px-1.5 sm:px-2 shadow-inner overflow-hidden">
          {/* Left Rack Ear */}
          <div className="w-2.5 h-full py-0.5 flex flex-col justify-between items-center bg-[#242730] rounded-[1px] border border-zinc-600 shadow-sm shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900" />
          </div>

          {/* APC Branding & Logo */}
          <div className="flex flex-col leading-none pl-1 shrink-0">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[9px] font-mono font-black text-zinc-100 tracking-wider">
                APC
              </span>
            </div>
            <span className="text-[6.5px] font-mono text-zinc-400 font-bold truncate max-w-[80px]">
              Smart-UPS On-Line
            </span>
          </div>

          {/* Center Digital Blue Backlit Diagnostic LCD Display */}
          <div className="h-full py-1 flex items-center justify-center flex-1 min-w-0 mx-1 sm:mx-2 overflow-hidden">
            <div className="h-full px-2 rounded-[2px] bg-[#030914] border border-cyan-500/40 shadow-[inset_0_0_8px_rgba(6,182,212,0.25)] flex items-center justify-between gap-2 sm:gap-3 font-mono text-[7px] overflow-hidden">
              <div className="flex flex-col leading-tight shrink-0">
                <span className="text-cyan-400 font-bold flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                  ONLINE 3000VA
                </span>
                <span className="text-zinc-300">IN: 230V • OUT: 230V</span>
              </div>

              {/* Load & Battery Bar Meters */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div className="flex flex-col items-center">
                  <span className="text-[6px] text-zinc-400">LOAD</span>
                  <div className="w-10 sm:w-12 h-1.5 bg-zinc-900 rounded-sm border border-zinc-700 overflow-hidden flex">
                    <div className="w-[62%] h-full bg-emerald-400 shadow-[0_0_3px_#34d399]" />
                  </div>
                  <span className="text-[5.5px] text-emerald-400 font-bold">62%</span>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-[6px] text-zinc-400">BATT</span>
                  <div className="w-10 sm:w-12 h-1.5 bg-zinc-900 rounded-sm border border-zinc-700 overflow-hidden flex">
                    <div className="w-full h-full bg-cyan-400 shadow-[0_0_3px_#22d3ee]" />
                  </div>
                  <span className="text-[5.5px] text-cyan-400 font-bold">100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Heavy Battery Bay Door Latch & Right Ear */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-[6.5px] font-mono text-zinc-400">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
              <span>N+1 REDUNDANT</span>
            </div>

            <div className="w-2.5 h-full py-0.5 flex flex-col justify-between items-center bg-[#242730] rounded-[1px] border border-zinc-600 shadow-sm shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PDU Equipment (CyberPower Switched / ATS PDU)
  return (
    <div
      style={{ height: `${heightPx}px` }}
      className="w-full relative px-1 py-0.5 border-b border-zinc-800/80 transition-all select-none overflow-hidden min-w-0"
    >
      <div className="w-full h-full rounded-[2px] bg-gradient-to-r from-[#171821] via-[#0d0e12] to-[#171821] border border-zinc-700/80 flex items-center justify-between px-1.5 sm:px-2 shadow-inner overflow-hidden">
        {/* Left Ear */}
        <div className="w-2.5 h-full py-0.5 flex flex-col justify-between items-center bg-[#242730] rounded-[1px] border border-zinc-600 shadow-sm shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900" />
        </div>

        {/* Master Breaker Switch with Red Guard */}
        <div className="flex items-center gap-1.5 pl-1 shrink-0">
          <div className="h-4 w-5 rounded-[2px] bg-[#7f1d1d] border border-red-500 flex items-center justify-center shadow-inner cursor-pointer" title="Main Breaker 16A">
            <div className="h-1.5 w-2.5 bg-red-500 rounded-sm shadow-sm" />
          </div>
          <div className="flex flex-col text-[6.5px] font-mono leading-tight">
            <span className="text-zinc-200 font-bold">CyberPower PDU</span>
            <span className="text-zinc-400">16A 230V DUAL</span>
          </div>
        </div>

        {/* Current Meter & LED Status */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 justify-center overflow-hidden">
          <div className="px-2 py-0.5 rounded bg-black border border-zinc-700 text-[7px] font-mono flex items-center gap-1.5 shrink-0">
            <span className="text-emerald-400 font-bold">11.4 A</span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-300">2.6 kW</span>
          </div>

          <div className="flex items-center gap-1.5 text-[6.5px] font-mono shrink-0">
            <span className="flex items-center gap-0.5 text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_3px_#34d399]" />
              FEED A
            </span>
            <span className="flex items-center gap-0.5 text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_3px_#34d399]" />
              FEED B
            </span>
          </div>
        </div>

        {/* Right Ear */}
        <div className="w-2.5 h-full py-0.5 flex flex-col justify-between items-center bg-[#242730] rounded-[1px] border border-zinc-600 shadow-sm shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900" />
        </div>
      </div>
    </div>
  );
};
