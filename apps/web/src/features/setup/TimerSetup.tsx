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

function secondsAtSliderValue(position: number): number | null {
  return position === 0 ? null : (TIMER_OPTIONS[position - 1] ?? null);
}

const LAST_OPTION = TIMER_OPTIONS[TIMER_OPTIONS.length - 1] as number;

export function TimerSetup({ value, onChange }: TimerSetupProps) {
  const id = useId();
  const position = timerSliderValue(value);
  const label = value === null ? de.setup.timerOff : formatTimerOption(value);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{de.setup.timerHeading}</h2>
      <p className="text-sm text-text-muted">{de.setup.timerHint}</p>

      <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <p className="text-2xl font-bold tabular-nums">{label}</p>

        <label htmlFor={id} className="sr-only">
          {de.setup.timerLabel}
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={TIMER_OPTIONS.length}
          step={1}
          value={position}
          aria-valuetext={label}
          onChange={(event) => onChange(secondsAtSliderValue(Number(event.target.value)))}
          className={cn('w-full accent-cat-1', 'focus-visible:outline-cat-1')}
        />

        <div className="flex justify-between text-xs text-text-muted">
          <span>{de.setup.timerScaleOff}</span>
          <span>{formatTimerOption(LAST_OPTION)}</span>
        </div>
      </div>
    </section>
  );
}
