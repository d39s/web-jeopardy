import { MAX_TEAMS_UI, MAX_TEAM_NAME_LENGTH } from '@jeopardy/game-core';
import { describe, expect, it } from 'vitest';
import { buildShareLink, buildShareQuery, parseShareParams } from './shareConfig';
import type { SharedConfig } from './shareConfig';

const basis: SharedConfig = {
  categoryId: 'it',
  level: 3,
  seed: 4711,
  teamNames: ['Team A', 'Team B'],
  timerSeconds: 30,
  vetoSeconds: null,
  wrongPenalty: 'full' as const,
};

/** 4711 zur Basis 36 – die Kurzform, die im Link steht. */
const ZIEHUNG = '3mv';

/** Konfiguration ohne Kategorie: nur Teams, wie ein Link ohne Thema sie liefert. */
const ohneKategorie: SharedConfig = {
  categoryId: null,
  level: null,
  seed: null,
  teamNames: [],
  timerSeconds: null,
  vetoSeconds: null,
  wrongPenalty: 'full' as const,
};

/** Baut den Link und liest ihn sofort wieder ein. */
function rundlauf(config: SharedConfig): SharedConfig | null {
  const result = parseShareParams(`?${buildShareQuery(config)}`);
  return result.status === 'ok' ? result.config : null;
}

describe('teilen-link bauen', () => {
  it('schreibt kategorie, stufe, ziehung, teams und bedenkzeit als lesbare parameter', () => {
    expect(buildShareQuery(basis)).toBe(
      `kategorie=it&stufe=3&ziehung=${ZIEHUNG}&teams=Team%20A,Team%20B&timer=30`,
    );
  });

  it('lässt den timer weg, wenn ohne zeitbegrenzung gespielt wird', () => {
    expect(buildShareQuery({ ...basis, timerSeconds: null })).toBe(
      `kategorie=it&stufe=3&ziehung=${ZIEHUNG}&teams=Team%20A,Team%20B`,
    );
  });

  it('lässt stufe und ziehung weg, solange keine kategorie feststeht', () => {
    const query = buildShareQuery({ ...basis, categoryId: null });

    expect(query).not.toContain('stufe');
    expect(query).not.toContain('ziehung');
    expect(query).toBe('teams=Team%20A,Team%20B&timer=30');
  });

  it('hängt die parameter an die adresse und entfernt vorhandene query-teile', () => {
    expect(buildShareLink(basis, 'https://spiel.example/jeopardy/?alt=1#stelle')).toBe(
      `https://spiel.example/jeopardy/?kategorie=it&stufe=3&ziehung=${ZIEHUNG}` +
        '&teams=Team%20A,Team%20B&timer=30',
    );
  });
});

