import { useId } from 'react';
import { cn } from '../../lib/cn';

export interface ScaleSliderProps {
  /**
   * Position auf der Skala, nicht der fachliche Wert: Die Stufen sind oft
   * ungleich verteilt (10 s bis 5 min), deshalb rechnet der Aufrufer um.
   */
  position: number;
  min?: number;
  max: number;
  onChange: (position: number) => void;
  /** Unsichtbare Beschriftung – auf dem Regler selbst steht nur ein Index. */
  label: string;
  /** Klartext des eingestellten Werts; steht über dem Regler. */
  valueText: string;
  /** Zweite Zeile darunter, z. B. die daraus folgende Zeit. */
  note?: string;
  /** Beschriftung der Skala ganz links. */
  scaleStart: string;
  /** Beschriftung der Skala ganz rechts. */
  scaleEnd: string;
  /** Vorlesetext; ohne Angabe gilt `valueText`. */
  ariaValueText?: string;
  disabled?: boolean;
  /** Id eines Textes, der die Sperre erklärt. */
  describedBy?: string;
}

/**
 * Schieberegler über eine Reihe von Stufen. Bedenkzeit, Veto-Zeit und
 * Schwierigkeit teilen sich Optik und Bedienung und unterscheiden sich nur in
 * den Beschriftungen – jede Abweichung wäre auf der Startseite sofort sichtbar.
 */
export function ScaleSlider({
  position,
  min = 0,
  max,
  onChange,
  label,
  valueText,
  note,
  scaleStart,
  scaleEnd,
  ariaValueText,
  disabled = false,
  describedBy,
}: ScaleSliderProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      {/* Bleibt kleiner als die Abschnittsüberschrift – es ist ein Wert, keine Überschrift. */}
      <p className={cn('text-lg font-semibold tabular-nums', disabled && 'text-text-muted')}>
        {valueText}
      </p>
      {note === undefined ? null : <p className="text-sm text-text-muted">{note}</p>}

      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={position}
        aria-valuetext={ariaValueText ?? valueText}
        disabled={disabled}
        aria-describedby={describedBy}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(
          'w-full accent-cat-1',
          'focus-visible:outline-cat-1',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      />

      <div className="flex justify-between text-xs text-text-muted">
        <span>{scaleStart}</span>
        <span>{scaleEnd}</span>
      </div>
    </div>
  );
}
