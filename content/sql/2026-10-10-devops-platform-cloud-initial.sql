-- Ergänzende PostgreSQL-Inhaltsergänzung: DevOps / Platform / Cloud
-- Datei: content/sql/2026-10-10-devops-platform-cloud-initial.sql
-- Keine bestehenden Themen, Fragen, Scores oder Historien ändern.
BEGIN;
SELECT pg_advisory_xact_lock(391002);
LOCK TABLE topics, rubrics, questions IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE input_topics (
  id varchar(64) PRIMARY KEY,
  title varchar(80) NOT NULL,
  description varchar(300),
  author varchar(80),
  locale varchar(20)
) ON COMMIT DROP;
CREATE TEMP TABLE input_rubrics (
  topic_id varchar(64) NOT NULL,
  id varchar(64) NOT NULL,
  name varchar(40) NOT NULL,
  color varchar(9),
  PRIMARY KEY (topic_id, id)
) ON COMMIT DROP;
CREATE TEMP TABLE input_questions (
  topic_id varchar(64) NOT NULL,
  rubric_id varchar(64) NOT NULL,
  id varchar(64) NOT NULL,
  source_level smallint NOT NULL CHECK (source_level BETWEEN 1 AND 9),
  question varchar(500) NOT NULL,
  answer varchar(500) NOT NULL,
  note varchar(500),
  PRIMARY KEY (topic_id, id)
) ON COMMIT DROP;

-- INPUT_TOPICS: Neue Kategorie
INSERT INTO input_topics (id, title, description, author, locale) VALUES
('devops-platform-cloud', 'DevOps, Platform & Cloud', 'Fragen rund um Containerisierung, Cloud-Plattformen, CI/CD, Infrastructure as Code, Observability und Kubernetes.', 'Community', 'de-DE');

-- INPUT_RUBRICS: 6 Rubriken
INSERT INTO input_rubrics (topic_id, id, name, color) VALUES
('devops-platform-cloud', 'container-linux', 'Container & Linux-Internals', NULL),
('devops-platform-cloud', 'kubernetes-orchestration', 'Kubernetes & Orchestrierung', NULL),
('devops-platform-cloud', 'ci-cd-gitops', 'CI/CD & GitOps', NULL),
('devops-platform-cloud', 'iac-cloud-foundations', 'Infrastructure as Code & Cloud', NULL),
('devops-platform-cloud', 'observability-sre', 'Observability & SRE', NULL),
('devops-platform-cloud', 'cloud-security-networking', 'Cloud-Security & Networking', NULL);

