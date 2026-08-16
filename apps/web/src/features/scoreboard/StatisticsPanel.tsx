import { selectTeamStatistics } from '@jeopardy/game-core';
import { de } from '../../i18n/de';
import { useGameState } from '../../state/GameProvider';

/** Kennzahlen je Team als Tabelle. Der Verlauf steht im eigenen Reiter daneben. */
export function StatisticsPanel() {
  const state = useGameState();
  const statistics = selectTeamStatistics(state);

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold">{de.result.statsHeading}</h3>

      {/* Die Tabelle scrollt für sich, damit acht Teams die Breite nicht sprengen. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[24rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-sm text-text-muted">
              <th scope="col" className="py-2 pr-3 font-medium">
                {de.result.statsTeam}
              </th>
              {[
                de.result.statsCorrect,
                de.result.statsWrong,
                de.result.statsVetos,
                de.result.statsScore,
              ].map((heading) => (
                <th key={heading} scope="col" className="py-2 pl-3 text-right font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {statistics.map((entry) => (
              <tr key={entry.team.id} className="border-b border-border/60 last:border-0">
                <th scope="row" className="py-2 pr-3 font-semibold">
                  {entry.team.name}
                </th>
                <td className="py-2 pl-3 text-right tabular-nums text-positive">{entry.correct}</td>
                <td className="py-2 pl-3 text-right tabular-nums text-negative">{entry.wrong}</td>
                <td className="py-2 pl-3 text-right tabular-nums">{entry.vetos}</td>
                <td className="py-2 pl-3 text-right font-bold tabular-nums">{entry.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-text-muted">{de.result.statsVetoHint}</p>
    </section>
  );
}
