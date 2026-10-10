# Lieferbericht: DevOps, Platform & Cloud (Ergänzende SQL-Lieferung)

- **Datum:** 10.10.2026
- **SQL-Datei:** `content/sql/2026-10-10-devops-platform-cloud-initial.sql`
- **Kategorie-ID:** `devops-platform-cloud`
- **Titel:** „DevOps, Platform & Cloud“
- **Sprache:** Deutsch (`de-DE`)
- **Status:** Bereitgestellt zur manuellen Übernahme durch den Betreiber (keine automatische Migration, kein produktiver Import).

---

## 1. Übersicht und Struktur

Die Lieferung legt eine neue, vollwertige Kategorie mit **6 Rubriken** und jeweils **9 Fragen** an.
Jede Rubrik deckt lückenlos alle Schwierigkeitsstufen **1 bis 9** ab, sodass bei der Spielauswahl für jede Reglerstellung (1–5) und jede Spaltenziehung optimal abgestimmte Fragen gezogen werden können.

- **Gesamtanzahl Fragen:** 54 Fragen
- **Rubriken:** 6 (mindestens 5 erforderlich, 6 ermöglichen abwechslungsreiche Ziehungen)
- **Stufen je Rubrik:** Stufen 1–9 jeweils genau 1x vertreten.

### Rubrikenübersicht

| Rubrik-ID                   | Name                           | Fragenanzahl | Stufen |
| :-------------------------- | :----------------------------- | :----------: | :----: |
| `container-linux`           | Container & Linux-Internals    |      9       |  1–9   |
| `kubernetes-orchestration`  | Kubernetes & Orchestrierung    |      9       |  1–9   |
| `ci-cd-gitops`              | CI/CD & GitOps                 |      9       |  1–9   |
| `iac-cloud-foundations`     | Infrastructure as Code & Cloud |      9       |  1–9   |
| `observability-sre`         | Observability & SRE            |      9       |  1–9   |
| `cloud-security-networking` | Cloud-Security & Networking    |      9       |  1–9   |

---

## 2. Fragen und Antworten nach Stufen

### Rubrik 1: Container & Linux-Internals (`container-linux`)

1. **Stufe 1:** _Welches quelloffene Werkzeug mit einem Wal-Logo gilt als Pionier für die breite Einführung von Software-Containern?_
   - **Antwort:** Docker
   - **Hinweis:** Docker Engine oder Docker genügen als Lösung.
2. **Stufe 2:** _Wie nennt man die schreibgeschützte Vorlage, aus der ein Docker-Container zur Laufzeit gestartet wird?_
   - **Antwort:** Image
   - **Hinweis:** Container-Image bzw. Docker-Image.
3. **Stufe 3:** _Wie lautet der Name der Standarddatei, in der Befehle zum Bauen eines Container-Images zeilenweise definiert werden?_
   - **Antwort:** Dockerfile
   - **Hinweis:** Containerfile wird ebenfalls oft verwendet.
4. **Stufe 4:** _Welches Linux-Kernel-Feature begrenzt und überwacht die Ressourcennutzung wie CPU und Arbeitsspeicher für Container?_
   - **Antwort:** cgroups
   - **Hinweis:** Control Groups bzw. cgroups v1/v2.
5. **Stufe 5:** _Welche Kernel-Mechanismen isolieren die Sicht eines Prozesses auf Ressourcen wie Prozess-IDs, Mounts und Netzwerke?_
   - **Antwort:** Namespaces
   - **Hinweis:** Linux Namespaces (z. B. pid, net, mnt, ipc, uts, user).
6. **Stufe 6:** _Welche Vereinigungsspezifikation definiert herstellerunabhängige Standards für Container-Laufzeiten und Image-Formate?_
   - **Antwort:** OCI
   - **Hinweis:** Open Container Initiative.
7. **Stufe 7:** _Welches Union-Mount-Dateisystem wird im modernen Linux-Kernel standardmäßig als Speicher-Treiber für Container-Layer genutzt?_
   - **Antwort:** OverlayFS
   - **Hinweis:** Overlay2 / OverlayFS.
8. **Stufe 8:** _Welche Sicherheitserweiterung des Linux-Kernels filtert Systemaufrufe (Syscalls) von Container-Prozessen anhand konfigurierbarer Profile?_
   - **Antwort:** seccomp
   - **Hinweis:** Secure Computing Mode bzw. seccomp-bpf.
