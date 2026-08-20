import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-lg border border-slate-700 bg-slate-800/60',
        'px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500',
        'transition-colors duration-200 resize-none',
        'focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
