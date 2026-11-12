import * as React from 'react';
import { cn } from '@/lib/utils';

const variantStyles = {
  default: 'bg-surface-2 text-ink hover:bg-edge border border-edge-strong',
  destructive: 'bg-danger text-danger-ink hover:opacity-90 border border-danger',
  outline: 'border border-edge-strong text-ink-muted hover:bg-surface-2 hover:text-ink bg-transparent',
  ghost: 'text-ink-muted hover:bg-surface-2 hover:text-ink bg-transparent',
  link: 'text-accent underline-offset-4 hover:underline bg-transparent',
  amber: 'bg-accent text-accent-ink hover:bg-accent-strong font-semibold border border-accent-strong',
  emerald: 'bg-positive text-positive-ink hover:opacity-90 border border-positive',
};

const sizeStyles = {
  default: 'h-10 px-4 py-2 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
};

const Button = React.forwardRef(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium',
          'transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
