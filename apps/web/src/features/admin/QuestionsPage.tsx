import { useCallback, useEffect, useState } from 'react';
import { CLUE_LEVELS } from '@jeopardy/game-core';
import type { AdminQuestion, AdminQuestionList, AdminTopic } from '@jeopardy/game-core';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { TextField } from '../../components/ui/TextField';
import { de } from '../../i18n/de';
import { adminApi } from './api';
import type { AdminApiError } from './api';
import { errorMessage, ErrorNotice, SelectField } from './fields';
import { QuestionDialog } from './QuestionDialog';

const t = de.admin.questions;
const PAGE_SIZE = 50;

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function QuestionsPage() {
  const [topics, setTopics] = useState<AdminTopic[] | null>(null);
  const [topicId, setTopicId] = useState('');
  const [rubricId, setRubricId] = useState('');
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [page, setPage] = useState({ filters: '', offset: 0 });
  const [list, setList] = useState<AdminQuestionList | null>(null);
  const [error, setError] = useState<AdminApiError | null>(null);
  const [editing, setEditing] = useState<AdminQuestion | 'new' | null>(null);
  const [revision, setRevision] = useState(0);
  const query = useDebounced(search.trim(), 300);
  // Neue Filter beginnen wieder auf der ersten Seite.
  const filters = [topicId, rubricId, query, level].join('|');
  const offset = page.filters === filters ? page.offset : 0;
  const setOffset = (value: number) => setPage({ filters, offset: value });

  const loadTopics = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await adminApi.topics(signal);
      setTopics(result);
      setTopicId((current) =>
        result.some((topic) => topic.id === current) ? current : (result[0]?.id ?? ''),
      );
    } catch (caught) {
      if (!signal?.aborted) setError(errorMessage(caught));
    }
  }, []);

  useEffect(() => {
    const request = new AbortController();
    void loadTopics(request.signal);
    return () => request.abort();
  }, [loadTopics]);

  useEffect(() => {
    if (!topicId) return;
    const request = new AbortController();
    adminApi
      .questions(
        {
          topicId,
          rubricId,
          q: query,
          level: level ? Number(level) : undefined,
          offset,
          limit: PAGE_SIZE,
        },
        request.signal,
      )
      .then(
        (result) => {
          setList(result);
          setError(null);
        },
        (caught: unknown) => {
          if (!request.signal.aborted) setError(errorMessage(caught));
        },
      );
    return () => request.abort();
  }, [topicId, rubricId, query, level, offset, revision]);

  const topic = topics?.find((entry) => entry.id === topicId);

  if (topics?.length === 0) return <Card className="p-5">{t.noTopics}</Card>;

  return (
    <section className="flex flex-col gap-5" aria-labelledby="admin-questions-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="admin-questions-heading" className="text-2xl font-bold">
            {t.heading}
          </h2>
          {topic ? (
            <p className="text-sm text-text-muted">
              {t.topicSummary(topic.rubrics.length, topic.questionCount)}
            </p>
          ) : null}
        </div>
        <Button variant="primary" disabled={!topic} onClick={() => setEditing('new')}>
          {t.create}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr_auto]">
        <SelectField
          label={t.topic}
          value={topicId}
          onChange={(event) => {
            setTopicId(event.target.value);
            setRubricId('');
          }}
        >
          {topics?.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.title}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={t.rubric}
          value={rubricId}
          onChange={(event) => setRubricId(event.target.value)}
        >
          <option value="">{t.allRubrics}</option>
          {topic?.rubrics.map((rubric) => (
            <option key={rubric.id} value={rubric.id}>
              {rubric.name} ({rubric.questionCount})
            </option>
          ))}
        </SelectField>
        <TextField
          label={t.search}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <SelectField
          label={t.level}
          value={level}
          onChange={(event) => setLevel(event.target.value)}
        >
          <option value="">{t.allLevels}</option>
          {CLUE_LEVELS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </SelectField>
      </div>
      {error ? <ErrorNotice error={error} /> : null}
      {list ? (
        <>
          {list.questions.length === 0 ? (
            <p className="text-text-muted">{t.empty}</p>
          ) : (
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
                <thead className="text-text-muted">
                  <tr className="border-b border-border">
                    <th className="p-3 font-semibold">{t.columns.rubric}</th>
                    <th className="p-3 font-semibold">{t.columns.question}</th>
                    <th className="p-3 font-semibold">{t.columns.answer}</th>
                    <th className="p-3 font-semibold" title={t.levelHint}>
                      {t.columns.level}
                    </th>
                    <th className="p-3 font-semibold">{t.columns.score}</th>
                    <th className="p-3 font-semibold">{t.columns.votes}</th>
                    <th className="p-3 font-semibold">
                      <span className="sr-only">{t.columns.actions}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.questions.map((question) => (
                    <tr
                      key={`${question.topicId}/${question.id}`}
                      className="border-b border-border last:border-0 align-top"
                    >
                      <td className="p-3 text-text-muted">{question.rubricName}</td>
                      <td className="max-w-md p-3">
                        <p>{question.question}</p>
                        <p className="mt-1 font-mono text-xs text-text-muted">{question.id}</p>
                      </td>
                      <td className="max-w-xs p-3">
                        <p>{question.answer}</p>
                        {question.note ? (
                          <p className="mt-1 text-xs text-text-muted">{question.note}</p>
                        ) : null}
                      </td>
                      <td className="p-3 tabular-nums" title={t.levelHint}>
                        {question.sourceLevel === question.level
                          ? question.level
                          : `${question.sourceLevel} → ${question.level}`}
                      </td>
                      <td className="p-3 tabular-nums">
                        {question.score.toLocaleString('de-DE', { minimumFractionDigits: 1 })}
                      </td>
                      <td className="p-3 tabular-nums">
                        {question.votes.fits +
                          question.votes.tooHard +
                          question.votes.tooEasy +
                          question.votes.unsure}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          aria-label={t.editLabel(question.id)}
                          onClick={() => setEditing(question)}
                        >
                          {t.edit}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
          {list.total > 0 ? (
            <div className="flex items-center justify-between gap-3 text-sm text-text-muted">
              <span role="status">
                {t.range(
                  Math.min(offset + 1, list.total),
                  Math.min(offset + PAGE_SIZE, list.total),
                  list.total,
                )}
              </span>
              <div className="flex gap-2">
                <Button
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                >
                  {t.previous}
                </Button>
                <Button
                  disabled={offset + PAGE_SIZE >= list.total}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                >
                  {t.next}
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : !error ? (
        <p role="status" className="text-text-muted">
          {de.admin.loading}
        </p>
      ) : null}
      {editing && topic ? (
        <QuestionDialog
          topic={topic}
          question={editing === 'new' ? undefined : editing}
          defaultRubricId={rubricId || undefined}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setRevision((value) => value + 1);
            void loadTopics();
          }}
        />
      ) : null}
    </section>
  );
}
