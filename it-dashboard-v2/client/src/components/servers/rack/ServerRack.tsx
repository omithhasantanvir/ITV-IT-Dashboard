'use client';

import React, { useState, useEffect } from 'react';
import {
  ServerNode,
  RackEquipment,
  RackViewMode,
  U_HEIGHT_PX,
} from './RackTypes';
import { RackRail } from './RackRail';
import { RackServer } from './RackServer';
import { NetworkSwitch } from './NetworkSwitch';
import { PatchPanel } from './PatchPanel';
import { StorageArray } from './StorageArray';
import { PowerEquipment } from './PowerEquipment';
import { ServerDetailsPanel } from './ServerDetailsPanel';
import {
  Server,
  DoorOpen,
  DoorClosed,
  Lock,
  RotateCcw,
} from 'lucide-react';

interface ServerRackProps {
  rackNumber: string; // '01' | '02'
  rackTitle: string;
  rackSub: string;
  equipmentList: RackEquipment[];
  servers: ServerNode[];
  selectedEquipment: RackEquipment | null;
  onSelectEquipment: (eq: RackEquipment | null) => void;
  hoveredEquipmentId: string | null;
  onHoverEquipment: (id: string | null) => void;
  onPingSingle?: (srv: ServerNode) => void;
  onCopyIp?: (ip: string) => void;
  copiedIp?: string | null;
  soundEnabled?: boolean;
  onPlaySound?: (type: 'beep' | 'slide' | 'door' | 'alert' | 'click') => void;
  onRequestDoorAuth?: () => void;
  totalUnits?: number;
}

