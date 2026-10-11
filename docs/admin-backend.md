# Admin-Backend

Unter `/admin` lassen sich Fragen pflegen und SQL-Lieferungen (z. B. aus `content/sql/`)
einspielen. Die Anwendung hat keine eigene Benutzerverwaltung: Die Anmeldung übernimmt
**Authentik per Forward Auth am Ingress**, die API wertet nur die weitergereichten Header aus.

| Bereich        | Pfad             | Inhalt                                                                  |
| -------------- | ---------------- | ----------------------------------------------------------------------- |
| Fragen         | `/admin`         | Suchen, filtern, anlegen, bearbeiten, verschieben, löschen              |
| Meldungen      | `/admin/reports` | Von Spielern gemeldete Fragen prüfen, bearbeiten, Meldung aufheben      |
| SQL einspielen | `/admin/sql`     | Skript hochladen oder einfügen, Testlauf mit Rollback, dann Ausführen   |
| Protokoll      | `/admin/log`     | Wer hat wann welche Frage oder welches Skript geändert, inklusive Stand |

Der Admin-Code wird als eigenes Bündel geladen; Spieler laden ihn nicht mit. Der Code selbst
ist nicht geheim – geschützt sind die Daten hinter `/api/v1/admin`.

## Betriebsarten (`ADMIN_AUTH`)

| Wert           | Verhalten                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------ |
| leer / `off`   | **Standard.** Admin-API existiert nicht (404), die Oberfläche meldet „nicht aktiviert“.    |
| `forward-auth` | Benutzer aus `X-authentik-username`, Gruppen aus `X-authentik-groups` (`a\|b`). Ohne → 401 |
| `dev`          | Nur lokal: ohne Anmeldung, Benutzername aus `ADMIN_DEV_USER` (Standard `dev`)              |

`ADMIN_GROUPS` (kommagetrennt, optional) verlangt bei `forward-auth` zusätzlich die
Mitgliedschaft in mindestens einer der Gruppen, sonst 403. Die Zugriffsregel in Authentik
bleibt die eigentliche Sperre; `ADMIN_GROUPS` ist die zweite Absicherung in der API.

### Lokal

```bash
ADMIN_AUTH=dev npm run dev:api   # API mit Admin-Bereich, Hinweis im Log
npm run dev                      # http://localhost:5173/admin
```

Mit Docker Compose `ADMIN_AUTH=dev` in `.env` setzen und `docker compose up -d api` ausführen.
`dev` nie in einer erreichbaren Umgebung verwenden.

## Authentik im Cluster

Vorgehen in Authentik (Bezeichnungen je nach Version leicht abweichend):

1. **Provider** vom Typ _Proxy_ im Modus _Forward auth (single application)_ anlegen,
   External host `https://<HOST>`.
2. **Application** dazu anlegen und per Policy/Binding nur der Admin-Gruppe erlauben,
   z. B. `jeopardy-admins`. Provider einem Outpost zuweisen (eingebetteter Outpost genügt).
3. Im API-Pod `ADMIN_AUTH=forward-auth` und `ADMIN_GROUPS=jeopardy-admins` setzen.

Am Ingress **nur** diese Pfade schützen; das Spiel selbst bleibt ohne Anmeldung erreichbar:

- `/admin` (Oberfläche, Weiterleitung zur Anmeldung)
- `/api/v1/admin` (API – **zwingend**, siehe Sicherheit)

Zusätzlich muss `/outpost.goauthentik.io` auf demselben Host zum Authentik-Outpost
(bzw. beim eingebetteten Outpost zum Authentik-Server-Service, Port 9000) geroutet werden,
damit Anmeldung und Rückleitung funktionieren.

**Beispiel ingress-nginx** – eigene Ingress-Ressource für die Admin-Pfade, Backend wie gehabt
der Web-Service (nginx reicht `/api/` samt Headern an die API weiter):

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: jeopardy-admin
  annotations:
    nginx.ingress.kubernetes.io/auth-url: http://<OUTPOST_SERVICE>.<AUTHENTIK_NS>.svc.cluster.local:9000/outpost.goauthentik.io/auth/nginx
    nginx.ingress.kubernetes.io/auth-signin: https://<HOST>/outpost.goauthentik.io/start?rd=$scheme://$http_host$escaped_request_uri
    nginx.ingress.kubernetes.io/auth-response-headers: Set-Cookie,X-authentik-username,X-authentik-groups,X-authentik-email,X-authentik-name,X-authentik-uid
    nginx.ingress.kubernetes.io/auth-snippet: proxy_set_header X-Forwarded-Host $http_host;
