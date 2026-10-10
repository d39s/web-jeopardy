# Web-Jeopardy: SQL-Inhalte für Agents erstellen

Stand: 10.10.2026. Neue Kategorien, Spalten und Fragen werden standardmäßig als
**ergänzende PostgreSQL-SQL-Dateien** geliefert. Der Betreiber prüft und importiert sie
später selbst, z. B. im pgAdmin Query Tool. Keine zusätzliche Importanwendung erforderlich.

## Repo-Skill

[create-jeopardy-questions](../.github/skills/create-jeopardy-questions/SKILL.md) ist der
wiederverwendbare Agent-Skill. Aufruf in unterstützten Editoren:
`/create-jeopardy-questions`, z. B. „Erstelle eine Kategorie Astronomie mit sechs Rubriken
und je neun Fragen, eine je Schwierigkeitsstufe.“

Die [SQL-Vorlage](../.github/skills/create-jeopardy-questions/assets/add-content.sql) enthält
Transaktion, Eingabeblöcke, Konfliktprüfung und append-only Einfügungen. Ohne echte
Eingabedaten bricht die Vorlage absichtlich ab. Eine Prüfung in einer isolierten Test-DB
ist möglich; **kein Import in die Anwendungsdatenbank ohne gesonderten Auftrag**.

## 1. Lieferung und Dateiformat

- UTF-8, PostgreSQL-Syntax, explizite Feldlisten, Semikolons; keine Markdown-Codezäune.
- SQL unter `content/sql/<datum>-<kategorie-id>-<zweck>.sql`.
- Begleitbericht mit gleichem Namen und `.md`: Umfang, Quellen, Prüfergebnisse, offene Fragen.
- Keine Zugangsdaten, Secrets oder DB-Dumps in den Dateien.
- Keine bestehenden Lieferungen überschreiben; keine vorhandenen Inhalte löschen/ersetzen.

Das Verzeichnis wird **nicht automatisch importiert**, weder bei API-Start noch Deployment.
Die Dateien sind keine Migrationen und gehören nicht unter `apps/api/migrations`.
Neue SQL-Inhalte benötigen keinen JSON-Pool oder Indexeintrag: Der Laufzeitindex kommt aus
`topics`. `content/topics` bleibt der bisherige JSON-Initialbestand.

## 2. Begriffe, Tabellen und Felder

**Themenkategorie → Rubrik/Spalte → Frage.** Das Spiel zieht fünf Rubriken als Spalten
mit je fünf Fragen. Die Lieferung erweitert den Vorrat, nicht ein einzelnes fertiges Brett.

| Tabelle     | Schlüssel / Beziehung                                                  | Felder                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `topics`    | PK `id`                                                                | `id`, `title`, `description`, `author`, `locale`, `position`                                                                           |
| `rubrics`   | PK `(topic_id, id)`, `topic_id` → `topics.id`                          | `topic_id`, `id`, `name`, `color`, `position`                                                                                          |
| `questions` | PK `(topic_id, id)`, `(topic_id, rubric_id)` → `rubrics(topic_id, id)` | `topic_id`, `rubric_id`, `id`, `level`, `source_level`, `difficulty_score`, `question`, `answer`, `note`, `position`, Bewertungszähler |

Nicht beschreiben oder ändern: `difficulty_votes` (Historie), `content_imports`
(Initialisierungsmarker) und `schema_migrations` (technischer Migrationsstand).

### Pflichtfelder und Limits

| Inhalt           | Regeln                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Kategorie        | `id`, `title` (1–80 Zeichen), `position` erforderlich                                                                     |
| Rubrik           | `topic_id`, `id`, `name` (1–40 Zeichen), `position` erforderlich                                                          |
| Frage            | `topic_id`, `rubric_id`, `id`, `level`, `source_level`, `difficulty_score`, `question`, `answer`, `position` erforderlich |
| IDs              | 1–64 Zeichen, kleine ASCII-Buchstaben/Ziffern/Bindestriche; `^[a-z0-9][a-z0-9-]*$`                                        |
| Frage / Antwort  | Je 1–500 Zeichen, getrimmt, nicht leer                                                                                    |
| Optionale Felder | Beschreibung max. 300, Autor max. 80, Locale max. 20, Notiz max. 500 Zeichen; `NULL` erlaubt                              |
| Farbe            | `NULL` oder `#2EC4B6`, `#FF7F50`, `#B388EB`, `#7AE582`, `#FFD166`                                                         |