-- INPUT_QUESTIONS: 54 Fragen (6 Rubriken x 9 Stufen 1-9)
INSERT INTO input_questions (topic_id, rubric_id, id, source_level, question, answer, note) VALUES
-- Rubrik 1: Container & Linux-Internals (container-linux)
('devops-platform-cloud', 'container-linux', 'cont-f4a1c8-1', 1, 'Welches quelloffene Werkzeug mit einem Wal-Logo gilt als Pionier für die breite Einführung von Software-Containern?', 'Docker', 'Docker Engine oder Docker genügen als Lösung.'),
('devops-platform-cloud', 'container-linux', 'cont-f4a1c8-2', 2, 'Wie nennt man die schreibgeschützte Vorlage, aus der ein Docker-Container zur Laufzeit gestartet wird?', 'Image', 'Container-Image bzw. Docker-Image.'),
('devops-platform-cloud', 'container-linux', 'cont-f4a1c8-3', 3, 'Wie lautet der Name der Standarddatei, in der Befehle zum Bauen eines Container-Images zeilenweise definiert werden?', 'Dockerfile', 'Containerfile wird ebenfalls oft verwendet.'),
('devops-platform-cloud', 'container-linux', 'cont-f4a1c8-4', 4, 'Welches Linux-Kernel-Feature begrenzt und überwacht die Ressourcennutzung wie CPU und Arbeitsspeicher für Container?', 'cgroups', 'Control Groups bzw. cgroups v1/v2.'),
('devops-platform-cloud', 'container-linux', 'cont-f4a1c8-5', 5, 'Welche Kernel-Mechanismen isolieren die Sicht eines Prozesses auf Ressourcen wie Prozess-IDs, Mounts und Netzwerke?', 'Namespaces', 'Linux Namespaces (z. B. pid, net, mnt, ipc, uts, user).'),
('devops-platform-cloud', 'container-linux', 'cont-f4a1c8-6', 6, 'Welche Vereinigungsspezifikation definiert herstellerunabhängige Standards für Container-Laufzeiten und Image-Formate?', 'OCI', 'Open Container Initiative.'),
('devops-platform-cloud', 'container-linux', 'cont-f4a1c8-7', 7, 'Welches Union-Mount-Dateisystem wird im modernen Linux-Kernel standardmäßig als Speicher-Treiber für Container-Layer genutzt?', 'OverlayFS', 'Overlay2 / OverlayFS.'),
('devops-platform-cloud', 'container-linux', 'cont-f4a1c8-8', 8, 'Welche Sicherheitserweiterung des Linux-Kernels filtert Systemaufrufe (Syscalls) von Container-Prozessen anhand konfigurierbarer Profile?', 'seccomp', 'Secure Computing Mode bzw. seccomp-bpf.'),
('devops-platform-cloud', 'container-linux', 'cont-f4a1c8-9', 9, 'Welcher daemonlose Container-Manager von Red Hat implementiert Pods nativ im Userspace und ersetzt Docker oft als Drop-in-CLI?', 'Podman', 'Teil der Podman/Buildah/Skopeo-Suite.'),

-- Rubrik 2: Kubernetes & Orchestrierung (kubernetes-orchestration)
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-b92e71-1', 1, 'Wie lautet die kleinste deploybare Recheneinheit in Kubernetes, die aus einem oder mehreren eng gekoppelten Containern besteht?', 'Pod', 'Ein Pod teilt sich Netzwerk und Speicher.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-b92e71-2', 2, 'Welches primäre Befehlszeilenwerkzeug steuert ein Kubernetes-Cluster von der Kommandozeile aus?', 'kubectl', 'Häufig ausgesprochen als kube-c-t-l oder kube-control.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-b92e71-3', 3, 'Wie heißt die Kubernetes-Ressource, die zustandslose Anwendungen verwaltet, Replikate deklariert und Rolling Updates ausführt?', 'Deployment', 'Erzeugt und verwaltet ReplicaSets.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-b92e71-4', 4, 'Welche Komponente der Control Plane speichert den gesamten Clusterzustand als verteilter Schlüssel-Wert-Speicher persistent ab?', 'etcd', 'Raft-basierter Key-Value-Store.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-b92e71-5', 5, 'Welche Kubernetes-Ressource stellt sicher, dass eine Kopie eines bestimmten Pods auf jedem einzelnen Worker-Node des Clusters läuft?', 'DaemonSet', 'Häufig für Logging-, Monitoring- oder Storage-Agents genutzt.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-b92e71-6', 6, 'Welche Ressource steuert HTTP- und HTTPS-Routing von außerhalb des Clusters auf interne Services auf Layer 7?', 'Ingress', 'Neuere Alternative: Kubernetes Gateway API.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-b92e71-7', 7, 'Welcher Prozess läuft auf jedem einzelnen Node und ist für die Kommunikation mit der Control Plane sowie das Starten von Pods verantwortlich?', 'kubelet', 'Der Node-Agent in Kubernetes.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-b92e71-8', 8, 'Welcher Admission Controller fährt Pods automatisch auf andere Nodes um, wenn diese markiert werden, und blockiert neue Zuweisungen per Taints?', 'Tolerations', 'Zusammenspiel aus Taints und Tolerations zur Node-Affinität.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-b92e71-9', 9, 'Wie heißt das Entwurfsmuster in Kubernetes, bei dem benutzerdefinierte Ressourcen (CRDs) mit einer Kontrollschleife kombiniert werden?', 'Operator-Pattern', 'Kubernetes Operator Pattern / Custom Controller.'),

