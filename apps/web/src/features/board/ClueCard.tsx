import type { CategoryColor, ClueOutcome, ClueResult } from '@jeopardy/game-core';
import { cardClasses } from '../../components/ui/Card';
import { de } from '../../i18n/de';
import { cn } from '../../lib/cn';

export interface ClueCardProps {
  categoryName: string;
  points: number;
  color: CategoryColor;
  /** Grau wird die Karte ausschließlich nach einer Wertung – nicht beim Öffnen. */
  scored: boolean;
  /**
   * Ausgang der gespielten Frage; null, solange sie nicht gewertet ist. Die
   * Markierung kommt zum Grauton hinzu, sie ersetzt ihn nicht.
   */
  result?: ClueResult | null;
  /** Im Übungsmodus sagt der Teamname nichts aus und entfällt auf der Karte. */
  showTeamName?: boolean;
  onOpen: () => void;
}

/** Farbe je Ausgang – sie trägt die Aussage nie allein, siehe Zeichen und Text. */
const outcomeColors: Record<ClueOutcome, string> = {
  correct: 'text-positive',
  wrong: 'text-negative',
  unanswered: 'text-text-muted',
};

/** Ohne Wertung bleibt die Karte zeichenlos neutral; der Text darunter genügt. */
const outcomeMarks: Record<ClueOutcome, string | null> = {
  correct: de.board.resultMarkCorrect,
  wrong: de.board.resultMarkWrong,
  unanswered: null,
};

/** Der Ausgang im Klartext – ergänzt das Vorlesen der Karte. */
function outcomeLabel(result: ClueResult): string {
  const amount = Math.abs(result.delta);
  if (result.outcome === 'correct' && result.team) {
    return de.board.resultCorrect(result.team.name, amount);
  }
  if (result.outcome === 'wrong' && result.team) {
    return de.board.resultWrong(result.team.name, amount);
  }
  return de.board.resultUnanswered;
}

function cardLabel(
  categoryName: string,
  points: number,
  scored: boolean,
  result: ClueResult | null,
): string {
  if (!scored) return de.board.cardLabel(categoryName, points);

  const base = de.board.cardScoredLabel(categoryName, points);
  return result ? `${base}. ${outcomeLabel(result)}` : base;
}

/**
 * Zweite Zeile der Karte: das Team, das die Frage für sich entschieden hat,
 * bzw. der Hinweis auf die fehlende Wertung. Bleibt bewusst kurz, damit das
 * Spielfeld auf dem Beamer weiterhin ohne Scrollen in einen Bildschirm passt.
 */
function cardCaption(result: ClueResult | null, showTeamName: boolean): string | null {
  if (!result) return null;
  if (result.outcome === 'unanswered') return de.board.resultUnansweredShort;
  return showTeamName && result.team ? result.team.name : null;
}

export function ClueCard({
  categoryName,
  points,
  color,
  scored,
  result = null,
  showTeamName = true,
  onOpen,
}: ClueCardProps) {
  const outcomeColor = result ? outcomeColors[result.outcome] : null;
  const mark = result ? outcomeMarks[result.outcome] : null;
  const caption = cardCaption(result, showTeamName);

  return (
    <button
      type="button"
      disabled={scored}
      aria-label={cardLabel(categoryName, points, scored, result)}
      onClick={onOpen}
      className={cn(
        cardClasses,
        'flex flex-col items-center justify-center gap-1 overflow-hidden px-1 transition-colors',
        'text-[clamp(1.4rem,3.4vw,2.75rem)] font-bold tabular-nums',
        scored
          ? 'cursor-default border-transparent bg-surface-mut text-text-muted opacity-50'
          : 'cursor-pointer hover:bg-surface-hi',
      )}
      style={scored ? undefined : { color }}
    >
      <span className="flex max-w-full items-baseline justify-center gap-1 leading-none">
        {mark ? (
          <span aria-hidden="true" className={cn('text-[0.62em]', outcomeColor)}>
            {mark}
          </span>
        ) : null}
        <span className={cn(outcomeColor, result?.outcome === 'wrong' && 'line-through')}>
          {points}
        </span>
      </span>

      {caption ? (
        <span className="block w-full truncate text-center text-[clamp(0.6rem,1.1vw,0.9rem)] leading-tight font-semibold text-text-muted">
          {caption}
        </span>
      ) : null}
    </button>
  );
}
