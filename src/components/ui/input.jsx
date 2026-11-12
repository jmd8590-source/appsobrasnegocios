import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-edge-strong bg-surface-2',
        'px-3 py-2 text-sm text-ink placeholder:text-ink-faint',
        'transition-colors duration-200',
        'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