-- Rubrik 3: CI/CD & GitOps (ci-cd-gitops)
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-d38a05-1', 1, 'Wofür steht das Akronym CI in der modernen Softwareentwicklung?', 'Continuous Integration', 'Kontinuierliche Integration.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-d38a05-2', 2, 'Welches quelloffene Versionskontrollsystem, ursprünglich von Linus Torvalds entwickelt, bildet das Fundament für GitOps?', 'Git', 'Verteiltes Versionskontrollsystem.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-d38a05-3', 3, 'Welcher klassische, erweiterbare Open-Source-Automatisierungsserver nutzt typischerweise ein Jenkinsfile für Pipeline-Definitionen?', 'Jenkins', 'Klassiker der CI-Automatisierung.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-d38a05-4', 4, 'Welches integrierte CI/CD-System nutzt YAML-Dateien im Verzeichnis .github/workflows?', 'GitHub Actions', 'GitHub Actions Workflows.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-d38a05-5', 5, 'Welches beliebte deklarative GitOps-Werkzeug für Kubernetes nutzt einen Controller, der Git-Zustand und Clusterzustand synchronisiert?', 'Argo CD', 'Argo CD (CNCF Graduated Project); Flux CD ist ebenfalls ein bekanntes GitOps-Tool.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-d38a05-6', 6, 'Wie nennt man die Bereitstellungsstrategie, bei der zwei identische Umgebungen vorgehalten werden, um ohne Ausfallzeit per Router umzuschalten?', 'Blue-Green-Deployment', 'Blau-Grün-Bereitstellung.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-d38a05-7', 7, 'Welche Release-Methode leitet zunächst nur einen winzigen Prozentsatz des echten Benutzerverkehrs auf eine neue Version um?', 'Canary-Deployment', 'Canary Release / Kanarienvogel-Deployment.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-d38a05-8', 8, 'Wie nennt man Software-Artefakt-Register, die verifizierte Build-Ergebnisse, Pakete oder Container-Images mit Prüfsummen verwalten?', 'Artefakt-Repository', 'Beispiele: Nexus, Artifactory, Harbor.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-d38a05-9', 9, 'Welches Linux-Foundation-Projekt bietet kryptografische Signaturen und Transparenzprotokolle zur Absicherung der Software-Supply-Chain?', 'Sigstore', 'Enthält Cosign, Rekor und Fulcio.'),

-- Rubrik 4: Infrastructure as Code & Cloud (iac-cloud-foundations)
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-c56e29-1', 1, 'Wie lautet der dreibuchstabige Fachbegriff für die automatisierte Verwaltung und Bereitstellung von Infrastruktur über Konfigurationsdateien?', 'IaC', 'Infrastructure as Code.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-c56e29-2', 2, 'Welcher Cloud-Anbieter von Amazon gilt historisch als Begründer des modernen Public-Cloud-Marktes?', 'AWS', 'Amazon Web Services.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-c56e29-3', 3, 'Welches von HashiCorp entwickelte Deklarationswerkzeug verwendet Dateien mit der Endung .tf zur Infrastrukturbereitstellung?', 'Terraform', 'Nutzt HCL (HashiCorp Configuration Language).'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-c56e29-4', 4, 'Wie nennt man den Open-Source-Fork von Terraform, der nach der HashiCorp-Lizenzänderung unter dem Dach der Linux Foundation entstand?', 'OpenTofu', 'Entstanden als Reaktion auf den Wechsel zur BSL-Lizenz.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-c56e29-5', 5, 'Welches agentenlose Konfigurationsmanagement-Werkzeug von Red Hat führt Playbooks im YAML-Format über SSH aus?', 'Ansible', 'Basiert auf Python und SSH/WinRM.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-c56e29-6', 6, 'Wie bezeichnet man den Cloud-Speicherdiensttyp, der unstrukturierte Daten über HTTP-REST-APIs mit eindeutigen Schlüsseln speichert?', 'Objektspeicher', 'Object Storage (z. B. AWS S3, Google Cloud Storage, Azure Blob Storage).'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-c56e29-7', 7, 'Welches IaC-Framework ermöglicht die Definition von Cloud-Ressourcen in echten Programmiersprachen wie TypeScript, Python oder Go?', 'Pulumi', 'Auch AWS CDK fällt in diese Kategorie der Cloud-SDK-basierten IaC.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-c56e29-8', 8, 'Wie nennt man in verteilten Systemen das Phänomen, wenn reale Cloud-Ressourcen ohne Absicht von ihrer IaC-Codebasis abweichen?', 'Configuration Drift', 'Drift oder Configuration Drift.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-c56e29-9', 9, 'Welches quelloffene Kubernetes-Addon ermöglicht es, externe Cloud-Ressourcen wie SQL-Datenbanken direkt über Kubernetes-CRDs zu verwalten?', 'Crossplane', 'Crossplane ermöglicht Universal Control Planes auf K8s-Basis.'),

