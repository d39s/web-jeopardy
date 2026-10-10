# Web-Jeopardy: Übergabe für den Kubernetes-Deployment-Agenten

Stand: 10.10.2026. Diese Datei enthält den derzeitigen Anwendungsvertrag, **keine bereits
ausgerollte Cluster-Konfiguration**. Repository: `d39s/web-jeopardy`.

## Auftrag und noch benötigte Angaben

Weboberfläche, Fragen-API und eine persistente PostgreSQL-Datenbank in Kubernetes betreiben.
Vor dem Anlegen von Ressourcen vorhandene Cluster-/GitOps-Konventionen prüfen. Keine
bestehende Datenbank, Secrets oder Volumes ungefragt ersetzen oder löschen.

Diese Angaben sind noch offen und müssen vom Betreiber kommen:

- Cluster/Kontext und Namespace: `<CONTEXT>`, `<NAMESPACE>`.
- Bereitstellung: vorhandenes GitOps-Repository/Helm/Kustomize oder direktes Deployment.
- Image-Tag bzw. Digest für **beide** Images: `<RELEASE>`.
- Hostname, IngressClass, TLS/Issuer und Zugriffsschutz: `<HOST>`, `<INGRESS_CLASS>`.
- Harbor-ImagePullSecret, falls die Registry Authentifizierung verlangt.
- Datenbank: bestehender PostgreSQL-Service/Operator oder neue Instanz; Secret und TLS-Vorgaben.
- Bei neuer DB: StorageClass, PVC-Größe, Backup-Ziel, Aufbewahrung und Restore-Verfahren.
- Vorhandene lokale Fragen/Bewertungen übernehmen oder eine neue DB initial befüllen?

Platzhalter nicht als reale Werte ausrollen. Keine lokalen Standardpasswörter übernehmen.

## 1. Architektur und Images

**Browser → Ingress (TLS) → Web/nginx:80 → API-Service:3001 → PostgreSQL:5432**

| Komponente | Image                                                 | Kubernetes-Ressource / Port                                       |
| ---------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| Web        | `harbor.d39s.de/library/web-jeopardy:<RELEASE>`       | Deployment + ClusterIP-Service, Containerport 80                  |
| API        | `harbor.d39s.de/library/web-jeopardy-api:<RELEASE>`   | Deployment + ClusterIP-Service, Containerport 3001                |
| DB         | PostgreSQL 17, lokal geprüft mit `postgres:17-alpine` | Bestehender DB-Service/Operator oder StatefulSet + PVC, Port 5432 |

Jenkins baut Web und API separat. Die gemeinsame Library vergibt `latest` auf main,
`br-<zweig>`, `pr-<nummer>` bzw. Versionstags aus Git-Tags. Vor dem Deployment prüfen,
ob beide Images des gewünschten Releases veröffentlicht wurden. Für reproduzierbare
Deployments vorhandene Digests oder unveränderliche Versionstags verwenden.

Zunächst je **eine Web- und API-Replik** verwenden; keine Sitzungsbindung erforderlich.
Die API ist zustandslos außer PostgreSQL. Pro API-Pod sind maximal zehn DB-Verbindungen
konfiguriert; das bei späterer Skalierung berücksichtigen.

Ingress vorzugsweise nur auf den Web-Service routen. nginx übernimmt `/api/` ohne
Pfadumschreibung. `/`, `/game` und `/review` müssen direkt und nach Neuladen funktionieren.
Deployment an der Root-URL `/` vorsehen; Betrieb unter einem Unterpfad ist nicht vorbereitet.
API und DB nicht zusätzlich per NodePort/LoadBalancer öffentlich freigeben.

## 2. Umgebungsvariablen

### Web-Pod

| Variable           | Wert / Bedeutung                                                                    |
| ------------------ | ----------------------------------------------------------------------------------- |
| `JEOPARDY_API_URL` | **Setzen:** z. B. `http://jeopardy-api:3001`, passend zum tatsächlichen API-Service |
| `JEOPARDY_WS_URL`  | Leer lassen; nur Platzhalter, kein WebSocket-Backend vorhanden                      |

