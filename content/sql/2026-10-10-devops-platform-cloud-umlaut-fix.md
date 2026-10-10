# Umlaut-Korrektur DevOps / Platform / Cloud

Einmalige Korrektur zu `2026-10-10-devops-platform-cloud-initial.sql` und
`2026-10-10-devops-platform-cloud-expansion.sql`. Beide Lieferungen waren mit Umschreibungen
(`fuer`, `ueber`, `Groesse`) statt echter Umlaute erstellt worden. Die Lieferdateien sind
inzwischen korrigiert. Bereits importierte Fragen behebt `2026-10-10-devops-platform-cloud-umlaut-fix.sql`.

Abweichend von den append-only-Lieferungen enthält diese Datei ein `UPDATE`, und zwar nur für
`question`, `answer` und `note` von 279 Fragen (45 initial, 234 Erweiterung). Kategorie und Rubriken
sind nicht betroffen.

Alle Wörter mit `ss` wurden einzeln geprüft. Zu `ß` geändert sind nur `heißt`, `heißen`, `hieß`,
`Größe`, `große`, `außerhalb`, `Maßnahmen`, `Schließt`, `Verstöße`, `gleichmäßig` und
`standardmäßig(e)`. Alle übrigen `ss` sind korrekt (`dass`, `muss`, `Schlüssel`, `Prozess`,
Wortfugen wie `Betriebssystem`, englische Begriffe). Zusätzlich korrigiert: `fahrt` → `fährt`
in `k8s-b92e71-8`.

## Verhalten

- Geändert wird nur, wenn der DB-Text noch exakt einer bekannten früheren Fassung entspricht:
  Originallieferung oder Stand nach der ersten Fassung dieses Skripts (ohne `fährt`-Korrektur).
- `fehlt`: Frage nicht importiert, z. B. Erweiterung noch nicht eingespielt. Dann später direkt
  die korrigierte Lieferdatei ausführen.
- `abweichend`: Frage wurde inzwischen anders bearbeitet und bleibt unverändert. Die ID wird gemeldet.
- `level`, `source_level`, `difficulty_score`, Bewertungszähler und `difficulty_votes` bleiben unverändert.
- Mehrfaches Ausführen ist unschädlich. Ergebnis im Meldungen-Tab von pgAdmin.
- Die Review-Version ändert sich mit dem Text. Offene Review-Karten betroffener Fragen melden einmal
  „veraltet“ und müssen neu geladen werden.

## Prüfung

In einer isolierten PostgreSQL-17-Testdatenbank mit beiden Migrationen geprüft:

- Alter Import + Korrektur: 279 korrigiert. Zweiter Lauf: 279 „bereits korrigiert“.
- Danach laufen die korrigierten Lieferdateien ohne ID-Konflikt durch. Fragenbestand identisch mit
  einem frischen Import der korrigierten Dateien.
- Vorher gesetzte Scores, Zähler und Votes bleiben erhalten.
- Manuell geänderte Frage wird als `abweichend` gemeldet und nicht überschrieben.
- Erste Skriptfassung bereits gelaufen: 278 „bereits korrigiert“, 1 korrigiert (`k8s-b92e71-8`).
- Nur initial importiert: 45 korrigiert, 234 `fehlt`. Danach lässt sich die korrigierte Erweiterung importieren.

Nicht gegen die Anwendungsdatenbank ausgeführt.
