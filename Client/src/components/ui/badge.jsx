import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-transparent dark:bg-emerald-500/15 dark:text-emerald-400',
        warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-transparent dark:bg-amber-500/15 dark:text-amber-400',
        danger: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-transparent dark:bg-rose-500/15 dark:text-rose-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
