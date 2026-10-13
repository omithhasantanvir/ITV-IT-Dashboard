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
    cableColor: '#2563eb', // Royal Blue (photo tier 1)
    highlightColor: '#93c5fd',
    bootColor: '#1d4ed8',
  },
  {
    tier: 2,
    label: 'PATCH PANEL 02 • DISTRIBUTION CAT6A',
    category: 'Cat6A U/FTP 10G',
    vlan: 'VLAN 20 • BROADCAST MCR & NEWS PRODUCTION',
    cableColor: '#2563eb', // Royal Blue (photo tier 2)
    highlightColor: '#93c5fd',
    bootColor: '#1d4ed8',
  },
  {
    tier: 3,
    label: 'PATCH PANEL 03 • GRASS VALLEY VIDEO IP',
    category: 'Cat6A S/FTP 10G',
    vlan: 'VLAN 30 • SMPTE ST 2110 IP VIDEO',
    cableColor: '#eab308', // Bright Yellow (photo tier 3)
    highlightColor: '#fef08a',
    bootColor: '#ca8a04',
  },
  {
    tier: 4,
    label: 'PATCH PANEL 04 • REDUNDANT PTP & SAN',
    category: 'Cat6A S/FTP 10G',
    vlan: 'VLAN 40 • HIGH PRIORITY PTP & iSCSI SAN',
    cableColor: '#dc2626', // Bright Red (photo tier 4)
    highlightColor: '#fca5a5',
    bootColor: '#b91c1c',
  },
  {
    tier: 5,
    label: 'PATCH PANEL 05 • OM4 LASER 10G FIBER',
    category: 'OM4 MTP/LC 50/125µm Multi-Mode',
    vlan: '10G BACKBONE OPTICAL TRUNK',
    cableColor: '#06b6d4', // Bright Aqua Cyan (photo tier 5)
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
    <div className="p-2 sm:p-2.5 bg-[#08090d] space-y-2 select-none relative overflow-hidden font-mono">
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between px-2 py-1 bg-zinc-950/90 border border-zinc-800 rounded-md text-[8px] text-zinc-400">
        <span className="flex items-center gap-1 font-bold text-cyan-400">
          <Cable className="h-2.5 w-2.5" /> HIGH-DENSITY STRUCTURED PATCH BAY • ITV RACK {rackNumber}
        </span>
        <span className="text-[7.5px] text-emerald-400 font-bold">
          120/120 PORTS PATCHED (100% LINKED)
        </span>
      </div>

      {/* Main Enclosure: Left Wire Duct | 5 Combed Patch Tiers + Switches | Right Wire Duct */}
      <div className="relative rounded-lg border border-zinc-800 bg-[#07080b] p-1.5 flex gap-1.5 overflow-hidden shadow-2xl">
        {/* =========================================================================
            LEFT VERTICAL WIRE DUCT (THICK CABLE TRUNK WITH BLACK D-RINGS & VELCRO)
            ========================================================================= */}
        <div className="w-5 sm:w-6 bg-gradient-to-r from-[#0d0e14] via-[#12131b] to-black rounded border border-zinc-800/80 p-0.5 flex flex-col justify-between items-center shrink-0 relative overflow-hidden">
          {/* Vertical Cables Running Downward */}
          <div className="absolute inset-y-1 left-1.5 w-0.5 bg-blue-600 rounded-full shadow-[0_0_4px_#2563eb]" />
          <div className="absolute inset-y-1 left-2.5 w-0.5 bg-yellow-400 rounded-full shadow-[0_0_4px_#eab308]" />
          <div className="absolute inset-y-1 right-2 w-0.5 bg-red-600 rounded-full shadow-[0_0_4px_#dc2626]" />
          <div className="absolute inset-y-1 right-1 w-0.5 bg-cyan-400 rounded-full shadow-[0_0_4px_#06b6d4]" />

          {/* D-Rings & Yellow Velcro Ties at each tier level */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="z-10 flex flex-col items-center my-1">
              <div className="w-4 h-2 bg-amber-400 rounded-[1px] shadow-sm" title="Velcro Cable Strap" />
              <div className="w-4.5 h-3 bg-zinc-900 border border-zinc-700 rounded-sm mt-0.5 shadow-inner" />
            </div>
          ))}
        </div>

        {/* =========================================================================
            CENTER: 5 HIGH-DENSITY PATCH PANELS WITH PHOTO-ACCURATE COMBED WATERFALLS
            ========================================================================= */}
        <div className="flex-1 space-y-1.5 min-w-0">
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
                    ? 'border-cyan-500/80 bg-[#12141d] shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'border-zinc-800 bg-[#0c0d12]'
                }`}
              >
                {/* 1. Patch Panel Silk-Screen Header Bar with 24 Port Numbers */}
                <div className="px-1.5 py-0.5 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between text-[7.5px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500 font-bold">1U</span>
                    <span className="font-bold text-zinc-300">{tier.label}</span>
                  </div>
                  <span
                    className="text-[7px] font-bold px-1 rounded"
                    style={{ color: tier.cableColor, backgroundColor: `${tier.cableColor}15` }}
                  >
                    {tier.category}
                  </span>
                </div>

                {/* 2. Scalable High-Fidelity Vector SVG Combed Waterfall Cable Graphic */}
                <div className="relative w-full h-[58px] sm:h-[62px] bg-[#090a0f] flex items-center justify-center overflow-hidden">
                  <svg
                    viewBox="0 0 440 62"
                    className="w-full h-full"
                    preserveAspectRatio="none"
                  >
                    {/* Panel Port Strip Silkscreen */}
                    <rect x="30" y="2" width="380" height="7" rx="1" fill="#e2e8f0" opacity="0.9" />

                    {/* Silkscreen Port Numbers 01 to 24 */}
                    {Array.from({ length: 12 }).map((_, i) => (
                      <text
                        key={`num-l-${i}`}
                        x={42 + i * 13}
                        y="7"
                        textAnchor="middle"
                        fontSize="4.5"
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
                        y="7"
                        textAnchor="middle"
                        fontSize="4.5"
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
                          <rect x={x - 4.5} y="9" width="9" height="7" rx="1" fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />
                          <rect x={x - 2.5} y="14" width="5" height="4" fill={tier.bootColor} />
                        </g>
                      );
                    })}
                    {Array.from({ length: 12 }).map((_, i) => {
                      const x = 242 + i * 13;
                      return (
                        <g key={`jack-r-${i}`}>
                          <rect x={x - 4.5} y="9" width="9" height="7" rx="1" fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />
                          <rect x={x - 2.5} y="14" width="5" height="4" fill={tier.bootColor} />
                        </g>
                      );
                    })}

                    {/* Central Cable Management Bracket & Separator */}
                    <rect x="211" y="22" width="18" height="20" rx="2" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
                    <rect x="213" y="28" width="14" height="4" fill="#fbbf24" rx="0.5" /> {/* Yellow Velcro strap */}

                    {/* Left & Right D-Ring Brackets */}
                    <rect x="6" y="32" width="10" height="22" rx="2" fill="#18181b" stroke="#52525b" strokeWidth="1" />
                    <rect x="424" y="32" width="10" height="22" rx="2" fill="#18181b" stroke="#52525b" strokeWidth="1" />

                    {/* COMBED CABLES - LEFT WATERFALL BUNDLE (Curves left into left D-ring) */}
                    {Array.from({ length: 12 }).map((_, i) => {
                      const x = 42 + i * 13;
                      const pathData = `M ${x},17 L ${x},22 C ${x},36 ${28 + i * 2.2},46 12,${40 + i * 1.1}`;
                      return (
                        <g key={`cable-l-${i}`}>
                          {/* Outer Cable Cylinder */}
                          <path
                            d={pathData}
                            fill="none"
                            stroke={tier.cableColor}
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            opacity={isHovered ? '1' : '0.95'}
                          />
                          {/* Inner Specular Highlight Reflection */}
                          <path
                            d={pathData}
                            fill="none"
                            stroke={tier.highlightColor}
                            strokeWidth="1"
                            strokeLinecap="round"
                            opacity="0.65"
                          />
                        </g>
                      );
                    })}

                    {/* COMBED CABLES - RIGHT WATERFALL BUNDLE (Curves right into right D-ring) */}
                    {Array.from({ length: 12 }).map((_, i) => {
                      const x = 242 + i * 13;
                      const pathData = `M ${x},17 L ${x},22 C ${x},36 ${412 - (11 - i) * 2.2},46 428,${40 + (11 - i) * 1.1}`;
                      return (
                        <g key={`cable-r-${i}`}>
                          {/* Outer Cable Cylinder */}
                          <path
                            d={pathData}
                            fill="none"
                            stroke={tier.cableColor}
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            opacity={isHovered ? '1' : '0.95'}
                          />
                          {/* Inner Specular Highlight Reflection */}
                          <path
                            d={pathData}
                            fill="none"
                            stroke={tier.highlightColor}
                            strokeWidth="1"
                            strokeLinecap="round"
                            opacity="0.65"
                          />
                        </g>
                      );
                    })}

                    {/* Bottom Horizontal Wire Management Comb Bar with Slots */}
                    <rect x="25" y="55" width="390" height="7" fill="#13141b" stroke="#27272a" strokeWidth="0.8" />
                    {Array.from({ length: 26 }).map((_, i) => (
                      <line
                        key={`slot-${i}`}
                        x1={35 + i * 14}
                        y1="55"
                        x2={35 + i * 14}
                        y2="62"
                        stroke="#090a0f"
                        strokeWidth="2"
                      />
                    ))}
                  </svg>
                </div>

                {/* Telemetry Tooltip Strip on Hover */}
                {isHovered && (
                  <div className="px-2 py-0.5 bg-black/95 border-t border-cyan-500/50 flex items-center justify-between text-[7.5px] text-zinc-300 animate-in fade-in duration-100">
                    <span className="text-cyan-300 font-bold">{tier.vlan}</span>
                    <span className="text-emerald-400 font-bold">● 24/24 GIGABIT CHANNELS ACTIVE</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* =========================================================================
              BOTTOM SWITCH 01: CISCO CATALYST 48G SWITCH (ACTIVE RJ45 + GREEN LEDS)
              ========================================================================= */}
          <div className="p-1.5 rounded bg-gradient-to-r from-[#111219] via-[#161722] to-[#111219] border border-zinc-700/80 shadow-md">
            <div className="flex items-center justify-between mb-1 text-[7.5px] font-mono text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white tracking-wider">CISCO CATALYST 48G</span>
                <span className="text-[6.5px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40">
                  POE+ ACTIVE
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[6.5px] text-zinc-400">STAT:</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_#34d399] animate-pulse" />
                <span className="text-[6.5px] text-zinc-400 ml-1">FAN: OK</span>
              </div>
            </div>

            {/* 48 RJ45 Ports Matrix (Two Rows of 24 Ports) */}
            <div className="bg-black/90 p-1 rounded border border-zinc-800 flex items-center justify-between overflow-x-auto">
              <div className="flex flex-col gap-0.5">
                {/* Upper Row 24 Ports with Flashing Link LEDs */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={`p1-${i}`} className="flex flex-col items-center">
                      <div
                        className={`h-1 w-1 rounded-[0.5px] ${
                          i % 4 === 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                        }`}
                      />
                      <div className="h-1.5 w-1.5 bg-zinc-900 border border-zinc-700 rounded-[1px] mt-0.5" />
                    </div>
                  ))}
                </div>

                {/* Lower Row 24 Ports */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={`p2-${i}`} className="flex flex-col items-center">
                      <div className="h-1.5 w-1.5 bg-zinc-900 border border-zinc-700 rounded-[1px]" />
                      <div
                        className={`h-1 w-1 rounded-[0.5px] mt-0.5 ${
                          i % 3 === 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 4x 10G SFP+ Uplink Fiber Cages */}
              <div className="flex items-center gap-1 pl-2 border-l border-zinc-800">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[6px] text-cyan-400 font-bold">10G SFP+</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-3 w-2 rounded bg-black border border-cyan-500/60 p-0.5 flex flex-col justify-between">
                        <div className="h-0.5 w-full bg-cyan-400 animate-pulse" />
                        <div className="h-0.5 w-full bg-emerald-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              BOTTOM SWITCH 02: CISCO 24-PORT AGGREGATION / SFP+ FIBER SWITCH
              ========================================================================= */}
          <div className="p-1.5 rounded bg-gradient-to-r from-[#0d0e14] via-[#14151f] to-[#0d0e14] border border-zinc-800 text-[7.5px]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-zinc-300">CISCO AGGREGATION ROUTER • SFP+ 10G OPTICS</span>
              <span className="text-[6.5px] font-mono text-cyan-400">OPTICAL REDUNDANCY UP</span>
            </div>
            <div className="h-3.5 bg-black/90 rounded border border-zinc-800 px-1 flex items-center justify-between">
              <div className="flex items-center gap-1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-2 w-2 rounded-[1px] bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                    <div className="h-1 w-1 rounded-full bg-cyan-400 shadow-[0_0_3px_#22d3ee] animate-pulse" />
                  </div>
                ))}
              </div>
              <span className="text-[6.5px] text-zinc-400 font-bold">CORE FABRIC: 480 Gbps</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT VERTICAL WIRE DUCT (THICK CABLE TRUNK WITH BLACK D-RINGS & VELCRO)
            ========================================================================= */}
        <div className="w-5 sm:w-6 bg-gradient-to-l from-[#0d0e14] via-[#12131b] to-black rounded border border-zinc-800/80 p-0.5 flex flex-col justify-between items-center shrink-0 relative overflow-hidden">
          {/* Vertical Cables Running Downward */}
          <div className="absolute inset-y-1 left-1 w-0.5 bg-cyan-400 rounded-full shadow-[0_0_4px_#06b6d4]" />
          <div className="absolute inset-y-1 left-2 w-0.5 bg-red-600 rounded-full shadow-[0_0_4px_#dc2626]" />
          <div className="absolute inset-y-1 right-2.5 w-0.5 bg-yellow-400 rounded-full shadow-[0_0_4px_#eab308]" />
          <div className="absolute inset-y-1 right-1.5 w-0.5 bg-blue-600 rounded-full shadow-[0_0_4px_#2563eb]" />

          {/* D-Rings & Yellow Velcro Ties at each tier level */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="z-10 flex flex-col items-center my-1">
              <div className="w-4 h-2 bg-amber-400 rounded-[1px] shadow-sm" title="Velcro Cable Strap" />
              <div className="w-4.5 h-3 bg-zinc-900 border border-zinc-700 rounded-sm mt-0.5 shadow-inner" />
            </div>
          ))}
        </div>
      </div>

      {/* Cabling Legend / Color Code */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 pt-0.5 text-[7px] text-zinc-400">
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800">
          <div className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_4px_#2563eb]" />
          <span className="truncate">Tier 1 & 2: Royal Blue (Cat6A)</span>
        </div>
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800">
          <div className="h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_4px_#eab308]" />
          <span className="truncate">Tier 3: Yellow (Grass Valley IP)</span>
        </div>
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800">
          <div className="h-2 w-2 rounded-full bg-red-600 shadow-[0_0_4px_#dc2626]" />
          <span className="truncate">Tier 4: Red (PTP & SAN Trunk)</span>
        </div>
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800">
          <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_4px_#06b6d4]" />
          <span className="truncate">Tier 5: Aqua (OM4 10G Fiber)</span>
        </div>
      </div>
    </div>
  );
}
