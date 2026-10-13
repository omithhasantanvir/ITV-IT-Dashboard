'use client';

import { Fingerprint, Unlock, CreditCard } from 'lucide-react';

interface SupremaRackTerminalProps {
  doorOpen: boolean;
  onOpenTerminal: () => void;
  onLockDoor: () => void;
  soundEnabled?: boolean;
  onPlaySound?: (type: 'beep' | 'alert' | 'slide' | 'door' | 'key' | 'grant' | 'deny') => void;
}

export function SupremaRackTerminal({
  doorOpen,
  onOpenTerminal,
  onLockDoor,
  soundEnabled,
  onPlaySound,
}: SupremaRackTerminalProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (doorOpen) {
      if (soundEnabled && onPlaySound) onPlaySound('door');
      onLockDoor();
    } else {
      if (soundEnabled && onPlaySound) onPlaySound('key');
      onOpenTerminal();
    }
  };

  return (
    <div className="relative group">
      {/* Suprema BioStation 2 Hardware Enclosure Mounted on Rack Frame */}
      <div
        onClick={handleClick}
        className={`w-14 sm:w-16 rounded-xl border-2 p-1 flex flex-col items-center gap-1 transition-all duration-200 shadow-2xl cursor-pointer select-none font-mono hover:scale-105 ${
          doorOpen
            ? 'bg-zinc-950/95 border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:border-emerald-400'
            : 'bg-[#101117]/95 border-cyan-500/60 shadow-[0_0_18px_rgba(6,182,212,0.35)] hover:border-cyan-400'
        }`}
        title={doorOpen ? "Click to lock server cabinet" : "Suprema Terminal: Click to enter Employee ID and unlock door"}
      >
        {/* Top Metallic Bevel Strip with Suprema Branding */}
        <div className="w-full text-center pb-0.5 border-b border-zinc-800 flex items-center justify-center gap-0.5">
          <Fingerprint className="h-2 w-2 text-cyan-400 shrink-0" />
          <span className="font-sans font-black text-[6.5px] tracking-wider text-white uppercase">
            SUPREMA
          </span>
        </div>

        {/* Miniature High-Contrast OLED Screen */}
        <div
          className={`w-full rounded-[3px] py-0.5 px-0.5 text-center border transition-all ${
            doorOpen
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
              : 'bg-black border-cyan-500/40 text-cyan-300'
          }`}
        >
          <div className="text-[5.5px] font-bold leading-tight uppercase tracking-tight">
            {doorOpen ? 'UNLOCKED' : 'ENTER ID'}
          </div>
          <div className="text-[5px] text-zinc-400 leading-none mt-0.5">
            {doorOpen ? 'DOOR OPEN' : 'KEYPAD / RFID'}
          </div>
        </div>

        {/* Miniature 3x4 Backlit Numeric Keypad */}
        <div className="w-full grid grid-cols-3 gap-0.5 p-0.5 bg-black/80 rounded border border-zinc-800">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '↵'].map((k) => (
            <div
              key={k}
              className={`h-2.5 rounded-[1px] flex items-center justify-center text-[5.5px] font-bold transition ${
                k === '↵'
                  ? 'bg-emerald-500/30 text-emerald-300'
                  : k === 'C'
                  ? 'bg-rose-500/30 text-rose-300'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {k}
            </div>
          ))}
        </div>

        {/* Optical Fingerprint Prism & Circular Glowing LED Indicator Ring */}
        <div className="relative my-0.5">
          <div
            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
              doorOpen
                ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_10px_#10b981]'
                : 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_10px_#06b6d4]'
            }`}
          >
            {doorOpen ? (
              <Unlock className="h-3 w-3 text-emerald-400 animate-pulse" />
            ) : (
              <Fingerprint className="h-3 w-3 text-cyan-300" />
            )}
          </div>
          {/* Subtle RFID Icon Overlay */}
          <div className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-black border border-zinc-700 flex items-center justify-center">
            <CreditCard className="h-1.5 w-1.5 text-zinc-400" />
          </div>
        </div>

        {/* Action Status Pill */}
        <div
          className={`w-full py-0.5 rounded text-center text-[5.5px] font-bold uppercase transition ${
            doorOpen
              ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
          }`}
        >
          {doorOpen ? 'CLICK TO LOCK' : 'TAP TO ENTER'}
        </div>
      </div>
    </div>
  );
}
