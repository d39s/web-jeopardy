# Gemeinsame Fragenbibliothek (PostgreSQL)

## Lokal starten

`docker compose up --build -d` startet PostgreSQL 17, Fragen-API und Weboberfläche.
Das Spiel läuft unter **http://localhost:8080**, die API zusätzlich unter
**http://localhost:3001/api/v1**. PostgreSQL ist unter **localhost:5432** erreichbar
(Datenbank und Benutzer `jeopardy`, lokales Passwort `jeopardy-local`).
Ist Port 8080 belegt, lässt sich mit `WEB_PORT=8081` ein anderer Web-Port wählen.

Optional `.env.example` nach `.env` kopieren und Passwort, Schreibtoken sowie erlaubte
Browser-Origins anpassen. Diese Voreinstellungen sind ausschließlich für lokale Entwicklung.
DB und direkter API-Port sind nur an Loopback gebunden. Die über Port 8080 ausgelieferte
Oberfläche gibt allerdings auch lesenden API-Zugriff frei; sie ist keine Zugriffskontrolle.
Für einen öffentlichen Betrieb TLS, Zugriffsschutz und getrennte DB-Rollen ergänzen.
Ein DB-Passwort mit URL-Sonderzeichen muss in `DATABASE_URL` percent-encodiert werden;
für die Compose-Voreinstellung ein langes URL-sicheres Passwort verwenden.

Beim API-Start werden versionierte Migrationen transaktional ausgeführt und die vorhandenen
Pools aus `content/topics` **einmalig** übernommen. Spätere Neustarts überschreiben keine
DB-Änderungen. Auch eine bereits manuell befüllte DB wird nicht mit Seed-Daten überschrieben.
Ein benanntes Docker-Volume hält die Daten über Container-Neustarts hinweg. `docker compose
down` erhält es; `docker compose down -v` löscht es unwiederbringlich.

## API-Ziel im Frontend-Pod konfigurieren

Das Webimage enthält keine Fragenpools. Der Browser fragt `/api/v1` an der Web-Origin ab;
nginx leitet diese Requests an die API weiter. Das Ziel ist zur Laufzeit per
**`JEOPARDY_API_URL`** konfigurierbar, etwa `http://jeopardy-api:3001` oder
`http://jeopardy-api.mein-namespace.svc.cluster.local:3001` im Kubernetes-Deployment.
Die Adresse muss aus dem **Frontend-Pod** erreichbar sein. Kein `/api`-Suffix und kein
abschließender Slash: nginx soll den originalen Requestpfad beibehalten.

Standard ist `http://api:3001` für Compose. Die offizielle nginx-Entrypoint-Logik rendert
`/etc/nginx/templates/default.conf.template` beim Start. Es ist kein Frontend-Rebuild nötig;
nach Änderung der Pod-Umgebungsvariable einen Rollout durchführen. Für getrennte
Cluster-Namespaces den vollständigen Service-DNS-Namen verwenden. Der Browser benötigt
so weder Zugriff auf interne Serviceadressen noch CORS-Freigaben zur Spiel-API.
Die API-URL nicht mit DB-Zugangsdaten oder anderen Secrets versehen.

## Datenbank mit pgAdmin ansehen

`docker compose up -d pgadmin` startet die lokale Verwaltungsoberfläche unter
**http://localhost:5050** (nur an Loopback gebunden). Standardmäßig ist die
pgAdmin-Anmeldung im lokalen Desktop-Modus deaktiviert; die Oberfläche öffnet direkt.
Mit `PGADMIN_SERVER_MODE=True` in `.env` lässt sich die Anmeldung aktivieren.
Danach den Container mit `docker compose up -d pgadmin` neu erstellen. Standard-Login:

- E-Mail: `admin@example.com`
- Passwort: `pgadmin-local`