9. **Stufe 9:** _Welcher daemonlose Container-Manager von Red Hat implementiert Pods nativ im Userspace und ersetzt Docker oft als Drop-in-CLI?_
   - **Antwort:** Podman
   - **Hinweis:** Teil der Podman/Buildah/Skopeo-Suite.

### Rubrik 2: Kubernetes & Orchestrierung (`kubernetes-orchestration`)

1. **Stufe 1:** _Wie lautet die kleinste deploybare Recheneinheit in Kubernetes, die aus einem oder mehreren eng gekoppelten Containern besteht?_
   - **Antwort:** Pod
   - **Hinweis:** Ein Pod teilt sich Netzwerk und Speicher.
2. **Stufe 2:** _Welches primäre Befehlszeilenwerkzeug steuert ein Kubernetes-Cluster von der Kommandozeile aus?_
   - **Antwort:** kubectl
   - **Hinweis:** Häufig ausgesprochen als kube-c-t-l oder kube-control.
3. **Stufe 3:** _Wie heißt die Kubernetes-Ressource, die zustandslose Anwendungen verwaltet, Replikate deklariert und Rolling Updates ausführt?_
   - **Antwort:** Deployment
   - **Hinweis:** Erzeugt und verwaltet ReplicaSets.
4. **Stufe 4:** _Welche Komponente der Control Plane speichert den gesamten Clusterzustand als verteilter Schlüssel-Wert-Speicher persistent ab?_
   - **Antwort:** etcd
   - **Hinweis:** Raft-basierter Key-Value-Store.
5. **Stufe 5:** _Welche Kubernetes-Ressource stellt sicher, dass eine Kopie eines bestimmten Pods auf jedem einzelnen Worker-Node des Clusters läuft?_
   - **Antwort:** DaemonSet
   - **Hinweis:** Häufig für Logging-, Monitoring- oder Storage-Agents genutzt.
6. **Stufe 6:** _Welche Ressource steuert HTTP- und HTTPS-Routing von außerhalb des Clusters auf interne Services auf Layer 7?_
   - **Antwort:** Ingress
   - **Hinweis:** Neuere Alternative: Kubernetes Gateway API.
7. **Stufe 7:** _Welcher Prozess läuft auf jedem einzelnen Node und ist für die Kommunikation mit der Control Plane sowie das Starten von Pods verantwortlich?_
   - **Antwort:** kubelet
   - **Hinweis:** Der Node-Agent in Kubernetes.
8. **Stufe 8:** _Welcher Admission Controller fährt Pods automatisch auf andere Nodes um, wenn diese markiert werden, und blockiert neue Zuweisungen per Taints?_
   - **Antwort:** Tolerations
   - **Hinweis:** Zusammenspiel aus Taints und Tolerations zur Node-Affinität.
9. **Stufe 9:** _Wie heißt das Entwurfsmuster in Kubernetes, bei dem benutzerdefinierte Ressourcen (CRDs) mit einer Kontrollschleife kombiniert werden?_
   - **Antwort:** Operator-Pattern
   - **Hinweis:** Kubernetes Operator Pattern / Custom Controller.

### Rubrik 3: CI/CD & GitOps (`ci-cd-gitops`)

1. **Stufe 1:** _Wofür steht das Akronym CI in der modernen Softwareentwicklung?_
   - **Antwort:** Continuous Integration
   - **Hinweis:** Kontinuierliche Integration.
2. **Stufe 2:** _Welches quelloffene Versionskontrollsystem, ursprünglich von Linus Torvalds entwickelt, bildet das Fundament für GitOps?_
   - **Antwort:** Git
   - **Hinweis:** Verteiltes Versionskontrollsystem.
3. **Stufe 3:** _Welcher klassische, erweiterbare Open-Source-Automatisierungsserver nutzt typischerweise ein Jenkinsfile für Pipeline-Definitionen?_
   - **Antwort:** Jenkins
   - **Hinweis:** Klassiker der CI-Automatisierung.
4. **Stufe 4:** _Welches integrierte CI/CD-System nutzt YAML-Dateien im Verzeichnis .github/workflows?_
   - **Antwort:** GitHub Actions
   - **Hinweis:** GitHub Actions Workflows.
