'use client';

import React, { useState } from 'react';
import { Cable, Layers, ShieldCheck, Zap, Activity } from 'lucide-react';

interface CablingTierConfig {
  tier: number;
  label: string;
  category: string;
  vlan: string;
  cableColor: string;
  highlightColor: string;
  bootColor: string;
  isFiber?: boolean;
}

const CABLING_TIERS: CablingTierConfig[] = [
  {
    tier: 1,
    label: 'PATCH PANEL 01 • CORE ENTERPRISE CAT6A',
    category: 'Cat6A U/FTP 10G',
    vlan: 'VLAN 10 • NEWSROOM & ACTIVE DIRECTORY',
    cableColor: '#2563eb', // Royal Blue
    highlightColor: '#93c5fd',
    bootColor: '#1d4ed8',
  },
  {
    tier: 2,
    label: 'PATCH PANEL 02 • DISTRIBUTION CAT6A',
    category: 'Cat6A U/FTP 10G',
    vlan: 'VLAN 20 • BROADCAST IT & NEWS PRODUCTION',
    cableColor: '#2563eb', // Royal Blue
    highlightColor: '#93c5fd',
    bootColor: '#1d4ed8',
  },
  {
    tier: 3,
    label: 'PATCH PANEL 03 • GRASS VALLEY VIDEO IP',
    category: 'Cat6A S/FTP 10G',
    vlan: 'VLAN 30 • SMPTE ST 2110 IP VIDEO',
    cableColor: '#eab308', // Bright Yellow
    highlightColor: '#fef08a',
    bootColor: '#ca8a04',
  },
  {
    tier: 4,
    label: 'PATCH PANEL 04 • REDUNDANT PTP & SAN',
    category: 'Cat6A S/FTP 10G',
    vlan: 'VLAN 40 • HIGH PRIORITY PTP & iSCSI SAN',
    cableColor: '#dc2626', // Bright Red
    highlightColor: '#fca5a5',
    bootColor: '#b91c1c',
  },
  {
    tier: 5,
    label: 'PATCH PANEL 05 • OM4 LASER 10G FIBER',
    category: 'OM4 MTP/LC 50/125µm Multi-Mode',
    vlan: '10G BACKBONE OPTICAL TRUNK',
    cableColor: '#06b6d4', // Bright Aqua Cyan
    highlightColor: '#a5f3fc',
    bootColor: '#0891b2',
    isFiber: true,
  },
];

interface StructuredCablingBayProps {
  rackNumber: string;
  soundEnabled?: boolean;
  onPlaySound?: (type: 'beep' | 'alert' | 'slide' | 'door' | 'key' | 'grant' | 'deny') => void;
}

