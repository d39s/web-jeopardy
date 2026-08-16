import type { Team } from '@jeopardy/game-core';
import { Button } from '../../components/ui/Button';
import { de } from '../../i18n/de';

export interface VetoButtonsProps {
  /** Teams, die bei dieser Frage noch nicht am Zug waren. */
  candidates: Team[];
  onVeto: (teamId: string) => void;
}

/**
 * Ein Knopf je Team, das noch übernehmen darf. Die Liste entsteht ausschließlich
 * aus dem Spielstand; beteiligte Teams verschwinden daraus von selbst.
 */
export function VetoButtons({ candidates, onVeto }: VetoButtonsProps) {
  if (candidates.length === 0) return null;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {candidates.map((team) => (
        <Button key={team.id} size="lg" onClick={() => onVeto(team.id)}>
          <span className="truncate">{de.clue.vetoButton(team.name)}</span>
        </Button>
      ))}
    </div>
  );
}