5. **Stufe 5:** _Welches beliebte deklarative GitOps-Werkzeug für Kubernetes nutzt einen Controller, der Git-Zustand und Clusterzustand synchronisiert?_
   - **Antwort:** Argo CD
   - **Hinweis:** Argo CD (CNCF Graduated Project); Flux CD ist ebenfalls ein bekanntes GitOps-Tool.
6. **Stufe 6:** _Wie nennt man die Bereitstellungsstrategie, bei der zwei identische Umgebungen vorgehalten werden, um ohne Ausfallzeit per Router umzuschalten?_
   - **Antwort:** Blue-Green-Deployment
   - **Hinweis:** Blau-Grün-Bereitstellung.
7. **Stufe 7:** _Welche Release-Methode leitet zunächst nur einen winzigen Prozentsatz des echten Benutzerverkehrs auf eine neue Version um?_
   - **Antwort:** Canary-Deployment
   - **Hinweis:** Canary Release / Kanarienvogel-Deployment.
8. **Stufe 8:** _Wie nennt man Software-Artefakt-Register, die verifizierte Build-Ergebnisse, Pakete oder Container-Images mit Prüfsummen verwalten?_
   - **Antwort:** Artefakt-Repository
   - **Hinweis:** Beispiele: Nexus, Artifactory, Harbor.
9. **Stufe 9:** _Welches Linux-Foundation-Projekt bietet kryptografische Signaturen und Transparenzprotokolle zur Absicherung der Software-Supply-Chain?_
   - **Antwort:** Sigstore
   - **Hinweis:** Enthält Cosign, Rekor und Fulcio.

### Rubrik 4: Infrastructure as Code & Cloud (`iac-cloud-foundations`)

1. **Stufe 1:** _Wie lautet der dreibuchstabige Fachbegriff für die automatisierte Verwaltung und Bereitstellung von Infrastruktur über Konfigurationsdateien?_
   - **Antwort:** IaC
   - **Hinweis:** Infrastructure as Code.
2. **Stufe 2:** _Welcher Cloud-Anbieter von Amazon gilt historisch als Begründer des modernen Public-Cloud-Marktes?_
   - **Antwort:** AWS
   - **Hinweis:** Amazon Web Services.
3. **Stufe 3:** _Welches von HashiCorp entwickelte Deklarationswerkzeug verwendet Dateien mit der Endung .tf zur Infrastrukturbereitstellung?_
   - **Antwort:** Terraform
   - **Hinweis:** Nutzt HCL (HashiCorp Configuration Language).
4. **Stufe 4:** _Wie nennt man den Open-Source-Fork von Terraform, der nach der HashiCorp-Lizenzänderung unter dem Dach der Linux Foundation entstand?_
   - **Antwort:** OpenTofu
   - **Hinweis:** Entstanden als Reaktion auf den Wechsel zur BSL-Lizenz.
5. **Stufe 5:** _Welches agentenlose Konfigurationsmanagement-Werkzeug von Red Hat führt Playbooks im YAML-Format über SSH aus?_
   - **Antwort:** Ansible
   - **Hinweis:** Basiert auf Python und SSH/WinRM.
6. **Stufe 6:** _Wie bezeichnet man den Cloud-Speicherdiensttyp, der unstrukturierte Daten über HTTP-REST-APIs mit eindeutigen Schlüsseln speichert?_
   - **Antwort:** Objektspeicher
   - **Hinweis:** Object Storage (z. B. AWS S3, Google Cloud Storage, Azure Blob Storage).
7. **Stufe 7:** _Welches IaC-Framework ermöglicht die Definition von Cloud-Ressourcen in echten Programmiersprachen wie TypeScript, Python oder Go?_
   - **Antwort:** Pulumi
   - **Hinweis:** Auch AWS CDK fällt in diese Kategorie der Cloud-SDK-basierten IaC.
8. **Stufe 8:** _Wie nennt man in verteilten Systemen das Phänomen, wenn reale Cloud-Ressourcen ohne Absicht von ihrer IaC-Codebasis abweichen?_
   - **Antwort:** Configuration Drift
   - **Hinweis:** Drift oder Configuration Drift.
9. **Stufe 9:** _Welches quelloffene Kubernetes-Addon ermöglicht es, externe Cloud-Ressourcen wie SQL-Datenbanken direkt über Kubernetes-CRDs zu verwalten?_
   - **Antwort:** Crossplane
   - **Hinweis:** Crossplane ermöglicht Universal Control Planes auf K8s-Basis.

