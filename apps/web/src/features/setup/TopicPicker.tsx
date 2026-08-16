import type { GameDefinition, TopicIndexEntry } from '@jeopardy/game-core';
import { Card } from '../../components/ui/Card';
import { de } from '../../i18n/de';
import { cn } from '../../lib/cn';
import type { LoadError } from '../../content/loader';

export interface TopicPickerProps {
  topics: TopicIndexEntry[];
  loading: boolean;
  error: LoadError | null;
  selectedId: string | null;
  uploaded: GameDefinition | null;
  onSelect: (id: string) => void;
  onUpload: (file: File) => void;
}

export function TopicPicker({
  topics,
  loading,
  error,
  selectedId,
  uploaded,
  onSelect,
  onUpload,
}: TopicPickerProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">{de.setup.topicsHeading}</h2>

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

      <ul className="grid items-stretch gap-3 sm:grid-cols-2">
        {topics.map((topic) => {
          const selected = !uploaded && topic.id === selectedId;
          return (
            <li key={topic.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(topic.id)}
                className={cn(
                  // h-full: nebeneinanderliegende Karten bleiben gleich hoch.
                  'h-full w-full rounded-card border bg-surface p-4 text-left transition-colors',
                  selected ? 'border-cat-1 bg-surface-hi' : 'border-border hover:bg-surface-hi',
                )}
              >
                <span className="block font-semibold">{topic.title}</span>
                {topic.description ? (
                  <span className="mt-1 block text-sm text-text-muted">{topic.description}</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

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