spec:
  ingressClassName: <INGRESS_CLASS>
  tls: [{ hosts: [<HOST>], secretName: <TLS_SECRET> }]
  rules:
    - host: <HOST>
      http:
        paths:
          - {
              path: /admin,
              pathType: Prefix,
              backend: { service: { name: <WEB_SERVICE>, port: { number: 80 } } },
            }
          - {
              path: /api/v1/admin,
              pathType: Prefix,
              backend: { service: { name: <WEB_SERVICE>, port: { number: 80 } } },
            }
```

`auth-snippet` setzt erlaubte Snippet-Annotationen voraus; falls der Controller sie sperrt,
die Variante aus der Authentik-Dokumentation für die eingesetzte Version wählen.

**Beispiel Traefik** – Middleware an einer IngressRoute/Ingress nur für die beiden Pfade:

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: authentik
spec:
  forwardAuth:
    address: http://<OUTPOST_SERVICE>.<AUTHENTIK_NS>.svc.cluster.local:9000/outpost.goauthentik.io/auth/traefik
    trustForwardHeader: true
    authResponseHeaders:
      - X-authentik-username
      - X-authentik-groups
      - X-authentik-email
      - X-authentik-name
      - X-authentik-uid
```

Platzhalter (`<HOST>`, `<OUTPOST_SERVICE>` …) gegen die tatsächlichen Namen ersetzen und die
Annotationen mit der Authentik-Dokumentation der eingesetzten Version abgleichen.

## Sicherheit

- **Die API vertraut den `X-authentik-*`-Headern.** Das ist nur sicher, wenn jede Anfrage auf
  `/api/v1/admin` durch die Forward-Auth läuft: Der Ingress überschreibt dann vom Client
  mitgeschickte Header mit den Werten aus Authentik. Nach dem Deployment prüfen:
  `curl -i -H 'X-authentik-username: test' https://<HOST>/api/v1/admin/me` muss eine
  Weiterleitung bzw. 401 vom Ingress liefern, **nie** 200 von der API.
- API-Service nicht direkt erreichbar machen; NetworkPolicy nur Web → API:3001 erlauben,
  sonst können andere Pods die Header selbst setzen.
- **SQL einspielen hat die vollen Rechte des DB-Benutzers der API** – inklusive `DELETE`,
  `DROP` und DDL. Für die API keinen PostgreSQL-Superuser verwenden (im lokalen Compose ist
  er es) und vor Ausführungen ein Backup sicherstellen.
- Skripte laufen in einer eigenen Transaktion mit `statement_timeout` 120 s und
  `lock_timeout` 15 s. Die Verbindung wird danach verworfen, damit `SET`, temporäre Tabellen
  oder Rollenwechsel eines Skripts nicht in andere Anfragen gelangen.

## Fragen bearbeiten

- Jede Änderung prüft den Inhaltsstand (`version`). Hat jemand anderes die Frage inzwischen
  geändert, meldet die API 409; die Seite neu laden.
- Eine **geänderte Ausgangsstufe** setzt Score, Spielstufe und Bewertungszähler zurück.
  Textkorrekturen behalten die Bewertung, außer „zurücksetzen“ ist gewählt. Nach einer
  Textänderung lehnt der Bewertungsmodus noch offene Stimmen für den alten Text ab (409).
- Änderungen, die den Pool unspielbar machen würden (z. B. Rubrik unter fünf Fragen),
  werden mit 422 und den Problemen aus `validateQuestionPool` abgelehnt und nicht gespeichert.
  Schon vorher bestehende Probleme blockieren nicht, damit ein Pool reparierbar bleibt.
- Neue Fragen ohne ID erhalten `<rubrik>-<8 Hex-Zeichen>`. IDs von Rubriken und Fragen
  dürfen sich innerhalb eines Themas nicht überschneiden.

## Meldungen

