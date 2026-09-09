import { formatSeed } from '@jeopardy/game-core';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { de } from '../../i18n/de';

export interface DrawSetupProps {
  /** Nummer, aus der das Spielfeld entsteht – sie steht auch im geteilten Link. */
  seed: number;
  onReshuffle: () => void;
}

/**
 * Zeigt die Ziehungsnummer und erlaubt, neu zu mischen. Sichtbar ist sie, weil
 * sie im Link steht: Wer dieselbe Nummer hat, spielt dasselbe Brett.
 */
export function DrawSetup({ seed, onReshuffle }: DrawSetupProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{de.setup.drawHeading}</h2>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <p className="font-semibold tabular-nums">{de.setup.drawNumber(formatSeed(seed))}</p>
          <p className="text-sm text-text-muted">{de.setup.drawHint}</p>
        </div>
        <Button onClick={onReshuffle}>{de.setup.reshuffle}</Button>
      </Card>
    </section>
  );
}
