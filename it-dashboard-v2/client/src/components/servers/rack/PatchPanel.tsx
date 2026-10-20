'use client';

import React from 'react';
import { RackEquipment, U_HEIGHT_PX } from './RackTypes';

interface PatchPanelProps {
  equipment: RackEquipment;
}

export const PatchPanel: React.FC<PatchPanelProps> = ({ equipment }) => {
  const isFiber = equipment.model.toLowerCase().includes('fiber') || equipment.model.toLowerCase().includes('om4');

  return (
    <div
      style={{ height: `${equipment.uHeight * U_HEIGHT_PX}px` }}
      className="w-full relative px-1 py-0.5 border-b border-zinc-800/80 transition-all select-none overflow-hidden min-w-0"
    >
      <div className="w-full h-full rounded-[2px] bg-gradient-to-r from-[#14151a] via-[#0d0e12] to-[#14151a] border border-zinc-700/80 flex items-center justify-between px-1.5 shadow-inner overflow-hidden">
        {/* Left Rack Ear */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="w-2.5 h-full py-0.5 flex flex-col justify-between items-center bg-[#242730] rounded-[1px] border border-zinc-600 shadow-sm shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900" />
          </div>
          <span className="text-[7px] font-mono text-zinc-400 font-bold uppercase tracking-wider pl-1 hidden sm:inline">
            {isFiber ? 'OM4 FIBER' : 'CAT6A PATCH'}
          </span>
        </div>

        {/* 24x Port Matrix with Draped Patch Leads */}
        <div className="flex-1 min-w-0 mx-1 sm:mx-2 h-full py-0.5 flex items-center justify-center relative overflow-hidden">
          <div className="flex items-center gap-1 bg-[#08080b] p-0.5 rounded border border-zinc-800/90 shadow-inner">
            {Array.from({ length: 4 }).map((_, blockIdx) => (
              <div key={blockIdx} className="flex items-center gap-[2px] px-1 border-r border-zinc-800 last:border-0">
                {Array.from({ length: 6 }).map((_, portIdx) => {
                  const portNum = blockIdx * 6 + portIdx + 1;
                  // Color coding: Blue (Cat6A), Yellow (Mgmt), Aqua (Fiber), Red (Critical)
                  const patchColors = ['#22d3ee', '#3b82f6', '#eab308', '#ef4444'];
                  const color = patchColors[(blockIdx + portIdx) % patchColors.length];

                  return (
                    <div
                      key={portNum}
                      className="w-2 h-3 rounded-[1px] bg-[#121318] border border-zinc-700 flex flex-col justify-between items-center p-[1px]"
                      title={`Patch Port ${portNum}`}
                    >
                      <span className="text-[5px] font-mono text-zinc-500 leading-none">{portNum}</span>
                      <div
                        className="w-1.5 h-1 rounded-sm shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Draped Patch Cord Curves */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80" preserveAspectRatio="none">
            <path
              d="M 60,18 Q 110,32 160,18"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M 120,18 Q 170,30 220,18"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M 180,18 Q 230,32 280,18"
              fill="none"
              stroke="#eab308"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Right Ear */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[6.5px] font-mono text-zinc-500 font-bold pr-1 hidden sm:inline">24-PORT</span>
          <div className="w-2.5 h-full py-0.5 flex flex-col justify-between items-center bg-[#242730] rounded-[1px] border border-zinc-600 shadow-sm shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900" />
          </div>
        </div>
      </div>
    </div>
  );
};
