'use client';

import React, { useState } from 'react';
import {
  ServerNode,
  RackEquipment,
  RackViewMode,
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
  ChevronRight,
  Maximize2,
  ArrowRight,
  Sliders,
} from 'lucide-react';

interface RackServerProps {
  equipment: RackEquipment;
  serverNode?: ServerNode;
  isSelected: boolean;
  isHovered: boolean;
  doorOpen: boolean;
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
  doorOpen,
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

  // Visual height in pixels (1U = 28px, 2U = 56px, 3U = 84px, 4U = 112px)
  const heightPx = equipment.uHeight * 28;
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

  // --------------------------------------------------------------------------
  // REAR VIEW: PSUs, RJ45 ports, SFP+ optical ports, Cable Management Arm (CMA)
  // --------------------------------------------------------------------------
  if (viewMode === 'rear') {
    return (
      <div
        style={{ height: `${heightPx}px` }}
        className={`w-full relative px-1 py-0.5 border-b border-zinc-800 transition-all select-none ${
          isSelected ? 'bg-zinc-900/95 ring-1 ring-cyan-500/50' : 'bg-[#0f1015]'
        }`}
        onClick={handleClick}
      >
        <div className="h-full w-full rounded-[2px] bg-[#14151c] border border-zinc-700/80 flex items-center justify-between px-2 text-[8px] font-mono shadow-inner">
          {/* Dual Hot-Swap Power Supplies (PSU1 & PSU2) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* PSU 1 */}
            <div className="h-full py-0.5 px-1.5 rounded-[2px] bg-[#1b1c24] border border-zinc-700 flex items-center gap-1">
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
            <div className="h-full py-0.5 px-1.5 rounded-[2px] bg-[#1b1c24] border border-zinc-700 flex items-center gap-1">
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
            <span className="text-[7px] text-zinc-400 font-bold">{displayName} • REAR I/O</span>
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
                className="w-3 h-3 rounded-[1px] bg-zinc-900 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_3px_rgba(6,182,212,0.4)]"
                title="10G SFP+ Optic 1"
              >
                <div className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_4px_#22d3ee] animate-pulse" />
              </div>
              <div
                className="w-3 h-3 rounded-[1px] bg-zinc-900 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_3px_rgba(6,182,212,0.4)]"
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
  // FRONT / 3D VIEW: Physical Bezel, Drive Bays, Rails, Click-to-Pull-Out
  // --------------------------------------------------------------------------
  return (
    <div
      style={{
        height: `${heightPx}px`,
        perspective: '1200px',
      }}
      className="w-full relative px-1 py-0.5 border-b border-zinc-800/80 transition-all select-none"
      onMouseEnter={() => onHover(equipment.id)}
      onMouseLeave={() => onHover(null)}
      onClick={handleClick}
    >
      {/* --------------------------------------------------------------------
          TELESCOPING STAINLESS STEEL BALL-BEARING SLIDE RAILS
          (Physically slide out from rack rails when server is pulled out)
          -------------------------------------------------------------------- */}
      <div
        className={`absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 h-2.5 rounded-l border border-zinc-400 transition-all duration-300 pointer-events-none z-30 ${
          isSelected
            ? 'w-4 sm:w-5 opacity-100 shadow-[0_3px_10px_rgba(0,0,0,0.85)]'
            : 'w-0 opacity-0'
        }`}
        style={{
          background: 'linear-gradient(180deg, #4b5563 0%, #9ca3af 35%, #e5e7eb 50%, #6b7280 65%, #374151 100%)',
        }}
      >
        <div className="h-full flex items-center justify-around px-0.5">
          <div className="h-1 w-1 rounded-full bg-zinc-200 border border-zinc-600 shadow-inner" />
          <div className="h-1 w-1 rounded-full bg-zinc-200 border border-zinc-600 shadow-inner" />
        </div>
      </div>

      <div
        className={`absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 h-2.5 rounded-r border border-zinc-400 transition-all duration-300 pointer-events-none z-30 ${
          isSelected
            ? 'w-4 sm:w-5 opacity-100 shadow-[0_3px_10px_rgba(0,0,0,0.85)]'
            : 'w-0 opacity-0'
        }`}
        style={{
          background: 'linear-gradient(180deg, #4b5563 0%, #9ca3af 35%, #e5e7eb 50%, #6b7280 65%, #374151 100%)',
        }}
      >
        <div className="h-full flex items-center justify-around px-0.5">
          <div className="h-1 w-1 rounded-full bg-zinc-200 border border-zinc-600 shadow-inner" />
          <div className="h-1 w-1 rounded-full bg-zinc-200 border border-zinc-600 shadow-inner" />
        </div>
      </div>

      {/* --------------------------------------------------------------------
          SERVER CHASSIS CONTAINER
          Applies 3D translation when pulled out
          -------------------------------------------------------------------- */}
      <div
        className={`w-full h-full rounded-[2px] transition-all duration-300 ease-out cursor-pointer relative ${
          isSelected
            ? 'z-40 scale-[1.015] [transform:translateZ(42px)_translateY(-2px)] shadow-[0_18px_35px_rgba(0,0,0,0.95),0_0_24px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400/90'
            : isHovered
            ? 'z-20 scale-[1.005] [transform:translateZ(12px)] shadow-lg shadow-black/80'
            : 'z-10 [transform:translateZ(0px)]'
        }`}
      >
        {/* TOP GALVANIZED STEEL COVER LID (Revealed when pulled out!) */}
        {isSelected && (
          <div className="absolute -top-3 inset-x-2 h-3 bg-gradient-to-b from-[#2b2e38] via-[#1d1f27] to-[#121318] rounded-t border-t border-x border-zinc-600 text-[6px] font-mono text-zinc-400 flex items-center justify-between px-2 pointer-events-none shadow-md">
            <span className="font-bold text-zinc-300 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
              CHASSIS EXTENDED • {displayModel}
            </span>
            <span className="text-[5.5px] text-zinc-500 uppercase tracking-widest font-mono">
              ASSET ID: {equipment.id.toUpperCase()}
            </span>
          </div>
        )}

        {/* MAIN SERVER FRONT BEZEL */}
        <div
          className={`w-full h-full rounded-[2px] border flex items-center justify-between px-1 sm:px-1.5 transition-colors overflow-hidden ${
            isOnline
              ? isSelected
                ? 'bg-gradient-to-r from-[#171922] via-[#12131a] to-[#171922] border-cyan-500/80'
                : 'bg-gradient-to-r from-[#161820] via-[#0f1015] to-[#161820] border-zinc-700/80 hover:border-zinc-500'
              : isWarning
              ? 'bg-gradient-to-r from-[#201c13] via-[#14120a] to-[#201c13] border-amber-600/80'
              : 'bg-gradient-to-r from-[#221215] via-[#140b0d] to-[#221215] border-rose-600/80'
          }`}
        >
          {/* ===============================================================
              LEFT SECTION: RACK MOUNTING EAR + CAPTIVE SCREWS + CHASSIS HANDLE
              =============================================================== */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Left Rack Ear with 2 Captive Screws */}
            <div className="w-2.5 sm:w-3 h-full py-0.5 flex flex-col justify-between items-center bg-[#252833] rounded-[1px] border border-zinc-600 shadow-sm shrink-0">
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

            {/* Left Heavy Aluminum Chassis Handle */}
            <div
              className="w-1.5 sm:w-2 h-full rounded-[1px] border border-zinc-600 shrink-0 shadow-sm"
              style={{
                background: 'linear-gradient(90deg, #9ca3af 0%, #f3f4f6 35%, #e5e7eb 65%, #6b7280 100%)',
              }}
            />

            {/* Power Button & Diagnostic Status Cluster */}
            <div className="flex flex-col justify-between py-0.5 px-0.5 h-full bg-[#0d0e12] rounded-[2px] border border-zinc-800 shrink-0 leading-none">
              <div className="flex items-center gap-1">
                {/* Power Button with LED Ring */}
                <button
                  type="button"
                  className={`w-2.5 h-2.5 rounded-full flex items-center justify-center border transition-all ${
                    isOnline
                      ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_6px_#34d399]'
                      : isWarning
                      ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_6px_#fbbf24]'
                      : 'bg-rose-500/20 border-rose-500 shadow-[0_0_6px_#f43f5e]'
                  }`}
                  title={`Power Status: ${serverNode?.status || 'ONLINE'}`}
                >
                  <div
                    className={`w-1 h-1 rounded-full ${
                      isOnline ? 'bg-emerald-400' : isWarning ? 'bg-amber-400' : 'bg-rose-500'
                    }`}
                  />
                </button>

                {/* Network Traffic Activity LED */}
                <div
                  className={`w-1 h-1 rounded-full ${
                    isOnline ? 'bg-amber-400 shadow-[0_0_4px_#fbbf24] animate-nic-flicker' : 'bg-zinc-700'
                  }`}
                  title="NIC Network Activity"
                />
              </div>

              {/* U Slot Stamp */}
              <span className="text-[6.5px] font-mono text-zinc-400 font-bold tracking-tight">
                {uDisplay}
              </span>
            </div>
          </div>

          {/* ===============================================================
              CENTER SECTION: BRAND BADGE + SERVER LABEL + HONEYCOMB EXHAUST
              =============================================================== */}
          <div className="flex-1 mx-1.5 h-full flex items-center justify-between gap-1 overflow-hidden">
            {/* Ventilation Honeycomb Texture with Professional Tape Label */}
            <div className="flex-1 h-full rounded-[2px] border border-zinc-800/90 server-honeycomb-grill flex items-center justify-between px-2 overflow-hidden relative shadow-inner">
              {/* Server Name & IP Label Plate */}
              <div className="flex items-center gap-1.5 z-10">
                <div
                  className={`px-1.5 py-0.5 rounded-[2px] font-mono text-[8px] sm:text-[9px] font-extrabold tracking-wide flex items-center gap-1 shadow ${
                    isOnline
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white'
                      : isWarning
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white'
                      : 'bg-gradient-to-r from-rose-700 to-red-800 text-white'
                  }`}
                >
                  <Server className="w-2.5 h-2.5 stroke-[2.5]" />
                  <span>{displayName}</span>
                </div>

                {/* Subnet / IP Address */}
                <div className="hidden sm:flex items-center gap-1 px-1 py-0.5 rounded bg-black/80 border border-zinc-700/80 text-[7.5px] font-mono text-zinc-300 font-bold">
                  <span>{displayIp}</span>
                </div>
              </div>

              {/* Vendor & Model Badge */}
              <div className="hidden md:flex items-center gap-1 z-10 text-[7px] font-mono font-bold text-zinc-400">
                <span className="px-1 py-0.2 rounded bg-zinc-900/90 border border-zinc-800 text-zinc-300">
                  {equipment.vendor}
                </span>
                <span className="text-zinc-500 truncate max-w-[120px]">{displayModel}</span>
              </div>
            </div>
          </div>

          {/* ===============================================================
              RIGHT SECTION: HOT-SWAP DRIVE CADDIES WITH ACTIVITY LEDS
              =============================================================== */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Hot-Swap Drive Matrix (2 to 8 bays depending on 1U vs 2U/3U) */}
            <div className="flex items-center gap-0.5 bg-[#0a0b0e] p-0.5 rounded-[2px] border border-zinc-800">
              {Array.from({ length: Math.min(equipment.driveBayCount || 4, 8) }).map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 sm:w-2 h-full py-0.5 bg-[#171922] rounded-[1px] border border-zinc-700 flex flex-col justify-between items-center"
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

            {/* Right Heavy Aluminum Chassis Handle */}
            <div
              className="w-1.5 sm:w-2 h-full rounded-[1px] border border-zinc-600 shrink-0 shadow-sm"
              style={{
                background: 'linear-gradient(90deg, #9ca3af 0%, #f3f4f6 35%, #e5e7eb 65%, #6b7280 100%)',
              }}
            />

            {/* Right Rack Ear with 2 Captive Screws */}
            <div className="w-2.5 sm:w-3 h-full py-0.5 flex flex-col justify-between items-center bg-[#252833] rounded-[1px] border border-zinc-600 shadow-sm shrink-0">
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
    </div>
  );
};
