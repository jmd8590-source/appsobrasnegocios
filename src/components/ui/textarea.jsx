import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-lg border border-edge-strong bg-surface-2',
        'px-3 py-2 text-sm text-ink placeholder:text-ink-faint',
        'transition-colors duration-200 resize-none',
        'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
