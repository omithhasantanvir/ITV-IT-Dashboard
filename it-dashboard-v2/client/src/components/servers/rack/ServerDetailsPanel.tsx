'use client';

import React from 'react';
import { ServerNode, RackEquipment } from './RackTypes';
import {
  Server,
  Activity,
  Cpu,
  HardDrive,
  Shield,
  Zap,
  Cable,
  Copy,
  Check,
  X,
  Radio,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Thermometer,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface ServerDetailsPanelProps {
  equipment: RackEquipment;
  serverNode?: ServerNode;
  rackNumber: string;
  rackTitle: string;
  onClose: () => void;
  onPingSingle?: (srv: ServerNode) => void;
  onCopyIp?: (ip: string) => void;
  copiedIp?: string | null;
  onPlaySound?: (type: 'beep' | 'slide' | 'door' | 'alert' | 'click') => void;
}

export const ServerDetailsPanel: React.FC<ServerDetailsPanelProps> = ({
  equipment,
  serverNode,
  rackNumber,
  rackTitle,
  onClose,
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

  const uPosition = equipment.uHeight > 1
    ? `U${equipment.uStart}–U${equipment.uStart + equipment.uHeight - 1}`
    : `U${equipment.uStart}`;

  const displayName = serverNode?.serverName || equipment.name;
  const displayHostname = serverNode?.hostname || `${displayName.toLowerCase()}.independent24.tv`;
  const displayIp = serverNode?.ipAddress || '172.19.4.x';
  const displayOs = serverNode?.operatingSystem || 'Windows Server 2022 Datacenter';
  const displayCpu = serverNode?.cpu || equipment.specsSummary?.split('•')[0]?.trim() || '16 vCPU (Xeon)';
  const displayRam = serverNode?.ram || equipment.specsSummary?.split('•')[1]?.trim() || '32 GB DDR4';
  const displayDisk = serverNode?.diskUsage || equipment.specsSummary?.split('•')[2]?.trim() || '45% used';
  const displayPurpose = serverNode?.purpose || equipment.description || 'Enterprise Broadcast Infrastructure';
  const displayAdmin = serverNode?.administrator || 'IT Infrastructure Team';

  const handleClose = () => {
    if (onPlaySound) onPlaySound('slide');
    onClose();
  };

  return (
    <div className="w-full bg-[#0d0e14] border border-cyan-500/50 rounded-xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(6,182,212,0.15)] font-mono text-xs animate-in fade-in slide-in-from-top-2 duration-200 relative overflow-hidden">
      {/* Top Ambient Glow Bar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-500" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          {/* Server Icon Box */}
          <div
            className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border ${
              isOnline
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : isWarning
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/40 text-rose-500 animate-pulse'
            }`}
          >
            <Server className="w-6 h-6 stroke-[2]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white tracking-wide">{displayName}</h3>
              <span
                className={`text-[8.5px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  isOnline
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : isWarning
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOnline ? 'bg-emerald-400 animate-pulse' : isWarning ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                />
                {isOnline ? 'ONLINE' : isWarning ? 'WARNING' : 'OFFLINE (TIMED OUT)'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
              <span>{displayHostname}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-cyan-400 font-bold">ITV RACK {rackNumber} ({uPosition})</span>
            </p>
          </div>
        </div>

        {/* Action Controls: Ping, Copy IP, Slide Back */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Copy IP */}
          <button
            onClick={() => onCopyIp && onCopyIp(displayIp)}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-[10px] flex items-center gap-1.5 transition active:scale-95"
            title="Copy IP Address"
          >
            {copiedIp === displayIp ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>{displayIp}</span>
              </>
            )}
          </button>

          {/* Live Ping Single */}
          {serverNode && onPingSingle && (
            <button
              onClick={() => onPingSingle(serverNode)}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] flex items-center gap-1.5 shadow-md shadow-cyan-600/30 transition active:scale-95"
              title="Send ICMP Ping Probe to this host"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Ping Node</span>
            </button>
          )}

          {/* Slide Back / Close */}
          <button
            onClick={handleClose}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-600 text-[10px] font-bold flex items-center gap-1.5 transition active:scale-95"
            title="Slide server back into cabinet slot"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Slide Back</span>
          </button>
        </div>
      </div>

      {/* Main Telemetry & Specifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3">
        {/* Computing & Hardware Profile */}
        <div className="p-2.5 rounded-lg bg-[#12141c] border border-zinc-800 space-y-1">
          <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Computing Specs
          </span>
          <p className="text-zinc-200 font-semibold text-[11px]">{displayCpu}</p>
          <p className="text-[10px] text-zinc-400">{displayRam} ECC Registered</p>
          <div className="pt-1 border-t border-zinc-800/80 flex items-center justify-between text-[9px]">
            <span className="text-zinc-500">Form Factor:</span>
            <span className="text-zinc-300 font-bold">{equipment.uHeight}U Chassis ({equipment.model})</span>
          </div>
        </div>

        {/* Operating System & Network I/O */}
        <div className="p-2.5 rounded-lg bg-[#12141c] border border-zinc-800 space-y-1">
          <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" /> Operating System & Network
          </span>
          <p className="text-zinc-200 font-semibold text-[11px] truncate">{displayOs}</p>
          <p className="text-[10px] text-zinc-400">
            IP: <span className="text-cyan-300 font-bold">{displayIp}</span> • Port: {serverNode?.port || 80}
          </p>
          <div className="pt-1 border-t border-zinc-800/80 flex items-center justify-between text-[9px]">
            <span className="text-zinc-500">Latency:</span>
            <span className={`font-bold ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isOnline ? `${serverNode?.latencyMs || 2} ms (0% Loss)` : 'Request Timed Out'}
            </span>
          </div>
        </div>

        {/* Storage, Thermal & Power Health */}
        <div className="p-2.5 rounded-lg bg-[#12141c] border border-zinc-800 space-y-1">
          <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Power & Environment
          </span>
          <p className="text-zinc-200 font-semibold text-[11px]">
            Dual 750W Titanium PSUs <span className="text-emerald-400">(Feed A+B OK)</span>
          </p>
          <p className="text-[10px] text-zinc-400">
            Storage Usage: <span className="text-zinc-200 font-bold">{displayDisk}</span>
          </p>
          <div className="pt-1 border-t border-zinc-800/80 flex items-center justify-between text-[9px]">
            <span className="text-zinc-500">Chassis Temp:</span>
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-cyan-400" /> 21°C Intake / 34°C Exhaust
            </span>
          </div>
        </div>
      </div>

      {/* Broadcast Purpose & Infrastructure Summary */}
      <div className="p-2.5 rounded-lg bg-[#101118] border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px]">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 uppercase font-bold shrink-0">Role & Purpose:</span>
          <span className="text-zinc-200 font-semibold">{displayPurpose}</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-400 shrink-0">
          <span>Admin: <strong className="text-zinc-200">{displayAdmin}</strong></span>
          <span className="text-zinc-600">•</span>
          <span>Asset: <strong className="text-cyan-400">{equipment.id.toUpperCase()}</strong></span>
        </div>
      </div>
    </div>
  );
};
