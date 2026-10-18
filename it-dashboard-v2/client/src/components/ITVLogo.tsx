import React from 'react';

export function ITVLogo({
  className,
  showText = true,
  size = 'md',
}: {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | string;
}) {
  const sizeClass =
    className ||
    (size === 'sm' ? 'h-6 w-auto' : size === 'lg' ? 'h-12 w-auto' : 'h-9 w-auto');

  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <img
        src="/itv-logo.png"
        alt="Independent Television Logo"
        className={`${sizeClass} drop-shadow-[0_2px_8px_rgba(227,30,36,0.5)] object-contain select-none`}
      />
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span className="font-black text-xs tracking-tight text-white font-sans">
              INDEPENDENT
            </span>
            <span className="text-[8px] px-1 py-0.2 rounded bg-primary text-white font-mono font-extrabold">
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
