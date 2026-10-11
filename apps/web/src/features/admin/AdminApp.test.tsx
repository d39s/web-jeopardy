import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import type { AdminQuestion, AdminTopic, SqlRunResult } from '@jeopardy/game-core';
import { AdminApp } from './AdminApp';

const topic: AdminTopic = {
  id: 'it',
  title: 'IT',
  questionCount: 1,
  rubrics: [
    { id: 'netze', name: 'Netze', questionCount: 1 },
    { id: 'code', name: 'Code', questionCount: 0 },
  ],
};
const question: AdminQuestion = {
  topicId: 'it',
  rubricId: 'netze',
  rubricName: 'Netze',
  id: 'dns',
  question: 'Was ist DNS?',
  answer: 'Domain Name System',
  sourceLevel: 3,
  level: 4,
  score: 3.6,
  votes: { fits: 1, tooHard: 3, tooEasy: 0, unsure: 0 },
  version: 'a'.repeat(64),
};
const dryRun: SqlRunResult = {
  ok: true,
  committed: false,
  sha256: 'b'.repeat(64),
  durationMs: 12,
  statements: [{ command: 'INSERT', rowCount: 25 }],
  notices: [],
  counts: {
    before: { topics: 1, rubrics: 2, questions: 1 },
    after: { topics: 2, rubrics: 7, questions: 26 },
  },
  topics: [
    {
      id: 'neu',
      title: 'Neu',
      before: { rubrics: 0, questions: 0 },
      after: { rubrics: 5, questions: 25 },
    },
  ],
  issues: [],
};

type Handler = (url: string, init: RequestInit) => { status?: number; body?: unknown } | undefined;

function respond({ status = 200, body }: { status?: number; body?: unknown }) {
  return Promise.resolve({
    ok: status < 400,
    status,
    json: async () => body,
  });
}

