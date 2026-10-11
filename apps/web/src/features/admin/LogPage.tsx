import { useEffect, useState } from 'react';
import type { AdminLogEntry } from '@jeopardy/game-core';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { de } from '../../i18n/de';
import { adminApi } from './api';
import type { AdminApiError } from './api';
import { errorMessage, ErrorNotice } from './fields';

const t = de.admin.log;
const PAGE_SIZE = 50;

const dateFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'medium' });

export function LogPage() {
  const [entries, setEntries] = useState<AdminLogEntry[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<AdminApiError | null>(null);

  async function load(before?: number, signal?: AbortSignal) {
    try {
      const page = await adminApi.log(before, signal);
      setEntries((current) => [...(before ? (current ?? []) : []), ...page.entries]);
      setHasMore(page.entries.length === PAGE_SIZE);
    } catch (caught) {
      if (!signal?.aborted) setError(errorMessage(caught));
    }
  }

  useEffect(() => {
    const request = new AbortController();
    void load(undefined, request.signal);
    return () => request.abort();
  }, []);

  return (
    <section className="flex flex-col gap-5" aria-labelledby="admin-log-heading">
      <h2 id="admin-log-heading" className="text-2xl font-bold">
        {t.heading}
      </h2>
      {error ? <ErrorNotice error={error} /> : null}
      {entries === null && !error ? (
        <p role="status" className="text-text-muted">
          {de.admin.loading}
        </p>
      ) : null}
      {entries?.length === 0 ? <p className="text-text-muted">{t.empty}</p> : null}
      {entries && entries.length > 0 ? (
        <ol className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.id}>
              <LogItem entry={entry} />
            </li>
          ))}
        </ol>
      ) : null}
      {hasMore && entries ? (
        <Button className="self-start" onClick={() => void load(entries.at(-1)?.id)}>
          {t.more}
        </Button>
      ) : null}
    </section>
  );
}

function LogItem({ entry }: { entry: AdminLogEntry }) {
  const [sql, setSql] = useState<string | null>(null);
  const [error, setError] = useState<AdminApiError | null>(null);

  async function showSql() {
    try {
      const full = await adminApi.logEntry(entry.id);
      setSql(typeof full.detail.sql === 'string' ? full.detail.sql : '');
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  return (
    <Card className="flex flex-col gap-2 p-4 text-sm">
      <p className="flex flex-wrap gap-x-3 gap-y-1">
        <span className="font-semibold">{t.actions[entry.action] ?? entry.action}</span>
        {entry.target ? <span className="font-mono">{entry.target}</span> : null}
        <span className="text-text-muted">
          {entry.actor} · {dateFormat.format(new Date(entry.createdAt))}
        </span>
      </p>
      <details>
        <summary className="cursor-pointer text-text-muted">{t.details}</summary>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-btn bg-surface-hi p-3 font-mono text-xs">
          {JSON.stringify(entry.detail, null, 2)}
        </pre>
        {entry.action === 'sql.execute' ? (
          sql === null ? (
            <Button className="mt-2" onClick={() => void showSql()}>
              {t.showSql}
            </Button>
          ) : (
            <pre className="mt-2 max-h-96 overflow-auto rounded-btn bg-surface-hi p-3 font-mono text-xs">
              {sql}
            </pre>
          )
        ) : null}
        {error ? <ErrorNotice error={error} /> : null}
      </details>
    </Card>
  );
}
