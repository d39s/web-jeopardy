---
name: create-jeopardy-questions
description: 'Neue Jeopardy-Fragen, Themenkategorien, Bereiche, Rubriken oder Spalten erstellen und erweitern. Verwenden für Fragen erstellen, Fragensets generieren, Kategorien anlegen und ergänzende PostgreSQL-SQL-Dateien zur manuellen Übernahme. Keine automatischen Imports oder Änderungen produktiver Datenbanken.'
argument-hint: 'Thema, Kategorie-ID, Rubriken, Fragenanzahl und Zielgruppe'
---

# Neue Jeopardy-Inhalte als SQL erstellen

## Ziel und Grenzen

Erstelle **ergänzende PostgreSQL-SQL-Dateien**, keine neue Importanwendung und standardmäßig
keine JSON-Pools. Der Betreiber prüft und führt die Dateien später selbst aus.
Keine DB-Zugangsdaten erfragen, keinen produktiven Import ausführen, keine Migrationen,
Deployments oder API-PUTs starten. Eine Validierung in einer ausdrücklich isolierten
Testdatenbank ist erlaubt; andernfalls Grenzen der Prüfung im Abschlussbericht nennen.

## Ablauf

1. Auftrag lesen: neue Kategorie oder bestehende ergänzen, gewünschte Rubriken,
   Anzahl, Sprache (Standard Deutsch) und Zielgruppe. Bei fehlender Ziel-Kategorie-ID oder
   unklarem Umfang gezielt nachfragen. Ein DB-Abzug oder eine Prüfung aller bestehenden
   Fragen ist **keine Voraussetzung** für die Erstellung. Wenn ein Export mitgegeben wurde,
   kann er freiwillig zur Themenorientierung dienen.
2. Tatsächliches Schema prüfen: `apps/api/migrations/001-question-library.sql`,
   `002-difficulty-ratings.sql` und `packages/game-core/src/schema.ts`.
   Bekannte Seed-Daten in `content/topics/` sind nur ein Anhaltspunkt, kein aktueller DB-Abzug.
3. Fakten recherchieren und Fragen eigenständig formulieren. Quellen und offene Unsicherheiten
   in einer begleitenden Markdown-Datei sammeln. Keine fremden Fragensammlungen kopieren.
4. SQL unter `content/sql/<datum>-<kategorie-id>-<kurzer-zweck>.sql` liefern.
   Bericht daneben mit gleichem Basisnamen und `.md`. Prüfe vorhandene Dateinamen;
   keine bestehende Lieferung überschreiben. Dateien sind manuelle Artefakte, keine Migrationen.
5. [SQL-Vorlage](./assets/add-content.sql) kopieren und die drei Eingabeblöcke mit echten
   Daten füllen. Die Vorlage ist ohne Eingabedaten absichtlich nicht ausführbar.
   SQL-Literale korrekt escapen: `O'Brien` wird `'O''Brien'`. UTF-8 verwenden.
6. Validieren: Syntax, IDs, Fremdschlüssel, Zeichenlimits, Ausgangsstufen, Spielbarkeit
   prüfen. Wenn möglich in isolierter DB zweimal ausführen:
   gleicher Bestand nach Wiederholung, bestehende Ratings und Inhalte unverändert.
7. Bericht mit Pfaden, Kategorie-/Rubrik-IDs, Fragenanzahl je Stufe, Quellen und Prüfergebnis
   liefern. **Nicht behaupten, die Fragen seien bereits importiert.**

## Fachliche Struktur

- **Kategorie:** `topics`, z. B. „Natur und Wissenschaft“.
- **Spalte/Bereich/Rubrik:** `rubrics`, z. B. „Astronomie“.
- **Frage:** `questions` mit Rubrik- und Kategoriebezug.
- Ein neues Thema benötigt mindestens **fünf Rubriken mit je fünf Fragen**. Besser jede Stufe
  1–9 pro Rubrik abdecken; mindestens sechs passende Rubriken ermöglichen wechselnde Spalten.
- Eine neue Rubrik in einer vorhandenen Kategorie mit mindestens fünf Fragen liefern.
  Einzelne neue Fragen für vorhandene Rubriken sind erlaubt, wenn der Gesamtbestand gültig bleibt.
- Beim Spielstart werden fünf Spalten und fünf Fragen je Spalte gezogen. Keine Punkte oder
  fertigen Spielfelder in die Datenbank schreiben. JSON-Spielimport ist ein separater Ablauf.

## IDs, Text und Schwierigkeitsstufen

- Stabile IDs mit 1–64 Zeichen, nur kleine ASCII-Buchstaben, Ziffern und Bindestriche;
  Regex `^[a-z0-9][a-z0-9-]*$`. Rubrik- und Frage-IDs sind **gemeinsam pro Kategorie eindeutig**.
- Neue Fragen z. B. `<rubrik>-<lieferungskennung>-<nummer>`, maximale ID-Länge beachten.
  Ohne Bestandskenntnis eine einmalig erzeugte zufällige Lieferungskennung verwenden
  (z. B. UUID ohne Bindestriche, ggf. Rubrikprefix kürzen), dann für Wiederholungen beibehalten.
  Keine ID-Wiederverwendung für andere Inhalte. Eine Scoreänderung ändert keine ID.
