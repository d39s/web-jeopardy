import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

/**
 * Gemeinsame Kartenoptik. Als Konstante exportiert, damit auch Elemente, die
 * keine `div` sind (etwa die Punktekarten als `button`), exakt gleich aussehen.
 */
export const cardClasses = 'rounded-card border border-border bg-surface shadow-card';

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return <div className={cn(cardClasses, className)} {...props} />;
}
