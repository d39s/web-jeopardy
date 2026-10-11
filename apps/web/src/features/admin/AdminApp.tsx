import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import type { AdminIdentity } from '@jeopardy/game-core';
import { Card } from '../../components/ui/Card';
import { cn } from '../../lib/cn';
import { de } from '../../i18n/de';
import { adminApi } from './api';
import type { AdminApiError } from './api';
import { errorMessage, ErrorNotice } from './fields';
import { LogPage } from './LogPage';
import { QuestionsPage } from './QuestionsPage';
import { ReportsPage } from './ReportsPage';
import { SqlPage } from './SqlPage';

type State =
  | { status: 'loading' }
  | { status: 'ready'; identity: AdminIdentity }
  | { status: 'error'; error: AdminApiError };

const navItems = [
  { to: '/admin', label: de.admin.nav.questions, end: true },
  { to: '/admin/reports', label: de.admin.nav.reports, end: false },
  { to: '/admin/sql', label: de.admin.nav.sql, end: false },
  { to: '/admin/log', label: de.admin.nav.log, end: false },
];

/** Admin-Bereich unter /admin. Die Anmeldung erledigt Authentik vor der Anwendung. */
export function AdminApp() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    const request = new AbortController();
    adminApi.me(request.signal).then(
      (identity) => setState({ status: 'ready', identity }),
      (error: unknown) => {
        if (!request.signal.aborted) setState({ status: 'error', error: errorMessage(error) });
      },
    );
    return () => request.abort();
  }, []);

  if (state.status !== 'ready') {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6 sm:p-10">
        <h1 className="text-3xl font-bold">{de.admin.heading}</h1>
        {state.status === 'loading' ? (
          <p role="status" className="text-text-muted">
            {de.admin.loading}
          </p>
        ) : state.error.status === 404 ? (
          <Card className="p-5">{de.admin.notEnabled}</Card>
        ) : state.error.status === 401 || state.error.status === 403 ? (
          <Card className="flex flex-col items-start gap-3 p-5">
            <p role="alert">{de.admin.noAccess}</p>
            {/* Vollständiges Neuladen, damit der Ingress zur Authentik-Anmeldung leitet. */}
            <a
              href={`${import.meta.env.BASE_URL}admin`}
              className="text-cat-1 underline underline-offset-4"
            >
              {de.admin.signIn}
            </a>
          </Card>
        ) : (
          <ErrorNotice error={state.error} />
        )}
      </main>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <h1 className="text-xl font-bold">{de.admin.heading}</h1>
          <nav aria-label={de.admin.navLabel} className="flex flex-wrap gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-btn px-3 py-2 text-sm font-semibold',
                    isActive ? 'bg-surface-hi text-text' : 'text-text-muted hover:text-text',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-4 text-sm text-text-muted">
            <span>{de.admin.signedInAs(state.identity.user)}</span>
            <Link to="/" className="text-cat-1 underline underline-offset-4">
              {de.admin.backToGame}
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
        <Routes>
          <Route index element={<QuestionsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="sql" element={<SqlPage />} />
          <Route path="log" element={<LogPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
