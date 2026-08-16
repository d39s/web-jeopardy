import { DIFFICULTIES } from '@jeopardy/game-core';
import type { Difficulty } from '@jeopardy/game-core';
import { de } from '../../i18n/de';
import { cn } from '../../lib/cn';

export interface DifficultyMarksProps {
  level: Difficulty;
}

/**
 * Schwierigkeit als drei Fragezeichen, von denen die ersten `level` kräftig
 * gesetzt sind. Immer alle drei zu zeigen macht die Bezugsgröße sichtbar –
 * bei zwei Zeichen allein wüsste man nicht, ob drei oder fünf das Maximum sind.
 * Für Screenreader steht der Wert im Klartext daneben.
 */
export function DifficultyMarks({ level }: DifficultyMarksProps) {
  return (
    <span className="inline-flex items-center gap-0.5" title={de.setup.difficultyLabel(level)}>
      <span aria-hidden="true" className="font-bold tracking-tight">
        {DIFFICULTIES.map((step) => (
          <span key={step} className={cn(step <= level ? 'text-cat-5' : 'text-text-muted/40')}>
            {de.setup.difficultyMark}
          </span>
        ))}
      </span>
      <span className="sr-only">{de.setup.difficultyLabel(level)}</span>
    </span>
  );
}