Für deutsche Kategorien `locale = 'de-DE'`. Farben normalerweise `NULL` lassen.
Moderationshinweise und akzeptierte Antwortvarianten gehören in `note`.
Apostrophe in SQL escapen: `O'Brien` als `'O''Brien'`; `NULL` nicht als String schreiben.

## 3. Sicherheit, IDs und Wiederholung

- Eine Transaktion: `BEGIN` bis `COMMIT`; Fehler brechen die gesamte Übernahme ab.
- Nur `INSERT`: **kein `UPDATE`, `DELETE`, `DROP`, `TRUNCATE`, `ALTER` oder Score-Reset**.
  Temporäre Eingabetabellen mit `ON COMMIT DROP` sind erlaubt.
- Advisory-Lock `pg_advisory_xact_lock(391002)` wie bestehender Import/Ratingzugriffe;
  Schreiblocks für die Inhalts-Tabellen verhindern konkurrierende Positionsberechnung.
- Stabile Kategorie-IDs global eindeutig; Rubrik- und Frage-IDs **gemeinsam pro Kategorie**
  eindeutig. Bestandskenntnis ist für die Inhaltserstellung nicht vorausgesetzt;
  tatsächliche ID-Konflikte prüft die SQL-Datei erst bei der Übernahme.
- Ohne Bestandskenntnis neue Frage-IDs mit einmaliger zufälliger Lieferungskennung erstellen,
  z. B. Rubrikprefix + UUID ohne Bindestriche + Nummer, insgesamt maximal 64 Zeichen.
  Ein Datum allein verhindert keine Kollision zwischen unabhängigen Agents. Dieselbe Lieferung verwendet
  bei Wiederholung dieselben IDs. Eine ID darf nicht für andere Inhalte wiederverwendet werden.
- Kategorien zuerst, dann Rubriken, dann Fragen einfügen. Vorhandene Eltern direkt über
  IDs referenzieren, ohne ihre Metadaten zu ändern; sie müssen im Zielbestand existieren.
- Konfliktziele: `topics(id)`, `rubrics(topic_id,id)`, `questions(topic_id,id)`.
  Identische vorhandene Inhalte per `ON CONFLICT ... DO NOTHING` überspringen.
  **Gleiche ID mit anderem Inhalt muss abbrechen**, nicht still ignorieren.
- `position` ist nullbasiert: Themen insgesamt, Rubriken pro Thema, Fragen pro Rubrik.
  Neue IDs am Ende anhängen. Vorhandene Positionen nicht verändern; nur neue IDs nummerieren.

Die Skill-Vorlage setzt diese Regeln um. Sie ist bewusst mehr als rohe Inserts, damit
erneutes Ausführen bestehende Ratings nicht überschreibt und IDs nicht still kollidieren.

## 4. Ausgangsschwierigkeit und Bewertungen

Für **jede neue Frage**: `level = source_level = difficulty_score = Ausgangsstufe`,
ganzzahlig **1–9**. `fits_votes`, `too_hard_votes`, `too_easy_votes`, `unsure_votes` starten
bei **0** (Zähler haben SQL-Defaults, `source_level`/`difficulty_score` nicht).

Orientierung: 1 allgemein bekannt, 2 breites Publikum, 3 Allgemeinbildung, 4 Interesse hilft,
5 Vorwissen, 6 solide Fachkenntnis, 7 Detailwissen, 8 Spezialwissen, 9 anspruchsvoll für Kenner.
Keine Punkte 100–500 in Fragen schreiben; die entstehen erst aus der Spielzeile.

Nutzerbewertungen ändern später den Score um ±0,2; „Schwierigkeit passt“ lässt ihn unverändert.
Das Spiel verwendet die gerundete Stufe in `questions.level`; `source_level` bleibt die
redaktionelle Ausgangsstufe. Vorhandene Scores/Zähler/Historien niemals aus Lieferdateien ändern.

## 5. Spielbarkeit und Faktenqualität

- Neue Kategorie: mindestens **fünf Rubriken mit je fünf Fragen**; besser sechs oder mehr
  Rubriken mit allen Stufen 1–9 und mehreren Fragen je Stufe.