-- Rubrik 5: Observability & SRE (observability-sre)
('devops-platform-cloud', 'observability-sre', 'obs-e81f44-1', 1, 'Wie lautet die englische Bezeichnung für chronologische Ereignisprotokolle, die Textausgaben von Anwendungen enthalten?', 'Logs', 'Logdateien / Logging.'),
('devops-platform-cloud', 'observability-sre', 'obs-e81f44-2', 2, 'Wie nennt man die drei klassischen Säulen der Observability in der IT?', 'Metriken, Logs und Traces', 'Metrics, Logs, Traces (auch M-L-T).'),
('devops-platform-cloud', 'observability-sre', 'obs-e81f44-3', 3, 'Welches führende quelloffene Visualisierungswerkzeug stellt Metriken und Zeitreihen in anpassbaren Dashboards dar?', 'Grafana', 'Quelloffene Dashboard- und Visualisierungsplattform.'),
('devops-platform-cloud', 'observability-sre', 'obs-e81f44-4', 4, 'Welches CNCF-Graduated-System sammelt Metriken primär über ein Pull-basiertes Scraping-Modell im Zeitreihenformat?', 'Prometheus', 'Pull-basierte Time-Series-Datenbank für Cloud-Native-Umgebungen.'),
('devops-platform-cloud', 'observability-sre', 'obs-e81f44-5', 5, 'Wie lautet die Abkürzung für die vertraglich vereinbarte Mindestverfügbarkeit zwischen Dienstanbieter und Kunde?', 'SLA', 'Service Level Agreement; das interne Ziel heißt SLO (Service Level Objective).'),
('devops-platform-cloud', 'observability-sre', 'obs-e81f44-6', 6, 'Wie bezeichnet man im Site Reliability Engineering die erlaubte Ausfallzeit oder Fehlerquote innerhalb eines definierten Zeitfensters?', 'Error Budget', 'Fehlerbudget (z. B. 0,1 % bei 99,9 % Verfügbarkeitsziel).'),
('devops-platform-cloud', 'observability-sre', 'obs-e81f44-7', 7, 'Welches offene Framework der CNCF vereinheitlicht SDKs und Protokolle zur Erfassung von Traces, Metriken und Logs?', 'OpenTelemetry', 'Häufig abgekürzt als OTel; Nachfolger von OpenTracing und OpenCensus.'),
('devops-platform-cloud', 'observability-sre', 'obs-e81f44-8', 8, 'Wie nennt man die mittlere Zeitspanne von der Entstehung eines Produktionsvorfalls bis zu seiner vollständigen Behebung?', 'MTTR', 'Mean Time to Recovery / Mean Time to Resolve / Mean Time to Repair.'),
('devops-platform-cloud', 'observability-sre', 'obs-e81f44-9', 9, 'Welche Linux-Kernel-Technologie ermöglicht hocheffiziente, sichere Sandboxed-Programme direkt im Kernel zur Tracing- und Netzwerkbeobachtung?', 'eBPF', 'Extended Berkeley Packet Filter.'),

