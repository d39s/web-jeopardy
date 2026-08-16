import { useId } from 'react';
import { de } from '../../i18n/de';

export interface RulesSetupProps {
  /** Ob eine falsche Antwort Punkte kostet. */
  deductOnWrong: boolean;
  onChange: (deductOnWrong: boolean) => void;
}

/** Spielregeln, die vor dem Start feststehen müssen. */
export function RulesSetup({ deductOnWrong, onChange }: RulesSetupProps) {
  const id = useId();
  const hintId = `${id}-hinweis`;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{de.setup.rulesHeading}</h2>

      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={deductOnWrong}
          aria-describedby={hintId}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 size-5 shrink-0 accent-cat-1"
        />
        <div className="flex flex-col gap-1">
          <label htmlFor={id} className="font-semibold">
            {de.setup.rulesDeductLabel}
          </label>
          <p id={hintId} className="text-sm text-text-muted">
            {deductOnWrong ? de.setup.rulesDeductHintOn : de.setup.rulesDeductHintOff}
          </p>
        </div>
      </div>
    </section>
  );
}