### Rubrik 5: Observability & SRE (`observability-sre`)

1. **Stufe 1:** _Wie lautet die englische Bezeichnung für chronologische Ereignisprotokolle, die Textausgaben von Anwendungen enthalten?_
   - **Antwort:** Logs
   - **Hinweis:** Logdateien / Logging.
2. **Stufe 2:** _Wie nennt man die drei klassischen Säulen der Observability in der IT?_
   - **Antwort:** Metriken, Logs und Traces
   - **Hinweis:** Metrics, Logs, Traces (auch M-L-T).
3. **Stufe 3:** _Welches führende quelloffene Visualisierungswerkzeug stellt Metriken und Zeitreihen in anpassbaren Dashboards dar?_
   - **Antwort:** Grafana
   - **Hinweis:** Quelloffene Dashboard- und Visualisierungsplattform.
4. **Stufe 4:** _Welches CNCF-Graduated-System sammelt Metriken primär über ein Pull-basiertes Scraping-Modell im Zeitreihenformat?_
   - **Antwort:** Prometheus
   - **Hinweis:** Pull-basierte Time-Series-Datenbank für Cloud-Native-Umgebungen.
5. **Stufe 5:** _Wie lautet die Abkürzung für die vertraglich vereinbarte Mindestverfügbarkeit zwischen Dienstanbieter und Kunde?_
   - **Antwort:** SLA
   - **Hinweis:** Service Level Agreement; das interne Ziel heißt SLO (Service Level Objective).
6. **Stufe 6:** _Wie bezeichnet man im Site Reliability Engineering die erlaubte Ausfallzeit oder Fehlerquote innerhalb eines definierten Zeitfensters?_
   - **Antwort:** Error Budget
   - **Hinweis:** Fehlerbudget (z. B. 0,1 % bei 99,9 % Verfügbarkeitsziel).
7. **Stufe 7:** _Welches offene Framework der CNCF vereinheitlicht SDKs und Protokolle zur Erfassung von Traces, Metriken und Logs?_
   - **Antwort:** OpenTelemetry
   - **Hinweis:** Häufig abgekürzt als OTel; Nachfolger von OpenTracing und OpenCensus.
8. **Stufe 8:** _Wie nennt man die mittlere Zeitspanne von der Entstehung eines Produktionsvorfalls bis zu seiner vollständigen Behebung?_
   - **Antwort:** MTTR
   - **Hinweis:** Mean Time to Recovery / Mean Time to Resolve / Mean Time to Repair.
9. **Stufe 9:** _Welche Linux-Kernel-Technologie ermöglicht hocheffiziente, sichere Sandboxed-Programme direkt im Kernel zur Tracing- und Netzwerkbeobachtung?_
   - **Antwort:** eBPF
   - **Hinweis:** Extended Berkeley Packet Filter.

### Rubrik 6: Cloud-Security & Networking (`cloud-security-networking`)

1. **Stufe 1:** _Welches Sicherheitsprinzip fordert, jedem Benutzer und Prozess stets nur die zwingend notwendigen Mindestrechte zu gewähren?_
   - **Antwort:** Principle of Least Privilege
   - **Hinweis:** PoLP / Prinzip der geringsten Rechte / Least Privilege.
2. **Stufe 2:** _Welche Abkürzung bezeichnet die zentrale Verwaltung von Identitäten, Rollen und Zugriffsrechten in der Cloud?_
   - **Antwort:** IAM
   - **Hinweis:** Identity and Access Management.
3. **Stufe 3:** _Wie nennt man eine isolierte, private Netzwerkumgebung innerhalb einer öffentlichen Cloud?_
   - **Antwort:** VPC
   - **Hinweis:** Virtual Private Cloud (bei Azure auch VNet genannt).
4. **Stufe 4:** _Welche zustandsbehafteten virtuellen Paketfilter fungieren in Clouds als Firewall auf Instanz- oder Schnittstellenebene?_
   - **Antwort:** Security Groups
   - **Hinweis:** Sicherheitsgruppen / Security Groups (in AWS und OpenStack).