`JEOPARDY_API_URL` ist die Adresse **aus Sicht des Web-Pods**, nicht die öffentliche URL.
Bei anderem Namespace z. B. `http://jeopardy-api.<NAMESPACE>.svc.cluster.local:3001`
verwenden (Cluster-DNS-Suffix an die Umgebung anpassen).
**Kein abschließender Slash und kein `/api`-Suffix.** Der Originalpfad `/api/v1/...`
muss erhalten bleiben. Default `http://api:3001` stammt aus Docker Compose und passt nur,
wenn der Kubernetes-Service tatsächlich `api` heißt.

Das nginx-Image rendert `/etc/nginx/templates/default.conf.template` beim Start. Eine
Änderung erfordert einen Pod-Rollout, keinen Frontend-Rebuild. Der Browser fragt weiterhin
dieselbe Origin unter `/api/v1` an; DB-Secrets und Schreibtoken gehören nicht ins Frontend.
API-Service **vor den Web-Pods** anlegen: nginx löst den Upstream beim Start auf und kann
bei fehlendem DNS-Namen gar nicht starten. Bei Änderung einer Service-ClusterIP Web-Pods
neu starten; die aktuelle Konfiguration nutzt keine dynamische DNS-Neuauflösung.

### API-Pod

| Variable              | Wert / Bedeutung                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `HOST`                | **`0.0.0.0` setzen**; Code-Default ist `127.0.0.1` und wäre nur im Pod erreichbar             |
| `PORT`                | `3001`                                                                                        |
| `DATABASE_URL`        | **Aus Secret:** `postgresql://<USER>:<URL_ENCODED_PASSWORD>@<DB_HOST>:5432/<DB_NAME>`         |
| `SEED_CONTENT`        | `true` für Erstbefüllung einer neuen DB; `false` zum Überspringen des Seeds                   |
| `CONTENT_DIR`         | Optional `/app/content/topics`; Seed-Dateien sind bereits im API-Image enthalten              |
| `CONTENT_WRITE_TOKEN` | Optional aus Secret; leer/nicht gesetzt deaktiviert vollständige Pool-Ersetzung               |
| `CORS_ORIGINS`        | Leer lassen für Web/nginx-Same-Origin; andere Browser-Origins explizit kommagetrennt erlauben |

`SEED_CONTENT` muss zum Abschalten exakt als String `"false"` gesetzt werden.
Passwörter in der DB-URL percent-encodieren. Falls die Datenbank TLS voraussetzt, passende
`pg`-Verbindungsparameter und CA-Bereitstellung separat festlegen und verifizieren;
Zertifikatsprüfung nicht pauschal deaktivieren.

Optionaler Secret-Aufbau: `DATABASE_URL` und `CONTENT_WRITE_TOKEN` per `secretKeyRef`;
nicht-geheime Einstellungen per ConfigMap/Deployment. Registry-Credentials separat halten.

## 3. Daten, Migrationen und Erstbefüllung

- **PostgreSQL ist die Laufzeitquelle** für Fragen, Rubriken, Themen und Bewertungen.
- Das Webimage enthält **keine Fragenpools** und benötigt keinen Content-Mount oder PVC.
- Das API-Image enthält JSON-Dateien nur als Seed-/Importquelle. Im Cluster ist dafür kein
  HostPath-Mount erforderlich; `/app/content/topics` nicht versehentlich leer übermounten.
- Jeder API-Start führt automatisch versionierte Migrationen aus (derzeit 001 und 002),
  anschließend optional den einmaligen Seed. Erst danach wird der HTTP-Port geöffnet.
- Migrationen und Initialimport sind transaktional mit PostgreSQL-Advisory-Locks geschützt.
  Dennoch Erststart/Upgrade kontrolliert mit einer API-Replik durchführen.
- Der DB-Benutzer benötigt wegen automatischer Migrationen Tabellen-/Index-DDL und DML
  im Anwendungsschema. Ein reiner Lesebenutzer reicht nicht; DB-Superuser ist nicht nötig.
