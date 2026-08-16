import type { GameDefinition, TopicCategory, TopicIndexEntry } from '@jeopardy/game-core';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { de } from '../../i18n/de';
import { cn } from '../../lib/cn';
import type { LoadError } from '../../content/loader';
import { DifficultyMarks } from './DifficultyMarks';

export interface TopicPickerProps {
  categories: TopicCategory[];
  topics: TopicIndexEntry[];
  loading: boolean;
  error: LoadError | null;
  /** Gewählte Themenkategorie; null zeigt die Kategorieauswahl. */
  selectedCategory: string | null;
  selectedId: string | null;
  uploaded: GameDefinition | null;
  onSelectCategory: (id: string | null) => void;
  onSelect: (id: string) => void;
  onUpload: (file: File) => void;
}

/** Gemeinsame Optik der Auswahlkarten – gleich hoch, gleicher Rahmen. */
const cardClasses = 'h-full w-full rounded-card border bg-surface p-4 text-left transition-colors';

export function TopicPicker({
  categories,
  topics,
  loading,
  error,
  selectedCategory,
  selectedId,
  uploaded,
  onSelectCategory,
  onSelect,
  onUpload,
}: TopicPickerProps) {
  const category = categories.find((entry) => entry.id === selectedCategory) ?? null;
  const shown = category ? topics.filter((topic) => topic.category === category.id) : [];

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

      {!loading && !error && topics.length === 0 ? (
        <p className="text-text-muted">{de.setup.topicsEmpty}</p>
      ) : null}

      {/* Erste Stufe: Kategorien, bewusst ohne Schwierigkeit – die steht am Thema. */}
      {category === null ? (
        <ul className="grid items-stretch gap-3 sm:grid-cols-2">
          {categories.map((entry) => {
            const count = topics.filter((topic) => topic.category === entry.id).length;

            return (
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
                  <span className="mt-2 block text-sm text-text-muted">
                    {de.setup.categoryTopicCount(count)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        // Zweite Stufe: die Fragensets der Kategorie, jeweils mit Schwierigkeit.
        <ul className="grid items-stretch gap-3 sm:grid-cols-2">
          {shown.map((topic) => {
            const selected = !uploaded && topic.id === selectedId;

            return (
              <li key={topic.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelect(topic.id)}
                  className={cn(
                    cardClasses,
                    selected ? 'border-cat-1 bg-surface-hi' : 'border-border hover:bg-surface-hi',
                  )}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 font-semibold">{topic.title}</span>
                    <DifficultyMarks level={topic.difficulty} />
                  </span>
                  {topic.description ? (
                    <span className="mt-1 block text-sm text-text-muted">{topic.description}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="font-semibold">{de.setup.uploadHeading}</h3>
        <p className="text-sm text-text-muted">{de.setup.uploadHint}</p>
        <label className="flex w-fit flex-col gap-1 text-sm text-text-muted">
          {de.setup.uploadLabel}
          <input
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
              event.target.value = '';
            }}
            className={cn(
              'rounded-btn border border-border bg-surface-hi p-2 text-text',
              'file:mr-3 file:rounded-btn file:border-0 file:bg-cat-1 file:px-3 file:py-1',
              'file:font-semibold file:text-bg',
            )}
          />
        </label>
        {uploaded ? (
          <p className="text-sm text-cat-4">{de.setup.uploadSuccess(uploaded.title)}</p>
        ) : null}
      </div>
    </section>
  );
}
