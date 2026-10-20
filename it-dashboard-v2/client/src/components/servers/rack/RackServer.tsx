'use client';

import React from 'react';
import {
  ServerNode,
  RackEquipment,
  RackViewMode,
  U_HEIGHT_PX,
} from './RackTypes';
import {
  Server,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Cpu,
  HardDrive,
  Shield,
  Zap,
  Cable,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';

interface RackServerProps {
  equipment: RackEquipment;
  serverNode?: ServerNode;
  isSelected: boolean;
  isHovered: boolean;
  viewMode: RackViewMode;
  onSelect: (equipment: RackEquipment) => void;
  onHover: (id: string | null) => void;
  onPingSingle?: (srv: ServerNode) => void;
  onCopyIp?: (ip: string) => void;
  copiedIp?: string | null;
  onPlaySound?: (type: 'beep' | 'slide' | 'door' | 'alert' | 'click') => void;
}

export const RackServer: React.FC<RackServerProps> = ({
  equipment,
  serverNode,
  isSelected,
  isHovered,
  viewMode,
  onSelect,
  onHover,
  onPingSingle,
  onCopyIp,
  copiedIp,
  onPlaySound,
}) => {
  const isOnline = serverNode
    ? serverNode.status === 'ONLINE' || serverNode.online === true
    : true;
  const isWarning = serverNode?.status === 'WARNING';
  const isOffline = serverNode ? !isOnline && !isWarning : false;

  // Proportional height in pixels: 1U = 24px, 2U = 48px, 3U = 72px, 4U = 96px
  const heightPx = equipment.uHeight * U_HEIGHT_PX;
  const is2U = equipment.uHeight >= 2;
  const is3U = equipment.uHeight >= 3;

  const uDisplay = equipment.uHeight > 1
    ? `U${equipment.uStart}-${equipment.uStart + equipment.uHeight - 1}`
    : `U${equipment.uStart}`;

  const displayName = serverNode?.serverName || equipment.name;
  const displayIp = serverNode?.ipAddress || 'DHCP / Static';
  const displayModel = equipment.model;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlaySound) onPlaySound('slide');
    onSelect(equipment);
  };

  const handleRetract = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlaySound) onPlaySound('slide');
    onSelect(equipment);
  };

  // --------------------------------------------------------------------------
  // REAR VIEW: Dual redundant PSUs, 1GbE/10GbE RJ45 & SFP+ Fiber ports
  // --------------------------------------------------------------------------
  if (viewMode === 'rear') {
    return (
      <div
        style={{ height: `${heightPx}px` }}
        className={`w-full relative px-1 py-0.5 border-b border-zinc-800 transition-all select-none ${
          isSelected ? 'bg-zinc-900/95 ring-1 ring-cyan-500/50' : 'bg-[#0e0f14]'
        }`}
        onClick={handleClick}
      >
        <div className="h-full w-full rounded-[2px] bg-[#14151c] border border-zinc-700/80 flex items-center justify-between px-2 text-[8px] font-mono shadow-inner">
          {/* Dual Hot-Swap Power Supplies (PSU1 & PSU2) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* PSU 1 */}
            <div className="h-full py-0.5 px-1.5 rounded-[2px] bg-[#1b1c24] border border-zinc-700 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
              <div className="flex flex-col text-[6.5px] leading-tight text-zinc-400">
                <span className="text-zinc-200 font-bold">PSU 1</span>
                <span>230V OK</span>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-black border border-zinc-700 flex items-center justify-center p-0.5">
                <div className="w-1 h-1 rounded-full bg-zinc-800" />
              </div>
            </div>

            {/* PSU 2 (Redundant) */}
            <div className="h-full py-0.5 px-1.5 rounded-[2px] bg-[#1b1c24] border border-zinc-700 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
              <div className="flex flex-col text-[6.5px] leading-tight text-zinc-400">
                <span className="text-zinc-200 font-bold">PSU 2</span>
                <span>230V OK</span>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-black border border-zinc-700 flex items-center justify-center p-0.5">
                <div className="w-1 h-1 rounded-full bg-zinc-800" />
              </div>
            </div>
          </div>

          {/* Center Info Tag */}
          <div className="flex flex-col items-center leading-none">
            <span className="text-[7.5px] text-zinc-300 font-bold">{displayName} • REAR I/O</span>
            <span className="text-[6.5px] text-zinc-500 font-mono">{displayIp}</span>
          </div>

          {/* Network Interfaces: 4x 1GbE RJ45 + Dual 10G SFP+ */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 4x 1GbE Ports */}
            <div className="flex items-center gap-0.5 bg-black/60 p-0.5 rounded border border-zinc-800">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2.5 rounded-[1px] bg-[#111218] border border-zinc-700 flex flex-col justify-between p-[1px]"
                  title={`1GbE Port ${i + 1}`}
                >
                  <div className="w-full h-0.5 bg-emerald-400 animate-pulse" />
                  <div className="w-full h-0.5 bg-zinc-800" />
                </div>
              ))}
            </div>

            {/* Dual 10G SFP+ Optical Cages */}
            <div className="flex items-center gap-0.5 bg-black/60 p-0.5 rounded border border-zinc-800">
              <div
                className="w-2.5 h-2.5 rounded-[1px] bg-zinc-900 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_3px_rgba(6,182,212,0.4)]"
                title="10G SFP+ Optic 1"
              >
                <div className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_4px_#22d3ee] animate-pulse" />
              </div>
              <div
                className="w-2.5 h-2.5 rounded-[1px] bg-zinc-900 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_3px_rgba(6,182,212,0.4)]"
                title="10G SFP+ Optic 2"
              >
                <div className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_4px_#22d3ee] animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // FRONT / 3D VIEW: Physical Bezel, Drive Bays, Rails, Drawer Pull-Out
  // --------------------------------------------------------------------------
  return (
    <div
      style={{ height: `${heightPx}px` }}
      className="w-full relative px-0.5 py-0.5 border-b border-zinc-800/80 select-none group min-w-0 overflow-x-clip"
      onMouseEnter={() => onHover(equipment.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* --------------------------------------------------------------------
          1. RECESSED EMPTY RACK BAY CAVITY
          Remains fixed in place inside the rack when server is pulled out!
          -------------------------------------------------------------------- */}
      {isSelected && (
        <div className="absolute inset-x-0.5 inset-y-0.5 rounded-[1px] bg-[#07080b] border border-zinc-800/90 shadow-[inset_0_4px_12px_rgba(0,0,0,0.95),inset_0_0_20px_rgba(0,0,0,0.8)] flex items-center justify-between px-3 overflow-hidden pointer-events-none z-0">
          {/* Left Stationary C-Channel Slide Rail */}
          <div className="w-3 h-full bg-[#1b1c24] border-r border-zinc-700/80 flex flex-col justify-around py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-600/80 ml-0.5" />
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-600/80 ml-0.5" />
          </div>

          {/* Stenciled slot warning and backplane connectors */}
          <div className="flex items-center gap-3 opacity-60">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2.5 rounded-[1px] bg-black border border-zinc-700 flex items-center justify-center">
                <div className="w-1.5 h-1 bg-amber-500/70 rounded-full" />
              </div>
              <span className="text-[6.5px] font-mono text-zinc-500 font-bold uppercase tracking-widest">
                BACKPLANE SAS / 230V POWER BUS
              </span>
            </div>
            <span className="text-[7px] font-mono text-cyan-400 font-black tracking-widest uppercase">
              {uDisplay} • CHASSIS EXTENDED
            </span>
          </div>

          {/* Right Stationary C-Channel Slide Rail */}
          <div className="w-3 h-full bg-[#1b1c24] border-l border-zinc-700/80 flex flex-col justify-around py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-600/80 ml-0.5" />
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-600/80 ml-0.5" />
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------
          2. PHYSICAL SLIDING SERVER CHASSIS (DRAWER PULL-OUT)
          When isSelected: Physically slides forward out of the cabinet plane
          by ~190px, revealing the top galvanized cover and telescoping slide rails!
          -------------------------------------------------------------------- */}
      <div
        onClick={handleClick}
        style={{
          transform: isSelected
            ? 'perspective(1100px) translate3d(0, 0, 190px) rotateX(8deg)'
            : isHovered
            ? 'perspective(1100px) translate3d(0, 0, 10px)'
            : 'perspective(1100px) translate3d(0, 0, 0px)',
          transition: 'all 550ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`w-full h-full rounded-[2px] cursor-pointer relative ${
          isSelected
            ? 'z-40 shadow-[0_30px_70px_-10px_rgba(0,0,0,0.95),0_15px_35px_rgba(0,0,0,0.85),0_0_25px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
            : isHovered
            ? 'z-20 shadow-md shadow-black/80 ring-1 ring-zinc-500/60'
            : 'z-10'
        }`}
      >
        {/* ===================================================================
            TOP GALVANIZED STEEL CHASSIS LID
            Visible when pulled out: 190px depth with authentic motherboard
            diagrams, CPU sockets, memory slots, hazard stripes, and slide rails
            =================================================================== */}
        {isSelected && (
          <div
            style={{
              height: '190px',
              top: '-190px',
              background: 'linear-gradient(180deg, #1b1d25 0%, #252833 35%, #1d1f28 70%, #15161d 100%)',
            }}
            className="absolute inset-x-0 rounded-t-sm border-t border-x border-zinc-500 shadow-2xl flex flex-col justify-between p-2 font-mono overflow-hidden select-none cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left & Right Telescoping Stainless Steel Slide Rails */}
            <div
              className="absolute left-0 inset-y-0 w-3.5 border-r border-zinc-500 flex flex-col justify-between items-center py-2 shadow-inner"
              style={{
                background: 'linear-gradient(90deg, #4b5563 0%, #9ca3af 35%, #e5e7eb 50%, #9ca3af 65%, #374151 100%)',
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 border border-zinc-700 shadow-sm" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 border border-zinc-700 shadow-sm" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 border border-zinc-700 shadow-sm" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 border border-zinc-700 shadow-sm" />
              <div className="w-2 h-4 rounded-sm bg-blue-600 border border-blue-400 shadow-sm text-[5px] text-white flex items-center justify-center font-bold">
                ▼
              </div>
            </div>

            <div
              className="absolute right-0 inset-y-0 w-3.5 border-l border-zinc-500 flex flex-col justify-between items-center py-2 shadow-inner"
              style={{
                background: 'linear-gradient(90deg, #4b5563 0%, #9ca3af 35%, #e5e7eb 50%, #9ca3af 65%, #374151 100%)',
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 border border-zinc-700 shadow-sm" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 border border-zinc-700 shadow-sm" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 border border-zinc-700 shadow-sm" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 border border-zinc-700 shadow-sm" />
              <div className="w-2 h-4 rounded-sm bg-blue-600 border border-blue-400 shadow-sm text-[5px] text-white flex items-center justify-center font-bold">
                ▼
              </div>
            </div>

            {/* Top Header of Lid: Asset ID & Retract Button */}
            <div className="mx-4 flex items-center justify-between pb-1 border-b border-zinc-700/80">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
                <span className="text-[7.5px] font-black text-cyan-300 tracking-wider">
                  CHASSIS EXTENDED • {uDisplay} • {displayModel}
                </span>
              </div>

              {/* Retract / Slide Back Control */}
              <button
                type="button"
                onClick={handleRetract}
                className="px-2 py-0.5 rounded bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-600 text-[7px] font-bold flex items-center gap-1 transition active:scale-95 shadow cursor-pointer"
                title="Slide server back into rack slot (Esc)"
              >
                <RotateCcw className="w-2.5 h-2.5 text-cyan-400" />
                <span>RETRACT SERVER [ESC]</span>
              </button>
            </div>

            {/* Middle Section of Lid: Stamped Motherboard Silk-Screen Diagram */}
            <div className="mx-4 my-1 flex-1 grid grid-cols-3 gap-2 p-1.5 rounded bg-[#101217]/80 border border-zinc-800/80">
              {/* Dual CPU Xeon Sockets */}
              <div className="flex flex-col justify-center items-center p-1 rounded bg-[#161821] border border-zinc-700/60 text-center">
                <span className="text-[6px] text-zinc-500 font-bold uppercase tracking-wider">DUAL XEON PLATINUM</span>
                <div className="flex gap-1.5 my-1">
                  <div className="w-5 h-5 rounded-[1px] bg-zinc-900 border border-cyan-500/60 flex items-center justify-center shadow-inner">
                    <span className="text-[5px] text-cyan-300 font-bold">CPU 1</span>
                  </div>
                  <div className="w-5 h-5 rounded-[1px] bg-zinc-900 border border-cyan-500/60 flex items-center justify-center shadow-inner">
                    <span className="text-[5px] text-cyan-300 font-bold">CPU 2</span>
                  </div>
                </div>
                <span className="text-[5.5px] text-zinc-400">16 CORES • 32 THREADS</span>
              </div>

              {/* 16x DDR4 ECC DIMM Slot Array */}
              <div className="flex flex-col justify-center items-center p-1 rounded bg-[#161821] border border-zinc-700/60 text-center">
                <span className="text-[6px] text-zinc-500 font-bold uppercase tracking-wider">ECC MEMORY BANKS</span>
                <div className="flex items-center gap-[1px] my-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="w-1 h-5 rounded-[0.5px] bg-emerald-500/40 border border-emerald-500/80" />
                  ))}
                  <div className="w-1 h-5" />
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="w-1 h-5 rounded-[0.5px] bg-emerald-500/40 border border-emerald-500/80" />
                  ))}
                </div>
                <span className="text-[5.5px] text-zinc-400">64 GB ECC REGISTERED</span>
              </div>

              {/* Hot-Swap Cooling Fan Module Array */}
              <div className="flex flex-col justify-center items-center p-1 rounded bg-[#161821] border border-zinc-700/60 text-center">
                <span className="text-[6px] text-zinc-500 font-bold uppercase tracking-wider">6x REDUNDANT FANS</span>
                <div className="grid grid-cols-3 gap-1 my-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-3.5 h-3.5 rounded-full bg-black border border-cyan-500/60 flex items-center justify-center shadow-inner"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-spin" />
                    </div>
                  ))}
                </div>
                <span className="text-[5.5px] text-cyan-400 font-bold">12,500 RPM • NORMAL</span>
              </div>
            </div>

            {/* Bottom Strip of Lid: Industrial Hazard Warning & Asset Barcode */}
            <div className="mx-4 flex items-center justify-between pt-1 border-t border-zinc-700/80">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[6px] font-bold">
                <span className="w-1 h-1 rounded-full bg-amber-400 animate-ping" />
                <span>CAUTION: DUAL POWER SUPPLIES CONNECTED • STATIC SENSITIVE DEVICES</span>
              </div>

              <div className="flex items-center gap-2 text-[6px] text-zinc-400">
                <span>INDEPENDENT TELEVISION ASSET: <strong className="text-zinc-200">{equipment.id.toUpperCase()}</strong></span>
                <span className="text-zinc-600">•</span>
                <span className="font-mono text-cyan-400">IP: {displayIp}</span>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            MAIN SERVER FRONT BEZEL
            Optimized for visibility: larger server name, distinct drive bays,
            heavy handles, and clear status LEDs
            =================================================================== */}
        <div
          className={`w-full h-full rounded-[2px] border flex items-center justify-between px-1 sm:px-1.5 transition-colors overflow-hidden ${
            isOnline
              ? isSelected
                ? 'bg-gradient-to-r from-[#1d202d] via-[#141620] to-[#1d202d] border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-gradient-to-r from-[#181a24] via-[#101117] to-[#181a24] border-zinc-700/90 hover:border-zinc-500'
              : isWarning
              ? 'bg-gradient-to-r from-[#201c13] via-[#14120a] to-[#201c13] border-amber-600/90'
              : 'bg-gradient-to-r from-[#241316] via-[#150c0e] to-[#241316] border-rose-600/90'
          }`}
        >
          {/* ===============================================================
              LEFT SECTION: RACK MOUNTING EAR + CAPTIVE SCREWS + CHASSIS HANDLE
              =============================================================== */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 h-full py-0.5">
            {/* Left Rack Mounting Ear with 2 Captive Screws */}
            <div className="w-2.5 sm:w-3 h-full flex flex-col justify-between items-center bg-[#252833] rounded-[1px] border border-zinc-600 shadow-sm shrink-0 py-0.5">
              <div
                className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900 flex items-center justify-center shadow-inner"
                title="Captive Rack Mounting Screw"
              >
                <div className="w-1 h-[0.5px] bg-zinc-400 rotate-45" />
              </div>
              <div
                className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900 flex items-center justify-center shadow-inner"
                title="Captive Rack Mounting Screw"
              >
                <div className="w-1 h-[0.5px] bg-zinc-400 -rotate-45" />
              </div>
            </div>

            {/* Left Solid Aluminum Chassis Handle */}
            <div
              className="w-1.5 sm:w-2 h-full rounded-[1px] border border-zinc-500 shrink-0 shadow-sm"
              style={{
                background: 'linear-gradient(90deg, #9ca3af 0%, #f3f4f6 35%, #e5e7eb 65%, #6b7280 100%)',
              }}
            />

            {/* Power Button & Diagnostic Status Cluster */}
            <div className="flex flex-col justify-between py-0.5 px-0.5 sm:px-1 h-full bg-[#0c0d12] rounded-[2px] border border-zinc-800 shrink-0 leading-none">
              <div className="flex items-center gap-1 sm:gap-1.5">
                {/* Power Button with LED Ring */}
                <button
                  type="button"
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex items-center justify-center border transition-all ${
                    isOnline
                      ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_6px_#34d399]'
                      : isWarning
                      ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_6px_#fbbf24]'
                      : 'bg-rose-500/20 border-rose-500 shadow-[0_0_6px_#f43f5e]'
                  }`}
                  title={`Power Status: ${serverNode?.status || 'ONLINE'}`}
                >
                  <div
                    className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                      isOnline ? 'bg-emerald-400' : isWarning ? 'bg-amber-400' : 'bg-rose-500'
                    }`}
                  />
                </button>

                {/* Network Traffic Activity LED */}
                <div
                  className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                    isOnline ? 'bg-amber-400 shadow-[0_0_4px_#fbbf24] animate-nic-flicker' : 'bg-zinc-700'
                  }`}
                  title="NIC Network Traffic"
                />
              </div>

              {/* U Slot Stamp */}
              <span className="text-[6.5px] sm:text-[7px] font-mono text-zinc-400 font-bold tracking-tight">
                {uDisplay}
              </span>
            </div>
          </div>

          {/* ===============================================================
              CENTER SECTION: BRAND BADGE + SERVER LABEL + HONEYCOMB EXHAUST
              =============================================================== */}
          <div className="flex-1 min-w-0 mx-1 sm:mx-1.5 h-full flex items-center justify-between gap-1 overflow-hidden">
            {/* Ventilation Honeycomb Texture with Professional Server Badge */}
            <div className="flex-1 min-w-0 h-full rounded-[2px] border border-zinc-800/90 server-honeycomb-grill flex items-center justify-between px-1.5 sm:px-2 overflow-hidden relative shadow-inner">
              {/* Server Name & IP Label Plate */}
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 shrink">
                <div
                  className={`px-1.5 sm:px-2 py-0.5 rounded-[2px] font-mono ${
                    is2U ? 'text-[9.5px] sm:text-[11px]' : 'text-[8px] sm:text-[9px]'
                  } font-black tracking-wide flex items-center gap-1 shadow shrink-0 ${
                    isOnline
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white'
                      : isWarning
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white'
                      : 'bg-gradient-to-r from-rose-700 to-red-800 text-white'
                  }`}
                >
                  <Server className={`${is2U ? 'w-3 h-3' : 'w-2.5 h-2.5'} stroke-[2.5] shrink-0`} />
                  <span className="truncate max-w-[85px] sm:max-w-[125px]">{displayName}</span>
                </div>

                {/* Subnet / IP Address */}
                <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/85 border border-zinc-700/80 text-[7.5px] sm:text-[8.5px] font-mono text-zinc-200 font-bold shrink-0">
                  <span>{displayIp}</span>
                </div>
              </div>

              {/* Vendor & Model Badge */}
              <div className="hidden md:flex items-center gap-1 min-w-0 shrink-0 text-[7px] sm:text-[7.5px] font-mono font-bold text-zinc-400 pl-1">
                <span className="px-1 py-0.2 rounded bg-zinc-900/95 border border-zinc-800 text-zinc-300 shrink-0">
                  {equipment.vendor}
                </span>
                <span className="text-zinc-400 truncate max-w-[70px] sm:max-w-[95px]">{displayModel}</span>
              </div>
            </div>
          </div>

          {/* ===============================================================
              RIGHT SECTION: HOT-SWAP DRIVE CADDIES WITH ACTIVITY LEDS
              =============================================================== */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 h-full py-0.5">
            {/* Hot-Swap Drive Matrix (Up to 4 bays on compact, 6 on wider) */}
            <div className="flex items-center gap-0.5 bg-[#090a0e] p-0.5 rounded-[2px] border border-zinc-800">
              {Array.from({ length: Math.min(equipment.driveBayCount || 4, 6) }).map((_, i) => (
                <div
                  key={i}
                  className={`${
                    is2U ? 'w-1.5 sm:w-2' : 'w-1.5'
                  } h-full py-0.5 bg-[#171922] rounded-[1px] border border-zinc-700 flex flex-col justify-between items-center`}
                  title={`Drive Bay ${i + 1}: SAS 12G Hot-Swap`}
                >
                  {/* Signature Blue Release Latch */}
                  <div className="w-full h-1 server-caddy-latch-blue rounded-[0.5px]" />
                  {/* Drive Activity LED */}
                  <div
                    className={`w-1 h-0.5 rounded-full ${
                      isOnline ? 'bg-emerald-400 animate-drive-flicker' : 'bg-zinc-800'
                    }`}
                  />
                  {/* Drive Base Stop */}
                  <div className="w-full h-0.5 bg-zinc-800 rounded-[0.5px]" />
                </div>
              ))}
            </div>

            {/* Right Solid Aluminum Chassis Handle */}
            <div
              className="w-1.5 sm:w-2 h-full rounded-[1px] border border-zinc-500 shrink-0 shadow-sm"
              style={{
                background: 'linear-gradient(90deg, #9ca3af 0%, #f3f4f6 35%, #e5e7eb 65%, #6b7280 100%)',
              }}
            />

            {/* Right Rack Mounting Ear with 2 Captive Screws */}
            <div className="w-2.5 sm:w-3 h-full flex flex-col justify-between items-center bg-[#252833] rounded-[1px] border border-zinc-600 shadow-sm shrink-0 py-0.5">
              <div
                className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900 flex items-center justify-center shadow-inner"
                title="Captive Rack Mounting Screw"
              >
                <div className="w-1 h-[0.5px] bg-zinc-400 rotate-45" />
              </div>
              <div
                className="w-1.5 h-1.5 rounded-full bg-[#71717a] border border-zinc-900 flex items-center justify-center shadow-inner"
                title="Captive Rack Mounting Screw"
              >
                <div className="w-1 h-[0.5px] bg-zinc-400 -rotate-45" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          3. HOVER HUD TOOLTIP (Only when not selected)
          -------------------------------------------------------------------- */}
      {isHovered && !isSelected && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-9 z-50 px-2.5 py-1 rounded bg-[#0b0c12]/95 border border-cyan-500/80 text-[8.5px] font-mono text-zinc-200 shadow-xl pointer-events-none flex items-center gap-2 whitespace-nowrap backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold text-white">{displayName}</span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-400">{uDisplay}</span>
          <span className="text-zinc-500">•</span>
          <span className="text-cyan-300 font-bold">{displayIp}</span>
          <span className="text-zinc-500">•</span>
          <span className="text-emerald-400 font-bold">CLICK TO PULL OUT</span>
        </div>
      )}
    </div>
  );
};
