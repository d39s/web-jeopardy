# ADR 0002 – Technologie-Stack

Status: angenommen · Datum: 2026-08-16

## Kontext

Die Anforderung nennt ein „modernes CSS-/JavaScript-Framework", einen späteren Online-Modus
und die Auslieferung über einen Docker-Container. Der Stack muss außerdem paralleles
Arbeiten mehrerer Personen tragen.

## Entscheidung

React 19 mit Vite und TypeScript im strict-Modus, Tailwind CSS v4 mit CSS-first-Tokens, Zod
für Laufzeitvalidierung, React Router für zwei Routen, Vitest und Playwright für Tests,
alles in einem Monorepo aus `apps/web` und `packages/game-core`.

Verworfen: SvelteKit und Nuxt (SSR bringt für eine Moderator-Oberfläche keinen Nutzen),
Next.js (koppelt die Spiellogik an das Framework, während ein schlanker WebSocket-Server für
Buzzer besser passt), Vanilla JS (widerspricht der Vorgabe und erschwert Parallelarbeit).

### Drei umgebungsbedingte Abweichungen vom Konzept

| Konzept            | Umsetzung          | Grund                                                                                                                                                                                                       |
| ------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pnpm über corepack | **npm-Workspaces** | corepack ist nicht mehr Teil von Node 25; ein global installiertes Werkzeug soll nicht vorausgesetzt werden. npm-Workspaces leisten dasselbe, `package-lock.json` sorgt für reproduzierbare Installationen. |
| TypeScript 7       | **TypeScript 5.9** | `typescript-eslint` unterstützt derzeit nur `<6.1`; mit TypeScript 7 fällt die typbewusste Linterprüfung aus.                                                                                               |
| ESLint 10          | **ESLint 9**       | `eslint-plugin-jsx-a11y` deklariert Kompatibilität nur bis ESLint 9.                                                                                                                                        |

## Konsequenzen

- `packages/game-core` hat außer Zod keine Laufzeitabhängigkeit und ist damit auch in Node
  lauffähig – Voraussetzung für den Phase-2-Server.
- Die Auflösung `@jeopardy/game-core` läuft über npm-Workspaces plus einen Vite-Alias und
  TypeScript-`paths`; ein Build-Schritt für das Paket entfällt, es wird direkt aus dem
  Quelltext eingebunden.
- Die drei Abweichungen sind bei künftigen Aktualisierungen zu prüfen: Sobald
  `eslint-plugin-jsx-a11y` ESLint 10 unterstützt und `typescript-eslint` TypeScript 7,
  können beide nachgezogen werden.
