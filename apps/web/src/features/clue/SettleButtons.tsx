import type { Team } from '@jeopardy/game-core';
import { Button } from '../../components/ui/Button';
import { de } from '../../i18n/de';

export interface SettleButtonsProps {
  /** Teams, die sich an dieser Frage beteiligt haben – nur sie werden gewertet. */
  participants: Team[];
  points: number;
  deductOnWrong: boolean;
  /** `null` bedeutet „keine richtige Antwort gegeben". */
  onSettle: (winnerTeamId: string | null) => void;
}

/**
 * Wertung der Veto-Runde: Die Moderation wählt den Gewinner, alles Weitere
 * ergibt sich. Unbeteiligte Teams stehen bewusst nicht zur Wahl.
 */
export function SettleButtons({
  participants,
  points,
  deductOnWrong,
  onSettle,
}: SettleButtonsProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm uppercase tracking-wide text-text-muted">{de.clue.settleHeading}</h3>

      <div className="grid gap-2 sm:grid-cols-2">
        {participants.map((team) => (
          <Button key={team.id} variant="success" size="lg" onClick={() => onSettle(team.id)}>
            <span className="truncate">{team.name}</span>
          </Button>
        ))}
      </div>

      <Button variant="danger" size="lg" onClick={() => onSettle(null)}>
        {de.clue.settleNobody}
      </Button>

      <p className="text-sm text-text-muted">
        {deductOnWrong ? de.clue.settleHintDeduct(points) : de.clue.settleHintKeep}
      </p>
    </div>
  );
}
