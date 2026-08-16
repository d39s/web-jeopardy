import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'ghost' | 'success' | 'danger';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-btn font-semibold transition-colors ' +
  'disabled:cursor-not-allowed disabled:opacity-40';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-cat-1 text-bg hover:brightness-110',
  ghost: 'border border-border bg-surface text-text hover:bg-surface-hi',
  success: 'border border-positive/40 bg-positive-soft text-positive hover:bg-positive/25',
  danger: 'border border-negative/40 bg-negative-soft text-negative hover:bg-negative/25',
};

const sizes: Record<ButtonSize, string> = {
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-4 text-lg',
};

export function Button({
  variant = 'ghost',
  size = 'md',
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