- Ein vorhandener Seed-Marker oder bereits vorhandene Themen verhindern Neubefüllung.
  Neustarts/Image-Updates überschreiben keine gepflegten Fragen.
- DB-Tabellen: `topics`, `rubrics`, `questions`, `difficulty_votes`, `content_imports`,
  `schema_migrations`.

Für eine neue einzelne PostgreSQL-17-Instanz: PVC unter `/var/lib/postgresql/data`,
gegebenenfalls `PGDATA=/var/lib/postgresql/data/pgdata` wegen vorbefülltem Mount-Verzeichnis.
Nicht mehrere unabhängige PostgreSQL-Prozesse auf demselben Datadir starten. Für HA und
geregelte Backups einen vorhandenen PostgreSQL-Operator/DB-Dienst bevorzugen.

**Lokale Daten sind nicht automatisch im Cluster.** Wenn die bestehenden Fragen und
Bewertungen übernommen werden sollen: lokalen Bestand mit `pg_dump` sichern und
kontrolliert in die leere Zieldatenbank wiederherstellen, bevor die API startet.
Ein anschließender API-Start aktualisiert fehlende Migrationen. Backup vor jedem Upgrade
und regelmäßig im Betrieb; Restore testen. PVC bei Deploymentwechsel/Rollback nicht löschen.

Die vorhandenen CLI-Befehle `npm run db:migrate`, `npm run db:seed`, `npm run db:import`
sind auch im API-Image vorhanden und nutzen dessen `DATABASE_URL`.
**`db:import` nicht bei jedem Rollout ausführen:** Es ersetzt bewusst die im Index
aufgeführten Pools und kann DB-Inhalte überschreiben. Unveränderte Fragen behalten Ratings.

Spielstände, Teams und Setup-Vorgaben liegen im Browser-localStorage, nicht in PostgreSQL.
Der **Import fertiger Spiele per JSON bleibt browserlokal** und benötigt keinen Upload-Service.
Eine andere Domain/Origin hat getrennten Browser-Speicher.

## 4. Probes, Container und Netzwerk

Docker-`HEALTHCHECK` wird von Kubernetes nicht automatisch übernommen; Probes explizit setzen:

- **Web:** Readiness/Liveness HTTP `GET /` auf Port 80. Das prüft nur nginx, nicht die API.
- **API:** Startup + Readiness HTTP `GET /api/v1/health` auf Port 3001, Timeout mindestens
  5 Sekunden. Startup z. B. alle 5 Sekunden bis zu 60 Versuche, da Migration/Seed vor HTTP-Start
  laufen. Liveness zunächst TCP auf Port 3001, damit ein DB-Ausfall nicht permanent API-Pods
  neu startet. Es gibt noch keinen separaten DB-unabhängigen HTTP-Liveness-Endpunkt.
- **DB:** Bereitschaft mit `pg_isready` bzw. den Probes des gewählten Operators.

Ressourcen-Requests/Limits explizit nach Cluster-Konventionen setzen und mit Messwerten
anpassen. Vorschlag für den Anfang: Web 50m CPU/64Mi Request, 256Mi Memory-Limit;
API 100m CPU/128Mi Request, 512Mi Memory-Limit. PostgreSQL separat passend zu Datenmenge
und Operator dimensionieren. Dies sind Startwerte, keine gemessenen Anforderungen.

API läuft bereits als `USER node`, nginx-Image dagegen ohne eigenen `USER`-Override.
Kein unverifiziertes pauschales `runAsNonRoot` für Web setzen. Der Web-Entrypoint muss
nginx-Konfiguration und `/usr/share/nginx/html/config.json` schreiben; nginx benötigt zudem
Laufzeit-/Cachepfade. `readOnlyRootFilesystem` erst nach passenden Mounts/Anpassungen aktivieren.
Image-Entrypoints nicht überschreiben, sonst fehlt u. a. die API-URL-Konfiguration.

