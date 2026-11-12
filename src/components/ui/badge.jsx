import * as React from 'react';
import { cn } from '@/lib/utils';

const variantStyles = {
  default: 'bg-surface-2 text-ink-muted border-edge-strong',
  outline: 'bg-transparent border-edge-strong text-ink-muted',
  metal: 'bg-accent/15 text-accent border-accent/30',
  wood: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
  plastic: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  construction: 'bg-ink-faint/15 text-ink-muted border-ink-faint/30',
  available: 'bg-positive/15 text-positive border-positive/30',
  in_lot: 'bg-accent/15 text-accent border-accent/30',
  sold: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  discarded: 'bg-danger/15 text-danger border-danger/30',
};

const Badge = React.forwardRef(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = 'Badge';

export { Badge };