Der Server **„Jeopardy (lokal)“** ist vorkonfiguriert. Beim ersten Verbinden das
PostgreSQL-Passwort eingeben: standardmäßig `jeopardy-local`, bei Anpassung der Wert
aus `POSTGRES_PASSWORD`. Unter **Databases → jeopardy → Schemas → public → Tables**
liegen unter anderem `topics`, `rubrics` und `questions`. Mit Rechtsklick auf eine Tabelle
und **View/Edit Data → All Rows** lassen sich die Daten ansehen.

Host innerhalb des Docker-Netzes ist `postgres`, Port `5432`, Benutzer und Datenbank
jeweils `jeopardy` (nicht `localhost` als Datenbankhost verwenden).
`PGADMIN_PORT`, `PGADMIN_SERVER_MODE`, `PGADMIN_EMAIL` und `PGADMIN_PASSWORD` sind über
`.env` konfigurierbar. Den Modus ohne Login niemals öffentlich bereitstellen;
die lokalen Standardpasswörter nicht für öffentlichen Betrieb verwenden.
pgAdmin speichert seine Einstellungen im eigenen Volume `pgadmin-data`; die
Initial-Anmeldedaten werden nur beim ersten Anlegen dieses Volumes übernommen.

## Lokale Entwicklung ohne Webcontainer