NetworkPolicies passend zu den tatsächlichen Namespace-/Podlabels erstellen:
Ingress-Controller → Web:80, Web → API:3001, API → DB:5432 und benötigtes DNS zulassen.
Monitoring-Probes/Operatorzugriffe berücksichtigen. DB-Verkehr und Secret-Zugriff begrenzen.
Ingress/nginx erlauben maximal 10 MiB für Pool-Ersetzungen; keine Pfad-Rewrite-Regel setzen.

## 5. Zugriffsschutz – vor öffentlichem Betrieb entscheiden

Die Anwendung hat **keine eigene Benutzeranmeldung**.

- Themen-/Pool-GETs und Zufallsfragen liefern auch Musterlösungen.
- `POST /api/v1/review/<topicId>/<id>/votes` verändert Ratings derzeit **ohne Authentifizierung**.
- Nur `PUT /api/v1/pools/<id>.json` ist mit `CONTENT_WRITE_TOKEN` abgesichert.
- CORS ist keine Zugriffskontrolle; die Same-Origin-Proxyroute ist von außen erreichbar.

Für öffentlich erreichbaren Betrieb daher Authentifizierung am Ingress/vorgelagerten Proxy
(z. B. vorhandenes SSO) oder vertrauenswürdiges internes Netz/VPN festlegen. Mindestens
Review-Schreibpfade schützen und Rate-Limits vorsehen; die `/review`-Seite allein zu sperren
reicht nicht. Secrets niemals in ausgelieferte Frontend-Dateien übernehmen.

**pgAdmin nicht aus dem lokalen Compose ungeprüft übernehmen:** Dort ist Login standardmäßig
deaktiviert. Kein öffentliches pgAdmin ohne Authentifizierung deployen. Administration
vorzugsweise über freigegebenen internen Dienst bzw. kontrolliertes Port-Forwarding.

`docker/jenkins-test-pod.yaml` ist ausschließlich eine flüchtige **CI-Testdatenbank** mit
`emptyDir` und Testpasswort, ausdrücklich keine Vorlage für eine produktive PostgreSQL-Instanz.

## 6. Rollout und Abnahme

1. Namespace, GitOps-Ziel, Secrets, Registryzugriff, DB/PVC, TLS und Zugriffsschutz klären.
2. Gewünschte Web-/API-Images prüfen; Backup/gegebenenfalls Datenübernahme durchführen.
3. PostgreSQL und API-Service bereitstellen; API mit `HOST=0.0.0.0` und korrekter DB-URL starten.
4. API-Logs und Startup/Readiness prüfen; Migrationen und erwarteten Fragenbestand verifizieren.
5. Web-Service/Deployment mit passender `JEOPARDY_API_URL` starten, Ingress aktivieren.
6. Über die tatsächliche Web-Origin prüfen:
   - `/api/v1/health` liefert HTTP 200 und `{ "status": "ok" }`.
   - `/api/v1/topics/index.json` liefert Themen; ein Pool lädt ohne CORS-Fehler.
   - Ein Spiel startet mit 25 Karten; `/game` und `/review` funktionieren nach Neuladen.
   - Bewertungsmodus lädt Kategoriefragen und speichert eine Testbewertung in PostgreSQL.
   - Fertiges JSON-Spiel importieren; diese Funktion auch bei nicht erreichbarer API testen.
   - API-Neustart verändert Fragen/Ratings nicht; „Neues Spiel“ übernimmt Setup, nicht Punkte.
   - Zugriffsschutz verhindert unerlaubte API-Bewertungen/Pool-Ersetzungen.
7. Deploymentparameter, Image-Digests, Probezustände, Backup/Restore und offene Probleme melden.

Rollbacks betreffen zunächst Images. DB-Migrationen haben keine automatische Down-Migration;
ein Image-Rollback setzt die DB nicht zurück. Vorher Schema-Kompatibilität prüfen und bei
notwendiger Wiederherstellung das dokumentierte Backup-/Restore-Verfahren verwenden.

Weiterführende Quellen im Repository: `Jenkinsfile`, `docker/Dockerfile`,
`docker/api.Dockerfile`, `docker/nginx.conf`, `apps/api/src/server.ts`,
`apps/api/src/database.ts` und `docs/fragen-datenbank.md`.
