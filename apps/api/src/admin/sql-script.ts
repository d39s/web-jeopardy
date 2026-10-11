/**
 * Zerlegt SQL-Skripte so weit, wie es für einen sicheren Testlauf nötig ist: Das Admin-Backend
 * steuert die Transaktion selbst. Ein eigenes BEGIN am Anfang und COMMIT am Ende (wie in den
 * Lieferungen unter content/sql/) werden ausgeblendet, jede andere Transaktionssteuerung wird
 * abgelehnt – sonst könnte ein COMMIT mitten im Skript einen Testlauf festschreiben.
 */

export class SqlScriptError extends Error {
  constructor(
    message: string,
    readonly line: number,
    readonly column: number,
  ) {
    super(message);
  }
}

export interface SqlStatement {
  /** Bereich im Originaltext inklusive abschließendem Semikolon. */
  start: number;
  end: number;
  /** Erstes Zeichen nach Leerraum und Kommentaren. */
  codeStart: number;
  /** Anweisung ohne Kommentare; Literale bleiben erhalten. */
  code: string;
}

const identifierChar = /[\w$\u0080-￿]/;
const dollarTag = /\$(?:[A-Za-z_\u0080-￿][\w\u0080-￿]*)?\$/y;

export function position(sql: string, offset: number): { line: number; column: number } {
  const before = sql.slice(0, offset);
  const lineStart = before.lastIndexOf('\n') + 1;
  return { line: before.split('\n').length, column: offset - lineStart + 1 };
}

function unterminated(sql: string, offset: number, what: string): SqlScriptError {
  const { line, column } = position(sql, offset);
  return new SqlScriptError(`${what} ist nicht abgeschlossen.`, line, column);
}

/** Trennt an Semikolons außerhalb von Kommentaren, Zeichenketten und Dollar-Quotes. */
export function splitStatements(sql: string): SqlStatement[] {
  const statements: SqlStatement[] = [];
  let start = 0;
  let codeStart = -1;
  let code = '';
  let i = 0;
  const append = (text: string, at: number) => {
    if (codeStart === -1 && text.trim()) codeStart = at;
    code += text;
  };
  const finish = (end: number) => {
    if (codeStart !== -1) statements.push({ start, end, codeStart, code: code.trim() });
    start = end;
    codeStart = -1;
    code = '';
  };
  while (i < sql.length) {
    const char = sql[i]!;
    const next = sql[i + 1];
    if (char === '-' && next === '-') {
      const newline = sql.indexOf('\n', i);
      i = newline === -1 ? sql.length : newline;
      code += ' ';
    } else if (char === '/' && next === '*') {
      // PostgreSQL erlaubt verschachtelte Blockkommentare.
      let depth = 1;
      let j = i + 2;
      while (j < sql.length && depth > 0) {
        if (sql.startsWith('/*', j)) {
          depth++;
          j += 2;
        } else if (sql.startsWith('*/', j)) {
          depth--;
          j += 2;
        } else j++;
      }
      if (depth > 0) throw unterminated(sql, i, 'Kommentar');
      i = j;
      code += ' ';
    } else if (char === "'" || char === '"') {
      const previous = sql[i - 1];
      const escapes =
        char === "'" &&
        (previous === 'e' || previous === 'E') &&
        !identifierChar.test(sql[i - 2] ?? '');
      let j = i + 1;
      for (;;) {
        if (j >= sql.length) throw unterminated(sql, i, 'Zeichenkette');
        if (escapes && sql[j] === '\\') j += 2;
        else if (sql[j] === char && sql[j + 1] === char) j += 2;
        else if (sql[j] === char) break;
        else j++;
      }
      append(sql.slice(i, j + 1), i);
      i = j + 1;
    } else if (char === '$' && !identifierChar.test(sql[i - 1] ?? '')) {
      dollarTag.lastIndex = i;
      const tag = dollarTag.exec(sql)?.[0];
      if (tag) {
        const close = sql.indexOf(tag, i + tag.length);
        if (close === -1) throw unterminated(sql, i, 'Dollar-Quote');
        append(sql.slice(i, close + tag.length), i);
        i = close + tag.length;
      } else {
        append(char, i);
        i++;
      }
    } else if (char === ';') {
      i++;
      finish(i);
    } else {
      append(char, i);
      i++;
    }
  }
  finish(sql.length);
  return statements;
}

function keywords(code: string): string[] {
  return (/^[A-Za-z_]+(?:\s+[A-Za-z_]+){0,2}/.exec(code)?.[0] ?? '').toUpperCase().split(/\s+/);
}

function isTransactionControl(code: string): boolean {
  const [first, second] = keywords(code);
  if (first === 'ROLLBACK') return second !== 'TO';
  if (first === 'START') return second === 'TRANSACTION';
  if (first === 'PREPARE') return second === 'TRANSACTION';
  return ['BEGIN', 'COMMIT', 'END', 'ABORT'].includes(first ?? '');
}

function isOuterBegin(code: string): boolean {
  const [first, second] = keywords(code);
  return first === 'BEGIN' || (first === 'START' && second === 'TRANSACTION');
}

function isOuterCommit(code: string): boolean {
  return /^(?:COMMIT|END)(?:\s+(?:WORK|TRANSACTION))?$/i.test(code);
}

/** Überschreibt einen Bereich mit Leerzeichen; Zeilenumbrüche bleiben für Fehlerpositionen. */
function blank(sql: string, { start, end }: SqlStatement): string {
  return sql.slice(0, start) + sql.slice(start, end).replace(/[^\r\n]/g, ' ') + sql.slice(end);
}

export interface PreparedScript {
  /** Gleich lang wie das Original, damit Fehlerpositionen der Datenbank passen. */
  body: string;
  statements: number;
}

export function prepareScript(sql: string): PreparedScript {
  const statements = splitStatements(sql);
  let body = sql;
  const first = statements[0];
  const last = statements.at(-1);
  if (first && isOuterBegin(first.code)) {
    body = blank(body, first);
    statements.shift();
  }
  if (last && last !== first && isOuterCommit(last.code)) {
    body = blank(body, last);
    statements.pop();
  }
  const control = statements.find((statement) => isTransactionControl(statement.code));
  if (control) {
    const { line, column } = position(sql, control.codeStart);
    throw new SqlScriptError(
      `Transaktionssteuerung ist nur als BEGIN am Anfang und COMMIT am Ende erlaubt: ${keywords(control.code).join(' ')}`,
      line,
      column,
    );
  }
  if (statements.length === 0)
    throw new SqlScriptError('Das Skript enthält keine Anweisungen.', 1, 1);
  return { body, statements: statements.length };
}
