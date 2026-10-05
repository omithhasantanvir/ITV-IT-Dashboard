import { cn } from '@/lib/utils';

// The brand mark lives in Client/public/, so Vite serves it straight from the
// site root. Referencing it as a plain string (instead of an `import`) keeps the
// bytes out of the JS bundle and lets the browser cache it on its own.
//
// `logo-removebg-preview.png` is the cut-out version (transparent background),
// so it drops onto light and dark surfaces alike. `1.png` is the full circular
// plate and is used as the dashboard backdrop rather than as a logo.
export const BRAND_LOGO_SRC = '/logo-removebg-preview.png';
export const BRAND_PLATE_SRC = '/1.png';

export function BrandLogo({ className, alt = 'Independent', src = BRAND_LOGO_SRC }) {
  return <img src={src} alt={alt} className={cn('select-none object-contain', className)} draggable="false" />;
}

// Full-bleed artwork behind the dashboard. `fixed` + a low opacity keeps it
// pinned to the viewport while content scrolls, and `pointer-events-none` stops
// the decorative layer from swallowing clicks meant for tables and buttons.
export function BrandBackdrop({ className }) {
  return (
    <div className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden', className)} aria-hidden="true">
      <img src={BRAND_PLATE_SRC} alt="" className="h-full w-full scale-125 object-cover opacity-[0.07] dark:opacity-[0.12]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background/95" />
    </div>
  );
}

// Sign-in screen backdrop.
//
// The plate is a small 455x256 source, so it has to be *scaled up* to act as a
// real page background. `object-cover` + a large scale fills the viewport edge to
// edge; the scrim is a light wash so the form text stays readable on top.
export function LoginBackdrop({ className }) {
  return (
    <div className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden', className)} aria-hidden="true">
      <img
        src={BRAND_PLATE_SRC}
        alt=""
        className="h-full w-full scale-150 object-cover object-center opacity-100"
      />
      <div className="absolute inset-0 bg-background/35" />
    </div>
  );
}

export default BrandLogo;
