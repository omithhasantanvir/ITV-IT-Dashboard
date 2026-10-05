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

// Same artwork, tuned for the sign-in screen: the login page has no tables or
// live status behind it, so the plate can sit centred and much more visible.
// The centre-weighted scrim keeps the username/password text readable while
// still showing the artwork around the card.
export function LoginBackdrop({ className }) {
  return (
    <div className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden', className)} aria-hidden="true">
      <img
        src={BRAND_PLATE_SRC}
        alt=""
        className="h-full w-full scale-110 object-cover object-center opacity-25 dark:opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/55 to-background/85" />
      {/* Soft halo behind the form so the inputs never sit directly on artwork. */}
      <div className="absolute left-1/2 top-1/2 h-[70vh] w-[70vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/60 blur-3xl" />
    </div>
  );
}

export default BrandLogo;