export const ServerRack: React.FC<ServerRackProps> = ({
  rackNumber,
  rackTitle,
  rackSub,
  equipmentList,
  servers,
  selectedEquipment,
  onSelectEquipment,
  hoveredEquipmentId,
  onHoverEquipment,
  onPingSingle,
  onCopyIp,
  copiedIp,
  soundEnabled,
  onPlaySound,
  onRequestDoorAuth,
  totalUnits = 27,
}) => {
  // View mode inside this cabinet: 'front' | 'rear' | '3d'
  const [viewMode, setViewMode] = useState<RackViewMode>('front');
  // Front Glass / Mesh Door: Open or Closed
  const [doorOpen, setDoorOpen] = useState(false);

  const isRack1 = rackNumber === '01';
  const totalRackHeight = totalUnits * U_HEIGHT_PX; // 27 * 24px = 648px

  // Press Escape to retract any extended server in this rack
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedEquipment) {
        if (onPlaySound) onPlaySound('slide');
        onSelectEquipment(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEquipment, onSelectEquipment, onPlaySound]);

  // Toggle Door Open/Close
  const handleToggleDoor = () => {
    if (doorOpen) {
      setDoorOpen(false);
      if (onPlaySound) onPlaySound('door');
    } else {
      if (onRequestDoorAuth) {
        onRequestDoorAuth();
      } else {
        setDoorOpen(true);
        if (onPlaySound) onPlaySound('door');
      }
    }
  };

  // Handle Equipment Click (Pull Out Server or Toggle Selection)
  const handleEquipmentClick = (eq: RackEquipment) => {
    if (selectedEquipment?.id === eq.id) {
      // Push back in
      onSelectEquipment(null);
    } else {
      // Pull out
      onSelectEquipment(eq);
    }
  };

  // Find linked ServerNode for selected equipment
  const selectedServerNode = selectedEquipment?.serverNodeId
    ? servers.find((s) => s.id === selectedEquipment.serverNodeId)
    : selectedEquipment
    ? servers.find((s) => s.serverName.toUpperCase() === selectedEquipment.name.toUpperCase())
    : undefined;

  // Exact vertical position calculation for beside-the-server details panel
  const selectedTopOffset = selectedEquipment
    ? (totalUnits - (selectedEquipment.uStart + selectedEquipment.uHeight - 1)) * U_HEIGHT_PX
    : 0;
  // Clamped top position so details panel never overflows the rack boundary
  const clampedPanelTop = Math.max(8, Math.min(selectedTopOffset - 24, totalRackHeight - 380));

  // =========================================================================
  // SEQUENTIAL RACK SLOT RENDERER (Clean 27U Rack without empty bottom void)
  // Iterates from totalUnits down to U01:
  // - Real hardware renders at its exact physical U position.
  // - Unoccupied units render as clean, compact empty rack spaces.
  // =========================================================================
  const renderSlots = () => {
    const slotElements: React.ReactNode[] = [];
    let currentU = totalUnits;

    while (currentU >= 1) {
      // Find equipment whose topmost rack unit matches currentU
      // (An equipment with uStart and uHeight occupies units from uStart to uStart + uHeight - 1)
      const eq = equipmentList.find((e) => e.uStart + e.uHeight - 1 === currentU);

      if (eq) {
        const isSelected = selectedEquipment?.id === eq.id;
        const isHovered = hoveredEquipmentId === eq.id;
        const serverNode = eq.serverNodeId
          ? servers.find((s) => s.id === eq.serverNodeId)
          : servers.find((s) => s.serverName.toUpperCase() === eq.name.toUpperCase());

        if (eq.category === 'server') {
          slotElements.push(
            <RackServer
              key={eq.id}
              equipment={eq}
              serverNode={serverNode}
              isSelected={isSelected}
              isHovered={isHovered}
              doorOpen={doorOpen}
              viewMode={viewMode}
              onSelect={handleEquipmentClick}
              onHover={onHoverEquipment}
              onPingSingle={onPingSingle}
              onCopyIp={onCopyIp}
              copiedIp={copiedIp}
              onPlaySound={onPlaySound}
            />
          );
        } else if (eq.category === 'switch') {
          slotElements.push(<NetworkSwitch key={eq.id} equipment={eq} />);
        } else if (eq.category === 'patch_panel') {
          slotElements.push(<PatchPanel key={eq.id} equipment={eq} />);
        } else if (eq.category === 'storage_array') {
          slotElements.push(<StorageArray key={eq.id} equipment={eq} />);
        } else if (eq.category === 'ups' || eq.category === 'pdu') {
          slotElements.push(<PowerEquipment key={eq.id} equipment={eq} />);
        }

        currentU -= eq.uHeight;
      } else {
        // Genuinely unoccupied 1U rack slot: clean, compact, authentic empty rail space
        const uNum = currentU;
        slotElements.push(
          <div
            key={`unoccupied-u${uNum}`}
            style={{ height: `${U_HEIGHT_PX}px` }}
            className="w-full relative px-2 border-b border-zinc-800/40 bg-[#08090d] flex items-center justify-between select-none group/empty hover:bg-[#0c0e14] transition-colors"
          >
            {/* Left rail cage nut thread marker */}
            <div className="flex items-center gap-1.5 opacity-30 group-hover/empty:opacity-60 transition-opacity">
              <div className="w-1.5 h-1.5 rounded-[1px] bg-zinc-800 border border-zinc-700/60 shadow-inner" />
              <span className="text-[6.5px] font-mono text-zinc-600 font-medium">U{uNum}</span>
            </div>

            {/* Subtle clean empty bay guideline (NO fake text) */}
            <div className="flex items-center gap-2 opacity-20 group-hover/empty:opacity-40 transition-opacity">
              <div className="h-[1px] w-6 sm:w-12 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
              <span className="text-[6px] font-mono text-zinc-600 tracking-widest uppercase">
                AVAILABLE 1U
              </span>
              <div className="h-[1px] w-6 sm:w-12 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
            </div>

            {/* Right rail cage nut thread marker */}
            <div className="flex items-center gap-1.5 opacity-30 group-hover/empty:opacity-60 transition-opacity">
              <span className="text-[6.5px] font-mono text-zinc-600 font-medium">U{uNum}</span>
              <div className="w-1.5 h-1.5 rounded-[1px] bg-zinc-800 border border-zinc-700/60 shadow-inner" />
            </div>
          </div>
        );

        currentU -= 1;
      }
    }

    return slotElements;
  };

  return (
    <div className="w-full flex flex-col items-center font-mono relative">
      {/* =====================================================================
          MAIN 42U PHYSICAL SERVER CABINET ENCLOSURE
          Full width for equipment, realistic 19" EIA-310 proportions.
          ===================================================================== */}
      <div
        className={`w-full max-w-[460px] sm:max-w-[480px] relative transition-transform duration-500 ${
          viewMode === '3d'
            ? '[perspective:1400px] [transform:rotateY(-7deg)_rotateX(2deg)] shadow-[25px_25px_60px_rgba(0,0,0,0.9)]'
            : ''
        }`}
      >
        {/* =================================================================
            CABINET TOP ROOF CANOPY & DUAL 120MM EXHAUST COOLING FANS
            ================================================================= */}
        <div className="w-full h-8 rounded-t-xl bg-gradient-to-b from-[#2b2e3a] via-[#1a1b24] to-[#101117] border-t border-x border-zinc-700/80 px-3 flex items-center justify-between shadow-[inset_0_2px_4px_rgba(255,255,255,0.12),0_-4px_12px_rgba(0,0,0,0.8)] relative z-30">
          {/* Fan 1 (Left) */}
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-black/90 border border-cyan-500/50 p-0.5 flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.4)] overflow-hidden">
              <svg
                className="w-full h-full text-cyan-400 animate-spin"
                style={{ animationDuration: '2.4s' }}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 12c-2.2 0-4-1.8-4-4 0-3.3 4-7 4-7s4 3.7 4 7c0 2.2-1.8 4-4 4zm0 0c0-2.2 1.8-4 4-4 3.3 0 7 4 7 4s-3.7 4-7 4c-2.2 0-4-1.8-4-4zm0 0c2.2 0 4 1.8 4 4 0 3.3-4 7-4 7s-4-3.7-4-7c0-2.2 1.8-4 4-4zm0 0c0 2.2-1.8 4-4 4-3.3 0-7-4-7-4s3.7-4 7-4c2.2 0 4 1.8 4 4z" />
                <circle cx="12" cy="12" r="2.5" fill="#090a0f" stroke="#06b6d4" strokeWidth="1" />
              </svg>
            </div>
            <span className="text-[6.5px] font-mono text-zinc-400 font-bold hidden sm:inline">
              FAN 1 • 2450 RPM
            </span>
          </div>

          {/* Center Cable Chimney & Standard Stamp */}
          <div className="px-2.5 py-0.5 rounded-full bg-black/80 border border-zinc-700 text-[7px] text-zinc-300 font-bold tracking-wider flex items-center gap-1.5 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_#34d399]" />
            <span>{totalUnits}U EIA-310 • APC NETSHELTER SX</span>
          </div>

          {/* Fan 2 (Right) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[6.5px] font-mono text-zinc-400 font-bold hidden sm:inline">
              FAN 2 • 2480 RPM
            </span>
            <div className="w-5 h-5 rounded-full bg-black/90 border border-cyan-500/50 p-0.5 flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.4)] overflow-hidden">
              <svg
                className="w-full h-full text-cyan-400 animate-spin"
                style={{ animationDuration: '2.2s' }}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 12c-2.2 0-4-1.8-4-4 0-3.3 4-7 4-7s4 3.7 4 7c0 2.2-1.8 4-4 4zm0 0c0-2.2 1.8-4 4-4 3.3 0 7 4 7 4s-3.7 4-7 4c-2.2 0-4-1.8-4-4zm0 0c2.2 0 4 1.8 4 4 0 3.3-4 7-4 7s-4-3.7-4-7c0-2.2 1.8-4 4-4zm0 0c0 2.2-1.8 4-4 4-3.3 0-7-4-7-4s3.7-4 7-4c2.2 0 4 1.8 4 4z" />
                <circle cx="12" cy="12" r="2.5" fill="#090a0f" stroke="#06b6d4" strokeWidth="1" />
              </svg>
            </div>
          </div>
        </div>

        {/* =================================================================
            CABINET BEZEL HEADER (OFFICIAL ITV BRANDING & VIEW SELECTOR)
            ================================================================= */}
        <div className="px-3 py-2 bg-gradient-to-b from-[#1b1d28] via-[#12131b] to-[#0c0d12] border-x border-b border-zinc-700/80 flex flex-wrap items-center justify-between gap-2 relative z-30">
          {/* Official ITV Logo & Title */}
          <div className="flex items-center gap-2">
            <img
              src="/itv-logo.png"
              alt="Independent Television Logo"
              className="h-5 w-auto object-contain drop-shadow-[0_0_8px_rgba(227,30,36,0.7)] select-none shrink-0"
            />
            <div className="flex flex-col leading-none">
              <span className="text-xs font-black text-white tracking-wider uppercase font-mono">
                ITV RACK {rackNumber}
              </span>
              <span className="text-[7.5px] text-zinc-400 font-bold uppercase font-mono mt-0.5">
                {rackSub}
              </span>
            </div>
          </div>

          {/* View Selector Controls (Front / Rear / 3D) & Door Lock */}
          <div className="flex items-center gap-1.5">
            {/* View Mode Switcher */}
            <div className="flex items-center p-0.5 rounded-lg bg-black/80 border border-zinc-800 text-[8px] font-bold">
              <button
                onClick={() => setViewMode('front')}
                className={`px-2 py-0.5 rounded transition ${
                  viewMode === 'front'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Front View: Server bezels, drive bays, LEDs"
              >
                Front
              </button>
              <button
                onClick={() => setViewMode('rear')}
                className={`px-2 py-0.5 rounded transition ${
                  viewMode === 'rear'
                    ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Rear View: Power supplies, Ethernet ports, SFP+ fiber"
              >
                Rear
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`px-2 py-0.5 rounded transition ${
                  viewMode === '3d'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="3D Perspective View: Angled inspection"
              >
                3D
              </button>
            </div>

            {/* Cabinet Door Open/Close Button */}
            <button
              onClick={handleToggleDoor}
              className={`px-2 py-1 rounded-lg text-[8px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                doorOpen
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800'
              }`}
              title={doorOpen ? 'Click to close cabinet glass door' : 'Click to open cabinet glass door'}
            >
              {doorOpen ? (
                <>
                  <DoorOpen className="w-2.5 h-2.5 text-emerald-400" />
                  <span>DOOR OPEN</span>
                </>
              ) : (
                <>
                  <DoorClosed className="w-2.5 h-2.5 text-zinc-400" />
                  <span>DOOR CLOSED</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* =================================================================
            CABINET CHASSIS FRAME & INTERNAL EQUIPMENT CHAMBER
            Clean, balanced cabinet frame with left & right mounting rails.
            Equipment occupies the full usable width. NO right-side extension!
            ================================================================= */}
        <div className="w-full border-x border-zinc-800 bg-[#08090c] relative shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex">
          {/* Vertical Rails on Left */}
          <RackRail side="left" units={totalUnits} />

          {/* Center Equipment Column: Exact totalRackHeight */}
          <div
            style={{ height: `${totalRackHeight}px` }}
            className="flex-1 mx-5 sm:mx-6 bg-[#090a0e] flex flex-col relative z-10 border-x border-zinc-800/90"
          >
            {renderSlots()}
          </div>

          {/* Vertical Rails on Right */}
          <RackRail side="right" units={totalUnits} />

          {/* ===============================================================
              OPTIONAL GLASS / MESH FRONT DOOR OVERLAY
              When closed, displays realistic tinted glass with reflection.
              When clicked or toggled, swings smoothly open on left hinge.
              =============================================================== */}
          {!doorOpen && (
            <div
              onClick={handleToggleDoor}
              className="absolute inset-0 z-30 bg-cyan-950/20 backdrop-blur-[0.5px] border-2 border-zinc-700/60 rounded-[2px] transition-all cursor-pointer group flex flex-col justify-between p-3 select-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(6,182,212,0.04) 40%, rgba(0,0,0,0.4) 100%)',
              }}
              title="Cabinet Glass Door is Locked. Click to open and inspect servers."
            >
              {/* Glass Diagonal Reflection Sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none" />

              {/* Top Door Warning Label */}
              <div className="self-center px-3 py-1 rounded bg-black/80 border border-zinc-700 text-[8px] font-mono font-bold text-zinc-300 flex items-center gap-1.5 shadow-lg opacity-80 group-hover:opacity-100 transition">
                <Lock className="w-2.5 h-2.5 text-cyan-400" />
                <span>CABINET DOOR CLOSED • CLICK TO UNLOCK & PULL OUT SERVERS</span>
              </div>

              {/* Right Chrome Door Swing Handle & Cylinder Lock */}
              <div className="self-end mr-2 w-4 h-24 rounded bg-gradient-to-b from-zinc-400 via-zinc-200 to-zinc-500 border border-zinc-700 flex flex-col items-center justify-between py-2 shadow-2xl">
                <div className="w-2 h-2 rounded-full bg-zinc-800 border border-zinc-600 shadow-inner" />
                <div className="w-1 h-8 rounded-full bg-zinc-600" />
                <div className="w-2 h-2 rounded-full bg-zinc-800 border border-zinc-600 shadow-inner" />
              </div>
            </div>
          )}
        </div>

        {/* =================================================================
            CABINET BASE FOOTER & HEAVY-DUTY CASTER LEVELING FEET
            ================================================================= */}
        <div className="w-full h-8 rounded-b-xl bg-gradient-to-b from-[#101117] via-[#1a1b24] to-[#252834] border-b border-x border-zinc-700/80 px-3 flex items-center justify-between shadow-[0_15px_30px_rgba(0,0,0,0.8)] relative z-20">
          {/* Left Foot Caster */}
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-zinc-900 border border-zinc-700 rounded-b flex items-center justify-center">
              <div className="w-2 h-1 bg-zinc-600 rounded-sm" />
            </div>
            <span className="text-[6.5px] font-mono text-zinc-400">GROUND LUG #1</span>
          </div>

          <div className="text-[7px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
            INDEPENDENT TELEVISION DATACENTER
          </div>

          {/* Right Foot Caster */}
          <div className="flex items-center gap-1">
            <span className="text-[6.5px] font-mono text-zinc-400">GROUND LUG #2</span>
            <div className="w-4 h-3 bg-zinc-900 border border-zinc-700 rounded-b flex items-center justify-center">
              <div className="w-2 h-1 bg-zinc-600 rounded-sm" />
            </div>
          </div>
        </div>

        {/* ===================================================================
            SERVER DETAILS PANEL: BESIDE THE EXTENDED SERVER (DESKTOP)
            Appears at the exact same moment the server pulls out, anchored
            directly beside the extended chassis at that specific U height!
            =================================================================== */}
        {selectedEquipment && (
          <div
            style={{ top: `${clampedPanelTop}px` }}
            className={`hidden xl:block absolute z-50 w-[380px] sm:w-[420px] transition-all duration-300 ${
              isRack1
                ? 'left-full ml-4'
                : 'right-full mr-4'
            }`}
          >
            {/* Visual illuminated indicator tether pointing from rack to panel */}
            <div
              className={`absolute top-6 w-4 h-[2px] bg-gradient-to-r from-cyan-400 to-teal-400 shadow-[0_0_8px_#22d3ee] pointer-events-none ${
                isRack1 ? '-left-4' : '-right-4'
              }`}
            />
            <ServerDetailsPanel
              equipment={selectedEquipment}
              serverNode={selectedServerNode}
              rackNumber={rackNumber}
              rackTitle={rackTitle}
              onClose={() => onSelectEquipment(null)}
              onPingSingle={onPingSingle}
              onCopyIp={onCopyIp}
              copiedIp={copiedIp}
              onPlaySound={onPlaySound}
            />
          </div>
        )}
      </div>

      {/* ===================================================================
          SERVER DETAILS PANEL: RESPONSIVE FALLBACK (< 1280px / MOBILE)
          Docks cleanly adjacent to the rack on narrow viewports
          =================================================================== */}
      {selectedEquipment && (
        <div className="xl:hidden w-full max-w-[460px] sm:max-w-[480px] mt-4 z-50">
          <ServerDetailsPanel
            equipment={selectedEquipment}
            serverNode={selectedServerNode}
            rackNumber={rackNumber}
            rackTitle={rackTitle}
            onClose={() => onSelectEquipment(null)}
            onPingSingle={onPingSingle}
            onCopyIp={onCopyIp}
            copiedIp={copiedIp}
            onPlaySound={onPlaySound}
          />
        </div>
      )}
    </div>
  );
};
