import React from 'react';

export function ITVLogo({ className = "h-9 w-auto", showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <img
        src="/itv-logo.png"
        alt="Independent Television Logo"
        className={`${className} drop-shadow-[0_2px_8px_rgba(239,68,68,0.5)] object-contain select-none`}
      />
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span className="font-black text-xs tracking-tight text-white font-sans">
              INDEPENDENT
            </span>
            <span className="text-[8px] px-1 py-0.2 rounded bg-red-600 text-white font-mono font-extrabold">
              24
            </span>
          </div>
          <span className="text-[7.5px] tracking-[0.2em] text-zinc-400 uppercase font-mono font-bold mt-0.5">
            TELEVISION
          </span>
        </div>
      )}
    </div>
  );
}
