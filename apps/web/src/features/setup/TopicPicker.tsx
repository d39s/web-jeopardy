import type { QuestionPool, TopicCategory } from '@jeopardy/game-core';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { de } from '../../i18n/de';
import { cn } from '../../lib/cn';
import type { LoadError } from '../../content/loader';

export interface TopicPickerProps {
  categories: TopicCategory[];
  loading: boolean;
  error: LoadError | null;
  /** Gewählte Kategorie; null zeigt die Auswahl. */
  selectedCategory: string | null;
  /** Vorrat der gewählten Kategorie; null, solange er noch nicht da ist. */
  pool: QuestionPool | null;
  poolLoading: boolean;
  onSelectCategory: (id: string | null) => void;
}

/** Gemeinsame Optik der Auswahlkarten – gleich hoch, gleicher Rahmen. */
const cardClasses = 'h-full w-full rounded-card border bg-surface p-4 text-left transition-colors';

/** Fragen und Rubriken eines Vorrats – sagt, wie viel Abwechslung zu erwarten ist. */
function poolSize(pool: QuestionPool): string {
  const clues = pool.rubrics.reduce((sum, rubric) => sum + rubric.clues.length, 0);
  return de.setup.poolSize(clues, pool.rubrics.length);
}

export function TopicPicker({
  categories,
  loading,
  error,
  selectedCategory,
  pool,
  poolLoading,
  onSelectCategory,
}: TopicPickerProps) {
  const category = categories.find((entry) => entry.id === selectedCategory) ?? null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold">{de.setup.topicsHeading}</h2>
        {category ? (
          <Button onClick={() => onSelectCategory(null)}>{de.setup.categoryBack}</Button>
        ) : null}
      </div>

      <p className="text-sm text-text-muted">
        {category ? de.setup.categoryOf(category.title) : de.setup.categoryHint}
      </p>

      {loading ? <p className="text-text-muted">{de.setup.topicsLoading}</p> : null}

      {error ? (
        <Card className="border-negative/40 p-4">
          <p className="font-semibold text-negative">{error.message}</p>
          {error.issues.length > 0 ? (
            <>
              <p className="mt-2 text-sm text-text-muted">{de.errors.issuesHeading}</p>
              <ul className="mt-1 list-inside list-disc text-sm text-text-muted">
                {error.issues.slice(0, 5).map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </>
          ) : null}
        </Card>
      ) : null}

      {!loading && !error && categories.length === 0 ? (
        <p className="text-text-muted">{de.setup.topicsEmpty}</p>
      ) : null}

      {category === null ? (
        <ul className="grid items-stretch gap-3 sm:grid-cols-2">
          {categories.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onSelectCategory(entry.id)}
                className={cn(cardClasses, 'border-border hover:bg-surface-hi')}
              >
                <span className="block font-semibold">{entry.title}</span>
                {entry.description ? (
                  <span className="mt-1 block text-sm text-text-muted">{entry.description}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        // Zweite Stufe: Die Kategorie steht fest, die Härte wählt der Regler
        // darunter. Der Umfang des Vorrats sagt, wie viel Abwechslung er hergibt.
        <Card className="border-cat-1 p-4">
          <p className="font-semibold">{category.title}</p>
          {category.description ? (
            <p className="mt-1 text-sm text-text-muted">{category.description}</p>
          ) : null}
          <p className="mt-2 text-sm text-text-muted">
            {poolLoading || pool === null ? de.setup.poolLoading : poolSize(pool)}
          </p>
        </Card>
      )}
    </section>
  );
}