describe('teilen-link lesen', () => {
  it('ergibt nach dem rundlauf dieselbe konfiguration', () => {
    expect(rundlauf(basis)).toEqual(basis);
  });

  it('überträgt jede stufe und jede ziehungsnummer verlustfrei', () => {
    for (const level of [1, 2, 3, 4, 5] as const) {
      for (const seed of [0, 1, 999999, 0xffffffff]) {
        expect(rundlauf({ ...basis, level, seed })).toEqual({ ...basis, level, seed });
      }
    }
  });

  it('überträgt umlaute und sonderzeichen in teamnamen unverändert', () => {
    const config: SharedConfig = {
      ...basis,
      categoryId: 'popkultur',
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
    const result = parseShareParams('?kategorie=it&timer=7');

    expect(result).toEqual({
      status: 'ok',
      config: { ...ohneKategorie, categoryId: 'it' },
    });
  });

  it('ignoriert eine unbrauchbare bedenkzeit', () => {
    const result = parseShareParams('?kategorie=it&timer=bald');

    expect(result.status === 'ok' && result.config.timerSeconds).toBeNull();
  });

  it('ignoriert eine stufe außerhalb der skala', () => {
    for (const stufe of ['0', '6', '2.5', 'schwer', '']) {
      const result = parseShareParams(`?kategorie=it&stufe=${stufe}`);
      expect(result.status === 'ok' && result.config.level).toBeNull();
    }
  });

  it('ignoriert eine unbrauchbare ziehungsnummer', () => {
    for (const ziehung of ['', '-1', 'zzzzzzzz', 'ü']) {
      const result = parseShareParams(`?kategorie=it&ziehung=${ziehung}`);
      expect(result.status === 'ok' && result.config.seed).toBeNull();
    }
  });

  it('ignoriert eine kategorie-id mit unzulässigen zeichen', () => {
    const result = parseShareParams('?kategorie=..%2F..%2Fetc&teams=Adler');

    expect(result).toEqual({
      status: 'ok',
      config: { ...ohneKategorie, teamNames: ['Adler'] },
    });
  });

  it('begrenzt die teamanzahl auf die obergrenze der oberfläche', () => {
    const namen = Array.from({ length: MAX_TEAMS_UI + 4 }, (_, index) => `Team ${index + 1}`);
    const result = parseShareParams(`?kategorie=it&teams=${namen.join(',')}`);

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
    const result = parseShareParams('?kategorie=%E0%A4&teams=%E0%A4,Adler');

    expect(result).toEqual({
      status: 'ok',
      config: { ...ohneKategorie, teamNames: ['Adler'] },
    });
  });

  it('meldet einen link ohne verwertbare angaben als fehlerhaft', () => {
    expect(parseShareParams('?kategorie=&teams=').status).toBe('invalid');
    expect(parseShareParams('?timer=30').status).toBe('invalid');
    expect(parseShareParams('?stufe=3&ziehung=3mv').status).toBe('invalid');
  });
});

describe('veto-zeit im link', () => {
  it('lässt die kopplung weg und liest sie als kopplung zurück', () => {
    const query = buildShareQuery(basis);

    expect(query).not.toContain('vetozeit');
    expect(rundlauf(basis)).toEqual(basis);
  });

  it('schreibt eine eigene veto-zeit hinter die bedenkzeit', () => {
    const config: SharedConfig = { ...basis, vetoSeconds: 20 };

    expect(buildShareQuery(config)).toBe(
      `kategorie=it&stufe=3&ziehung=${ZIEHUNG}&teams=Team%20A,Team%20B&timer=30&vetozeit=20`,
    );
    expect(rundlauf(config)).toEqual(config);
  });

  it('ignoriert eine veto-zeit, die nicht zur auswahl gehört', () => {
    const result = parseShareParams('?kategorie=it&timer=30&vetozeit=7');

    expect(result.status === 'ok' && result.config.vetoSeconds).toBeNull();
  });

  it('ignoriert eine unbrauchbare veto-zeit', () => {
    const kaputt = parseShareParams('?kategorie=it&vetozeit=gleich');
    const leer = parseShareParams('?kategorie=it&vetozeit=');

    expect(kaputt.status === 'ok' && kaputt.config.vetoSeconds).toBeNull();
    expect(leer.status === 'ok' && leer.config.vetoSeconds).toBeNull();
  });

  it('reicht allein nicht für einen brauchbaren link', () => {
    expect(parseShareParams('?vetozeit=20').status).toBe('invalid');
  });
});

describe('abzugsregel im link', () => {
  it('lässt den standard weg und ergänzt ihn beim lesen', () => {
    const query = buildShareQuery({ ...basis, wrongPenalty: 'full' });

    expect(query).not.toContain('abzug');
    expect(parseShareParams(`?${query}`)).toEqual({
      status: 'ok',
      config: { ...basis, wrongPenalty: 'full' },
    });
  });

  it('überträgt die halbe und die abgeschaltete regel', () => {
    const halb = { ...basis, wrongPenalty: 'half' as const };
    const keiner = { ...basis, wrongPenalty: 'none' as const };

    expect(buildShareQuery(halb)).toContain('abzug=halb');
    expect(parseShareParams(`?${buildShareQuery(halb)}`)).toEqual({ status: 'ok', config: halb });

    expect(buildShareQuery(keiner)).toContain('abzug=0');
    expect(parseShareParams(`?${buildShareQuery(keiner)}`)).toEqual({
      status: 'ok',
      config: keiner,
    });
  });

  it('nimmt bei fehlender oder unlesbarer angabe den vollen abzug an', () => {
    const ohne = parseShareParams('?kategorie=it');
    const kaputt = parseShareParams('?kategorie=it&abzug=vielleicht');

    expect(ohne.status === 'ok' && ohne.config.wrongPenalty).toBe('full');
    expect(kaputt.status === 'ok' && kaputt.config.wrongPenalty).toBe('full');
  });
});