export function StructuredCablingBay({ rackNumber, soundEnabled, onPlaySound }: StructuredCablingBayProps) {
  const [hoveredTier, setHoveredTier] = useState<number | null>(null);

  return (
    <div className="w-full h-full p-1.5 sm:p-2 bg-[#08090d] flex flex-col justify-between select-none relative font-mono overflow-hidden">
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between px-2 py-0.5 bg-zinc-950/90 border border-zinc-800 rounded text-[7.5px] text-zinc-400 shrink-0 mb-1">
        <span className="flex items-center gap-1 font-bold text-cyan-400">
          <Cable className="h-2.5 w-2.5" /> HIGH-DENSITY STRUCTURED PATCH BAY • ITV RACK {rackNumber}
        </span>
        <span className="text-[7px] text-emerald-400 font-bold">
          120/120 PORTS PATCHED (100% LINKED)
        </span>
      </div>

      {/* Main Enclosure: Left Wire Duct | 5 Combed Patch Tiers + Switches | Right Wire Duct */}
      <div className="flex-1 relative rounded-lg border border-zinc-800 bg-[#07080b] p-1 flex gap-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700/80 shadow-inner">
        {/* =========================================================================
            LEFT VERTICAL WIRE DUCT (THICK CABLE TRUNK WITH BLACK D-RINGS & VELCRO)
            ========================================================================= */}
        <div className="w-4 sm:w-5 bg-gradient-to-r from-[#0d0e14] via-[#12131b] to-black rounded border border-zinc-800/80 p-0.5 flex flex-col justify-between items-center shrink-0 relative overflow-hidden">
          {/* Vertical Cables Running Downward */}
          <div className="absolute inset-y-1 left-1 w-0.5 bg-blue-600 rounded-full shadow-[0_0_4px_#2563eb]" />
          <div className="absolute inset-y-1 left-2 w-0.5 bg-yellow-400 rounded-full shadow-[0_0_4px_#eab308]" />
          <div className="absolute inset-y-1 right-1.5 w-0.5 bg-red-600 rounded-full shadow-[0_0_4px_#dc2626]" />
          <div className="absolute inset-y-1 right-0.5 w-0.5 bg-cyan-400 rounded-full shadow-[0_0_4px_#06b6d4]" />

          {/* D-Rings & Yellow Velcro Ties */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="z-10 flex flex-col items-center my-0.5">
              <div className="w-3.5 h-1.5 bg-amber-400 rounded-[1px] shadow-sm" title="Velcro Cable Strap" />
              <div className="w-3.5 h-2 bg-zinc-900 border border-zinc-700 rounded-sm mt-0.5 shadow-inner" />
            </div>
          ))}
        </div>

        {/* =========================================================================
            CENTER: 5 HIGH-DENSITY PATCH PANELS WITH PHOTO-ACCURATE COMBED WATERFALLS
            ========================================================================= */}
        <div className="flex-1 space-y-1 min-w-0">
          {CABLING_TIERS.map((tier) => {
            const isHovered = hoveredTier === tier.tier;
            return (
              <div
                key={tier.tier}
                onMouseEnter={() => {
                  setHoveredTier(tier.tier);
                  if (soundEnabled && onPlaySound) onPlaySound('beep');
                }}
                onMouseLeave={() => setHoveredTier(null)}
                className={`relative rounded border transition-all duration-200 overflow-hidden ${
                  isHovered
                    ? 'border-cyan-500/80 bg-[#12141d] shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'border-zinc-800 bg-[#0c0d12]'
                }`}
              >
                {/* 1. Patch Panel Silk-Screen Header Bar */}
                <div className="px-1.5 py-0.5 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between text-[7px]">
                  <div className="flex items-center gap-1 truncate">
                    <span className="text-zinc-500 font-bold">1U</span>
                    <span className="font-bold text-zinc-300 truncate">{tier.label}</span>
                  </div>
                  <span
                    className="text-[6.5px] font-bold px-1 rounded shrink-0 ml-1"
                    style={{ color: tier.cableColor, backgroundColor: `${tier.cableColor}15` }}
                  >
                    {tier.category}
                  </span>
                </div>

                {/* 2. Scalable High-Fidelity Vector SVG Combed Waterfall Cable Graphic */}
                <div className="relative w-full h-[36px] sm:h-[40px] bg-[#090a0f] flex items-center justify-center overflow-hidden">
                  <svg
                    viewBox="0 0 440 42"
                    className="w-full h-full"
                    preserveAspectRatio="none"
                  >
                    {/* Panel Port Strip Silkscreen */}
                    <rect x="30" y="1" width="380" height="5" rx="1" fill="#e2e8f0" opacity="0.9" />

                    {/* Silkscreen Port Numbers 01 to 24 */}
                    {Array.from({ length: 12 }).map((_, i) => (
                      <text
                        key={`num-l-${i}`}
                        x={42 + i * 13}
                        y="5"
                        textAnchor="middle"
                        fontSize="3.8"
                        fontWeight="bold"
                        fill="#0f172a"
                      >
                        {String(i + 1).padStart(2, '0')}
                      </text>
                    ))}
                    {Array.from({ length: 12 }).map((_, i) => (
                      <text
                        key={`num-r-${i}`}
                        x={242 + i * 13}
                        y="5"
                        textAnchor="middle"
                        fontSize="3.8"
                        fontWeight="bold"
                        fill="#0f172a"
                      >
                        {String(i + 13).padStart(2, '0')}
                      </text>
                    ))}

                    {/* RJ45 / LC Keystone Jacks (Left 12 + Right 12) */}
                    {Array.from({ length: 12 }).map((_, i) => {
                      const x = 42 + i * 13;
                      return (
                        <g key={`jack-l-${i}`}>
                          <rect x={x - 4} y="7" width="8" height="5" rx="0.8" fill="#18181b" stroke="#3f3f46" strokeWidth="0.6" />
                          <rect x={x - 2} y="11" width="4" height="3" fill={tier.bootColor} />
                        </g>
                      );
                    })}
                    {Array.from({ length: 12 }).map((_, i) => {
                      const x = 242 + i * 13;
                      return (
                        <g key={`jack-r-${i}`}>
                          <rect x={x - 4} y="7" width="8" height="5" rx="0.8" fill="#18181b" stroke="#3f3f46" strokeWidth="0.6" />
                          <rect x={x - 2} y="11" width="4" height="3" fill={tier.bootColor} />
                        </g>
                      );
                    })}

                    {/* Central Cable Management Bracket */}
                    <rect x="212" y="16" width="16" height="14" rx="1.5" fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />
                    <rect x="214" y="21" width="12" height="3" fill="#fbbf24" rx="0.5" />

                    {/* Left & Right D-Ring Brackets */}
                    <rect x="6" y="22" width="8" height="16" rx="1.5" fill="#18181b" stroke="#52525b" strokeWidth="0.8" />
                    <rect x="426" y="22" width="8" height="16" rx="1.5" fill="#18181b" stroke="#52525b" strokeWidth="0.8" />

                    {/* COMBED CABLES - LEFT WATERFALL BUNDLE */}
                    {Array.from({ length: 12 }).map((_, i) => {
                      const x = 42 + i * 13;
                      const pathData = `M ${x},13 L ${x},17 C ${x},26 ${28 + i * 2.2},33 12,${27 + i * 0.9}`;
                      return (
                        <g key={`cable-l-${i}`}>
                          <path
                            d={pathData}
                            fill="none"
                            stroke={tier.cableColor}
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            opacity={isHovered ? '1' : '0.95'}
                          />
                          <path
                            d={pathData}
                            fill="none"
                            stroke={tier.highlightColor}
                            strokeWidth="0.8"
                            strokeLinecap="round"
                            opacity="0.65"
                          />
                        </g>
                      );
                    })}

                    {/* COMBED CABLES - RIGHT WATERFALL BUNDLE */}
                    {Array.from({ length: 12 }).map((_, i) => {
                      const x = 242 + i * 13;
                      const pathData = `M ${x},13 L ${x},17 C ${x},26 ${412 - i * 2.2},33 428,${27 + i * 0.9}`;
                      return (
                        <g key={`cable-r-${i}`}>
                          <path
                            d={pathData}
                            fill="none"
                            stroke={tier.cableColor}
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            opacity={isHovered ? '1' : '0.95'}
                          />
                          <path
                            d={pathData}
                            fill="none"
                            stroke={tier.highlightColor}
                            strokeWidth="0.8"
                            strokeLinecap="round"
                            opacity="0.65"
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            );
          })}

          {/* BOTTOM SWITCH 01: EXTREME SUMMIT 48-PORT SWITCH */}
          <div className="p-1 rounded bg-[#0b0c10] border border-zinc-800 text-[7px]">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-bold text-zinc-300">EXTREME SUMMIT • 48-PORT DISTRIBUTION</span>
              <span className="text-[6px] font-mono text-emerald-400">ONLINE</span>
            </div>
            <div className="h-3 bg-black/90 rounded border border-zinc-800 px-1 flex items-center justify-between">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="h-1.5 w-1.5 rounded-[1px] bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                    <div
                      className={`h-0.5 w-0.5 rounded-full ${
                        i % 4 === 0 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                    />
                  </div>
                ))}
              </div>
              <span className="text-[6px] text-zinc-500 font-bold hidden sm:inline">10 Gbps SFP+</span>
            </div>
          </div>

          {/* BOTTOM SWITCH 02: CISCO 24-PORT AGGREGATION ROUTER */}
          <div className="p-1 rounded bg-[#0b0c10] border border-zinc-800 text-[7px]">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-bold text-zinc-300">CISCO AGGREGATION ROUTER • SFP+ 10G</span>
              <span className="text-[6px] font-mono text-cyan-400">OPTICAL FABRIC</span>
            </div>
            <div className="h-3 bg-black/90 rounded border border-zinc-800 px-1 flex items-center justify-between">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-1.5 w-1.5 rounded-[1px] bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                    <div className="h-0.5 w-0.5 rounded-full bg-cyan-400 shadow-[0_0_3px_#22d3ee] animate-pulse" />
                  </div>
                ))}
              </div>
              <span className="text-[6px] text-zinc-500 font-bold hidden sm:inline">480 Gbps</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT VERTICAL WIRE DUCT (THICK CABLE TRUNK WITH BLACK D-RINGS & VELCRO)
            ========================================================================= */}
        <div className="w-4 sm:w-5 bg-gradient-to-l from-[#0d0e14] via-[#12131b] to-black rounded border border-zinc-800/80 p-0.5 flex flex-col justify-between items-center shrink-0 relative overflow-hidden">
          {/* Vertical Cables Running Downward */}
          <div className="absolute inset-y-1 left-0.5 w-0.5 bg-cyan-400 rounded-full shadow-[0_0_4px_#06b6d4]" />
          <div className="absolute inset-y-1 left-1.5 w-0.5 bg-red-600 rounded-full shadow-[0_0_4px_#dc2626]" />
          <div className="absolute inset-y-1 right-2 w-0.5 bg-yellow-400 rounded-full shadow-[0_0_4px_#eab308]" />
          <div className="absolute inset-y-1 right-1 w-0.5 bg-blue-600 rounded-full shadow-[0_0_4px_#2563eb]" />

          {/* D-Rings & Yellow Velcro Ties */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="z-10 flex flex-col items-center my-0.5">
              <div className="w-3.5 h-1.5 bg-amber-400 rounded-[1px] shadow-sm" title="Velcro Cable Strap" />
              <div className="w-3.5 h-2 bg-zinc-900 border border-zinc-700 rounded-sm mt-0.5 shadow-inner" />
            </div>
          ))}
        </div>
      </div>

      {/* Cabling Legend / Color Code */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 pt-1 text-[6.5px] text-zinc-400 shrink-0 border-t border-zinc-900">
        <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-zinc-950 border border-zinc-800">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-600 shadow-[0_0_3px_#2563eb]" />
          <span className="truncate">Tier 1-2: Royal Blue (Cat6A)</span>
        </div>
        <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-zinc-950 border border-zinc-800">
          <div className="h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-[0_0_3px_#eab308]" />
          <span className="truncate">Tier 3: Yellow (GV IP)</span>
        </div>
        <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-zinc-950 border border-zinc-800">
          <div className="h-1.5 w-1.5 rounded-full bg-red-600 shadow-[0_0_3px_#dc2626]" />
          <span className="truncate">Tier 4: Red (PTP/SAN)</span>
        </div>
        <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-zinc-950 border border-zinc-800">
          <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_3px_#06b6d4]" />
          <span className="truncate">Tier 5: Aqua (OM4 Fiber)</span>
        </div>
      </div>
    </div>
  );
}
