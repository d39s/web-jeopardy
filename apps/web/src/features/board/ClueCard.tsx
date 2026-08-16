import type { CategoryColor, ClueSummary } from '@jeopardy/game-core';
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
  result?: ClueSummary | null;
  /** Im Übungsmodus sagt der Teamname nichts aus und entfällt auf der Karte. */
  showTeamName?: boolean;
  onOpen: () => void;
}

/** Der Ausgang im Klartext – ergänzt das Vorlesen der Karte. */
function outcomeLabel(result: ClueSummary): string {
  return result.winner
    ? de.board.resultCorrect(result.winner.name, result.points)
    : de.board.resultNobodyLong(result.points);
}

function cardLabel(
  categoryName: string,
  points: number,
  scored: boolean,
  result: ClueSummary | null,
): string {
  if (!scored) return de.board.cardLabel(categoryName, points);

  const base = de.board.cardScoredLabel(categoryName, points);
  return result ? `${base}. ${outcomeLabel(result)}` : base;
}

/**
 * Zweite Zeile der Karte: das Team, das die Frage für sich entschieden hat –
 * bei mehreren Beteiligten ergänzt um deren Anzahl. Bleibt bewusst kurz, damit
 * das Spielfeld auf dem Beamer ohne Scrollen in einen Bildschirm passt.
 */
function cardCaption(result: ClueSummary | null, showTeamName: boolean): string | null {
  if (!result) return null;
  if (!showTeamName) return null;

  const teamCount = result.losers.length + (result.winner ? 1 : 0);
  const name = result.winner ? result.winner.name : de.board.resultNobody;
  return teamCount > 1 ? `${name} · ${de.board.resultTeamCount(teamCount)}` : name;
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
  // Farbe trägt die Aussage nie allein – Zeichen und Text kommen hinzu.
  const outcomeColor = result ? (result.winner ? 'text-positive' : 'text-negative') : null;
  const mark = result
    ? result.winner
      ? de.board.resultMarkCorrect
      : de.board.resultMarkWrong
    : null;
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
        <span className={cn(outcomeColor, result && !result.winner && 'line-through')}>
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
