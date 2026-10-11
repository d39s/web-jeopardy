import { useId, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { SqlRunResult } from '@jeopardy/game-core';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { cn } from '../../lib/cn';
import { de } from '../../i18n/de';
import { adminApi } from './api';
import type { AdminApiError } from './api';
import { errorMessage, ErrorNotice, TextAreaField } from './fields';

const t = de.admin.sql;

export function SqlPage() {
  const fileId = useId();
  const confirmId = useId();
  const [sql, setSql] = useState('');
  const [filename, setFilename] = useState<string | undefined>();
  const [busy, setBusy] = useState<'dry' | 'execute' | null>(null);
  const [result, setResult] = useState<{ sql: string; run: SqlRunResult } | null>(null);
  const [error, setError] = useState<AdminApiError | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Ausführen nur für exakt das Skript, dessen Testlauf gerade erfolgreich war.
  const executable = result?.sql === sql && result.run.ok && !result.run.committed;

  async function run(commit: boolean) {
    setBusy(commit ? 'execute' : 'dry');
    setError(null);
    setConfirming(false);
    try {
      const run = await adminApi.runSql({ sql, ...(filename ? { filename } : {}) }, commit);
      setResult({ sql, run });
    } catch (caught) {
      setResult(null);
      setError(errorMessage(caught));
    } finally {
      setBusy(null);
    }
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSql(await file.text());
    setFilename(file.name);
    setResult(null);
    setError(null);
  }

  return (
    <section className="flex flex-col gap-5" aria-labelledby="admin-sql-heading">
      <div className="flex flex-col gap-2">
        <h2 id="admin-sql-heading" className="text-2xl font-bold">
          {t.heading}
        </h2>
        <p className="max-w-3xl text-sm text-text-muted">{t.intro}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={fileId}
          className="cursor-pointer rounded-btn border border-border bg-surface px-4 py-2 font-semibold hover:bg-surface-hi"
        >
          {t.file}
        </label>
        <input
          id={fileId}
          type="file"
          accept=".sql,text/plain,application/sql"
          className="sr-only"
          onChange={(event) => void chooseFile(event)}
        />
        {filename ? <span className="text-sm text-text-muted">{t.filename(filename)}</span> : null}
      </div>
      <TextAreaField
        label={t.script}
        hint={t.scriptHint}
        value={sql}
        rows={16}
        spellCheck={false}
        className="font-mono text-sm"
        onChange={(event) => {
          setSql(event.target.value);
          if (!event.target.value) setFilename(undefined);
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          disabled={!sql.trim() || busy !== null}
          onClick={() => void run(false)}
        >
          {busy === 'dry' ? t.dryRunning : t.dryRun}
        </Button>
        <Button
          variant="danger"
          disabled={!executable || busy !== null}
          onClick={() => setConfirming(true)}
        >
          {busy === 'execute' ? t.executing : t.execute}
        </Button>
        {!executable && sql.trim() ? (
          <span className="text-sm text-text-muted">{t.executeHint}</span>
        ) : null}
      </div>
      {error ? <ErrorNotice error={error} /> : null}
      {result ? <SqlResult run={result.run} /> : null}
      {confirming && result ? (
        <Modal
          open
          onClose={() => setConfirming(false)}
          labelledBy={confirmId}
          className="w-[min(36rem,92vw)]"
        >
          <div className="flex flex-col gap-4">
            <h2 id={confirmId} className="text-xl font-bold">
              {t.confirmHeading}
            </h2>
            <p>
              {t.confirmText(result.run.counts.after.questions, result.run.counts.after.topics)}
            </p>
            {filename ? <p className="text-sm text-text-muted">{t.filename(filename)}</p> : null}
            <div className="flex gap-3">
              <Button variant="danger" onClick={() => void run(true)}>
                {t.confirm}
              </Button>
              <Button onClick={() => setConfirming(false)}>{t.cancel}</Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}

function SqlResult({ run }: { run: SqlRunResult }) {
  const status = run.committed
    ? t.committed
    : run.error
      ? t.failed
      : run.issues.length > 0
        ? t.blocked
        : t.dryRunOk;
  const counts = ['topics', 'rubrics', 'questions'] as const;
  return (
    <div className="flex flex-col gap-4">
      <Card
        role={run.ok ? 'status' : 'alert'}
        className={cn(
          'flex flex-col gap-2 p-4',
          run.ok ? 'border-positive/40 text-positive' : 'border-negative/40 text-negative',
        )}
      >
        <p className="font-semibold">
          {status}{' '}
          <span className="font-normal text-text-muted">· {t.duration(run.durationMs)}</span>
        </p>
        {run.error ? (
          <div className="flex flex-col gap-1 text-sm">
            <p className="font-mono">
              {run.error.line ? `${t.location(run.error.line, run.error.column)}: ` : null}
              {run.error.message}
            </p>
            {[run.error.detail, run.error.hint, run.error.where].filter(Boolean).map((line) => (
              <p key={line} className="whitespace-pre-wrap font-mono text-text-muted">
                {line}
              </p>
            ))}
          </div>
        ) : null}
        {run.issues.map((entry) => (
          <div key={entry.topicId} className="text-sm">
            <p>{t.issuesHeading(entry.topicId)}</p>
            <ul className="list-disc pl-5">
              {entry.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        ))}
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-2 font-semibold">{t.countsHeading}</h3>
          <table className="w-full text-left text-sm">
            <thead className="text-text-muted">
              <tr>
                <th className="py-1 font-normal">{t.countsColumns.what}</th>
                <th className="py-1 text-right font-normal">{t.countsColumns.before}</th>
                <th className="py-1 text-right font-normal">{t.countsColumns.after}</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {counts.map((key) => (
                <tr key={key}>
                  <td className="py-1">{t.countLabels[key]}</td>
                  <td className="py-1 text-right">{run.counts.before[key]}</td>
                  <td
                    className={cn(
                      'py-1 text-right',
                      run.counts.before[key] !== run.counts.after[key] &&
                        'font-semibold text-cat-1',
                    )}
                  >
                    {run.counts.after[key]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        {run.topics.length > 0 ? (
          <Card className="p-4">
            <h3 className="mb-2 font-semibold">{t.topicsHeading}</h3>
            <ul className="flex flex-col gap-1 text-sm">
              {run.topics.map((topic) => (
                <li key={topic.id}>
                  <span className="font-semibold">{topic.title}</span>{' '}
                  <span className="text-text-muted">
                    {t.countLabels.rubrics}{' '}
                    {t.topicChange(topic.before.rubrics, topic.after.rubrics)} ·{' '}
                    {t.countLabels.questions}{' '}
                    {t.topicChange(topic.before.questions, topic.after.questions)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
      {run.notices.length > 0 ? (
        <Card className="p-4">
          <h3 className="mb-2 font-semibold">{t.noticesHeading}</h3>
          <ul className="flex flex-col gap-1 font-mono text-sm">
            {run.notices.map((notice, index) => (
              <li key={index}>{notice}</li>
            ))}
          </ul>
        </Card>
      ) : null}
      {run.statements.length > 0 ? (
        <details className="rounded-card border border-border bg-surface p-4">
          <summary className="cursor-pointer font-semibold">
            {t.statementsHeading(run.statements.length)}
          </summary>
          <ol className="mt-3 flex flex-col gap-3 text-sm">
            {run.statements.map((statement, index) => (
              <li key={index} className="flex flex-col gap-2">
                <p className="font-mono">
                  {index + 1}. {statement.command}{' '}
                  <span className="text-text-muted">{t.rowCount(statement.rowCount)}</span>
                </p>
                {statement.columns && statement.rows && statement.rows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="border-collapse font-mono text-xs">
                      <thead>
                        <tr>
                          {statement.columns.map((column, columnIndex) => (
                            <th
                              key={columnIndex}
                              className="border border-border px-2 py-1 text-left"
                            >
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {statement.rows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.map((value, columnIndex) => (
                              <td key={columnIndex} className="border border-border px-2 py-1">
                                {value ?? 'NULL'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </div>
  );
}