Spieler können eine Frage nach dem Aufdecken melden, optional mit Kommentar (siehe
[Fragen-Datenbank](fragen-datenbank.md#fragen-melden)). Eine gemeldete Frage kommt in kein neues
Spiel und nicht in den Bewertungsmodus, bis die Meldung hier aufgehoben ist.

- Die Übersicht gruppiert offene Meldungen je Frage, neueste zuerst, mit Zeitpunkt, Herkunft
  (Spiel/Bewertung) und Kommentar. Weicht der gemeldete Stand vom aktuellen ab, wird er
  mit angezeigt.
- **Bearbeiten** öffnet denselben Dialog wie unter „Fragen“. Speichern hebt die Meldung
  **nicht** auf; das geschieht bewusst getrennt mit **Meldung aufheben**.
- Aufheben erfasst nur Meldungen bis zur neuesten angezeigten; inzwischen eingegangene bleiben
  offen. Es wird als `question.unflag` protokolliert.
- Löschen einer Frage hebt ihre offenen Meldungen mit auf (im Protokoll unter `resolvedReports`).
- In der Fragenliste tragen gemeldete Fragen einen Hinweis mit Link zur Übersicht.

## SQL einspielen

1. Datei wählen oder SQL einfügen, **Testlauf** starten. Das Skript läuft vollständig in
   einer Transaktion, die anschließend zurückgerollt wird.
2. Ergebnis prüfen: Bestand vorher/nachher, geänderte Themen, Anweisungen mit Zeilenzahlen,
   erste Zeilen von `SELECT`-Abfragen, `RAISE NOTICE`-Ausgaben und Fehler mit Zeile/Spalte.
3. **Ausführen** ist nur für exakt das zuletzt erfolgreich getestete Skript möglich.

Ein eigenes `BEGIN` am Anfang und `COMMIT` am Ende (wie in den Lieferungen) sind erlaubt;
jede andere Transaktionssteuerung (`COMMIT` mitten im Skript, `ROLLBACK`, `END` …) wird vor
der Ausführung mit Zeilenangabe abgelehnt. `SAVEPOINT` und `ROLLBACK TO` sind erlaubt.
Entstehen durch das Skript neue Probleme in einem Fragenpool, wird es nicht festgeschrieben.

Das Protokoll speichert bei Ausführungen Dateiname, SHA-256, Bestandsänderung und den
vollständigen SQL-Text (Tabelle `admin_log`). Testläufe werden nicht protokolliert.

## API

Alle Pfade unter `/api/v1/admin`, JSON, Schemas in `packages/game-core/src/admin.ts`.

| Methode | Pfad                                       | Zweck                                                  |
| ------- | ------------------------------------------ | ------------------------------------------------------ |
| GET     | `/me`                                      | Angemeldeter Benutzer und Gruppen                      |
| GET     | `/topics`                                  | Themen mit Rubriken und Fragenzahlen                   |
| GET     | `/questions?topicId&rubricId&q&level&…`    | Fragen seitenweise (`limit` ≤ 200, `offset`)           |
| POST    | `/topics/<topicId>/questions`              | Frage anlegen, 201                                     |
| PUT     | `/topics/<topicId>/questions/<id>`         | Frage ändern (mit `version`), 409 bei fremder Änderung |
| DELETE  | `/topics/<topicId>/questions/<id>?version` | Frage löschen, 204                                     |
| GET     | `/reports`                                 | Offene Meldungen je Frage, neueste zuerst              |
| POST    | `/reports/<topicId>/<id>/resolve`          | Meldungen bis `throughId` aufheben, 409 wenn keine     |
| POST    | `/sql/dry-run`                             | Skript testen, immer Rollback                          |
| POST    | `/sql/execute`                             | Skript ausführen und protokollieren                    |
| GET     | `/log?limit&before`                        | Protokoll, neueste zuerst, ohne SQL-Text               |
| GET     | `/log/<id>`                                | Einzelner Eintrag inklusive SQL-Text                   |

Erweiterungen für weitere Admin-Funktionen kommen als zusätzliche Route in
`apps/api/src/admin/routes.ts` und als weiterer Menüpunkt in
`apps/web/src/features/admin/AdminApp.tsx`; Anmeldung und Protokoll stehen dort bereits bereit.
