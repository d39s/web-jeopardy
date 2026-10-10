# Fragen pflegen

Jede Themenkategorie hat genau **einen Fragenpool**. Zur Laufzeit liegen Fragen und Rubriken
in PostgreSQL und werden über die Fragen-API geladen. Die JSON-Dateien in `content/topics/`
mit `index.json` bleiben als Initialbestand und bewusste Importquelle erhalten. Aus dem Pool
zieht jede Partie ihr eigenes 5×5-Spielfeld. Fertige Spiele können weiterhin separat importiert
werden. Einrichtung und API: [Fragen-Datenbank](../docs/fragen-datenbank.md).
Nach jeder Änderung an den Importdateien prüfen:

```bash
npm run validate:content
```

## Wie aus dem Vorrat ein Spielfeld wird

1. Die Startseite lässt eine **Kategorie** wählen und lädt deren Pool.
2. Ein Regler stellt die **Schwierigkeit** von 1 bis 5 ein.
3. Beim Start werden fünf **Rubriken** gezogen – sie werden die fünf Spalten.
4. Je Rubrik werden fünf Fragen gezogen, eine pro Zeile, mit aufsteigender Stufe.

Welche Fragen es trifft, entscheidet die **Ziehungsnummer**. Sie steht im geteilten Link:
Dieselbe Nummer ergibt überall dasselbe Brett, eine neue Nummer eine neue Partie.

## Schwierigkeit: Stufe der Frage, Fenster des Reglers

Jede Frage trägt eine absolute Stufe von **1 bis 9**. Der Regler wählt daraus kein einzelnes
Niveau, sondern schiebt ein Fenster von fünf Stufen über die Skala – eine Stufe je Zeile. In
jeder Reglerstellung stehen damit fünf **verschiedene**, aufsteigende Stufen auf dem Brett:

| Regler       | 100er | 200er | 300er | 400er | 500er |
| ------------ | ----: | ----: | ----: | ----: | ----: |
| 1 Locker     |     1 |     2 |     3 |     4 |     5 |
| 2 Leicht     |     2 |     3 |     4 |     5 |     6 |
| 3 Ausgewogen |     3 |     4 |     5 |     6 |     7 |
| 4 Fordernd   |     4 |     5 |     6 |     7 |     8 |
| 5 Für Kenner |     5 |     6 |     7 |     8 |     9 |

Zwei Zeilen desselben Bretts sind also nie gleich schwer – sonst gäbe es keinen Grund, sich
an die teuren Karten zu wagen. Dass die Skala bis 9 reicht und nicht bis 5, folgt daraus: Das
Fenster ist fünf Stufen breit und wandert über vier Stellungen weiter.

Woran sich die Stufe einer einzelnen Frage bemisst:

| Stufe | Gedacht für                                          |
| ----- | ---------------------------------------------------- |
| 1     | Kennt praktisch jede Runde – Hauptstadt von Italien. |
| 2     | Breites Publikum, kurzes Nachdenken.                 |
| 3     | Allgemeinbildung, ohne Spezialwissen.                |
| 4     | Wer sich für das Thema interessiert, kommt darauf.   |
| 5     | Verlangt Vorwissen; die Runde rät nicht mehr mit.    |
| 6     | Solide Kenntnis des Themas nötig.                    |
| 7     | Detailwissen, das man sich angelesen haben muss.     |
| 8     | Fachwissen oder ein sehr gutes Gedächtnis.           |
| 9     | Die Frage, bei der auch Kenner überlegen.            |

Punkte stehen **nicht** in der Datei: Sie ergeben sich aus der Zeile, in der eine Frage
landet, und sind immer 100 bis 500.

## Aufbau einer Pool-Datei

```json
{
  "schemaVersion": 1,
  "id": "allgemeinwissen",
  "title": "Allgemeinwissen",
  "description": "Ein Satz, der auf der Startseite erscheint.",
  "author": "Optional",
  "locale": "de-DE",
  "rubrics": [
    {
      "id": "erdkunde",
      "name": "Erdkunde",
      "clues": [
        {
          "id": "erdkunde-1-01",
          "level": 1,
          "question": "Wie heißt die Hauptstadt von Italien?",
          "answer": "Rom",
          "note": "Optionaler Hinweis nur für die Moderation."
        }
      ]
    }
  ]
}
```

## Regeln

