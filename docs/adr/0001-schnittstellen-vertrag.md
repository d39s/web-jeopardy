# ADR 0001 – Schnittstellen-Vertrag als Voraussetzung für Parallelarbeit

Status: angenommen · Datum: 2026-08-16

## Kontext

Der Arbeitsplan schneidet die Umsetzung in sechs parallele Streams. Das funktioniert nur,
wenn alle Beteiligten gegen dieselben, vorab festgelegten Schnittstellen entwickeln.

## Entscheidung

`packages/game-core` veröffentlicht den vollständigen Vertrag, bevor Implementierungsarbeit
in den Streams beginnt:

- **Typen** (`types.ts`): `Clue`, `Category`, `GameDefinition`, `TopicIndex`, `Team`,
  `ScoreEvent`, `GameState`, `GameAction`, `GameTransport`.
- **Schemas** (`schema.ts`): `gameDefinitionSchema`, `topicIndexSchema` sowie
  `validateGameDefinition` / `validateTopicIndex`, die feldgenaue, anzeigbare Meldungen
  liefern (`categories.2.clues.4.answer: …`).
- **Teamverwaltung** (`teams.ts`): `createDefaultTeams`, `createTeam`, `MIN_TEAMS`,
  `MAX_TEAMS_UI`.
- **Palette** (`colors.ts`): die fünf vorgegebenen Kategoriefarben – die einzige Stelle im
  Projekt, an der diese Hex-Werte stehen.
- **Fixtures** (`fixtures.ts`): ein vollständiges 5x5-Fragenset und bewusst fehlerhafte
  Varianten für Negativtests.
- **Design-Tokens** (`apps/web/src/styles/tokens.css`) und **Texte**
  (`apps/web/src/i18n/de.ts`).

Punktebuttons sind bewusst **Funktionen** (`de.clue.scoreCorrect(name)`), keine Konstanten.
Damit ist die Regel „zwei Buttons je Team, beliebig viele Teams" bereits im Vertrag
verankert und kann in keinem Stream versehentlich auf zwei Teams verengt werden.

## Konsequenzen

- Änderungen an diesen Dateien sind Breaking Changes und brauchen einen eigenen PR mit
  Review aus mindestens zwei Streams.
- Die Oberflächen-Streams können vollständig gegen `sampleDefinition` arbeiten, bevor der
  Content-Loader existiert.
- `game-core` bleibt frei von React, DOM und Zeit-/Zufallsquellen, damit derselbe Code in
  Phase 2 serverseitig laufen kann.

## Abweichung gegenüber dem Konzept

Der Arbeitsplan sah in T01 zusätzlich leere Signaturen der UI-Primitive vor. Da die
Umsetzung derzeit nicht parallel, sondern sequenziell erfolgt, entfallen diese Platzhalter
zugunsten der echten Komponenten in C1 – das vermeidet toten Code. Bei paralleler Besetzung
wären die Signaturen weiterhin sinnvoll.