- Titel 1–80, Rubrikname 1–40, Frage/Antwort 1–500 Zeichen; außen trimmen.
  Beschreibung max. 300, Autor max. 80, Locale max. 20, Notiz max. 500 Zeichen.
  Optionale SQL-Felder dürfen `NULL` sein. `locale` für deutsche Inhalte: `de-DE`.
- Farben standardmäßig `NULL`, sonst ausschließlich `#2EC4B6`, `#FF7F50`, `#B388EB`,
  `#7AE582`, `#FFD166`.
- `level` ist die redaktionelle Ausgangsstufe **1–9**, nicht die Spielreglerstellung 1–5.
  Orientierung: 1 allgemein bekannt, 3 Allgemeinbildung, 5 Vorwissen, 7 Detailwissen,
  9 anspruchsvoll für Kenner. Schwierigkeit nicht durch unklare Formulierungen erzeugen.
- Eindeutige Musterlösung; akzeptierte Varianten und Moderationshinweise in `note`.
  Zeitabhängige Fakten mit Jahr/Stand eingrenzen, unsichere Behauptungen nicht ausgeben.
- **Ähnliche oder identische Fragen und wiederholte Antworten sind erlaubt**, sofern die
  Datensatz-IDs verschieden sind. Keine Bestandsrecherche zur garantierten Text-Einzigartigkeit
  verlangen und keine künstlichen Antwortvarianten erzeugen. Innerhalb der eigenen Lieferung
  für sinnvolle Abwechslung sorgen, ohne daraus eine harte Importbedingung zu machen.

## SQL-Regeln

- Eine Transaktion: `BEGIN` bis `COMMIT`. Bei Fehler komplett abbrechen.
- PostgreSQL-Advisory-Lock `pg_advisory_xact_lock(391002)` wie bestehender Import/Bewertungen
  verwenden; Schreibzugriffe auf Inhaltstabellen beim Berechnen von Positionen serialisieren.
- Ausschließlich **neue Datensätze ergänzen**. Kein `UPDATE`, `DELETE`, `DROP`, `TRUNCATE`,
  `ALTER`, keine Tabellen ersetzen. Temporäre Eingabetabellen mit `ON COMMIT DROP` sind erlaubt.
- Kategorien vor Rubriken, Rubriken vor Fragen anlegen. Vorhandene Eltern können nur über IDs
  referenziert werden; sie müssen dann bereits in der Zieldatenbank existieren.
- Wiederholung über explizite Konfliktziele absichern: `topics(id)`, `rubrics(topic_id,id)`,
  `questions(topic_id,id)` mit `ON CONFLICT ... DO NOTHING`.
  **Anderer Inhalt unter derselben ID ist ein Fehler**, nicht still überspringen.
- `position` ist nullbasiert und wird am Ende angehängt: Kategorien insgesamt, Rubriken
  pro Kategorie, Fragen pro Rubrik. Nicht stumpf vorhandene Positionen 0, 1, 2 wiederverwenden.
  Nur tatsächlich neue IDs nummerieren; so entstehen bei Wiederholung keine Verschiebungen.
- Neue Frage: `level = source_level = difficulty_score = Ausgangsstufe`; alle vier
  Bewertungszähler null. Zähler haben DB-Defaults, die drei Stufen-/Scorefelder nicht.
- Keine vorhandenen Scores oder Historien verändern. `difficulty_votes`, `content_imports`
  und `schema_migrations` nicht beschreiben.
- Schemafehler verhindern: Direkte SQL-Einfügungen umgehen JSON-/API-Validierung.
  SQL-Constraints allein garantieren keine vom Frontend akzeptierten Pools.

## Prüfung und Abgabe

- Ganze Datei zweimal in leerer **Test-DB mit aktuellen Migrationen** prüfen, bei Ergänzungen
  vorher passende Test-Eltern anlegen. Umfasst der Auftrag eine neue Kategorie, finalen Pool
  über `postgresRepository(...).pool(id)` lesen und `validateQuestionPool` sowie Ziehung prüfen.
- Konflikttest: gleiche ID mit anderem Inhalt muss scheitern; frühere Einfügungen müssen
  zurückgerollt werden. Referenz-/Spielbarkeitsfehler dürfen keine halben Themen hinterlassen.
- Bestehende bewertete Fragen vor/nach Wiederholung vergleichen.
- `npm run validate:content` prüft **nur JSON-Seed-Dateien**, keine SQL-Lieferung.
- Ergänzungen zu bestehenden Kategorien können ohne DB-Abzug nicht vollständig gegen
  deren aktuellen Gesamtpool getestet werden. Das melden, nicht die Erstellung blockieren.
- SQL kann später im pgAdmin Query Tool vollständig ausgeführt werden. Ohne Importauftrag
  nur Dateien liefern, keine DB-Verbindung zur produktiven Anwendung herstellen.

Ausführlicher Tabellenvertrag und Lieferregeln: [Agent-Anleitung](../../../docs/content-authoring-handoff.md).