- Neue Rubrik mit mindestens fünf Fragen liefern. Einzelne Fragen zu bestehenden Rubriken
  sind erlaubt; der Gesamtbestand muss nach der Ergänzung gültig bleiben.
- Spielregler 1–5 benötigen Fragenstufen 1–5, 2–6, 3–7, 4–8 bzw. 5–9. Lückenlose Rubriken
  werden bevorzugt; Fallback auf benachbarte Stufen nicht als Inhaltsstrategie einplanen.
- Eindeutige Musterlösungen mit belastbaren Quellen prüfen, kurze Fragen selbst formulieren.
  Zeitabhängige Fakten mit Jahr/Stand eingrenzen; Quellen separat dokumentieren.
- **Ähnliche und identische Fragen sowie wiederholte Antworten sind erlaubt**, wenn die
  Datensatz-IDs verschieden sind. Keine künstlichen Formulierungen nur zur Textabweichung.
  Eine Recherche über sämtliche bestehenden Fragen ist nicht erforderlich; Agents können
  unabhängig Inhalte liefern. Abwechslung innerhalb der eigenen Lieferung ist ein Qualitätsziel,
  keine harte Validierungsbedingung. Die Poolvalidierung prüft Struktur, nicht Text-Einzigartigkeit.

SQL-Constraints allein garantieren keine vom Frontend akzeptierten Pools. Eine SQL-Datei
kann erfolgreich ausgeführt werden und dennoch Inhalte erzeugen, die der Poolvalidator ablehnt.

## 6. Prüfung und spätere Übernahme

Vor Freigabe in einer **isolierten Testdatenbank mit aktuellen Migrationen** prüfen:
Ein DB-Abzug ist für die Erstellung nicht nötig. Falls bei Ergänzungen die bestehenden
Eltern/Gesamtpools fehlen, nur die Lieferung prüfen und diese Testgrenze im Bericht nennen.

1. SQL ausführen; Beziehungen, neue Positionen und initiale Ratings prüfen.
2. DB-Pool über `postgresRepository(...).pool(id)` lesen, `validateQuestionPool` und
   Spielziehung für jede Schwierigkeit prüfen.
3. Dieselbe Datei erneut ausführen: gleicher Bestand/Positionen, keine Duplikate.
4. Testbewertungen anlegen, wiederholen: Scores und Zähler bleiben unverändert.
5. Konfliktdatei mit gleicher ID/anderem Inhalt muss scheitern und vollständig zurückrollen.

`npm run validate:content` prüft **nur JSON-Seed-Dateien**, nicht SQL-Lieferungen.
Ohne Test-DB nur tatsächlich durchgeführte Prüfungen nennen; keinen Import behaupten.

Später führt der Betreiber nach Prüfung und Backup die **gesamte Datei** in pgAdmin aus.
Bei Fehler `ROLLBACK` ausführen bzw. abgebrochene Transaktion beenden, nicht nur Fragmente
erneut starten. Bei psql `ON_ERROR_STOP` verwenden. Keine Produktionstests/automatischen
SQL-Imports im API-Start einrichten.

## 7. Abschlussbericht und bestehende JSON-Funktionen

Der Agent liefert SQL-/Berichtpfade, IDs, neue Rubriken, Fragenanzahl je Rubrik/Stufe,
Quellen und Prüfergebnisse sowie die Aussage: **Datei erstellt, nicht in die Anwendungs-DB importiert**.

JSON-Initialbestand und fertiger JSON-Spielimport bleiben erhalten. Neue SQL-Lieferungen
müssen JSON-Dateien nicht duplizieren. **Achtung `db:import`:** Das alte Werkzeug ersetzt
die aufgeführten Pools vollständig und kann SQL-Ergänzungen entfernen, die nicht in den
JSON-Dateien stehen. Nicht ungeprüft auf SQL-gepflegte Kategorien anwenden.
Der browserlokale Import fertiger `GameDefinition`-Spiele ist davon unabhängig.

Quellen: `apps/api/migrations/001-question-library.sql`, `002-difficulty-ratings.sql`,
`apps/api/src/repository.ts`, `packages/game-core/src/schema.ts`, `packages/game-core/src/draw.ts`.
