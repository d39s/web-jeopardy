import type { CategoryColor } from '@jeopardy/game-core';
import { cardClasses } from '../../components/ui/Card';
import { cn } from '../../lib/cn';

export interface CategoryHeaderProps {
  name: string;
  color: CategoryColor;
}

/** Kategoriefarbe als Hintergrund, dunkle Schrift für ausreichenden Kontrast. */
export function CategoryHeader({ name, color }: CategoryHeaderProps) {
  return (
    <div
      className={cn(
        cardClasses,
        'flex items-center justify-center border-transparent px-2 py-3 text-center',
        'text-bg text-[clamp(0.9rem,1.6vw,1.4rem)] font-bold uppercase tracking-wide',
      )}
      style={{ backgroundColor: color }}
    >
      {name}
    </div>
  );
}
