# Web-Jeopardy

Jeopardy-Spiel für Moderation über Beamer oder Screenshare: Startseite mit Team- und
Themenauswahl, 5×5-Spielfeld, Frage-Popup mit Punktevergabe. Später ist ein Online-Modus
vorgesehen; die Auslieferung erfolgt als Docker-Container.

- [Technisches Konzept](docs/technisches-konzept.md) – Architektur, Datenmodell, Design, Betrieb
- [Arbeitsplan & Subtasks](docs/arbeitsplan.md) – Aufgabenschnitt, Commit-Regeln, Umsetzungsstand
- [Fragensets anlegen](content/README.md) – Aufbau und Regeln der JSON-Dateien
- Architekturentscheidungen: [Schnittstellen-Vertrag](docs/adr/0001-schnittstellen-vertrag.md) ·
  [Technologie-Stack](docs/adr/0002-technologie-stack.md) ·
  [Transport-Naht](docs/adr/0003-transport-naht.md) ·
  [Auslieferung im Container](docs/adr/0004-auslieferung-im-container.md)

## Spielablauf

Startseite: Teams festlegen (ein Team genügt – dann läuft das Spiel als Übungsmodus ohne
Ranking) und Thema wählen, entweder aus den mitgelieferten Fragensets oder als eigene
JSON-Datei. Auf dem Spielfeld öffnet ein Klick auf eine Karte die Frage; die Musterlösung und
die Punktebuttons erscheinen erst nach „Antwort anzeigen". Erst ein Punktebutton wertet die
Frage – dann wird die Karte grau. Punkte werden addiert oder abgezogen und fallen nie unter
null. Teamnamen lassen sich jederzeit oben ändern, die Punktebuttons übernehmen den Namen
sofort. Ein laufendes Spiel übersteht das Schließen des Browsers.

## Schnellstart

```bash
npm install
npm run dev          # http://localhost:5173
```

## Skripte

| Befehl                     | Zweck                                           |
| -------------------------- | ----------------------------------------------- |
| `npm run dev`              | Entwicklungsserver                              |
| `npm run build`            | Produktions-Build nach `apps/web/dist`          |
| `npm run preview`          | Gebautes Ergebnis lokal ausliefern              |
| `npm run lint`             | ESLint über das gesamte Monorepo                |
| `npm run typecheck`        | TypeScript-Prüfung aller Projekte               |
| `npm test`                 | Unit- und Komponententests (Vitest)             |
| `npm run test:coverage`    | Tests mit Coverage-Schwellen für `game-core`    |
| `npm run test:junit`       | Wie oben, zusätzlich JUnit-Bericht für CI       |
| `npm run test:e2e`         | End-to-End-Tests (Playwright)                   |
| `npm run validate:content` | Prüft alle Fragensets in `content/topics`       |
| `npm run build:info`       | Commit und Datum für die Fußzeile bereitstellen |

## Continuous Integration

Gebaut und geprüft wird auf **jenkins.d39s.de**; die Pipeline steht im `Jenkinsfile` und nutzt
die gemeinsame [jenkins-library](https://jenkins.d39s.de). Zwei Stufen:

1. **Prüfen** im `playwright`-Pod: `npm ci`, Formatprüfung, Lint, Typecheck, Fragensets,
   Unit- und Komponententests, End-to-End-Tests. Die Testberichte entstehen als JUnit unter
   `reports/` und laufen über `publishChecks`/`withChecks` als GitHub-Check zurück; der
   Playwright-Bericht wird als Artefakt gesichert.
2. **Image bauen** im `kaniko`-Pod über den Library-Schritt `kaniko`. Gebaut wird
   `docker/Dockerfile` mit dem Repository-Wurzelverzeichnis als Kontext, das Ergebnis landet
   in `harbor.d39s.de/library/web-jeopardy`. Davor schreibt die Stufe Commit und Baudatum
   nach `apps/web/.env.production` – im Kontext liegt kein `.git`, sonst bliebe die Fußzeile
   der Startseite ohne Commit.

Die Tags vergibt die Library: `br-<zweig>` auf Zweigen, `pr-<nummer>` bei Pull Requests,
`latest` auf dem Hauptzweig und Versionsnummern aus Git-Tags. Gibt es kein Ziel, baut kaniko
mit `--no-push` – der Build wird also auch dort geprüft, wo nichts veröffentlicht wird.

Eine GitHub-Action gibt es nicht mehr; Jenkins meldet die Ergebnisse als Check nach GitHub
zurück.

## Betrieb im Container

```bash
npm run build:info            # Commit und Datum für die Fußzeile, siehe Versionierung
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

## Versionierung

Unten auf der Startseite steht, welcher Stand gerade läuft:

```
Version 0.1.0 · Commit d186d11 · Stand 09.09.2026
```

So ist auf jedem Beamer und in jedem Screenshot ablesbar, welches Build zu sehen ist.

Maßgeblich ist die `version` in der `package.json` im Wurzelverzeichnis. **Jede weitere
Änderung und jedes Release folgt [Semantic Versioning](https://semver.org/lang/de/)** –
`MAJOR.MINOR.PATCH`:

| Stufe     | Wann sie steigt                                                            |
| --------- | -------------------------------------------------------------------------- |
| **MAJOR** | Bruch am Verhalten oder an den Daten, etwa ein neues Schema für Fragensets |
| **MINOR** | Neue Funktion, abwärtskompatibel                                           |
| **PATCH** | Fehlerbehebung ohne neue Funktion                                          |

Solange die Version bei `0.x` steht, gilt die Vorabphase: Funktionen und Brüche gehen in
MINOR, Korrekturen in PATCH. Die Version wandert nicht mit jedem Commit, sondern mit dem
Release. Ein Release setzt alle Arbeitsbereiche gemeinsam und legt das Git-Tag an, aus dem
die Pipeline die Image-Tags ableitet:

```bash
npm version minor --workspaces --include-workspace-root
git push --follow-tags
```

Commit und Datum kommen aus dem Build, nicht aus dem Quelltext:

- **Lokal** (`npm run dev`, `npm run build`) liest Vite den kurzen Commit-Hash direkt aus
  dem Arbeitsverzeichnis; als Datum gilt der Zeitpunkt des Builds.
- **Im Container** gibt es kein `.git` (siehe `.dockerignore`). Dort liefert
  `npm run build:info` die Angaben vorab als `apps/web/.env.production`; die Jenkins-Pipeline
  schreibt dieselbe Datei aus `GIT_COMMIT`. Fehlt sie, steht in der Fußzeile
  `Commit unbekannt`.

## Mitarbeiten

Verbindliche Commit-Regeln und Best Practices stehen in
[docs/arbeitsplan.md](docs/arbeitsplan.md) (Kapitel 6 und 7). Kurzfassung: Conventional
Commits, kleine Commits, `main` bleibt jederzeit grün, Releases nach SemVer.
