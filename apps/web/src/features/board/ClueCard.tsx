import type { CategoryColor } from '@jeopardy/game-core';
import { cardClasses } from '../../components/ui/Card';
import { de } from '../../i18n/de';
import { cn } from '../../lib/cn';

export interface ClueCardProps {
  categoryName: string;
  points: number;
  color: CategoryColor;
  /** Grau wird die Karte ausschließlich nach einer Wertung – nicht beim Öffnen. */
  scored: boolean;
  onOpen: () => void;
}

export function ClueCard({ categoryName, points, color, scored, onOpen }: ClueCardProps) {
  return (
    <button
      type="button"
      disabled={scored}
      aria-label={
        scored
          ? de.board.cardScoredLabel(categoryName, points)
          : de.board.cardLabel(categoryName, points)
      }
      onClick={onOpen}
      className={cn(
        cardClasses,
        'flex items-center justify-center transition-colors',
        'text-[clamp(1.4rem,3.4vw,2.75rem)] font-bold tabular-nums',
        scored
          ? 'cursor-default border-transparent bg-surface-mut text-text-muted opacity-50'
          : 'cursor-pointer hover:bg-surface-hi',
      )}
      style={scored ? undefined : { color }}
    >
      {points}
    </button>
  );
}
