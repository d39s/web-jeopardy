# Manuelle SQL-Inhaltslieferungen

Hier liegen künftig **ergänzende** PostgreSQL-Dateien für neue Themen, Rubriken und Fragen.
Dateiname: `<datum>-<kategorie-id>-<zweck>.sql`, Begleitbericht mit gleichem Namen und `.md`.

Es gibt keinen automatischen Import dieses Verzeichnisses. Die Dateien sind **keine
Migrationen**, kein Seed und werden nicht beim API-Start ausgeführt. Der Betreiber prüft sie
und führt sie bei Bedarf vollständig in pgAdmin oder einem PostgreSQL-Client aus.

Agent-Skill: [create-jeopardy-questions](../../.github/skills/create-jeopardy-questions/SKILL.md).
Tabellen und Regeln: [Inhaltserstellung für Agents](../../docs/content-authoring-handoff.md).

Keine Secrets, DB-Dumps oder Zugangsdaten ablegen. Keine vorhandenen Fragen, Scores oder
Historien verändern. Die Skill-Vorlage ohne echte Eingabedaten bricht bewusst ab.