-- Rubrik 6: Cloud-Security & Networking (cloud-security-networking)
('devops-platform-cloud', 'cloud-security-networking', 'sec-a73c12-1', 1, 'Welches Sicherheitsprinzip fordert, jedem Benutzer und Prozess stets nur die zwingend notwendigen Mindestrechte zu gewähren?', 'Principle of Least Privilege', 'PoLP / Prinzip der geringsten Rechte / Least Privilege.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-a73c12-2', 2, 'Welche Abkürzung bezeichnet die zentrale Verwaltung von Identitäten, Rollen und Zugriffsrechten in der Cloud?', 'IAM', 'Identity and Access Management.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-a73c12-3', 3, 'Wie nennt man eine isolierte, private Netzwerkumgebung innerhalb einer öffentlichen Cloud?', 'VPC', 'Virtual Private Cloud (bei Azure auch VNet genannt).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-a73c12-4', 4, 'Welche zustandsbehafteten virtuellen Paketfilter fungieren in Clouds als Firewall auf Instanz- oder Schnittstellenebene?', 'Security Groups', 'Sicherheitsgruppen / Security Groups (in AWS und OpenStack).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-a73c12-5', 5, 'Welche Technologie verschlüsselt und authentifiziert Netzwerkverkehr transparent zwischen Microservices mittels Service Mesh?', 'mTLS', 'Mutual TLS / gegenseitiges TLS.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-a73c12-6', 6, 'Welches quelloffene Werkzeug von HashiCorp verwaltet Tokens, Passwörter, Zertifikate und dynamische API-Schlüssel sicher?', 'Vault', 'HashiCorp Vault.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-a73c12-7', 7, 'Wie nennt man eine formalisierte Aufstellung aller in einer Software enthaltenen Komponenten und Bibliotheken zur Schwachstellenprüfung?', 'SBOM', 'Software Bill of Materials (z. B. im CycloneDX- oder SPDX-Format).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-a73c12-8', 8, 'Welcher eBPF-basierte Netzwerk- und Sicherheits-Layer ersetzt oft kube-proxy und implementiert hochperformante L3-L7-NetworkPolicies?', 'Cilium', 'Cilium (CNCF Graduated Project).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-a73c12-9', 9, 'Wie heißt die OPA-eigene deklarative Abfragesprache, mit der feingranulare Autorisierungs- und Admission-Richtlinien definiert werden?', 'Rego', 'Rego (Abfragesprache der Open Policy Agent / OPA Engine).');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM input_questions) THEN
    RAISE EXCEPTION 'Keine Fragen geliefert: SQL-Vorlage zuerst ausfüllen.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM input_topics i JOIN topics t USING (id)
    WHERE (i.title, i.description, i.author, i.locale)
      IS DISTINCT FROM (t.title, t.description, t.author, t.locale)
  ) OR EXISTS (
    SELECT 1 FROM input_rubrics i JOIN rubrics r USING (topic_id, id)
    WHERE (i.name, i.color) IS DISTINCT FROM (r.name, r.color)
  ) OR EXISTS (
    SELECT 1 FROM input_questions i JOIN questions q USING (topic_id, id)
    WHERE (i.rubric_id, i.source_level, i.question, i.answer, i.note)
      IS DISTINCT FROM (q.rubric_id, q.source_level, q.question, q.answer, q.note)
  ) THEN
    RAISE EXCEPTION 'ID-Konflikt mit anderem Inhalt; vorhandene Daten bleiben unverändert.';
  END IF;
  IF EXISTS (
    SELECT id FROM input_topics WHERE id !~ '^[a-z0-9][a-z0-9-]*$' OR length(trim(title)) = 0
    UNION ALL
    SELECT id FROM input_rubrics WHERE id !~ '^[a-z0-9][a-z0-9-]*$'
      OR topic_id !~ '^[a-z0-9][a-z0-9-]*$' OR length(trim(name)) = 0
    UNION ALL
    SELECT id FROM input_questions WHERE id !~ '^[a-z0-9][a-z0-9-]*$'
      OR topic_id !~ '^[a-z0-9][a-z0-9-]*$' OR rubric_id !~ '^[a-z0-9][a-z0-9-]*$'
      OR length(trim(question)) = 0 OR length(trim(answer)) = 0
  ) THEN
    RAISE EXCEPTION 'Ungültige ID oder leerer Pflichttext.';
  END IF;
