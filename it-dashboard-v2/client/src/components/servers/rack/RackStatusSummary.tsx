'use client';

import React from 'react';
import { RackEquipment, ServerNode } from './RackTypes';
import { Server, Activity, CheckCircle2, AlertTriangle, Zap, Layers } from 'lucide-react';

interface RackStatusSummaryProps {
  rackTitle: string;
  rackNumber: string;
  equipmentList: RackEquipment[];
  servers: ServerNode[];
  onHoverU?: (u: number | null) => void;
  hoveredU?: number | null;
}

export const RackStatusSummary: React.FC<RackStatusSummaryProps> = ({
  rackTitle,
  rackNumber,
  equipmentList,
  servers,
  onHoverU,
  hoveredU,
}) => {
  const totalU = 42;
  const occupiedU = equipmentList.reduce((acc, eq) => acc + eq.uHeight, 0);
  const availableU = Math.max(0, totalU - occupiedU);
  const totalDevices = equipmentList.filter((e) => e.category !== 'filler').length;

  // Real server statuses from backend
  const rackServers = equipmentList
    .filter((e) => e.category === 'server')
    .map((e) => servers.find((s) => s.id === e.serverNodeId || s.serverName.toUpperCase() === e.name.toUpperCase()))
    .filter(Boolean) as ServerNode[];

  const onlineCount = rackServers.filter((s) => s.status === 'ONLINE' || s.online === true).length;
  const offlineCount = rackServers.filter((s) => s.status === 'OFFLINE' || s.online === false).length;

  const powerLoadKw = rackNumber === '01' ? '2.4 kW' : '3.1 kW';

  return (
    <div className="w-full bg-[#10121a] rounded-xl border border-zinc-800 p-3 shadow-md font-mono text-xs select-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Rack Capacity Metrics */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-zinc-400 font-semibold text-[11px]">42U Standard:</span>
            <span className="font-bold text-white text-[12px]">{occupiedU}U Occupied</span>
            <span className="text-zinc-500 font-normal text-[10px]">({availableU}U Free)</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 border-l border-zinc-800 pl-3">
            <Server className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400 text-[11px]">Hardware:</span>
            <span className="font-bold text-zinc-200 text-[11px]">{totalDevices} Units</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 border-l border-zinc-800 pl-3">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-400 text-[11px]">Load:</span>
            <span className="font-bold text-amber-300 text-[11px]">{powerLoadKw}</span>
          </div>
        </div>

        {/* Server Online/Offline Telemetry */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {onlineCount} Online
          </span>

          {offlineCount > 0 ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-400 text-[10px] font-bold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {offlineCount} Down
            </span>
          ) : (
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-500">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              All Normal
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Vertical 42U Mini Occupancy Strip
 * Shown alongside the cabinet rail
 */
export const VerticalOccupancyStrip: React.FC<{
  equipmentList: RackEquipment[];
  servers: ServerNode[];
  onHoverU?: (u: number | null) => void;
}> = ({ equipmentList, servers, onHoverU }) => {
  const units = Array.from({ length: 42 }).map((_, i) => 42 - i);

  return (
    <div
      className="hidden lg:flex flex-col w-2.5 h-full py-1 bg-[#090a0d] border border-zinc-800 rounded-[2px] shadow-inner select-none pointer-events-auto"
      title="42U Rack Space Occupancy Strip"
    >
      {units.map((u) => {
        const eq = equipmentList.find((e) => u >= e.uStart && u < e.uStart + e.uHeight);
        let colorClass = 'bg-zinc-800/40'; // Available / Empty slot

        if (eq) {
          if (eq.category === 'server') {
            const srv = servers.find((s) => s.id === eq.serverNodeId || s.serverName.toUpperCase() === eq.name.toUpperCase());
            const isOnline = srv ? srv.status === 'ONLINE' || srv.online === true : true;
            colorClass = isOnline ? 'bg-emerald-500 shadow-[0_0_2px_#10b981]' : 'bg-rose-500 shadow-[0_0_2px_#ef4444]';
          } else if (eq.category === 'switch') {
            colorClass = 'bg-cyan-400 shadow-[0_0_2px_#06b6d4]';
          } else if (eq.category === 'storage_array') {
            colorClass = 'bg-blue-500';
          } else if (eq.category === 'ups' || eq.category === 'pdu') {
            colorClass = 'bg-amber-400';
          } else if (eq.category === 'patch_panel') {
            colorClass = 'bg-purple-400';
          } else {
            colorClass = 'bg-zinc-700';
          }
        }

        return (
          <div
            key={u}
            className={`flex-1 w-full my-[0.5px] rounded-[0.5px] transition-all hover:scale-125 cursor-pointer ${colorClass}`}
            onMouseEnter={() => onHoverU && onHoverU(u)}
            onMouseLeave={() => onHoverU && onHoverU(null)}
            title={`U${u}: ${eq ? `${eq.name} (${eq.category})` : 'Available Rack Space'}`}
          />
        );
      })}
    </div>
  );
};
