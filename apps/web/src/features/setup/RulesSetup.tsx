import { de } from '../../i18n/de';
import { cn } from '../../lib/cn';

export interface RulesSetupProps {
  /** Ob eine falsche Antwort Punkte kostet. */
  deductOnWrong: boolean;
  onChange: (deductOnWrong: boolean) => void;
}

const options = [
  {
    value: true,
    title: de.setup.rulesDeductTitle,
    description: de.setup.rulesDeductDescription,
  },
  {
    value: false,
    title: de.setup.rulesKeepTitle,
    description: de.setup.rulesKeepDescription,
  },
] as const;

/** Spielregeln als Auswahl – gleiche Kartenoptik wie die Themenauswahl. */
export function RulesSetup({ deductOnWrong, onChange }: RulesSetupProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{de.setup.rulesHeading}</h2>
      <p className="text-sm text-text-muted">{de.setup.rulesHint}</p>

      <ul className="grid gap-3 sm:grid-cols-2" aria-label={de.setup.rulesGroupLabel}>
        {options.map((option) => {
          const selected = deductOnWrong === option.value;

          return (
            <li key={String(option.value)}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(option.value)}
                className={cn(
                  'w-full rounded-card border bg-surface p-4 text-left transition-colors',
                  selected ? 'border-cat-1 bg-surface-hi' : 'border-border hover:bg-surface-hi',
                )}
              >
                <span className="block font-semibold">{option.title}</span>
                <span className="mt-1 block text-sm text-text-muted">{option.description}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
