import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import type { ReviewQuestion } from '@jeopardy/game-core';
import { ReviewPage } from './ReviewPage';

const question: ReviewQuestion = {
  topicId: 'it',
  topicTitle: 'IT',
  rubricName: 'Netzwerke',
  id: 'frage',
  question: 'Was ist DNS?',
  answer: 'Domain Name System',
  level: 3,
  score: 3,
  votes: 0,
  version: 'a'.repeat(64),
};
const next = { ...question, id: 'naechste', question: 'Nächste Frage?', answer: 'Neue Antwort' };

afterEach(() => vi.unstubAllGlobals());
function mount() {
  render(
    <MemoryRouter>
      <ReviewPage />
    </MemoryRouter>,
  );
}

function mockRequests(fetch: (url: string, options: RequestInit) => unknown) {
  vi.stubGlobal('fetch', (url: string, options: RequestInit) =>
    url.endsWith('topics/index.json')
      ? Promise.resolve({
          ok: true,
          json: async () => ({
            schemaVersion: 2,
            categories: [
              { id: 'it', title: 'IT', file: 'it.json' },
              { id: 'popkultur', title: 'Popkultur', file: 'popkultur.json' },
            ],
          }),
        })
      : fetch(url, options),
  );
}

it('verbirgt Antwort und Schwierigkeit bis zum Klick und lädt nach Bewertung die nächste Frage', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => question })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ score: 3.2, level: 3, votes: 1 }) })
    .mockResolvedValueOnce({ ok: true, json: async () => next });
  mockRequests(fetch);
  mount();
  await screen.findByText(question.question);
  expect(screen.queryByText(question.answer)).not.toBeInTheDocument();
  expect(screen.queryByText(/Schwierigkeit: 3/)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'zu schwer' })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Antwort anzeigen' }));
  expect(screen.getByText(question.answer)).toBeVisible();
  expect(
    screen.queryByText(/Schwierigkeit:|Schwierigkeitswert:|Bewertungen:/),
  ).not.toBeInTheDocument();
  expect(screen.queryByText('So wird die Schwierigkeit angepasst')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'nicht einschätzbar' })).not.toBeInTheDocument();
  expect(screen.getAllByRole('button')).toHaveLength(3);
  expect(screen.getByRole('button', { name: 'zu leicht 2' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Schwierigkeit passt 3' })).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'zu schwer 4' }));
  await screen.findByText(next.question);
  const [url, options] = fetch.mock.calls[1]!;
  expect(url).toBe('/api/v1/review/it/frage/votes');
  expect(JSON.parse(options.body)).toMatchObject({
    verdict: 'too-hard',
    version: question.version,
  });
  expect(screen.queryByText(next.answer)).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent(
    'Bewertung gespeichert. · Score: 3,2 · Bewertungen: 1',
  );
  expect(fetch.mock.calls[2]![0]).toContain('excludeTopic=it&excludeId=frage');
});

it('behält bei Speicherfehlern die Frage und verwendet beim Wiederholen dieselbe Request-ID', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => question })
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ ok: true, json: async () => ({ score: 3, level: 3, votes: 1 }) })
    .mockResolvedValueOnce({ ok: true, json: async () => next });
  mockRequests(fetch);
  mount();
  await screen.findByText(question.question);
  await userEvent.click(screen.getByRole('button', { name: 'Antwort anzeigen' }));
  await userEvent.click(screen.getByRole('button', { name: 'Schwierigkeit passt 3' }));
  await screen.findByRole('alert');
  expect(screen.getByText(question.answer)).toBeVisible();
  expect(screen.getByRole('button', { name: 'zu leicht 2' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Schwierigkeit passt 3' }));
  await screen.findByText(next.question);
  expect(fetch.mock.calls[1]![1].body).toBe(fetch.mock.calls[2]![1].body);
  expect(JSON.parse(fetch.mock.calls[2]![1].body).verdict).toBe('fits');
});

it('zeigt Ladefehler und erlaubt einen erneuten Versuch', async () => {
  const fetch = vi
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ ok: true, json: async () => question });
  mockRequests(fetch);
  mount();
  await screen.findByRole('alert');
  await userEvent.click(screen.getByRole('button', { name: 'Neue Frage laden' }));
  await waitFor(() => expect(screen.getByText(question.question)).toBeVisible());
});

it('lädt nur Fragen der gewählten Kategorie und behält den Filter nach der Bewertung', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => question })
    .mockResolvedValueOnce({ ok: true, json: async () => next })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ score: 3, level: 3, votes: 1 }) })
    .mockResolvedValueOnce({ ok: true, json: async () => question });
  mockRequests(fetch);
  mount();
  await screen.findByText(question.question);
  await screen.findByRole('option', { name: 'IT' });
  await userEvent.selectOptions(screen.getByLabelText('Kategorie für die Bewertung'), 'it');
  await screen.findByText(next.question);
  expect(fetch.mock.calls[1]![0]).toContain('topicId=it');
  await userEvent.click(screen.getByRole('button', { name: 'Antwort anzeigen' }));
  const buttons = screen.getAllByRole('button', {
    name: /^(zu leicht|Schwierigkeit passt|zu schwer) \d$/,
  });
  expect(buttons[0]).toHaveAccessibleName('zu leicht 2');
  expect(buttons[1]).toHaveAccessibleName('Schwierigkeit passt 3');
  expect(buttons[2]).toHaveAccessibleName('zu schwer 4');
  await userEvent.click(screen.getByRole('button', { name: 'Schwierigkeit passt 3' }));
  await screen.findByText(question.question);
  expect(fetch.mock.calls[3]![0]).toContain('topicId=it');
  expect(screen.getByLabelText('Kategorie für die Bewertung')).toHaveValue('it');
});

it.each([
  [3.4, 3, 2, 4],
  [3.5, 4, 3, 5],
  [1, 1, 1, 2],
  [9, 9, 8, 9],
])(
  'zeigt für Score %s gerundete benachbarte Stufen innerhalb der Grenzen',
  async (score, current, lower, higher) => {
    mockRequests(
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...question, score, level: current }),
      }),
    );
    mount();
    await screen.findByText(question.question);
    expect(screen.queryByRole('button', { name: /Schwierigkeit passt/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Antwort anzeigen' }));
    expect(screen.getByRole('button', { name: `Schwierigkeit passt ${current}` })).toBeVisible();
    expect(screen.getByRole('button', { name: `zu leicht ${lower}` })).toBeVisible();
    expect(screen.getByRole('button', { name: `zu schwer ${higher}` })).toBeVisible();
    expect(screen.queryByText(/von 9/)).not.toBeInTheDocument();
  },
);
