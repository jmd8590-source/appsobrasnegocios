import { cn } from '@/lib/utils';

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-edge flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-ink-faint" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-ink-muted mb-2">{title}</h3>
      <p className="text-sm text-ink-faint max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}
