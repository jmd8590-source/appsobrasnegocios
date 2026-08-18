import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link' | 'amber' | 'emerald';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const variantStyles: Record<string, string> = {
  default: 'bg-slate-700 text-slate-100 hover:bg-slate-600 border border-slate-600',
  destructive: 'bg-red-600 text-white hover:bg-red-700 border border-red-700',
  outline: 'border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-slate-100 bg-transparent',
  ghost: 'text-slate-300 hover:bg-slate-800 hover:text-slate-100 bg-transparent',
  link: 'text-amber-400 underline-offset-4 hover:underline bg-transparent',
  amber: 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold border border-amber-400',
  emerald: 'bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-500',
};

const sizeStyles: Record<string, string> = {
  default: 'h-10 px-4 py-2 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium',
          'transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
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
