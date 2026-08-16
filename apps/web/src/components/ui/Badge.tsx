import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-border bg-surface-hi',
        'px-3 py-1 text-sm text-text-muted',
        className,
      )}
      {...props}
    />
  );
}
