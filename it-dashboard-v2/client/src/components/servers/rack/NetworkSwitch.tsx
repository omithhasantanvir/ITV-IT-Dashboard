'use client';

import React from 'react';
import { RackEquipment, U_HEIGHT_PX } from './RackTypes';

interface NetworkSwitchProps {
  equipment: RackEquipment;
}

export const NetworkSwitch: React.FC<NetworkSwitchProps> = ({ equipment }) => {
  const isCisco = equipment.vendor === 'Cisco';

  return (
    <div
      style={{ height: `${equipment.uHeight * U_HEIGHT_PX}px` }}
      className="w-full relative px-1 py-0.5 border-b border-zinc-800/80 transition-all select-none overflow-hidden min-w-0"
    >
      <div className="w-full h-full rounded-[2px] bg-gradient-to-r from-[#171a22] via-[#101217] to-[#171a22] border border-zinc-700/80 flex items-center justify-between px-1.5 shadow-inner overflow-hidden">
        {/* Left Rack Ear */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="w-2.5 h-full py-0.5 flex flex-col justify-between items-center bg-[#242730] rounded-[1px] border border-zinc-600 shadow-sm shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900" />
          </div>

          {/* Model Tag */}
          <div className="flex flex-col leading-none pl-1">
            <span className="text-[8px] font-mono font-black text-cyan-400 tracking-wider">
              {isCisco ? 'CISCO' : 'ARISTA'}
            </span>
            <span className="text-[6.5px] font-mono text-zinc-400 font-bold truncate max-w-[70px] sm:max-w-[85px]">
              {equipment.model}
            </span>
          </div>
        </div>

        {/* 48x RJ45 Switch Ports Array (arranged in 2 rows of 24) */}
        <div className="flex-1 min-w-0 mx-1 sm:mx-2 h-full py-0.5 flex items-center justify-center overflow-hidden">
          <div className="bg-[#08090c] p-0.5 rounded border border-zinc-800 flex items-center gap-1 shadow-inner overflow-hidden">
            {/* Block 1 (Ports 1-24) */}
            <div className="flex flex-col gap-[2px]">
              <div className="flex items-center gap-[2px]">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-[1px] bg-[#12141a] border border-zinc-700/80 flex flex-col justify-between p-[1px]"
                    title={`Port ${i * 2 + 1}: 10G Link Active`}
                  >
                    <div className="w-full h-[2px] bg-emerald-400 animate-pulse" />
                    <div className="w-full h-[2px] bg-zinc-800" />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-[2px]">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-[1px] bg-[#12141a] border border-zinc-700/80 flex flex-col justify-between p-[1px]"
                    title={`Port ${i * 2 + 2}: 10G Link Active`}
                  >
                    <div className="w-full h-[2px] bg-emerald-400" />
                    <div className="w-full h-[2px] bg-zinc-800" />
                  </div>
                ))}
              </div>
            </div>

            {/* Block 2 (Ports 25-48) */}
            <div className="flex flex-col gap-[2px]">
              <div className="flex items-center gap-[2px]">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-[1px] bg-[#12141a] border border-zinc-700/80 flex flex-col justify-between p-[1px]"
                    title={`Port ${i * 2 + 25}: 10G Link Active`}
                  >
                    <div className={`w-full h-[2px] ${i % 3 === 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                    <div className="w-full h-[2px] bg-zinc-800" />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-[2px]">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-[1px] bg-[#12141a] border border-zinc-700/80 flex flex-col justify-between p-[1px]"
                    title={`Port ${i * 2 + 26}: 10G Link Active`}
                  >
                    <div className="w-full h-[2px] bg-emerald-400" />
                    <div className="w-full h-[2px] bg-zinc-800" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Optical SFP+ Cages & Right Ear */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 4x 10G/40G Optical SFP+ Ports */}
          <div className="flex items-center gap-0.5 bg-[#090a0d] p-0.5 rounded border border-zinc-800">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-2.5 h-3.5 rounded-[1px] bg-zinc-900 border border-cyan-500/60 flex flex-col items-center justify-between p-0.5 shadow-[0_0_3px_rgba(6,182,212,0.3)]"
                title={`SFP+ Optical Uplink ${i + 1}`}
              >
                <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[5px] text-zinc-400 font-mono">10G</span>
              </div>
            ))}
          </div>

          {/* Right Rack Ear */}
          <div className="w-2.5 h-full py-0.5 flex flex-col justify-between items-center bg-[#242730] rounded-[1px] border border-zinc-600 shadow-sm shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900" />
          </div>
        </div>
      </div>
    </div>
  );
};
