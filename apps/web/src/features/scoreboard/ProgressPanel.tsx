import { selectScoreProgress } from '@jeopardy/game-core';
import { de } from '../../i18n/de';
import { useGameState } from '../../state/GameProvider';
import { ScoreChart } from './ScoreChart';

/** Punkteverlauf über das ganze Spiel – als eigener Reiter, damit er ohne Scrollen passt. */
export function ProgressPanel() {
  const state = useGameState();

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold">{de.result.chartHeading}</h3>
      <ScoreChart progress={selectScoreProgress(state)} />
    </section>
  );
}