| Regel                                                | Warum                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| Mindestens 5 Rubriken je Pool                        | Fünf werden zu den Spalten des Spielfelds.                          |
| Mindestens 5 Fragen je Rubrik                        | Weniger füllt keine Spalte; die Rubrik wird beim Ziehen übergangen. |
| `level` ist 1 bis 9                                  | Absolute Skala, über die der Regler sein Fenster schiebt.           |
| Alle `id`-Werte im Pool sind eindeutig               | Rubrik- und Frage-IDs landen im Brett im selben Namensraum.         |
| Bewährtes Muster: `<rubrik>-<stufe>-<nummer>`        | Leicht zu lesen und automatisch eindeutig.                          |
| Keine Frage zweimal, auch nicht sinngleich           | Sonst stünde sie irgendwann doppelt auf demselben Brett.            |
| `question` und `answer` maximal 500 Zeichen          | Damit die Karte auf dem Beamer lesbar bleibt.                       |
| `name` einer Rubrik maximal 40 Zeichen               | Der Spaltenkopf hat nur eine Spaltenbreite.                         |
| `color` ist optional und nur aus der Palette erlaubt | Ohne Angabe entscheidet die Position im gezogenen Brett.            |
| Keine zusätzlichen Felder                            | Tippfehler fallen so sofort auf.                                    |

Erlaubte Farben: `#2EC4B6`, `#FF7F50`, `#B388EB`, `#7AE582`, `#FFD166`.

## Eintrag im Index

`content/topics/index.json` führt nur noch die Kategorien, jede mit ihrer Pool-Datei:

```json
{
  "schemaVersion": 2,
  "categories": [
    {
      "id": "allgemeinwissen",
      "title": "Allgemeinwissen",
      "description": "Steht auf der Startseite.",
      "file": "pool-allgemeinwissen.json"
    }
  ]
}
```

`id` und `title` müssen mit der Pool-Datei übereinstimmen – die Prüfung meldet Abweichungen,
ebenso eine Datei im Verzeichnis, die in keinem Eintrag vorkommt.

## Wie viel Vorrat ist genug?

`npm run validate:content` zieht zu jeder Kategorie und jeder Reglerstellung Bretter und
meldet, wenn eine Stufe nur von genau fünf Rubriken bedient wird – dann steht jedes Spiel mit
derselben Spaltenauswahl da. Angestrebt ist je Kategorie ein volles Raster:

**10 Rubriken × 9 Stufen × 11 Fragen ≈ 1000 Fragen.**

Wichtiger als die runde Zahl ist die Lückenlosigkeit: Eine Rubrik, die alle neun Stufen
führt, steht in jeder Reglerstellung zur Verfügung. Fehlen ihr Stufen, ist sie nicht
verloren – beim Ziehen weicht das Spiel auf die nächstgelegene vorhandene aus. Rubriken, die
das Fenster lückenlos bedienen, haben aber immer Vorrang.

## Ohne Neubau ausliefern

Im API-Container liegt dieses Verzeichnis unter `/app/content/topics` als schreibgeschütztes
Volume. Nach Änderungen `docker compose exec api npm run db:import` ausführen: Die im Index
aufgeführten Pools werden atomar ersetzt. Erst danach werden die Änderungen beim Neuladen
sichtbar. Der automatische Seed läuft nur einmal und überschreibt keine DB-Änderungen.
Alternativ erlaubt die abgesicherte PUT-API die Pflege ohne JSON-Dateien.

## Fertige Spielfelder importieren

Die Startseite nimmt weiterhin ein **fertiges 5×5-Fragenset** als JSON entgegen
(„Eigenes Fragenset laden"). Ein solches Set wird nicht gezogen, sondern unverändert
gespielt – Regler und Ziehung greifen daran nicht. Aufbau:

```json
{
  "schemaVersion": 1,
  "id": "mein-set",
  "title": "Mein Set",
  "category": "allgemeinwissen",
  "difficulty": 3,
  "pointSteps": [100, 200, 300, 400, 500],
  "categories": [
    {
      "id": "spalte-eins",
      "name": "Spalte eins",
      "clues": [
        { "id": "spalte-eins-100", "points": 100, "question": "Frage?", "answer": "Antwort" }
      ]
    }
  ]
}
```

Dafür gilt: genau 5 Spalten mit je genau 5 Fragen, `points` in der Reihenfolge aus
`pointSteps`, `difficulty` zwischen 1 und 5 (die Reglerstellung, nicht die Fragenstufe),
alle IDs innerhalb der Datei eindeutig.
