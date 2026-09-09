import { DIFFICULTIES, DIFFICULTY_BANDS, MAX_DIFFICULTY } from '@jeopardy/game-core';
import type { Difficulty } from '@jeopardy/game-core';
import { ScaleSlider } from '../../components/ui/ScaleSlider';
import { de } from '../../i18n/de';

export interface DifficultySetupProps {
  value: Difficulty;
  onChange: (value: Difficulty) => void;
}

/** Voreinstellung: die Mitte der Skala, auf der das Brett alle Stufen zeigt. */
export const DEFAULT_DIFFICULTY: Difficulty = 3;

/** Reglerposition als Stufe; außerhalb der Skala gilt die Voreinstellung. */
export function difficultyAtSliderValue(position: number): Difficulty {
  return (DIFFICULTIES as readonly number[]).includes(position)
    ? (position as Difficulty)
    : DEFAULT_DIFFICULTY;
}

/**
 * Regler über die Schwierigkeit des ganzen Spielfelds. Unter dem Regler steht,
 * welche Stufen daraus in den fünf Zeilen landen – ohne diese Zeile bliebe im
 * Dunkeln, dass die Härte innerhalb der Partie weiter ansteigt.
 */
export function DifficultySetup({ value, onChange }: DifficultySetupProps) {
  const band = DIFFICULTY_BANDS[value].join(' · ');

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{de.setup.difficultyHeading}</h2>
      <p className="text-sm text-text-muted">{de.setup.difficultyHint}</p>

      <ScaleSlider
        position={value}
        min={1}
        max={MAX_DIFFICULTY}
        onChange={(position) => onChange(difficultyAtSliderValue(position))}
        label={de.setup.difficultySliderLabel}
        valueText={de.setup.difficultyName(value)}
        note={de.setup.difficultyDescription(value)}
        ariaValueText={`${de.setup.difficultyName(value)}, ${de.setup.difficultyLabel(value)}`}
        scaleStart={de.setup.difficultyScaleStart}
        scaleEnd={de.setup.difficultyScaleEnd}
      />

      <p className="text-sm text-text-muted tabular-nums">{de.setup.difficultyBand(band)}</p>
    </section>
  );
}
