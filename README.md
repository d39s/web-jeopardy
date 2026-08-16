# Web-Jeopardy

Jeopardy-Spiel für Moderation über Beamer oder Screenshare: Startseite mit Team- und
Themenauswahl, 5×5-Spielfeld, Frage-Popup mit Punktevergabe. Später ist ein Online-Modus
vorgesehen; die Auslieferung erfolgt als Docker-Container.

- [Technisches Konzept](docs/technisches-konzept.md)
- [Arbeitsplan & Subtasks](docs/arbeitsplan.md)

## Schnellstart

```bash
npm install
npm run dev          # http://localhost:5173
```

## Skripte

| Befehl                     | Zweck                                        |
| -------------------------- | -------------------------------------------- |
| `npm run dev`              | Entwicklungsserver                           |
| `npm run build`            | Produktions-Build nach `apps/web/dist`       |
| `npm run preview`          | Gebautes Ergebnis lokal ausliefern           |
| `npm run lint`             | ESLint über das gesamte Monorepo             |
| `npm run typecheck`        | TypeScript-Prüfung aller Projekte            |
| `npm test`                 | Unit- und Komponententests (Vitest)          |
| `npm run test:coverage`    | Tests mit Coverage-Schwellen für `game-core` |
| `npm run test:e2e`         | End-to-End-Tests (Playwright)                |
| `npm run validate:content` | Prüft alle Fragensets in `content/topics`    |

## Betrieb im Container

```bash
docker compose up --build     # http://localhost:8080
```

Das Image baut die Anwendung und liefert sie über nginx aus (rund 62 MB). Besonderheiten:

- **Fragensets ohne neues Image:** `content/topics` ist als Volume eingebunden. Neue oder
  geänderte JSON-Dateien wirken nach einem Neuladen der Seite, ein Rebuild ist nicht nötig.
- **Verlaufsadressen:** unbekannte Pfade beantwortet `index.html`, `/game` funktioniert also
  auch beim direkten Aufruf.
- **Zwischenspeicher:** gehashte Dateien in `/assets` werden dauerhaft gecacht,
  `index.html`, `/topics/*` und `/config.json` bewusst nicht.
- **Laufzeitkonfiguration:** Der Einstiegspunkt schreibt `config.json` aus Umgebungsvariablen
  (derzeit `JEOPARDY_WS_URL` als Platzhalter für den späteren Online-Modus), sodass dasselbe
  Image in mehreren Umgebungen läuft.

## Projektstruktur

```
apps/web/           Oberfläche (React, Vite, Tailwind)
packages/game-core/ Spiellogik ohne Framework-Bezug (Typen, Schemas, Reducer)
content/topics/     Fragensets als JSON
docker/             Dockerfile, nginx-Konfiguration, Compose
docs/               Konzept, Arbeitsplan, ADRs
e2e/                End-to-End-Tests
```

## Mitarbeiten

Verbindliche Commit-Regeln und Best Practices stehen in
[docs/arbeitsplan.md](docs/arbeitsplan.md) (Kapitel 6 und 7). Kurzfassung: Conventional
Commits, kleine Commits, `main` bleibt jederzeit grün.
