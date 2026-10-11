import { describe, expect, it } from 'vitest';
import { position, prepareScript, splitStatements, SqlScriptError } from './sql-script';

function error(sql: string): SqlScriptError {
  try {
    prepareScript(sql);
  } catch (caught) {
    if (caught instanceof SqlScriptError) return caught;
    throw caught;
  }
  throw new Error('Kein Fehler geworfen.');
}

describe('SQL-Skripte', () => {
  it('trennt nur an Semikolons außerhalb von Literalen, Kommentaren und Dollar-Quotes', () => {
    const sql = [
      "INSERT INTO t VALUES ('a;b', 'O''Brien;');",
      '-- Kommentar; mit Semikolon',
      '/* Block; /* verschachtelt; */ weiter; */',
      'SELECT "Spalte;Name" FROM t;',
      "SELECT E'Back\\'slash;';",
      "DO $$ BEGIN RAISE NOTICE 'x;'; COMMIT; END $$;",
      'DO $body$ BEGIN END $body$;',
      'SELECT a$b FROM t',
    ].join('\n');
    expect(splitStatements(sql).map((statement) => statement.code.split(/\s+/)[0])).toEqual([
      'INSERT',
      'SELECT',
      'SELECT',
      'DO',
      'DO',
      'SELECT',
    ]);
  });

  it('blendet äußeres BEGIN und COMMIT aus und erhält Länge und Zeilen', () => {
    const sql = '-- Lieferung\nBEGIN;\nSELECT 1;\nINSERT INTO t VALUES (1);\nCOMMIT;\n';
    const script = prepareScript(sql);
    expect(script.statements).toBe(2);
    expect(script.body).toHaveLength(sql.length);
    expect(script.body.split('\n')).toHaveLength(sql.split('\n').length);
    expect(script.body).not.toMatch(/BEGIN|COMMIT/);
    expect(script.body).toContain('SELECT 1;');
    expect(prepareScript('START TRANSACTION; SELECT 1; END;').statements).toBe(1);
    expect(prepareScript('SELECT 1').body).toBe('SELECT 1');
  });

  it('lehnt Transaktionssteuerung mitten im Skript mit Zeilenangabe ab', () => {
    for (const [sql, line] of [
      ['BEGIN;\nSELECT 1;\nCOMMIT;\nSELECT 2;', 3],
      ['SELECT 1;\n  rollback;', 2],
      ['SELECT 1;\n/* x */ BEGIN;\nSELECT 2;', 2],
      ['SELECT 1; ABORT;', 1],
      ["BEGIN; PREPARE TRANSACTION 'x';", 1],
      ['BEGIN;\nSELECT 1;\nCOMMIT AND CHAIN;', 3],
    ] as const) {
      expect(error(sql)).toMatchObject({ line });
    }
    expect(error('SELECT 1;\n\n  COMMIT;\nSELECT 2;')).toMatchObject({ line: 3, column: 3 });
    expect(prepareScript('SAVEPOINT a; SELECT 1; ROLLBACK TO SAVEPOINT a;').statements).toBe(3);
  });

  it('meldet leere und nicht abgeschlossene Skripte', () => {
    expect(error('BEGIN;\n-- nur Kommentar\nCOMMIT;').message).toContain('keine Anweisungen');
    expect(error("SELECT 'offen")).toMatchObject({ line: 1, column: 8 });
    expect(error('SELECT 1;\nDO $$ BEGIN').message).toContain('Dollar-Quote');
    expect(error('/* offen').message).toContain('Kommentar');
  });

  it('rechnet Zeichenpositionen in Zeile und Spalte um', () => {
    expect(position('ab\ncd\nef', 4)).toEqual({ line: 2, column: 2 });
    expect(position('abc', 0)).toEqual({ line: 1, column: 1 });
  });
});
