# Fragensets anlegen

Jedes Thema ist eine JSON-Datei in `content/topics/` und zusätzlich ein Eintrag in
`content/topics/index.json`. Nach jeder Änderung prüfen:

```bash
npm run validate:content
```

## Aufbau einer Themendatei

```json
{
  "schemaVersion": 1,
  "id": "mein-thema",
  "title": "Mein Thema",
  "description": "Ein Satz, der auf der Startseite erscheint.",
  "author": "Optional",
  "locale": "de-DE",
  "pointSteps": [100, 200, 300, 400, 500],
  "categories": [
    {
      "id": "kategorie-eins",
      "name": "Kategorie eins",
      "clues": [
        {
          "id": "kategorie-eins-100",
          "points": 100,
          "question": "Die Frage, die im Popup steht.",
          "answer": "Die Musterlösung.",
          "note": "Optionaler Hinweis nur für die Moderation."
        }
      ]
    }
  ]
}
```

## Regeln

| Regel                                                | Warum                                                                       |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| Genau 5 Kategorien mit je genau 5 Fragen             | Das Spielfeld ist ein 5×5-Raster.                                           |
| `points` folgt der Reihenfolge aus `pointSteps`      | Sonst passt die Karte nicht zu ihrer Zeile.                                 |
| `pointSteps` aufsteigend                             | Leichte Fragen oben, schwere unten.                                         |
| Alle `id`-Werte sind innerhalb der Datei eindeutig   | IDs identifizieren Karten und Wertungen.                                    |
| Bewährtes Muster: `<kategorie>-<punkte>`             | Leicht zu lesen und automatisch eindeutig.                                  |
| `color` ist optional und nur aus der Palette erlaubt | Farben sind gestalterisch vorgegeben; ohne Angabe entscheidet die Position. |
| `question` und `answer` maximal 500 Zeichen          | Damit die Karte auf dem Beamer lesbar bleibt.                               |
| Keine zusätzlichen Felder                            | Tippfehler fallen so sofort auf.                                            |

Erlaubte Farben: `#2EC4B6`, `#FF7F50`, `#B388EB`, `#7AE582`, `#FFD166`.

## Eintrag im Index

```json
{
  "id": "mein-thema",
  "title": "Mein Thema",
  "description": "Ein Satz, der auf der Startseite erscheint.",
  "file": "mein-thema.json"
}
```

`id` und `title` müssen mit der Themendatei übereinstimmen – die Prüfung meldet Abweichungen.

## Ohne Neubau ausliefern

Im Container liegt dieses Verzeichnis unter `/usr/share/nginx/html/topics` und ist als
Volume eingebunden. Neue Fragensets werden also einfach in `content/topics/` abgelegt; ein
neues Image ist dafür nicht nötig. Alternativ lässt sich eine Datei direkt auf der
Startseite über „Eigenes Fragenset laden" auswählen.
