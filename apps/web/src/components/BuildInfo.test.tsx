import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BuildInfo, formatBuildDate } from './BuildInfo';

describe('build-info', () => {
  it('nennt version, commit und datum in einer zeile', () => {
    render(
      <BuildInfo info={{ version: '1.2.3', commit: 'abc1234', builtAt: '2026-09-09T08:30:00Z' }} />,
    );

    expect(
      screen.getByText('Version 1.2.3 · Commit abc1234 · Stand 09.09.2026'),
    ).toBeInTheDocument();
  });

  it('zeigt einen fehlenden commit als unbekannt', () => {
    render(<BuildInfo info={{ version: '1.2.3', commit: '', builtAt: '2026-09-09T08:30:00Z' }} />);

    expect(screen.getByText(/Commit unbekannt/)).toBeInTheDocument();
  });

  it('lässt ein unbrauchbares datum weg, statt die zeile zu verlieren', () => {
    expect(formatBuildDate('kein datum')).toBeNull();

    render(<BuildInfo info={{ version: '1.2.3', commit: 'abc1234', builtAt: 'kein datum' }} />);

    expect(screen.getByText('Version 1.2.3 · Commit abc1234')).toBeInTheDocument();
  });

  it('greift ohne angabe auf den beim bauen eingesetzten stand zurück', () => {
    render(<BuildInfo />);

    // Der genaue Stand hängt vom Build ab – geprüft wird nur, dass er ankommt.
    expect(screen.getByText(/^Version \d+\.\d+\.\d+ · Commit /)).toBeInTheDocument();
  });
});
