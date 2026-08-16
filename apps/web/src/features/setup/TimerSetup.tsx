import { TIMER_OPTIONS } from '@jeopardy/game-core';
import { useId } from 'react';
import { de } from '../../i18n/de';
import { cn } from '../../lib/cn';

export interface TimerSetupProps {
  /** Sekunden je Frage; null bedeutet ohne Zeitbegrenzung. */
  value: number | null;
  onChange: (value: number | null) => void;
}

/** Lesbare Beschriftung einer Bedenkzeit, z. B. „45 Sekunden" oder „1:30 Minuten". */
export function formatTimerOption(seconds: number): string {
  if (seconds < 60) return de.setup.timerSeconds(seconds);

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? de.setup.timerMinutes(minutes) : de.setup.timerMinutesSeconds(minutes, rest);
}

/**
 * Position auf dem Schieberegler. Die Stufen sind ungleich verteilt (10 s bis
 * 5 min), deshalb steht auf dem Regler der Index und nicht die Sekundenzahl.
 * Position 0 bedeutet „ohne Zeitbegrenzung".
 */
export function timerSliderValue(seconds: number | null): number {
  if (seconds === null) return 0;
  const index = (TIMER_OPTIONS as readonly number[]).indexOf(seconds);
  return index === -1 ? 0 : index + 1;
}

/** Umkehrung von `timerSliderValue`; Position 0 ist die Sonderstufe. */
export function secondsAtSliderValue(position: number): number | null {
  return position === 0 ? null : (TIMER_OPTIONS[position - 1] ?? null);
}

const LAST_OPTION = TIMER_OPTIONS[TIMER_OPTIONS.length - 1] as number;

export interface TimerSliderProps {
  /** Sekunden; null steht für die Sonderstufe ganz links. */
  value: number | null;
  onChange: (value: number | null) => void;
  /** Unsichtbare Beschriftung – auf dem Regler selbst steht nur ein Index. */
  label: string;
  /** Klartext des eingestellten Werts; steht über dem Regler. */
  valueText: string;
  /** Zweite Zeile darunter, z. B. die daraus folgende Zeit. */
  note?: string;
  /** Beschriftung der Skala ganz links (Position 0). */
  scaleStart: string;
  /** Vorlesetext; ohne Angabe gilt `valueText`. */
  ariaValueText?: string;
  disabled?: boolean;
  /** Id eines Textes, der die Sperre erklärt. */
  describedBy?: string;
}

/**
 * Regler über die Zeitstufen. Bedenkzeit und Veto-Zeit teilen sich Optik und
 * Bedienung und unterscheiden sich nur in den Beschriftungen.
 */
export function TimerSlider({
  value,
  onChange,
  label,
  valueText,
  note,
  scaleStart,
  ariaValueText,
  disabled = false,
  describedBy,
}: TimerSliderProps) {
  const id = useId();
  const position = timerSliderValue(value);

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
        min={0}
        max={TIMER_OPTIONS.length}
        step={1}
        value={position}
        aria-valuetext={ariaValueText ?? valueText}
        disabled={disabled}
        aria-describedby={describedBy}
        onChange={(event) => onChange(secondsAtSliderValue(Number(event.target.value)))}
        className={cn(
          'w-full accent-cat-1',
          'focus-visible:outline-cat-1',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      />

      <div className="flex justify-between text-xs text-text-muted">
        <span>{scaleStart}</span>
        <span>{formatTimerOption(LAST_OPTION)}</span>
      </div>
    </div>
  );
}

export function TimerSetup({ value, onChange }: TimerSetupProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{de.setup.timerHeading}</h2>
      <p className="text-sm text-text-muted">{de.setup.timerHint}</p>

      <TimerSlider
        value={value}
        onChange={onChange}
        label={de.setup.timerLabel}
        valueText={value === null ? de.setup.timerOff : formatTimerOption(value)}
        scaleStart={de.setup.timerScaleOff}
      />
    </section>
  );
}