function mockApi(handler: Handler) {
  const fetch = vi.fn((url: string, init: RequestInit = {}) => {
    const path = url.replace(/^.*\/api\/v1\/admin\//, '');
    const custom = handler(path, init);
    if (custom) return respond(custom);
    if (path === 'me') return respond({ body: { user: 'dominic', groups: [] } });
    if (path === 'topics') return respond({ body: [topic] });
    if (path.startsWith('questions')) return respond({ body: { total: 1, questions: [question] } });
    return respond({ status: 404, body: { error: 'unbekannt' } });
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

function mount(path = '/admin') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeAll(() => {
  // jsdom kennt showModal nicht.
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.open = false;
  };
});
afterEach(() => vi.unstubAllGlobals());

it('erklärt, wenn der Admin-Bereich nicht aktiviert ist', async () => {
  mockApi((path) => (path === 'me' ? { status: 404 } : undefined));
  mount();
  expect(await screen.findByText(/nicht aktiviert/)).toBeInTheDocument();
});

it('fordert bei 403 zur erneuten Anmeldung auf', async () => {
  mockApi((path) => (path === 'me' ? { status: 403, body: { error: 'nein' } } : undefined));
  mount();
  expect(await screen.findByRole('alert')).toHaveTextContent('Keine Berechtigung');
  expect(screen.getByRole('link', { name: 'Erneut anmelden' })).toHaveAttribute('href', '/admin');
});

it('listet Fragen und speichert Änderungen mit Version und Rücksetzoption', async () => {
  const user = userEvent.setup();
  const fetch = mockApi((_path, init) =>
    init.method === 'PUT' ? { body: { ...question, question: 'Was macht DNS?' } } : undefined,
  );
  mount();
  expect(await screen.findByText('Angemeldet als dominic')).toBeInTheDocument();
  const row = (await screen.findByText('Was ist DNS?')).closest('tr')!;
  expect(within(row).getByText('3 → 4')).toBeInTheDocument();
  expect(within(row).getByText('3,6')).toBeInTheDocument();
  await user.click(within(row).getByRole('button', { name: 'Frage dns bearbeiten' }));

  const dialog = await screen.findByRole('dialog');
  const text = within(dialog).getByLabelText('Frage');
  await user.clear(text);
  await user.type(text, 'Was macht DNS?');
  await user.selectOptions(
    within(dialog).getByLabelText('Ausgangsstufe (1 leicht – 9 schwer)'),
    '5',
  );
  expect(within(dialog).getByRole('checkbox')).toBeChecked();
  expect(within(dialog).getByRole('checkbox')).toBeDisabled();
  await user.click(within(dialog).getByRole('button', { name: 'Speichern' }));

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  const put = fetch.mock.calls.find(([, init]) => init?.method === 'PUT')!;
  expect(put[0]).toMatch(/topics\/it\/questions\/dns$/);
  expect(JSON.parse(put[1]!.body as string)).toEqual({
    rubricId: 'netze',
    level: 5,
    question: 'Was macht DNS?',
    answer: 'Domain Name System',
    note: '',
    resetRating: false,
    version: question.version,
  });
  // Liste und Themenzähler werden neu geladen.
  await waitFor(() =>
    expect(fetch.mock.calls.filter(([url]) => url.endsWith('/topics'))).toHaveLength(2),
  );
});

it('zeigt Poolprobleme beim Löschen und lässt den Dialog offen', async () => {
  const user = userEvent.setup();
  mockApi((_path, init) =>
    init.method === 'DELETE'
      ? {
          status: 422,
          body: {
            error: 'Die Änderung würde den Fragenpool unspielbar machen.',
            issues: ['rubrics.0.clues: Eine Rubrik braucht mindestens 5 Fragen.'],
          },
        }
      : undefined,
  );
  mount();
  await user.click(await screen.findByRole('button', { name: 'Frage dns bearbeiten' }));
  const dialog = await screen.findByRole('dialog');
  await user.click(within(dialog).getByRole('button', { name: 'Löschen' }));
  await user.click(within(dialog).getByRole('button', { name: 'Wirklich löschen' }));
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('mindestens 5 Fragen');
});

it('führt SQL erst nach erfolgreichem Testlauf desselben Skripts aus', async () => {
  const user = userEvent.setup();
  const fetch = mockApi((path) =>
    path === 'sql/dry-run'
      ? { body: dryRun }
      : path === 'sql/execute'
        ? { body: { ...dryRun, committed: true } }
        : undefined,
  );
  mount('/admin/sql');
  const script = await screen.findByLabelText('SQL-Skript');
  const execute = screen.getByRole('button', { name: 'Ausführen' });
  await user.type(script, 'SELECT 1;');
  expect(execute).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Testlauf' }));
  expect(await screen.findByText(/Testlauf erfolgreich/)).toBeInTheDocument();
  expect(screen.getByText('Neu')).toBeInTheDocument();
  expect(execute).toBeEnabled();

  // Jede Änderung am Skript verlangt einen neuen Testlauf.
  await user.type(script, ' ');
  expect(execute).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Testlauf' }));
  await waitFor(() => expect(execute).toBeEnabled());
  await user.click(execute);
  const dialog = await screen.findByRole('dialog');
  expect(dialog).toHaveTextContent('26 Fragen in 2 Themen');
  await user.click(within(dialog).getByRole('button', { name: 'Jetzt ausführen' }));
  expect(await screen.findByText(/ausgeführt und gespeichert/)).toBeInTheDocument();
  expect(execute).toBeDisabled();
  const executed = fetch.mock.calls.find(([url]) => url.endsWith('sql/execute'))!;
  expect(JSON.parse(executed[1]!.body as string)).toEqual({ sql: 'SELECT 1; ' });
});

it('zeigt Skriptfehler mit Zeilenangabe', async () => {
  const user = userEvent.setup();
  mockApi((path) =>
    path === 'sql/dry-run'
      ? { status: 400, body: { error: 'Transaktionssteuerung ist nur …', line: 3, column: 1 } }
      : undefined,
  );
  mount('/admin/sql');
  await user.type(await screen.findByLabelText('SQL-Skript'), 'COMMIT;');
  await user.click(screen.getByRole('button', { name: 'Testlauf' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Zeile 3, Spalte 1');
});
