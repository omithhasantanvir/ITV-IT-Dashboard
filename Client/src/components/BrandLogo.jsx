import { cn } from '@/lib/utils';

// The brand mark lives in Client/public/, so Vite serves it straight from the
// site root. Referencing it as a plain string (instead of an `import`) keeps the
// bytes out of the JS bundle and lets the browser cache it on its own.
//
// `independent logo.png` is the clean red `O` emblem (transparent background),
// so it drops onto light and dark surfaces alike. `1.png` is the full circular
// plate and is used as the dashboard backdrop rather than as a logo.
//
// The mark file holds ONLY the emblem (no baked-in wordmark), so the hero
// placement renders it as-is and pairs it with real text underneath.
//
export const BRAND_LOGO_SRC = '/Independent%20logo.png';
export const BRAND_PLATE_SRC = '/1.png';
export const BRAND_MARK_SRC = '/Independent%20logo.png';

export function BrandLogo({ className, alt = 'Independent', src = BRAND_LOGO_SRC }) {
  return <img src={src} alt={alt} className={cn('select-none object-contain', className)} draggable="false" />;
}

// The clean emblem on its own, for the oversized hero placement on the sign-in
// screen. The source PNG is just the red `O` (no baked-in wordmark), so no
// cropping is needed — "INDEPENDENT TELEVISION" is rendered as real HTML text
// in LoginPage, which keeps it visible in both dark and light mode.
export function BrandMark({ className }) {
  return (
    <div className={cn('w-28 lg:w-32', className)}>
      <img
        src={BRAND_MARK_SRC}
        alt=""
        aria-hidden="true"
        draggable="false"
        className="h-auto w-full object-contain"
      />
    </div>
  );
}

// Decorative shapes behind the sign-in screen: the brand-red blobs on the right
// edge and the dotted gradient field. Drawn with CSS rather than an asset
// because there is no matching artwork in public/.
export function LoginDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Brand-red organic blobs hugging the right edge. */}
      <div className="absolute -right-40 -top-24 h-[34rem] w-[34rem] rounded-full bg-brand-red/90" />
      <div className="absolute right-16 top-40 h-[26rem] w-[26rem] rounded-full bg-brand-red" />
      <div className="absolute -bottom-32 -right-24 h-[30rem] w-[30rem] rounded-full bg-brand-red/95" />

      {/* Dotted field fading toward the centre. */}
      <div
        className="absolute right-0 top-0 h-full w-[62%] bg-dots opacity-70"
        style={{
          maskImage: 'radial-gradient(circle at 78% 50%, #000 30%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(circle at 78% 50%, #000 30%, transparent 78%)',
        }}
      />

      {/* Soft white wash under the card so the form stays readable. */}
      <div className="absolute left-0 top-0 h-full w-[58%] bg-gradient-to-r from-background via-background/85 to-transparent" />
    </div>
  );
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
// The plate is a small 455x256 source, so it has to be scaled up to read as a
// page background at all. `watermark` treatment: it is deliberately faint and
// centred, because it sits behind the whole page while the sign-in card (nearly
// opaque) sits on top of it. Only the area *around* the card shows the artwork —
// the same effect as the reference screenshot.
export function LoginBackdrop({ className }) {
  return (
    <div className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden', className)} aria-hidden="true">
      <img
        src={BRAND_PLATE_SRC}
        alt=""
        className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 scale-125 object-cover object-center opacity-[0.06] dark:opacity-[0.10]"
      />
    </div>
  );
}

export default BrandLogo;
