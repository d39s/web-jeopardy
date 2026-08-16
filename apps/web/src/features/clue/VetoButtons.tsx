import type { Team } from '@jeopardy/game-core';
import { Button } from '../../components/ui/Button';
import { de } from '../../i18n/de';

export interface VetoButtonsProps {
  /** Teams, die bei dieser Frage noch nicht am Zug waren. */
  candidates: Team[];
  /** Bei vielen Teams eine Stufe kleiner, damit alle Knöpfe ohne Scrollen passen. */
  compact?: boolean;
  onVeto: (teamId: string) => void;
}

/**
 * Ein Knopf je Team, das noch übernehmen darf. Die Liste entsteht ausschließlich
 * aus dem Spielstand; beteiligte Teams verschwinden daraus von selbst.
 *
 * Das Raster bricht selbständig um: `auto-fit` legt so viele Spalten an, wie in
 * der Breite Platz finden, und verteilt zwei Kandidaten genauso sauber wie
 * sieben. Damit bleibt die Höhe auch bei acht Teams bei zwei Reihen.
 */
export function VetoButtons({ candidates, compact = false, onVeto }: VetoButtonsProps) {
  if (candidates.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="shrink-0 text-sm uppercase tracking-wide text-text-muted">
          {de.clue.vetoHeading}
        </h3>
        <p className="hidden min-w-0 truncate text-sm text-text-muted sm:block">
          {de.clue.vetoHint}
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-2">
        {candidates.map((team) => (
          <Button
            key={team.id}
            size={compact ? 'md' : 'lg'}
            className="min-w-0"
            onClick={() => onVeto(team.id)}
          >
            <span className="min-w-0 truncate">{de.clue.vetoButton(team.name)}</span>
          </Button>
        ))}
      </div>
    </section>
  );
}
