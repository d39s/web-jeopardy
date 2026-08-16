import type { TeamStreak } from '@jeopardy/game-core';
import { de } from '../../i18n/de';
import { cn } from '../../lib/cn';

export interface StreakBadgeProps {
  teamName: string;
  streak: TeamStreak;
}

/**
 * Serie hinter dem Teamnamen: Flamme für richtige, Eis für falsche Antworten in
 * Folge, dazu die Länge. Zeichen und Zahl sind für Screenreader ausgeblendet –
 * ein Emoji wird sonst je nach Vorlesesoftware als „Feuer" gesprochen, was
 * nichts über die Serie sagt. Den Sinn trägt der Text daneben.
 */
export function StreakBadge({ teamName, streak }: StreakBadgeProps) {
  const correct = streak.kind === 'correct';

  return (
    <span
      className={cn(
        // Bewusst schmal: Bei acht Teams zählt jeder Pixel für den Teamnamen.
        'flex shrink-0 items-center gap-0.5 text-xs leading-none font-semibold tabular-nums',
        correct ? 'text-positive' : 'text-negative',
      )}
    >
      <span aria-hidden="true">
        {correct ? de.board.streakMarkCorrect : de.board.streakMarkWrong}
      </span>
      <span aria-hidden="true">{streak.length}</span>
      <span className="sr-only">
        {correct
          ? de.board.streakCorrectLabel(teamName, streak.length)
          : de.board.streakWrongLabel(teamName, streak.length)}
      </span>
    </span>
  );
}
