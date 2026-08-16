import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  /** Beschriftung nur für Screenreader – z. B. bei Teamnamen direkt am Spielfeld. */
  hideLabel?: boolean;
  hint?: string;
}

export function TextField({ label, hideLabel = false, hint, className, ...props }: TextFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={cn('text-sm text-text-muted', hideLabel && 'sr-only')}>
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hintId}
        className={cn(
          'rounded-btn border border-border bg-surface-hi px-3 py-2 text-text',
          'placeholder:text-text-muted focus-visible:outline-cat-1',
          className,
        )}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