END $$;

WITH fresh AS (
  SELECT i.* FROM input_topics i WHERE NOT EXISTS (SELECT 1 FROM topics t WHERE t.id = i.id)
)
INSERT INTO topics (id, title, description, author, locale, position)
SELECT id, title, description, author, locale,
  (SELECT COALESCE(MAX(position), -1) FROM topics) + ROW_NUMBER() OVER (ORDER BY id)
FROM fresh
ON CONFLICT (id) DO NOTHING;

WITH fresh AS (
  SELECT i.* FROM input_rubrics i
  WHERE NOT EXISTS (SELECT 1 FROM rubrics r WHERE r.topic_id = i.topic_id AND r.id = i.id)
)
INSERT INTO rubrics (topic_id, id, name, color, position)
SELECT topic_id, id, name, color,
  COALESCE((SELECT MAX(r.position) FROM rubrics r WHERE r.topic_id = fresh.topic_id), -1)
    + ROW_NUMBER() OVER (PARTITION BY topic_id ORDER BY id)
FROM fresh
ON CONFLICT (topic_id, id) DO NOTHING;

WITH fresh AS (
  SELECT i.* FROM input_questions i
  WHERE NOT EXISTS (SELECT 1 FROM questions q WHERE q.topic_id = i.topic_id AND q.id = i.id)
)
INSERT INTO questions (
  topic_id, rubric_id, id, level, source_level, difficulty_score, question, answer, note, position,
  fits_votes, too_hard_votes, too_easy_votes, unsure_votes
)
SELECT topic_id, rubric_id, id, source_level, source_level, source_level, question, answer, note,
  COALESCE((SELECT MAX(q.position) FROM questions q
    WHERE q.topic_id = fresh.topic_id AND q.rubric_id = fresh.rubric_id), -1)
    + ROW_NUMBER() OVER (PARTITION BY topic_id, rubric_id ORDER BY id),
  0, 0, 0, 0
FROM fresh
ON CONFLICT (topic_id, id) DO NOTHING;

-- Auch für reine Ergänzungen muss der fertige Gesamtpool spielbar bleiben.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM topics t
    WHERE t.id IN (SELECT id FROM input_topics UNION SELECT topic_id FROM input_rubrics
      UNION SELECT topic_id FROM input_questions)
      AND (SELECT COUNT(*) FROM rubrics r WHERE r.topic_id = t.id) < 5
  ) OR EXISTS (
    SELECT 1 FROM rubrics r
    WHERE r.topic_id IN (SELECT id FROM input_topics UNION SELECT topic_id FROM input_rubrics
      UNION SELECT topic_id FROM input_questions)
      AND (SELECT COUNT(*) FROM questions q
        WHERE q.topic_id = r.topic_id AND q.rubric_id = r.id) < 5
  ) THEN
    RAISE EXCEPTION 'Pool unvollständig: mindestens 5 Rubriken mit je 5 Fragen erforderlich.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM rubrics r JOIN questions q ON q.topic_id = r.topic_id AND q.id = r.id
    WHERE r.topic_id IN (SELECT id FROM input_topics UNION SELECT topic_id FROM input_rubrics
      UNION SELECT topic_id FROM input_questions)
  ) THEN
    RAISE EXCEPTION 'Rubrik- und Frage-IDs dürfen sich pro Kategorie nicht überschneiden.';
  END IF;
END $$;

-- Weitere Strukturregeln separat mit validateQuestionPool prüfen; gleiche Texte sind erlaubt.
COMMIT;
