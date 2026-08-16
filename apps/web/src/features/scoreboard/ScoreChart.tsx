import { CATEGORY_COLORS, categoryColorAt } from '@jeopardy/game-core';
import type { ScoreProgress } from '@jeopardy/game-core';
import { de } from '../../i18n/de';

/** Zeichenfläche in Nutzerkoordinaten; die Darstellung skaliert über das viewBox. */
const WIDTH = 640;
const HEIGHT = 200;
const PADDING = { top: 10, right: 14, bottom: 30, left: 56 };
const PLOT_WIDTH = WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;
const GRID_LINES = 4;

/**
 * Obere Grenze der Achse: aufgerundet auf einen glatten Wert, der sich durch
 * `GRID_LINES` teilen lässt – sonst stehen krumme Zahlen an den Hilfslinien.
 */
function niceMax(max: number): number {
  if (max <= 0) return 100;

  const rawStep = max / GRID_LINES;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const factor = [1, 2, 2.5, 5, 10].find((candidate) => magnitude * candidate >= rawStep) ?? 10;
  return magnitude * factor * GRID_LINES;
}

/** Ab dem sechsten Team wiederholt sich die Palette – dann unterscheidet die Strichart. */
function isDashed(index: number): boolean {
  return index >= CATEGORY_COLORS.length;
}

export interface ScoreChartProps {
  progress: ScoreProgress;
}

/**
 * Punkteverlauf als Liniendiagramm, ohne zusätzliche Bibliothek: Eine Handvoll
 * SVG-Elemente genügt und bleibt beim Zoomen scharf. Die Zahlen selbst stehen
 * in der Tabelle darüber – das Diagramm zeigt den Verlauf, nicht die Details.
 */
export function ScoreChart({ progress }: ScoreChartProps) {
  if (progress.clueCount === 0) {
    return <p className="text-text-muted">{de.result.chartEmpty}</p>;
  }

  const top = niceMax(progress.max);
  const x = (step: number): number => PADDING.left + (step / progress.clueCount) * PLOT_WIDTH;
  const y = (score: number): number => PADDING.top + PLOT_HEIGHT - (score / top) * PLOT_HEIGHT;

  const gridValues = Array.from(
    { length: GRID_LINES + 1 },
    (_, index) => (top / GRID_LINES) * index,
  );
  const standings = progress.series
    .map((entry) => de.result.chartTeamScore(entry.team.name, entry.scores.at(-1) ?? 0))
    .join(', ');

  return (
    // Die Legende steht über dem Diagramm: Sie ordnet die Farben den Teams zu
    // und darf nicht unter den Rand des scrollenden Reiters rutschen.
    <figure className="flex flex-col gap-3">
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {progress.series.map((entry, index) => (
          <span key={entry.team.id} className="flex items-center gap-2">
            <svg viewBox="0 0 24 8" className="h-2 w-6" aria-hidden="true">
              <line
                x1={0}
                x2={24}
                y1={4}
                y2={4}
                stroke={categoryColorAt(index)}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={isDashed(index) ? '7 5' : undefined}
              />
            </svg>
            <span className="text-text-muted">
              {de.result.chartTeamScore(entry.team.name, entry.scores.at(-1) ?? 0)}
            </span>
          </span>
        ))}
      </figcaption>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto max-h-[42vh] w-full"
        role="img"
        aria-label={de.result.chartSummary(progress.clueCount, standings)}
      >
        {gridValues.map((value) => (
          <g key={value}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={y(value)}
              y2={y(value)}
              className="stroke-border"
              strokeWidth={1}
            />
            <text
              x={PADDING.left - 8}
              y={y(value)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-text-muted text-[11px] tabular-nums"
            >
              {value}
            </text>
          </g>
        ))}

        {/* Beschriftung der Fragenachse: erste und letzte Frage genügen zur Einordnung. */}
        <text
          x={PADDING.left}
          y={HEIGHT - 10}
          textAnchor="start"
          className="fill-text-muted text-[11px]"
        >
          1
        </text>
        <text
          x={WIDTH - PADDING.right}
          y={HEIGHT - 10}
          textAnchor="end"
          className="fill-text-muted text-[11px] tabular-nums"
        >
          {progress.clueCount}
        </text>
        <text
          x={PADDING.left + PLOT_WIDTH / 2}
          y={HEIGHT - 10}
          textAnchor="middle"
          className="fill-text-muted text-[11px]"
        >
          {de.result.chartAxisClues}
        </text>

        {progress.series.map((entry, index) => (
          <polyline
            key={entry.team.id}
            points={entry.scores.map((score, step) => `${x(step)},${y(score)}`).join(' ')}
            fill="none"
            stroke={categoryColorAt(index)}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={isDashed(index) ? '7 5' : undefined}
          />
        ))}
      </svg>
    </figure>
  );
}
