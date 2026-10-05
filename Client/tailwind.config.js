import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Popover/overlay surface used by shadcn Dialog, DropdownMenu, Select,
        // Popover and Tooltip content. Without it those components render with
        // no background at all.
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      // Brand accent taken from the INDEPENDENT logo (the red in the mark),
        // used for the sign-in screen artwork and its submit button.
        'brand-red': {
          DEFAULT: 'hsl(var(--brand-red))',
        },
      },
      backgroundImage: {
        // Dot matrix behind the sign-in card.
        dots: 'radial-gradient(circle, hsl(var(--muted-foreground) / 0.55) 1.5px, transparent 1.5px)',
      },
      backgroundSize: {
        dots: '22px 22px',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.06), 0 12px 32px -16px rgba(15, 23, 42, 0.22)',
        card: '0 24px 60px -24px rgba(15, 23, 42, 0.28), 0 2px 8px rgba(15, 23, 42, 0.04)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        // Expanding ring behind a server tile while it is being pinged.
        'ping-ring': {
          '0%': { transform: 'scale(0.6)', opacity: '0.65' },
          '75%': { transform: 'scale(1.9)', opacity: '0' },
          '100%': { transform: 'scale(1.9)', opacity: '0' },
        },
        // Rotating arc drawn on top of the ping icon while the probe is in flight.
        'ping-sweep': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        // Result landing bounce: the green/red puck pops once per completed ping.
        'status-pop': {
          '0%': { transform: 'scale(0.55)', opacity: '0' },
          '55%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        // A host that answered "no" (or went from up to down) nudges sideways.
        'status-shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-3px)' },
          '40%': { transform: 'translateX(3px)' },
          '60%': { transform: 'translateX(-2px)' },
          '80%': { transform: 'translateX(2px)' },
        },
        'toast-in': {
          from: { transform: 'translateY(16px) scale(0.98)', opacity: '0' },
          to: { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'ping-ring': 'ping-ring 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'ping-sweep': 'ping-sweep 1.1s linear infinite',
        'status-pop': 'status-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'status-shake': 'status-shake 0.5s ease-in-out',
        'toast-in': 'toast-in 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  // Provides the animate-in / fade-in / zoom-in / slide-in utilities that
  // shadcn overlay components (Dialog, DropdownMenu, Tooltip, Sheet) rely on.
  plugins: [animate],
};
