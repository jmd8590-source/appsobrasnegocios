import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-lg skeleton',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
