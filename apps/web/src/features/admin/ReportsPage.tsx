import { useEffect, useState } from 'react';
import type { AdminQuestion, AdminReportedQuestion, AdminTopic } from '@jeopardy/game-core';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { de } from '../../i18n/de';
import { adminApi } from './api';
import type { AdminApiError } from './api';
import { errorMessage, ErrorNotice } from './fields';
import { QuestionDialog } from './QuestionDialog';

const t = de.admin.reports;
const dateFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' });

/** Gemeldete Fragen mit den Kommentaren der Spieler; neueste Meldung zuerst. */
export function ReportsPage() {
  const [entries, setEntries] = useState<AdminReportedQuestion[] | null>(null);
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [error, setError] = useState<AdminApiError | null>(null);
  const [editing, setEditing] = useState<AdminQuestion | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const request = new AbortController();
    Promise.all([adminApi.reports(request.signal), adminApi.topics(request.signal)]).then(
      ([list, topicList]) => {
        setEntries(list.questions);
        setTopics(topicList);
        setError(null);
      },
      (caught: unknown) => {
        if (!request.signal.aborted) setError(errorMessage(caught));
      },
    );
    return () => request.abort();
  }, [revision]);

  async function resolve(entry: AdminReportedQuestion) {
    const key = `${entry.topicId}/${entry.questionId}`;
    setResolving(key);
    setMessage('');
    setError(null);
    try {
      // Nur bis zur neuesten angezeigten Meldung; inzwischen eingegangene bleiben offen.
      await adminApi.resolveReports(entry.topicId, entry.questionId, entry.reports[0]!.id);
      setMessage(t.resolved(entry.questionId));
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setResolving(null);
      setRevision((value) => value + 1);
    }
  }

  const reportCount = entries?.reduce((sum, entry) => sum + entry.reports.length, 0) ?? 0;
  const editingTopic = editing && topics.find((topic) => topic.id === editing.topicId);

  return (
    <section className="flex flex-col gap-5" aria-labelledby="admin-reports-heading">
      <div className="flex flex-col gap-1">
        <h2 id="admin-reports-heading" className="text-2xl font-bold">
          {t.heading}
        </h2>
        <p className="text-sm text-text-muted">{t.intro}</p>
      </div>
      <p role="status" className="min-h-5 text-sm text-text-muted">
        {message || (entries && entries.length > 0 ? t.summary(entries.length, reportCount) : '')}
      </p>
      {error ? <ErrorNotice error={error} /> : null}
      {entries === null ? (
        !error ? (
          <p className="text-text-muted">{de.admin.loading}</p>
        ) : null
      ) : entries.length === 0 ? (
        <p className="text-text-muted">{t.empty}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {entries.map((entry) => {
            const key = `${entry.topicId}/${entry.questionId}`;
            const { question } = entry;
            return (
              <li key={key}>
                <Card className="flex flex-col gap-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="text-sm text-text-muted">
                        {entry.topicTitle ?? entry.topicId}
                        {question ? ` · ${question.rubricName}` : ''}
                      </p>
                      {question ? (
                        <>
                          <p className="text-lg font-semibold">{question.question}</p>
                          <p>
                            <span className="text-text-muted">{t.answer}: </span>
                            {question.answer}
                          </p>
                          {question.note ? (
                            <p className="text-sm text-text-muted">
                              {t.note}: {question.note}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <p className="text-text-muted">{t.missing}</p>
                      )}
                      <p className="font-mono text-xs text-text-muted">{entry.questionId}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {question && topics.some((topic) => topic.id === question.topicId) ? (
                        <Button
                          aria-label={t.editLabel(entry.questionId)}
                          disabled={resolving !== null}
                          onClick={() => setEditing(question)}
                        >
                          {t.edit}
                        </Button>
                      ) : null}
                      <Button
                        variant="primary"
                        aria-label={t.resolveLabel(entry.questionId)}
                        title={t.resolveHint}
                        disabled={resolving !== null}
                        onClick={() => void resolve(entry)}
                      >
                        {resolving === key ? t.resolving : t.resolve}
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 border-t border-border pt-3">
                    <h3 className="text-sm font-semibold text-text-muted">
                      {t.reportsHeading(entry.reports.length)}
                    </h3>
                    <ul className="flex flex-col gap-3">
                      {entry.reports.map((report) => (
                        <li key={report.id} className="flex flex-col gap-1 text-sm">
                          <p className="text-text-muted">
                            {dateFormat.format(new Date(report.createdAt))} ·{' '}
                            {t.sources[report.source]}
                          </p>
                          <p className={report.comment ? 'whitespace-pre-wrap' : 'text-text-muted'}>
                            {report.comment ?? t.noComment}
                          </p>
                          {question?.question !== report.question ||
                          question.answer !== report.answer ? (
                            <p className="text-xs text-text-muted">
                              {t.reportedVersion}: {report.question} → {report.answer}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
      {editing && editingTopic ? (
        <QuestionDialog
          topic={editingTopic}
          question={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setRevision((value) => value + 1);
          }}
        />
      ) : null}
    </section>
  );
}
