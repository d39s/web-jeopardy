import { MAX_TEAMS_UI, MAX_TEAM_NAME_LENGTH } from '@jeopardy/game-core';
import { describe, expect, it } from 'vitest';
import { buildShareLink, buildShareQuery, parseShareParams } from './shareConfig';
import type { SharedConfig } from './shareConfig';

const basis: SharedConfig = {
  topicId: 'it-grundlagen',
  teamNames: ['Team A', 'Team B'],
  timerSeconds: 30,
};

/** Baut den Link und liest ihn sofort wieder ein. */
function rundlauf(config: SharedConfig): SharedConfig | null {
  const result = parseShareParams(`?${buildShareQuery(config)}`);
  return result.status === 'ok' ? result.config : null;
}

describe('teilen-link bauen', () => {
  it('schreibt thema, teams und bedenkzeit als lesbare parameter', () => {
    expect(buildShareQuery(basis)).toBe('thema=it-grundlagen&teams=Team%20A,Team%20B&timer=30');
  });

  it('lässt den timer weg, wenn ohne zeitbegrenzung gespielt wird', () => {
    expect(buildShareQuery({ ...basis, timerSeconds: null })).toBe(
      'thema=it-grundlagen&teams=Team%20A,Team%20B',
    );
  });

  it('hängt die parameter an die adresse und entfernt vorhandene query-teile', () => {
    expect(buildShareLink(basis, 'https://spiel.example/jeopardy/?alt=1#stelle')).toBe(
      'https://spiel.example/jeopardy/?thema=it-grundlagen&teams=Team%20A,Team%20B&timer=30',
    );
  });
});

describe('teilen-link lesen', () => {
  it('ergibt nach dem rundlauf dieselbe konfiguration', () => {
    expect(rundlauf(basis)).toEqual(basis);
  });

  it('überträgt umlaute und sonderzeichen in teamnamen unverändert', () => {
    const config: SharedConfig = {
      topicId: 'popkultur-90er',
      teamNames: ['Die Füchse & Co.', 'Über, Team', 'Grüße 100% 🎉', 'a+b=c?'],
      timerSeconds: 45,
    };

    expect(rundlauf(config)).toEqual(config);
  });

  it('erkennt eine adresse ohne teilen-parameter', () => {
    expect(parseShareParams('').status).toBe('none');
    expect(parseShareParams('?utm_source=mail').status).toBe('none');
  });

  it('ignoriert eine bedenkzeit, die nicht zur auswahl gehört', () => {
    const result = parseShareParams('?thema=it-grundlagen&timer=7');

    expect(result).toEqual({
      status: 'ok',
      config: { topicId: 'it-grundlagen', teamNames: [], timerSeconds: null },
    });
  });

  it('ignoriert eine unbrauchbare bedenkzeit', () => {
    const result = parseShareParams('?thema=it-grundlagen&timer=bald');

    expect(result.status === 'ok' && result.config.timerSeconds).toBeNull();
  });

  it('ignoriert eine themen-id mit unzulässigen zeichen', () => {
    const result = parseShareParams('?thema=..%2F..%2Fetc&teams=Adler');

    expect(result).toEqual({
      status: 'ok',
      config: { topicId: null, teamNames: ['Adler'], timerSeconds: null },
    });
  });

  it('begrenzt die teamanzahl auf die obergrenze der oberfläche', () => {
    const namen = Array.from({ length: MAX_TEAMS_UI + 4 }, (_, index) => `Team ${index + 1}`);
    const result = parseShareParams(`?thema=it-grundlagen&teams=${namen.join(',')}`);

    expect(result.status === 'ok' && result.config.teamNames).toHaveLength(MAX_TEAMS_UI);
  });

  it('verwirft leere namen zwischen den trennzeichen', () => {
    const result = parseShareParams('?teams=,Adler,,%20%20,Falken,');

    expect(result.status === 'ok' && result.config.teamNames).toEqual(['Adler', 'Falken']);
  });

  it('kürzt zu lange namen auf die erlaubte länge', () => {
    const result = parseShareParams(`?teams=${'x'.repeat(MAX_TEAM_NAME_LENGTH + 10)}`);

    expect(result.status === 'ok' && result.config.teamNames[0]).toHaveLength(MAX_TEAM_NAME_LENGTH);
  });

  it('übersteht kaputte prozentfolgen im link', () => {
    const result = parseShareParams('?thema=%E0%A4&teams=%E0%A4,Adler');

    expect(result).toEqual({
      status: 'ok',
      config: { topicId: null, teamNames: ['Adler'], timerSeconds: null },
    });
  });

  it('meldet einen link ohne verwertbare angaben als fehlerhaft', () => {
    expect(parseShareParams('?thema=&teams=').status).toBe('invalid');
    expect(parseShareParams('?timer=30').status).toBe('invalid');
  });
});
