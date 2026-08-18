import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'metal' | 'wood' | 'plastic' | 'construction' | 'available' | 'in_lot' | 'sold' | 'discarded';
}

const variantStyles: Record<string, string> = {
  default: 'bg-slate-700 text-slate-200 border-slate-600',
  outline: 'bg-transparent border-slate-600 text-slate-300',
  metal: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  wood: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  plastic: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  construction: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  available: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  in_lot: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  sold: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  discarded: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
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
