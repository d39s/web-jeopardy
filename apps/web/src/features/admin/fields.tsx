import { useId } from 'react';
import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Card } from '../../components/ui/Card';
import { cn } from '../../lib/cn';
import { de } from '../../i18n/de';
import { AdminApiError } from './api';

const controlClasses =
  'rounded-btn border border-border bg-surface-hi px-3 py-2 text-text focus-visible:outline-cat-1 disabled:opacity-60';

interface FieldProps {
  label: string;
  hint?: string;
}

function Field({ id, label, hint, children }: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-sm text-text-muted">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SelectField({
  label,
  hint,
  className,
  ...props
}: FieldProps & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'>) {
  const id = useId();
  return (
    <Field id={id} label={label} hint={hint}>
      <select
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={cn(controlClasses, className)}
        {...props}
      />
    </Field>
  );
}

export function TextAreaField({
  label,
  hint,
  className,
  ...props
}: FieldProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'>) {
  const id = useId();
  return (
    <Field id={id} label={label} hint={hint}>
      <textarea
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={cn(controlClasses, 'min-h-20', className)}
        {...props}
      />
    </Field>
  );
}

export function errorMessage(error: unknown): AdminApiError {
  return error instanceof AdminApiError ? error : new AdminApiError(0, de.errors.unexpected);
}

export function ErrorNotice({ error }: { error: AdminApiError }) {
  return (
    <Card role="alert" className="flex flex-col gap-2 border-negative/40 p-4 text-negative">
      <p>
        {error.message}
        {error.line ? ` (${de.admin.sql.location(error.line, error.column)})` : null}
      </p>
      {error.issues.length > 0 ? (
        <>
          <p className="text-sm">{de.admin.issuesHeading}</p>
          <ul className="list-disc pl-5 text-sm">
            {error.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </>
      ) : null}
    </Card>
  );
}