5. **Stufe 5:** _Welche Technologie verschlüsselt und authentifiziert Netzwerkverkehr transparent zwischen Microservices mittels Service Mesh?_
   - **Antwort:** mTLS
   - **Hinweis:** Mutual TLS / gegenseitiges TLS.
6. **Stufe 6:** _Welches quelloffene Werkzeug von HashiCorp verwaltet Tokens, Passwörter, Zertifikate und dynamische API-Schlüssel sicher?_
   - **Antwort:** Vault
   - **Hinweis:** HashiCorp Vault.
7. **Stufe 7:** _Wie nennt man eine formalisierte Aufstellung aller in einer Software enthaltenen Komponenten und Bibliotheken zur Schwachstellenprüfung?_
   - **Antwort:** SBOM
   - **Hinweis:** Software Bill of Materials (z. B. im CycloneDX- oder SPDX-Format).
8. **Stufe 8:** _Welcher eBPF-basierte Netzwerk- und Sicherheits-Layer ersetzt oft kube-proxy und implementiert hochperformante L3-L7-NetworkPolicies?_
   - **Antwort:** Cilium
   - **Hinweis:** Cilium (CNCF Graduated Project).
9. **Stufe 9:** _Wie heißt die OPA-eigene deklarative Abfragesprache, mit der feingranulare Autorisierungs- und Admission-Richtlinien definiert werden?_
   - **Antwort:** Rego
   - **Hinweis:** Rego (Abfragesprache der Open Policy Agent / OPA Engine).

---

## 3. ID-Strategie und Schemakonformität

- **Kategorie-ID:** `devops-platform-cloud` (1–64 Zeichen, `^[a-z0-9][a-z0-9-]*$`)
- **Rubrik-IDs:** `container-linux`, `kubernetes-orchestration`, `ci-cd-gitops`, `iac-cloud-foundations`, `observability-sre`, `cloud-security-networking` (jeweils <= 40 Zeichen)
- **Frage-IDs:** Präfix je Rubrik + 6-stellige zufällige Lieferungskennung + Stufennummer (z. B. `cont-f4a1c8-1` bis `cont-f4a1c8-9`), strikt eindeutig innerhalb der Kategorie und kollisionssicher.
- **Zeichenlängen:** Alle Titel, Namen, Fragen, Antworten und Notizen halten die strikten DB- und Zod-Limits ein (Fragen/Antworten <= 500 Zeichen, Titel <= 80 Zeichen, Rubriknamen <= 40 Zeichen).
- **Initialwerte:** `level = source_level = difficulty_score = Stufe (1–9)`; Bewertungszähler starten bei `0`.

---

## 4. Quellen und Fachliche Absicherung

- **Linux & Kernel:** Offizielle Linux-Dokumentation (cgroups v2, namespaces, seccomp-bpf, overlayfs).
- **Container & Orchestrierung:** Open Container Initiative (OCI Runtime & Image Spec), Kubernetes Official Documentation (Concepts: Pods, Deployments, etcd, DaemonSets, Ingress, kubelet, Taints & Tolerations, Operator pattern).
- **CI/CD & Supply Chain:** Continuous Delivery Foundation, Git-SCM Dokumentation, Argo CD Docs, CNCF Sigstore (Cosign / Rekor).
- **IaC:** OpenTofu / HashiCorp HCL Docs, Pulumi Dokumentation, Crossplane CNCF Docs.
- **SRE & Observability:** Google SRE Book (SLI/SLO/SLA, Error Budgets, MTTR), CNCF OpenTelemetry & Prometheus Docs, eBPF Foundation.
- **Security:** NIST SP 800-207 (Zero Trust Architecture), CIS Benchmarks, Open Policy Agent (Rego Language Docs), Cilium Docs.

---

## 5. Prüfergebnis und Grenzen der Prüfung

- **Format & Syntax:** Gültiges PostgreSQL-Skript mit Transaktion (`BEGIN` ... `COMMIT`), Tabellen-Locks und Advisory-Lock (`391002`).
- **Idempotenz:** Mehrfache Ausführung ist durch `ON CONFLICT ... DO NOTHING` und Konfliktprüfungen abgesichert.
- **Hinweis zum Import:** Die Datei wurde **nicht** in die produktive Datenbank eingespielt. Der Betreiber kann die Datei bei Bedarf eigenständig im `pgAdmin Query Tool` oder via `psql` prüfen und ausführen.
