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

export function TimerSetup({ value, onChange }: TimerSetupProps) {
  const id = useId();

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{de.setup.timerHeading}</h2>
      <p className="text-sm text-text-muted">{de.setup.timerHint}</p>

      <label htmlFor={id} className="sr-only">
        {de.setup.timerLabel}
      </label>
      <select
        id={id}
        value={value ?? ''}
        onChange={(event) =>
          onChange(event.target.value === '' ? null : Number(event.target.value))
        }
        className={cn(
          'w-fit rounded-btn border border-border bg-surface-hi px-3 py-2 text-text',
          'focus-visible:outline-cat-1',
        )}
      >
        <option value="">{de.setup.timerOff}</option>
        {TIMER_OPTIONS.map((seconds) => (
          <option key={seconds} value={seconds}>
            {formatTimerOption(seconds)}
          </option>
        ))}
      </select>
    </section>
  );
}