1. `npm install`
2. `docker compose up -d postgres api --build`
3. `npm run dev` (http://localhost:5173)

Vite leitet `/api` an http://127.0.0.1:3001 weiter, auch im Preview-Modus. Optional setzt
`API_PROXY_TARGET` eine andere Zieladresse. Soll auch die API außerhalb von Docker laufen:
nur `postgres` starten und `DATABASE_URL=postgresql://jeopardy:jeopardy-local@localhost:5432/jeopardy
npm run dev:api` ausführen. Der API-Start migriert und initialisiert ebenfalls automatisch.

## Datenmodell und Zugriff einer weiteren Anwendung

- `topics`: Pool-Metadaten und stabile Sortierung.
- `rubrics`: Rubriken pro Thema; zusammengesetzter Schlüssel `(topic_id, id)`.
- `questions`: Stufe 1–9, Frage, Antwort und optionale Moderationsnotiz;
  Schlüssel `(topic_id, id)`, Fremdschlüssel zur Rubrik.
- `schema_migrations` und `content_imports`: Migrationsstand und Seed-Markierung.

Rubrik- und Fragenreihenfolge bleiben erhalten, damit die bestehende Ziehung reproduzierbar
bleibt. Ein Pool wird atomar ersetzt. Ein lesender Request bekommt einen konsistenten
Snapshot. Identische IDs dürfen in unterschiedlichen Themen vorkommen.

Die zweite Anwendung kann die **HTTP-API** verwenden (empfohlen: dieselben validierten
Datenformate, keine Abhängigkeit vom internen SQL-Modell) oder direkt PostgreSQL lesen.
Für direkten Zugriff einen eigenen Benutzer mit `SELECT` auf `topics`, `rubrics` und
`questions` anlegen; die Spiel-Zugangsdaten nicht in einem Browser hinterlegen.

| Methode | Adresse                          | Antwort                                               |
| ------- | -------------------------------- | ----------------------------------------------------- |
| GET     | `/api/v1/health`                 | DB-Erreichbarkeit, `{ "status": "ok" }`               |
| GET     | `/api/v1/topics/index.json`      | Bestehendes `TopicIndex`-Format, `schemaVersion: 2`   |
| GET     | `/api/v1/pools/<themen-id>.json` | Bestehendes `QuestionPool`-Format, `schemaVersion: 1` |
| PUT     | `/api/v1/pools/<themen-id>.json` | Validierten vollständigen Pool anlegen/ersetzen, 204  |

Der Index behält aus Kompatibilitätsgründen das Feld `file`; dieses bezeichnet jetzt die
Ressource `<id>.json`, keine Datei auf dem Webserver. Die Web-App lädt anhand der Themen-ID.
Die API liefert Antworten einschließlich Lösungen – sie ist für Moderation und Fragenpflege,
nicht als manipulationssicheres Spielerprotokoll gedacht.

PUT ist ohne `CONTENT_WRITE_TOKEN` deaktiviert (403). Bei gesetztem Token ist
`Authorization: Bearer <token>` erforderlich (sonst 401). Der Body muss ein vollständiger
Pool gemäß `content/README.md` sein, dessen ID zur URL passt. Ungültige Pools liefern 400
mit feldgenauen `issues`. Fehlende Themen liefern 404; DB-Ausfälle 503. Maximaler Body: 10 MiB.
Das Schreibtoken gehört nur in eine vertrauenswürdige Anwendung, nie in das Spiel-Frontend.
Nach Änderungen an `.env` den API-Container mit `docker compose up -d api` neu erstellen.

Browserzugriffe einer anderen Origin benötigen `CORS_ORIGINS`, etwa
`http://localhost:3000,http://localhost:5174`. Ohne diese Einstellung sind nur
Same-Origin-Zugriffe sowie Server-zu-Server-Anfragen vorgesehen.

## Schwierigkeitsbewertung

Auf der Startseite führt **„Fragen bewerten“** zum unabhängigen Modus `/review`.
Über **„Kategorie für die Bewertung“** lässt sich ein Thema oder **„Alle Kategorien“** wählen.
Der Filter bleibt beim Bewerten erhalten; ein Wechsel lädt eine neue, verdeckte Frage.
Er zieht zufällig eine Frage aus den gewählten Themen (jede Frage gleich wahrscheinlich), vermeidet
die unmittelbar vorherige Frage und zeigt zunächst weder Antwort noch Schwierigkeit.
Nach **„Antwort anzeigen“** erscheinen Lösung, Stufe 1–9, Score und vier Bewertungsbuttons.
Eine erfolgreiche Bewertung lädt automatisch die nächste Frage.

- **Schwierigkeit passt:** Score unverändert; Zustimmung wird gezählt.
- **zu schwer:** Score steigt um 0,2.
- **zu leicht:** Score sinkt um 0,2.
- **nicht einschätzbar:** Score unverändert; Enthaltung wird gezählt.

Scores bleiben zwischen 1 und 9. Die gerundete Stufe in `questions.level` fließt unmittelbar
in neu geladene Fragenpools und neue Spiele ein. Bereits geladene Pools erst neu auswählen
bzw. die Startseite neu laden; laufende Spiele und JSON-Uploads ändern sich nicht.
`source_level` hält die ursprüngliche Einstufung, `difficulty_score` den aktuellen Score;
`fits_votes`, `too_hard_votes`, `too_easy_votes`, `unsure_votes` die Zähler.
`difficulty_votes` protokolliert Bewertungen mit Request-ID und Zeitpunkt ohne Personendaten.
Die Migration 002 ergänzt vorhandene Datenbanken automatisch.

Die API bietet `GET /api/v1/review/random` (optional `topicId`, `excludeTopic` und `excludeId`) und
`POST /api/v1/review/<themen-id>/<fragen-id>/votes` mit
`{ "requestId": "<UUID>", "version": "<Version aus GET>", "verdict": "too-hard" }`.
Erlaubte Werte sind `fits`, `too-hard`, `too-easy`, `unsure`. POST liefert Score, Stufe und
Bewertungsanzahl. Wiederholungen mit identischer Request-ID werden nicht doppelt gezählt;
veränderte Fragen oder widersprüchliche Wiederholungen ergeben 409.

Diese Bewertungsendpunkte sind für den lokalen Betrieb ohne Schreibtoken nutzbar, anders
als die abgesicherte Pool-Ersetzung. Für öffentlichen Betrieb zusätzlich Zugriffsschutz
und Rate-Limits einrichten. Antwort und Schwierigkeit werden bereits mit GET geliefert,
aber zunächst nur in der Oberfläche verborgen; dies ist kein Prüfungsschutz.

Ein erneuter Import erhält Bewertungen bei unveränderten IDs, Fragen, Antworten und
ursprünglicher Stufe. Änderungen an diesen Inhalten setzen den aktuellen Score und die
Zähler dieser Frage zurück; historische Bewertungen bleiben für die Nachvollziehbarkeit.

## Fragen pflegen und erneut importieren

Die JSON-Pools bleiben als Seed-/Importquelle im Repository. Änderungen dort werden **nicht**
automatisch live übernommen. Nach `npm run validate:content` kann man bewusst synchronisieren:

`docker compose exec api npm run db:import`

Das ersetzt alle im Index aufgeführten Pools transaktional, entfernt aber keine anderen
Themen aus der DB. Es überschreibt Änderungen an diesen Pools – vorher ein Backup anlegen.
Alternativ per PUT aktualisieren. Außerhalb von Docker benötigen `npm run db:migrate`,
`npm run db:seed` und `npm run db:import` eine gesetzte `DATABASE_URL`.
Mit `CONTENT_DIR` lässt sich ein anderes Importverzeichnis wählen.

Backup: `docker compose exec -T postgres pg_dump -U jeopardy -d jeopardy > jeopardy.sql`.
Wiederherstellung in eine leere DB: `docker compose exec -T postgres psql -U jeopardy
-d jeopardy -v ON_ERROR_STOP=1 < jeopardy.sql` (API dabei stoppen).

## Fertige Spiele per JSON

**„Eigenes Fragenset laden“ bleibt unverändert.** Eine Datei im `GameDefinition`-Format
wird ausschließlich im Browser geprüft und direkt gespielt. Sie wird weder hochgeladen noch
in den Fragenpool umgewandelt oder in der Datenbank gespeichert. Der Import funktioniert
auch dann, wenn PostgreSQL oder API nicht erreichbar sind. Laufende Spiele bleiben ebenfalls
im Browser gespeichert und benötigen nach dem Start keinen API-Zugriff.

## Tests und Images

`npm test` enthält API-Vertragstests mit isoliertem Repository. UI-E2E-Tests verwenden die
echten Seed-JSONs als HTTP-Fixtures und brauchen keine DB. Der echte PostgreSQL-Roundtrip
(Migration, Seed, Speicherung, Neustart und atomarer Import) läuft zusätzlich mit
`DATABASE_URL=... npm run test:db`; dafür eine **eigene leere Testdatenbank** verwenden.
Jenkins führt diese Tests mit einer eigenen PostgreSQL-Sidecar und einem `emptyDir`-Volume
aus und schreibt `reports/database.xml`. Eine produktive DB wird nicht verwendet.

`content/topics` bleibt eine **Seed-/Importquelle**, nicht Teil der Webauslieferung.
Die Datenvalidierung prüft diesen Initialbestand und bewusste spätere Importe.
UI-Testfixtures simulieren Antworten der API; die getrennten Datenbanktests prüfen die
wirkliche Speicherung. Das API-Image enthält derzeit Seed-Dateien zur Erstbefüllung.
Bei einer bereits befüllten externen DB kann `SEED_CONTENT=false` gesetzt werden;
Migrationen laufen weiterhin. Ein Image-Update überschreibt keine gepflegten Fragen.

Das Webimage wird weiterhin mit `docker/Dockerfile` gebaut, das neue API-Image separat mit
`docker/api.Dockerfile`. Compose baut beide. Jenkins baut beide Images in getrennten
Kaniko-Pods und veröffentlicht sie als `harbor.d39s.de/library/web-jeopardy` und
`harbor.d39s.de/library/web-jeopardy-api` mit derselben Tag-Strategie der gemeinsamen Library.
Die bisherige reine nginx-Auslieferung ohne API reicht nicht mehr aus.
