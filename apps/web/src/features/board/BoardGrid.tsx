import {
  resolveCategoryColor,
  selectClueSummary,
  selectIsClueScored,
  selectIsPracticeMode,
} from '@jeopardy/game-core';
import { useDispatch, useGameState } from '../../state/GameProvider';
import { CategoryHeader } from './CategoryHeader';
import { ClueCard } from './ClueCard';

/**
 * 5x5-Raster: obere Zeile die Kategorien, darunter die Punktekarten.
 * Die Zeilenhöhen teilen sich den verfügbaren Platz, damit das Spielfeld auf
 * dem Beamer ohne Scrollen in einen Bildschirm passt.
 */
export function BoardGrid() {
  const state = useGameState();
  const dispatch = useDispatch();

  if (!state.definition) return null;
  const { categories } = state.definition;
  const rowCount = categories[0]?.clues.length ?? 0;
  // Bei einem einzigen Team sagt der Teamname auf der Karte nichts aus.
  const showTeamName = !selectIsPracticeMode(state);

  return (
    <div
      className="grid min-h-0 flex-1 gap-2 sm:gap-3"
      style={{
        gridTemplateColumns: `repeat(${categories.length}, minmax(0, 1fr))`,
        gridTemplateRows: `auto repeat(${rowCount}, minmax(0, 1fr))`,
      }}
    >
      {categories.map((category, index) => (
        <CategoryHeader
          key={category.id}
          name={category.name}
          color={resolveCategoryColor(category, index)}
        />
      ))}

      {Array.from({ length: rowCount }, (_, row) =>
        categories.map((category, index) => {
          const clue = category.clues[row];
          if (!clue) return null;

          return (
            <ClueCard
              key={clue.id}
              categoryName={category.name}
              points={clue.points}
              color={resolveCategoryColor(category, index)}
              scored={selectIsClueScored(state, clue.id)}
              result={selectClueSummary(state, clue.id)}
              showTeamName={showTeamName}
              onOpen={() => dispatch({ type: 'clue/open', clueId: clue.id, at: Date.now() })}
            />
          );
        }),
      )}
    </div>
  );
}
