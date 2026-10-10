-- Ergänzende PostgreSQL-Inhaltsergänzung: DevOps / Platform / Cloud (300 weitere Fragen)
-- Datei: content/sql/2026-10-10-devops-platform-cloud-expansion.sql
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

-- INPUT_TOPICS: Kategorie existiert bereits im Zielbestand, bleibt als Referenz unverändert leer.
-- INPUT_RUBRICS: Rubriken existieren bereits im Zielbestand, werden direkt in Fragen referenziert.

-- INPUT_QUESTIONS: 300 neue Fragen (6 Rubriken x 50 Fragen)
INSERT INTO input_questions (topic_id, rubric_id, id, source_level, question, answer, note) VALUES
-- Rubrik: Container & Linux-Internals (container-linux) - 50 Fragen
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-1', 1, 'Welches Kommandozeilen-Tool wird standardmäßig mit dem Befehl "docker run" ausgeführt?', 'Docker', 'Docker CLI / Docker Engine.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-2', 1, 'Mit welchem Docker-Befehl stoppt man einen laufenden Container?', 'docker stop', 'docker stop <container_id/name>'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-3', 1, 'Wie nennt man die zentrale öffentliche Registry von Docker zum Herunterladen von Images?', 'Docker Hub', 'hub.docker.com'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-4', 1, 'Welche Dateiendung hat ein Tar-Archiv typischerweise, das beim Exportieren von Container-Dateisystemen entsteht?', '.tar', 'Tarball / Tape Archive.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-5', 1, 'Mit welchem Befehl listet Docker alle aktuell laufenden Container auf?', 'docker ps', 'Alternativ auch docker container ls.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-6', 1, 'Wie lautet der Befehl, um ein Image von einer Registry lokal herunterzuladen?', 'docker pull', 'docker pull <image>'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-7', 2, 'Welche Dockerfile-Instruktion legt das Basis-Image für den Build-Prozess fest?', 'FROM', 'Beginnt fast jedes Dockerfile.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-8', 2, 'Mit welcher Dockerfile-Anweisung kopiert man Dateien aus dem Build-Kontext in das Image?', 'COPY', 'ADD kann zusätzlich Archive entpacken und URLs laden.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-9', 2, 'Welche Instruktion im Dockerfile führt einen Befehl während des Image-Builds aus und erzeugt eine neue Schicht?', 'RUN', 'RUN führt Befehle wie apt-get oder npm install aus.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-10', 2, 'Mit welcher Instruktion definiert man den Standardbefehl, der beim Starten eines Containers ausgeführt werden soll?', 'CMD', 'Wird oft zusammen mit ENTRYPOINT verwendet.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-11', 2, 'Welcher CLI-Schalter bei "docker run" sorgt dafür, dass der Container im Hintergrund ausgeführt wird?', '-d', 'Detached Mode (--detach bzw. -d).'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-12', 2, 'Welches Docker-Kommando entfernt alle ungenutzten Container, Netzwerke und ungetaggten Images auf einmal?', 'docker system prune', 'Bereinigung von dangling resources.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-13', 3, 'Wie nennt man den Build-Ansatz, bei dem mehrere FROM-Zeilen in einem Dockerfile genutzt werden, um Build-Tools aus dem End-Image fernzuhalten?', 'Multi-Stage Build', 'Mehrstufige Builds zur Image-Verkleinerung.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-14', 3, 'Welcher Mechanismus in Docker sorgt dafür, dass unveränderte Schichten beim erneuten Bauen nicht neu berechnet werden müssen?', 'Build-Cache', 'Layer-Caching / Build Cache.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-15', 3, 'Welche Datei im Projektstamm verhindert wie eine .gitignore-Datei, dass sensible Dateien in den Docker-Build-Kontext gelangen?', '.dockerignore', 'Schließt Dateien vom Build-Kontext aus.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-16', 3, 'Welcher Speichermechanismus in Docker speichert Daten direkt auf dem Host-Dateisystem außerhalb des Union-Dateisystems des Containers persistent ab?', 'Volume', 'Docker Volumes oder Bind Mounts.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-17', 3, 'Welche minimale Linux-Distribution wird aufgrund ihrer extrem kleinen Image-Größe von nur wenigen Megabytes sehr häufig als Basis-Image gewählt?', 'Alpine Linux', 'Nutzt musl libc und BusyBox.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-18', 3, 'Mit welchem Docker-Befehl kann man sich interaktiv in die laufende Shell eines Containers einklinken?', 'docker exec', 'docker exec -it <container> sh / bash.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-19', 4, 'Welcher Container-Standard von OCI beschreibt die JSON-basierte Spezifikation zur Erstellung und Ausführung von Containern auf Betriebssystemebene?', 'Runtime Specification', 'OCI Runtime Spec; Referenzimplementierung ist runc.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-20', 4, 'Wie heißt die leichtgewichtige OCI-Referenz-Laufzeitumgebung (Low-Level-Runtime), die ursprünglich von Docker als libcontainer entwickelt wurde?', 'runc', 'Wird von containerd und CRI-O als Default-Runtime genutzt.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-21', 4, 'Welcher Linux-Namespace sorgt dafür, dass Prozesse im Container ihre eigene isolierte Prozessbaum-Hierarchie beginnend bei PID 1 sehen?', 'PID-Namespace', 'Process ID Namespace.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-22', 4, 'Welcher Linux-Namespace isoliert Netzwerkinterfaces, Routingtabellen und IP-Ports für jeden Container?', 'Network-Namespace', 'Net-Namespace.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-23', 4, 'Welcher Daemon verwaltet auf modernen Linux-Systemen den vollständigen Container-Lebenszyklus von Image-Transfer bis Container-Ausführung unterhalb von Docker?', 'containerd', 'CNCF Graduated Runtime-Daemon.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-24', 4, 'Wie nennt man den virtuellen Ethernet-Paar-Typ in Linux, der Netzwerkverkehr zwischen einem Container-Netns und der Host-Bridge vermittelt?', 'veth-Pair', 'Virtual Ethernet Pair (veth).'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-25', 5, 'Welcher Linux-Namespace isoliert Hostnamen und Domainnamen des Containers vom Host-Betriebssystem?', 'UTS-Namespace', 'UNIX Timesharing System Namespace.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-26', 5, 'Welcher Linux-Namespace ermöglicht es Prozessen, eigene Dateisystem-Einhängungen (Mounts) isoliert zu verwalten?', 'Mount-Namespace', 'MNT-Namespace.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-27', 5, 'Welche Version der Linux Control Groups führte eine strikte einheitliche Hierarchie ohne getrennte Controller-Bäume ein?', 'cgroups v2', 'Unified cgroups hierarchy in modernen Linux-Distributionen.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-28', 5, 'Mit welchem Red-Hat-Tool können Container-Images ohne Daemon und ohne Root-Rechte nach OCI-Standard gebaut werden?', 'Buildah', 'Teil des Trios Podman/Buildah/Skopeo.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-29', 5, 'Welches schlanke Tool aus der Podman-Familie dient speziell zum Kopieren und Inspizieren von Container-Images zwischen Registries ohne Daemon?', 'Skopeo', 'skopeo copy / inspect.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-30', 5, 'Wie nennt man Images, die für mehrere verschiedene CPU-Architekturen wie amd64 und arm64 über ein gemeinsames Manifest verfügbar sind?', 'Multi-Arch-Images', 'Verwendet OCI Image Index bzw. Docker Manifest List.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-31', 6, 'Welcher Linux-Namespace erlaubt es einem unprivilegierten Benutzer auf dem Host, innerhalb des Containers scheinbar Root-Rechte (UID 0) zu besitzen?', 'User-Namespace', 'Ermöglicht Rootless Containers.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-32', 6, 'Welches Linux-Sicherheitsmodul (LSM) erzwingt in Red Hat Enterprise Linux und Fedora Mandatory Access Control (MAC) für Container?', 'SELinux', 'Security-Enhanced Linux; Ubuntu setzt meist auf AppArmor.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-33', 6, 'Welche Standard-C-Bibliothek nutzt Alpine Linux anstelle der sonst üblichen GNU C Library (glibc)?', 'musl', 'musl libc.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-34', 6, 'Welcher Befehl im Linux-Kernel trennt Systemressourcen eines aufgerufenen Programms in neue Namespaces ab, ohne fork() aufzurufen?', 'unshare', 'Syscall unshare() bzw. CLI unshare.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-35', 6, 'Wie heißt die OCI-spezifische Datei, die nach "runc spec" erzeugt wird und die vollständige Container-Konfiguration enthält?', 'config.json', 'OCI runtime bundle config.json.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-36', 7, 'Welcher Linux-Syscall wird verwendet, um einen Prozess an einen bereits bestehenden Namespace eines anderen Prozesses anzuhängen?', 'setns', 'Syscall setns().'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-37', 7, 'Welcher Linux-Syscall ändert das Root-Dateisystem eines Prozesses sicherer als chroot und verschiebt das alte Root-Verzeichnis?', 'pivot_root', 'pivot_root(new_root, put_old).'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-38', 7, 'Welche Sandbox-Container-Laufzeitumgebung von Google fängt Syscalls im Userspace ab, um den Host-Kernel vor unsicherem Code zu schützen?', 'gVisor', 'Nutzt den Sentry-Kernel in Go.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-39', 7, 'Welche Container-Laufzeit nutzt leichtgewichtige virtuelle Micro-VMs mit QEMU oder Cloud-Hypervisor für echte Hardware-Virtualisierung pro Pod?', 'Kata Containers', 'OpenStack Kata Containers.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-40', 7, 'Wie heißt die Linux-Kernel-Fähigkeit, die es erlaubt, klassische Root-Berechtigungen in feingliedrige Einzelrechte wie CAP_NET_ADMIN aufzuteilen?', 'Linux Capabilities', 'POSIX/Linux Capabilities.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-41', 8, 'Welcher BPF-Filtermechanismus wird in seccomp eingesetzt, um Syscalls anhand ihrer Argumente im Kernel zur Laufzeit zu evaluieren?', 'cBPF', 'Classic BPF (Berkeley Packet Filter).'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-42', 8, 'Wie heißt der Daemon-Prozess von containerd, der einen einzelnen Container überwacht und I/O weiterleitet, selbst wenn containerd neu startet?', 'containerd-shim', 'Verhindert verwaiste Container bei Daemon-Restarts.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-43', 8, 'Welches OCI-Dateiformat packt das Root-Dateisystem, Metadaten und Kernel in eine einzige unveränderbare Squashfs-Datei für HPC-Umgebungen?', 'Apptainer', 'Früher Singularity (SIF-Format).'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-44', 8, 'Welcher spezialisierte Linux-Hypervisor von Amazon Web Services bootet MicroVMs in Millisekunden und treibt AWS Lambda und Fargate an?', 'Firecracker', 'Geschrieben in Rust, basiert auf KVM.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-45', 8, 'Welches Layering-Merkmal in OverlayFS markiert eine Datei als gelöscht, wenn sie im schreibgeschützten Lowerdir existiert?', 'Whiteout', 'Whiteout-Device / Character Device 0:0.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-46', 9, 'Welcher cgroups-v2-Controller steuert und begrenzt die maximale Anzahl gleichzeitiger Prozesse und Threads, um Fork-Bombs zu verhindern?', 'pids', 'pids.max in cgroup v2.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-47', 9, 'Welche OCI-WebAssembly-Laufzeitumgebung ermöglicht das Ausführen von Wasm-Modulen direkt über runc-ähnliche Shims in Kubernetes?', 'runwasi', 'DeisLabs / containerd runwasi Projekt.'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-48', 9, 'Welcher Linux-Syscall erzeugt einen Kindprozess und akzeptiert Bitmasken wie CLONE_NEWPID und CLONE_NEWNET zur Namespace-Erstellung?', 'clone', 'Syscall clone() bzw. clone3().'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-49', 9, 'Welche Kernel-Funktion löst das Problem der Dateizugriffsbeschränkung für unprivilegierte Container bei unterschiedlichen Host-UIDs mittels VFS-Mapping?', 'ID-mapped Mounts', 'Eingeführt in Linux 5.12 (idmapped mounts).'),
('devops-platform-cloud', 'container-linux', 'cont-55f7e5-50', 9, 'Welche Linux-Sicherheitsfunktion verhindert dauerhaft, dass ein Prozess oder seine Kindprozesse über setuid neue Berechtigungen erlangen?', 'no_new_privs', 'prctl(PR_SET_NO_NEW_PRIVS, 1).'),
-- Rubrik: Kubernetes & Orchestrierung (kubernetes-orchestration) - 50 Fragen
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-1', 1, 'Welches Open-Source-Projekt zur Container-Orchestrierung wurde ursprünglich bei Google unter dem Codenamen Borg inspiriert?', 'Kubernetes', 'Häufig auch als K8s abgekürzt.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-2', 1, 'Welches Datenformat (Dateiendung .yaml oder .yml) wird standardmäßig für Kubernetes-Manifeste verwendet?', 'YAML', 'YAML Ain''t Markup Language.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-3', 1, 'Wie nennt man einen einzelnen physischen oder virtuellen Computer in einem Kubernetes-Cluster?', 'Node', 'Worker Node oder Control Plane Node.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-4', 1, 'Mit welchem kubectl-Befehl lässt sich ein Manifest deklarativ auf den Cluster anwenden?', 'kubectl apply', 'kubectl apply -f <datei>.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-5', 1, 'Welcher kubectl-Befehl listet Ressourcen wie Pods oder Services im aktuellen Namespace auf?', 'kubectl get', 'kubectl get pods / svc.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-6', 1, 'Wie nennt man den virtuellen logischen Trennungsbereich innerhalb eines Kubernetes-Clusters für Mandanten oder Umgebungen?', 'Namespace', 'Standardmäßig: default, kube-system, kube-public.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-7', 2, 'Welche Kubernetes-Ressource definiert einen stabilen Netzwerk-Endpunkt mit virtueller IP für eine Gruppe von Pods?', 'Service', 'Service-Typen: ClusterIP, NodePort, LoadBalancer, ExternalName.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-8', 2, 'Welcher Standardtyp eines Kubernetes-Service ist nur clusterintern erreichbar?', 'ClusterIP', 'Standardtyp bei Services.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-9', 2, 'Welche Ressource speichert unverschlüsselte Konfigurationsdaten wie Umgebungsvariablen oder Konfigurationsdateien für Pods?', 'ConfigMap', 'Für geheime Daten nutzt man stattdessen Secret.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-10', 2, 'Welche Ressource dient in Kubernetes der Verwaltung vertraulicher Daten wie Passwörter oder API-Keys?', 'Secret', 'Standardmäßig nur Base64-kodiert in etcd.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-11', 2, 'Welcher Paketmanager für Kubernetes paketiert Anwendungen in sogenannten Charts?', 'Helm', 'Der De-facto-Paketmanager für K8s.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-12', 2, 'Wie heißen die Schlüssel-Wert-Paare, die an Kubernetes-Objekte angehängt werden, um sie mittels Selektoren zu identifizieren?', 'Labels', 'Labels und Label-Selector.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-13', 3, 'Welche Kubernetes-Ressource eignet sich speziell für zustandsbehaftete Anwendungen mit stabiler Netzwerkidentität und festen Datenträgern?', 'StatefulSet', 'Geeignet für Datenbanken wie PostgreSQL oder Redis.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-14', 3, 'Wie heißt die Anforderung eines Pods an persistenten Speicher in Kubernetes?', 'PersistentVolumeClaim', 'PVC (PersistentVolumeClaim) bindet ein PV (PersistentVolume).'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-15', 3, 'Welche Ressource führt einmalige Aufgaben bis zum erfolgreichen Abschluss aus und beendet sich danach?', 'Job', 'Für wiederkehrende Aufgaben gibt es CronJobs.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-16', 3, 'Welcher Probe-Typ in Kubernetes prüft, ob eine Anwendung gesund läuft und startet den Container bei Fehlschlag neu?', 'Liveness Probe', 'LivenessProbe steuert Container-Neustarts.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-17', 3, 'Welcher Probe-Typ entscheidet, ob ein Pod bereit ist, Netzwerkverkehr von einem Service entgegenzunehmen?', 'Readiness Probe', 'ReadinessProbe steuert Aufnahme in Service-Endpoints.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-18', 3, 'Welcher DNS-Dienst läuft standardmäßig in modernen Kubernetes-Clustern für die interne Namensauflösung?', 'CoreDNS', 'Löste früher Kube-DNS ab.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-19', 4, 'Welche Kernkomponente der Control Plane entscheidet, auf welchem Worker-Node ein neuer Pod platziert wird?', 'kube-scheduler', 'Scheduler bewertet Nodes nach Filtern und Scores.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-20', 4, 'Welche Komponente der Control Plane führt Abgleichsschleifen für Kernressourcen wie ReplicaSets und Nodes aus?', 'kube-controller-manager', 'Controller-Manager hält den Sollzustand aufrecht.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-21', 4, 'Welche Netzwerkkomponente auf den Nodes implementiert Kubernetes-Services durch Manipulation von iptables oder IPVS-Regeln?', 'kube-proxy', 'Verwaltet Service-Routing auf Node-Ebene.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-22', 4, 'Wie heißt das Interface, das die Anbindung beliebiger Container-Runtimes wie containerd oder CRI-O an das Kubelet standardisiert?', 'CRI', 'Container Runtime Interface.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-23', 4, 'Wie heißt die Spezifikation, über die Speicheranbieter wie Ceph, AWS EBS oder Azure Disk Speicher an Kubernetes anbinden?', 'CSI', 'Container Storage Interface.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-24', 4, 'Welches Interface standardisiert die Netzwerkanbindung und IP-Vergabe für Pods in Kubernetes?', 'CNI', 'Container Network Interface.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-25', 5, 'Welche Ressource in Kubernetes skaliert die Anzahl der Pod-Replikate eines Deployments automatisch anhand der CPU-Auslastung?', 'HPA', 'Horizontal Pod Autoscaler.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-26', 5, 'Welcher spezielle Pod-Typ läuft vor den regulären Anwendungscontainern im selben Pod an und muss sich erfolgreich beenden?', 'Init-Container', 'Init Containers für Vorarbeiten und Migrationen.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-27', 5, 'Wie nennt man Metadaten an Kubernetes-Objekten, die keine Selektion ermöglichen, aber Build- oder Tool-Infos speichern?', 'Annotations', 'Annotations im Gegensatz zu Labels.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-28', 5, 'Welche Ressource definiert Richtlinien für Pod-Erschütterungen bei geplanten Wartungsarbeiten, um Mindestverfügbarkeit zu garantieren?', 'PDB', 'PodDisruptionBudget.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-29', 5, 'Mit welchem kubectl-Befehl markiert man einen Node als nicht-planbar und evakuiert alle darauf laufenden Pods sicher?', 'kubectl drain', 'kubectl drain --ignore-daemonsets.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-30', 5, 'Welche K8s-Ressource ermöglicht die Definition eigener Objekt-Typen und Schemas über die Standardressourcen hinaus?', 'CRD', 'Custom Resource Definition.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-31', 6, 'Welcher Hook wird direkt vor dem Senden des SIGTERM-Signals an den Container ausgeführt, um Graceful Shutdowns zu ermöglichen?', 'PreStop-Hook', 'preStop Lifecycle Hook.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-32', 6, 'Welche Admission-Controller-Art kann eingehende API-Anfragen an den API-Server modifizieren, bevor sie in etcd gespeichert werden?', 'Mutating Admission Webhook', 'MutatingWebhookConfiguration.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-33', 6, 'Welche Admission-Controller-Art prüft eingehende API-Objekte auf Konformität und kann die Erstellung verweigern?', 'Validating Admission Webhook', 'ValidatingWebhookConfiguration.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-34', 6, 'Welcher Typ von Probe schützt langsam startende Legacy-Anwendungen davor, von der Liveness Probe vorzeitig gekillt zu werden?', 'Startup Probe', 'Deaktiviert Liveness- und Readiness-Checks während des Starts.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-35', 6, 'Welche RBAC-Ressource bindet eine ClusterRole an einen bestimmten Benutzer oder ServiceAccount, jedoch nur innerhalb eines einzigen Namespace?', 'RoleBinding', 'Im Gegensatz zu ClusterRoleBinding, das clusterweit gilt.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-36', 7, 'Welcher moderne Node-Autoscaler der CNCF provisioniert Compute-Instanzen ohne Node-Groups direkt passgenau für ausstehende Pods?', 'Karpenter', 'Ursprung bei AWS, nun herstellerunabhängig.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-37', 7, 'Wie heißt das Kubernetes-Feature, das Pods gleichmäßig über Ausfallzonen (Failure Domains wie Availability Zones) verteilt?', 'Topology Spread Constraints', 'topologySpreadConstraints in PodSpec.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-38', 7, 'Welcher Mechanismus in etcd sichert den Konsens zwischen den Member-Knoten der Control Plane ab?', 'Raft', 'Raft Konsensus-Algorithmus.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-39', 7, 'Welche API-Ressource stellt die moderne, expressive und rollenorientierte Nachfolgerin der Ingress-Ressource in Kubernetes dar?', 'Gateway API', 'GatewayClass, Gateway und HTTPRoute.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-40', 7, 'Welches Sicherheits-Feature löste die veralteten PodSecurityPolicies (PSP) als nativer Admission Controller in Kubernetes ab?', 'Pod Security Standards', 'PSS / Pod Security Admission (PSA) mit Privileged, Baseline, Restricted.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-41', 8, 'Welcher Controller-Mechanismus in client-go vermeidet ständige API-Server-Abfragen durch lokale Caches und Delta-FIFO-Queues?', 'Informer', 'SharedInformer / Reflector Pattern.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-42', 8, 'Welches Kubernetes-Feature erlaubt das dynamische Erweitern von Volumes, ohne den dazugehörigen Pod neu starten zu müssen?', 'Online Volume Expansion', 'AllowVolumeExpansion im StorageClass.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-43', 8, 'Wie heißt die interne Datenstruktur in der Go-API-Bibliothek von Kubernetes, die das führende Schema interner Typen vor Konvertierung darstellt?', 'Internal Version', 'Hub-and-Spoke Type Conversion Pattern.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-44', 8, 'Welche Erweiterung des Linux-IPVS-Modus im kube-proxy ermöglicht Graceful Termination von bestehenden TCP-Verbindungen bei Pod-Löschung?', 'Graceful Termination', 'Verhindert Verbindungsabbrüche bei Rolling Updates.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-45', 8, 'Welche API-Gruppe ermöglicht es, temporäre Ephemeral-Container in einen laufenden Pod zu injizieren, um ohne Shell im Basisimage zu debuggen?', 'kubectl debug', 'Ephemeral Containers API.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-46', 9, 'Welcher Algorithmus wird im kube-apiserver verwendet, um API-Anfragen bei hoher Last fair nach Mandanten zu drosseln?', 'APF', 'API Priority and Fairness.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-47', 9, 'Welcher Go-Bibliotheksstandard aus dem Kubernetes-Ecosystem dient dem automatischen Generieren von DeepCopy-, Konvertierungs- und Client-Code?', 'code-generator', 'k8s.io/code-generator (deepcopy-gen, client-gen).'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-48', 9, 'Welche Ressource in etcd limitiert per Default die maximale Größe einer einzelnen Transaktion bzw. eines Schlüssel-Werte-Paars auf typischerweise 1,5 MB?', 'max-request-bytes', '--max-request-bytes Parameter in etcd.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-49', 9, 'Welches Subsystem im Kubelet verwaltet die Reservierung isolierter CPU-Cores für Pods mit Guaranteed QoS mittels CPU-Pinning?', 'CPU Manager', 'Static CPU Manager Policy.'),
('devops-platform-cloud', 'kubernetes-orchestration', 'k8s-8d5ab5-50', 9, 'Wie nennt man den Mechanismus, bei dem der kube-apiserver über etcd-Watch-Streams Lease-Objekte nutzt, um Node-Heartbeats zu erfassen?', 'Node Lease', 'NodeLease Controller in kube-node-lease Namespace.'),
-- Rubrik: CI/CD & GitOps (ci-cd-gitops) - 50 Fragen
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-1', 1, 'Wofür steht die Abkürzung CD in einer modernen Deployment-Pipeline meistens?', 'Continuous Delivery', 'Auch Continuous Deployment.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-2', 1, 'Mit welchem Git-Befehl überträgt man neue lokale Commits auf das entfernte Repository?', 'git push', 'git push origin <branch>.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-3', 1, 'Mit welchem Git-Befehl holt man Änderungen vom Remote-Repository und führt sie direkt mit dem lokalen Branch zusammen?', 'git pull', 'Kombination aus git fetch und git merge.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-4', 1, 'Wie nennt man in Git das Zusammenführen zweier separater Branches?', 'Merge', 'git merge.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-5', 1, 'Welches Webportal mit blau-orangem Fuchs-Logo bietet eine integrierte DevOps-Plattform mit Git und CI/CD?', 'GitLab', 'gitlab.com bzw. Self-hosted GitLab CE/EE.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-6', 1, 'Wie nennt man die Anforderung auf Plattformen wie GitHub, Code-Änderungen vor dem Mergen zur Prüfung vorzulegen?', 'Pull Request', 'PR bzw. Merge Request (MR bei GitLab).'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-7', 2, 'Wie heißt die zentrale Konfigurationsdatei für Pipelines in GitLab CI?', '.gitlab-ci.yml', 'Liegt im Wurzelverzeichnis des Repositories.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-8', 2, 'Welches Git-Kommando schiebt unfertige Änderungen im Arbeitsverzeichnis temporär auf einen internen Stapel beiseite?', 'git stash', 'git stash / git stash pop.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-9', 2, 'Wie nennt man in einer CI-Pipeline eine Gruppierung von Aufgaben, die parallel zueinander abgearbeitet werden können?', 'Stage', 'Stages wie build, test, deploy.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-10', 2, 'Welcher Dienst oder Agent nimmt in Jenkins Build-Jobs entgegen und führt sie auf der Zielmaschine aus?', 'Jenkins Agent', 'Früher Jenkins Slave genannt; arbeitet mit dem Jenkins Controller.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-11', 2, 'Welcher Git-Befehl wendet Commits eines Branches neu auf die Spitze eines anderen Branches an, um eine lineare Historie zu erzeugen?', 'git rebase', 'git rebase <basebranch>.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-12', 2, 'Wie nennt man Dateien oder Binaries, die während eines Builds erzeugt und für spätere Pipeline-Stufen archiviert werden?', 'Artefakte', 'Build Artifacts.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-13', 3, 'Welches Grundprinzip von GitOps besagt, dass der gewünschte Systemzustand in Git wie abgelegt sein muss?', 'Deklarativ', 'Deklarative Beschreibungen sind der Kern von GitOps.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-14', 3, 'Welches GitOps-Framework von Weaveworks (neben Argo CD) gehört zu den bekanntesten Projekten der CNCF?', 'Flux', 'Flux CD / Flux v2.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-15', 3, 'Wie nennt man den Software-Agenten in GitHub Actions, der auf einem Server läuft und Workflow-Jobs ausführt?', 'Runner', 'GitHub-hosted Runner oder Self-hosted Runner.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-16', 3, 'Welches Tool ermöglicht das Template-freie Anpassen von Kubernetes-Manifesten durch Overlays für verschiedene Umgebungen?', 'Kustomize', 'kustomization.yaml, integriert in kubectl (-k).'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-17', 3, 'Wie nennt man das automatische Zurückrollen auf die Vorgängerversion, wenn eine Bereitstellung fehlschlägt?', 'Rollback', 'Automated Rollback.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-18', 3, 'Welcher Typ von Web-Hook benachrichtigt CI-Server automatisch über neu eingetroffene Commits in einem Git-Repository?', 'Webhook', 'HTTP POST Callback.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-19', 4, 'Wie nennt man ein Branching-Modell, bei dem Entwickler häufig direkt in einen zentralen Haupt-Branch mergen und langlebige Branches vermeiden?', 'Trunk-Based Development', 'Im Gegensatz zu komplexem GitFlow.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-20', 4, 'Welche Technik erlaubt es, neuen Code in Produktion zu deployen, die Funktion jedoch zur Laufzeit über Schalter ein- oder auszuschalten?', 'Feature Flags', 'Feature Toggles.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-21', 4, 'Welches beliebte Open-Source-Container-Registry-Projekt der CNCF bietet integrierte Schwachstellenscans und rollenbasierte Zugriffe?', 'Harbor', 'CNCF Graduated Enterprise Registry.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-22', 4, 'Welches Tool von SonarSource führt statische Code-Analysen (SAST) auf Code-Smells, Bugs und Sicherheitslücken in CI durch?', 'SonarQube', 'SonarQube / SonarCloud.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-23', 4, 'Welches Kubernetes-native CI/CD-Framework der Linux Foundation definiert Pipelines direkt als Kubernetes-Custom-Resources (CRDs)?', 'Tekton', 'Tekton Pipelines (Teil der CD Foundation).'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-24', 4, 'Wie heißt die OIDC-Methode, mit der GitHub Actions ohne langlebige Zugangsdaten kurzlebige Cloud-Rollen bei AWS oder Azure annehmen kann?', 'OIDC Federation', 'Workload Identity Federation / OpenID Connect.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-25', 5, 'Welches Open-Source-Tool von Aqua Security scannt Container-Images, Dateisysteme und Git-Repositories rasend schnell auf Schwachstellen?', 'Trivy', 'Umfassender Security- und Vulnerability-Scanner.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-26', 5, 'Wie heißt die Spezifikation zur Versionsnummerierung von Software nach dem Schema Hauptversion.Nebenversion.Patch?', 'Semantic Versioning', 'SemVer (z. B. 2.1.0).'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-27', 5, 'Welches Werkzeug automatisiert die Erstellung von SemVer-Releases und Changelogs anhand standardisierter Git-Commit-Nachrichten?', 'semantic-release', 'Basiert auf Conventional Commits.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-28', 5, 'Wie nennt man die Sicherheitsinitiative von Google und der OpenSSF, die ein Stufenmodell (1–4) zur Absicherung der Software-Lieferkette definiert?', 'SLSA', 'Supply-chain Levels for Software Artifacts (ausgesprochen "Salsa").'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-29', 5, 'Welches Tool aus dem Sigstore-Projekt wird speziell zum kryptografischen Signieren und Verifizieren von OCI-Container-Images genutzt?', 'Cosign', 'cosign sign / verify.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-30', 5, 'Welcher GitOps-Controller in Argo CD überwacht Progressive Delivery mit Canary- und Blue-Green-Deployments inklusive Metrikenanalyse?', 'Argo Rollouts', 'Argo Rollouts Controller.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-31', 6, 'Wie nennt man ein Git-Repository-Setup, in dem der Quellcode mehrerer separater Anwendungen und Bibliotheken in einem einzigen Repository verwaltet wird?', 'Monorepo', 'Monolithisches Repository (im Gegensatz zu Polyrepo).'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-32', 6, 'Welches schlanke CLI-Tool für Kubernetes-Manifeste führt schnelle statische Validierungen gegen JSON-Schemas durch?', 'kubeconform', 'Nachfolger des älteren kubeval.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-33', 6, 'Wie nennt man den Sicherheitsansatz, bei dem Tests, Scans und Qualitätsprüfungen möglichst früh im Entwicklungszyklus stattfinden?', 'Shift Left', 'Shift-Left Testing / Security.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-34', 6, 'Welches Werkzeug von Bitnami ermöglicht die sichere Speicherung verschlüsselter Secrets direkt in Git mittels asymmetrischer Kryptografie?', 'Sealed Secrets', 'SealedSecrets Controller in Kubernetes.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-35', 6, 'Welches HashiCorp-Tool führt automatisierte Vault-Secret-Einbettungen in CI-Dateien durch Template-Rendering durch?', 'consul-template', 'Oder Vault Agent Templating.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-36', 7, 'Welches Transparenz-Logbuch im Sigstore-Projekt speichert Signaturen unlöschbar in einem Merkle-Tree zur nachträglichen Prüfung?', 'Rekor', 'Rekor Signature Transparency Log.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-37', 7, 'Welche Zertifizierungsstelle im Sigstore-Projekt stellt kurzlebige X.509-Zertifikate aus, die an OIDC-Identitäten gebunden sind?', 'Fulcio', 'Fulcio CA für keyless signing.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-38', 7, 'Wie nennt man das Build-Prinzip, bei dem ein identischer Quellcode zu exakt demselben bit-für-bit identischen Binär-Artefakt führt?', 'Reproducible Builds', 'Deterministische Builds.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-39', 7, 'Welches CLI-Tool von Mozilla verschlüsselt selektiv YAML- oder JSON-Werte in Git-Dateien mit KMS-Schlüsseln von AWS, GCP oder PGP?', 'SOPS', 'Secrets OPerationS (oft mit age oder AWS KMS).'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-40', 7, 'Welcher GitOps-Sicherheitsmechanismus in Flux CD verhindert, dass Mandanten Cross-Namespace-Ressourcen ohne Freigabe referenzieren?', 'ServiceAccount Impersonation', 'serviceAccountName im Kustomization-Objekt.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-41', 8, 'Welches Format der Linux Foundation dient als maschinenlesbarer Standard für Software-Stücklisten neben CycloneDX?', 'SPDX', 'Software Package Data Exchange (ISO/IEC 5962:2021).'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-42', 8, 'Welches OpenSSF-Tool bewertet Open-Source-Repositories anhand von bis zu 18 Sicherheitskriterien wie Branch-Protection und Code-Reviews?', 'Scorecard', 'OpenSSF Scorecard.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-43', 8, 'Welche In-Toto-Attestation-Spezifikation verknüpft Prüfpfade von Build-Steps kryptografisch miteinander, um Supply-Chain-Angriffe zu verhindern?', 'in-toto', 'in-toto framework.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-44', 8, 'Welcher BuildKit-Modus erlaubt das Caching von Docker-Build-Layers direkt in einer Remote-Container-Registry über Inline- oder Registry-Caches?', 'cache-to', '--cache-to type=registry.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-45', 8, 'Welcher Algorithmus in Git stellt sicher, dass Git-Objekte inhaltsadressierbar über kryptografische Prüfsummen verknüpft sind?', 'SHA-1', 'Wird schrittweise durch SHA-256 ergänzt (Git object hash).'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-46', 9, 'Welcher Linux-Kernel-Mechanismus wird von Dagger verwendet, um CI-Pipelines als programmierbare Container-Graphen isoliert auszuführen?', 'BuildKit', 'Dagger basiert auf BuildKit (Moby Engine).'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-47', 9, 'Wie heißt das CNCF-Projekt, das GitOps-Repositories auf Richtlinienkonformität prüft, bevor sie vom Cluster übernommen werden?', 'Conftest', 'Basiert auf Open Policy Agent (OPA).'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-48', 9, 'Welche kryptografische Datenstruktur garantiert in Sigstores Rekor-Log, dass frühere Einträge nicht manipuliert oder entfernt werden können?', 'Merkle Tree', 'Kryptografischer Hash-Baum.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-49', 9, 'Welches spezielle Git-Merkmal erlaubt es, die Git-Historie partiell zu klonen (Shallow Clone / Sparse Checkout), um CI-Zeiten drastisch zu senken?', 'Sparse Checkout', 'git clone --filter=blob:none bzw. git sparse-checkout.'),
('devops-platform-cloud', 'ci-cd-gitops', 'cicd-203d59-50', 9, 'Welches OIDC-Token-Attribut im GitHub-Actions-Token (id-token) enthält den vollständigen Repository- und Ref-Pfad für IAM-Trust-Policies?', 'sub', 'Subject Claim (z. B. repo:octocat/hello-world:ref:refs/heads/main).'),
-- Rubrik: Infrastructure as Code & Cloud (iac-cloud-foundations) - 50 Fragen
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-1', 1, 'Welches Servicemodell im Cloud Computing stellt Rechenleistung, virtuelle Server und Speicher als Basisinfrastruktur bereit?', 'IaaS', 'Infrastructure as a Service.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-2', 1, 'Welches Servicemodell der Cloud bietet eine fertige Ablaufumgebung für Anwendungen, ohne dass Betriebssysteme gepflegt werden müssen?', 'PaaS', 'Platform as a Service.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-3', 1, 'Welches Modell stellt fertige Endanwender-Software direkt über den Webbrowser zur Verfügung?', 'SaaS', 'Software as a Service (z. B. Microsoft 365, Google Workspace).'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-4', 1, 'Welcher Cloud-Dienst von Microsoft konkurriert direkt mit AWS und Google Cloud Platform?', 'Microsoft Azure', 'Azure.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-5', 1, 'Wie heißt die Public-Cloud-Plattform des Google-Konzerns?', 'GCP', 'Google Cloud Platform.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-6', 1, 'Welcher einfache Terraform-Befehl initialisiert ein Arbeitsverzeichnis und lädt benötigte Provider herunter?', 'terraform init', 'Erster Schritt bei jedem neuen Terraform-Projekt.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-7', 2, 'Welcher Terraform-Befehl erstellt einen Ausführungsplan und zeigt an, welche Cloud-Ressourcen angelegt oder geändert werden?', 'terraform plan', 'Zeigt Änderungen vor der eigentlichen Erstellung an.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-8', 2, 'Mit welchem Terraform-Befehl wendet man die geplanten Änderungen tatsächlich auf die Ziel-Cloud an?', 'terraform apply', 'Wendet den Ausführungsplan an.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-9', 2, 'Welcher Terraform-Befehl löscht alle im State-File verwalteten Infrastruktur-Ressourcen vollständig aus der Cloud?', 'terraform destroy', 'Löscht alle gemanagten Ressourcen.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-10', 2, 'Wie lautet die Standarddatei, in der Terraform den aktuellen Zustand der verwalteten Infrastruktur speichert?', 'terraform.tfstate', 'Terraform State File.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-11', 2, 'Wie heißt die hauseigene Konfigurationssprache von HashiCorp, in der Terraform-Dateien verfasst werden?', 'HCL', 'HashiCorp Configuration Language.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-12', 2, 'Wie nennt man wiederverwendbare, paketierte Terraform-Konfigurationen, die als Bausteine importiert werden können?', 'Module', 'Terraform Modules.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-13', 3, 'Wie nennt man das Speicherziel (z. B. S3-Bucket oder Azure Blob), auf dem der Terraform-State teamweit zentral und gesperrt abgelegt wird?', 'Remote Backend', 'Backend-Konfiguration (z. B. backend "s3").'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-14', 3, 'Welcher native Infrastructure-as-Code-Dienst von AWS nutzt JSON- oder YAML-Vorlagen zum Deklarieren von Cloud-Ressourcen?', 'CloudFormation', 'AWS CloudFormation.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-15', 3, 'Welches Ausführungsmodell führt Anwendungscode ereignisgesteuert ohne dauerhaft laufende Serverinstanzen aus (z. B. AWS Lambda)?', 'Serverless', 'Function as a Service (FaaS) / Serverless Computing.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-16', 3, 'Wie nennt man getrennte physische Rechenzentrumsstandorte innerhalb einer Cloud-Region mit redundanter Strom- und Netzwerkanbindung?', 'Availability Zones', 'Verfügbarkeitszonen (AZs).'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-17', 3, 'Welcher bekannte AWS-Objektspeicherdienst wurde als einer der ersten Cloud-Services im Jahr 2006 veröffentlicht?', 'S3', 'Simple Storage Service.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-18', 3, 'Wie nennt man den Block-Storage-Dienst von AWS, der als virtuelle Festplatte an EC2-Instanzen angehängt wird?', 'EBS', 'Elastic Block Store.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-19', 4, 'Welches HashiCorp-Tool dient dem automatisierten Erstellen identischer goldener Maschinen-Images für Clouds und Hypervisoren?', 'Packer', 'HashiCorp Packer.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-20', 4, 'Welches Open-Source-Framework von AWS erlaubt das Definieren von CloudFormation-Ressourcen in TypeScript, Python oder Java?', 'AWS CDK', 'Cloud Development Kit.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-21', 4, 'Wie heißt das native Bereitstellungsformat für Microsoft Azure, das als typsichere Abstraktion über ARM-Templates fungiert?', 'Bicep', 'Azure Bicep.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-22', 4, 'Welche Terraform-Funktion lädt bereits existierende, manuell angelegte Cloud-Ressourcen in das State-Management nach?', 'terraform import', 'import-Befehl oder import-Block (seit v1.5).'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-23', 4, 'Wie nennt man in Terraform getrennte Arbeitsbereiche für denselben Code, um etwa Dev- und Prod-States separat zu verwalten?', 'Workspaces', 'Terraform Workspaces.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-24', 4, 'Welches CLI-Tool von Infracost analysiert Terraform-Code im Pull Request und gibt die erwarteten monatlichen Cloud-Kosten aus?', 'Infracost', 'Kostenschätzung für IaC.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-25', 5, 'Welche Datenbank von AWS wird häufig für das State Locking bei der Nutzung von S3 als Terraform-Remote-Backend verwendet?', 'DynamoDB', 'DynamoDB Lock-Table.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-26', 5, 'Welcher Cloud-Diensttyp bietet vollständig verwaltete relationale Datenbanken wie PostgreSQL oder MySQL ohne OS-Wartung an?', 'RDS', 'Relational Database Service (z. B. AWS RDS, Azure Database).'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-27', 5, 'Wie nennt man die Eigenschaft einer Operation, bei mehrfacher Ausführung mit denselben Parametern stets denselben Endzustand zu liefern?', 'Idempotenz', 'Schlüsselkonzept von Ansible, Terraform und Puppet.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-28', 5, 'Welcher Terraform-Block-Typ wird verwendet, um Informationen über bestehende externe Ressourcen abzufragen, ohne sie zu verwalten?', 'data', 'Data Source (data "aws_ami" ...).'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-29', 5, 'Welche Terraform-Klausel (Meta-Argument) steuert, ob eine Ressource vor dem Zerstören zuerst neu angelegt werden soll?', 'lifecycle', 'create_before_destroy im lifecycle-Block.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-30', 5, 'Welcher Open-Source-Static-Code-Analyzer von Bridgecrew scannt Terraform, CloudFormation und Helm auf Sicherheitsfehlkonfigurationen?', 'Checkov', 'Checkov Static Analysis Tool.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-31', 6, 'Welche Lizenz führte HashiCorp im August 2023 für Terraform ein, was zur Gründung des Forks OpenTofu führte?', 'BSL', 'Business Source License (BSL / BUSL 1.1).'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-32', 6, 'Welches Open-Source-Tool für Terraform generiert automatisch Dokumentation im Markdown-Format für Variablen und Outputs von Modulen?', 'terraform-docs', 'Generiert Readmes für Module.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-33', 6, 'Wie nennt man ein Cloud-Architektur-Muster, bei dem Server nach dem Deployment niemals modifiziert, sondern bei Updates ersetzt werden?', 'Immutable Infrastructure', 'Unveränderliche Infrastruktur.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-34', 6, 'Welcher Terraform-Wrapper von Gruntwork bietet DRY-Konfigurationen und Modulorchestrierung für große Infrastrukturen?', 'Terragrunt', 'Beliebtes Orchestrierungstool für Terraform.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-35', 6, 'Welche Richtlinien-Engine von HashiCorp bietet deklarative Governance und Policy-as-Code für Terraform Enterprise?', 'Sentinel', 'HashiCorp Sentinel.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-36', 7, 'Wie nennt man in Crossplane die benutzerdefinierte API-Ressource, die mehrere gemanagte Cloud-Ressourcen zu einer logischen Einheit bündelt?', 'Composite Resource', 'XR (Composite Resource) und XRD (CompositeResourceDefinition).'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-37', 7, 'Welches Go-Tool der Open-Source-Community synchronisiert und konvertiert bestehende AWS-Infrastruktur direkt in Terraform-Dateien?', 'Terraformer', 'Entwickelt bei Waze/Google.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-38', 7, 'Welches Protokoll nutzen Terraform-Provider intern zur Kommunikation zwischen dem Terraform-Kern und den separaten Provider-Plugins?', 'gRPC', 'RPC-Protokoll über Unix Domain Sockets.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-39', 7, 'Welches Open-Source-Tool von Trivy-Entwicklern scannt speziell Terraform-Code lokal ohne Netzwerkzugriff auf Sicherheitslücken?', 'tfsec', 'Mittlerweile in Trivy integriert.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-40', 7, 'Wie nennt man das Cloud-Netzwerk-Konstrukt, das ein lokales Unternehmensrechenzentrum über dedizierte Glasfaser direkt mit AWS verbindet?', 'AWS Direct Connect', 'Bei Azure heißt das Äquivalent ExpressRoute.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-41', 8, 'Welcher Algorithmus wird in Terraform zur Berechnung des Abhängigkeitsgraphen für parallele Ressourcen-Provisionierung verwendet?', 'DAG', 'Directed Acyclic Graph (gerichteter azyklischer Graph).'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-42', 8, 'Welche Datei in Terraform sperrt ab Version 0.14 die genauen Versionen und Prüfsummen aller verwendeten Provider-Plugins fest?', '.terraform.lock.hcl', 'Dependency Lock File.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-43', 8, 'Welches Framework in Pulumi ermöglicht es, deklarative Architektur- und Compliance-Regeln in TypeScript oder Python zu erzwingen?', 'CrossGuard', 'Pulumi Policy as Code.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-44', 8, 'Welcher Mechanismus in AWS CloudFormation ermöglicht das Zurücksetzen auf einen Snapshot bei Rollback-Fehlern in StackSets?', 'Stack Refactor', 'Oder Change Sets / Rollback Triggers.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-45', 8, 'Welche Linux-Schnittstelle nutzt Firecracker zur hardwarebeschleunigten Virtualisierung ohne vollständige PC-Motherboard-Emulation?', 'KVM', 'Kernel-based Virtual Machine (/dev/kvm).'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-46', 9, 'Welches Sub-System in Crossplane übersetzt Terraform-Provider-Schemas automatisch in native Kubernetes-Custom-Resource-Definitions?', 'Upjet', 'Früher Terrajet; generiert Kube-APIs aus Terraform-Providern.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-47', 9, 'Welcher Go-Befehl des Terraform-Plugin-Frameworks validiert die Schema-Kompatibilität für benutzerdefinierte Provider-Ressourcen?', 'framework.Resource', 'terraform-plugin-framework von HashiCorp.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-48', 9, 'Wie heißt die mathematische Eigenschaft, wenn eine IaC-Engine garantiert, dass Ressourcen genau in der topologischen Ordnung erzeugt werden?', 'Topologische Sortierung', 'Topological Sort des DAG.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-49', 9, 'Welches Tool ermöglicht die kontinuierliche Erkennung von Infrastructure-Drift im Hintergrund und triggert automatische Heilungs-Pipelines?', 'driftctl', 'Erkennt Drift zwischen State und realen Cloud-APIs.'),
('devops-platform-cloud', 'iac-cloud-foundations', 'iac-b1c0c3-50', 9, 'Welcher kryptografische Mechanismus in AWS KMS stellt sicher, dass Secrets nur im Arbeitsspeicher von HSMs entschlüsselt werden?', 'Envelope Encryption', 'Briefumschlag-Verschlüsselung mit Daten- und Masterschlüsseln.'),
-- Rubrik: Observability & SRE (observability-sre) - 50 Fragen
('devops-platform-cloud', 'observability-sre', 'obs-de8785-1', 1, 'Welches Messinstrument zeigt Entwicklern und Operatoren numerische Systemzustände wie CPU-Last oder RAM-Verbrauch über die Zeit an?', 'Metrik', 'Metrics.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-2', 1, 'Wie nennt man eine visuelle Übersichtswand mit Diagrammen und Graphen im Monitoring-Bereich?', 'Dashboard', 'Z. B. in Grafana oder Datadog.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-3', 1, 'Wie lautet der Fachbegriff für eine automatische Benachrichtigung (per E-Mail oder Chat), wenn ein Schwellenwert überschritten wird?', 'Alert', 'Alerting / Alarmierung.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-4', 1, 'Welche Abkürzung steht für die Rolle des Site Reliability Engineer, die ursprünglich bei Google geprägt wurde?', 'SRE', 'Site Reliability Engineering.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-5', 1, 'Wie nennt man die Zeitdauer, die ein Server oder Dienst benötigt, um auf eine eingehende Benutzeranfrage zu antworten?', 'Latenz', 'Latency / Antwortzeit.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-6', 1, 'Wie nennt man die Zeitspanne, in der ein System oder Dienst für Benutzer nicht verfügbar ist?', 'Downtime', 'Ausfallzeit.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-7', 2, 'Welches populäre Log-Management-Trio aus Elasticsearch, Logstash und Kibana wird häufig mit diesem Akronym bezeichnet?', 'ELK-Stack', 'ELK / Elastic Stack.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-8', 2, 'Welcher Dienst innerhalb des Prometheus-Ökosystems ist für das Entgegennehmen, Gruppieren und Versenden von Benachrichtigungen zuständig?', 'Alertmanager', 'Prometheus Alertmanager.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-9', 2, 'Wie lautet die eigene Abfragesprache von Prometheus, mit der Zeitreihendaten gefiltert und aggregiert werden?', 'PromQL', 'Prometheus Query Language.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-10', 2, 'Wie lautet die Abkürzung für das intern definierte Zuverlässigkeitsziel (z. B. 99,9 % erfolgreiche Requests) im SRE?', 'SLO', 'Service Level Objective.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-11', 2, 'Wie lautet die Abkürzung für den messbaren Indikator (z. B. Fehlerrate oder Antwortzeit), der zur Prüfung des SLOs dient?', 'SLI', 'Service Level Indicator.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-12', 2, 'Welches Open-Source-Log-Aggregationssystem von Grafana Labs wurde speziell nach dem Vorbild von Prometheus entwickelt?', 'Loki', 'Grafana Loki (Like Prometheus, but for logs).'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-13', 3, 'Wie nennt man die vier goldenen Signale der Dienstüberwachung nach dem Google SRE-Buch neben Latenz und Traffic?', 'Fehler und Sättigung', 'Latency, Traffic, Errors, Saturation.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-14', 3, 'Welcher Prometheus-Metrik-Typ repräsentiert einen rein monoton steigenden Zähler, der nur erhöht oder bei Neustart zurückgesetzt wird?', 'Counter', 'Z. B. http_requests_total.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-15', 3, 'Welcher Metrik-Typ in Prometheus repräsentiert einen einzelnen numerischen Wert, der beliebig steigen und fallen kann?', 'Gauge', 'Z. B. Speichernutzung oder Temperatur.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-16', 3, 'Wie nennt man den Daemon oder Hilfsprozess, der Metriken aus fremden Systemen liest und im Prometheus-Format zur Verfügung stellt?', 'Exporter', 'Z. B. node_exporter oder postgres_exporter.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-17', 3, 'Welches verteilte Tracing-System wurde ursprünglich bei Uber entwickelt und gehört heute zu den CNCF-Graduated-Projekten?', 'Jaeger', 'Jaeger Tracing.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-18', 3, 'Wie nennt man im Distributed Tracing einen einzelnen zusammenhängenden Bearbeitungsschritt innerhalb eines Gesamt-Traces?', 'Span', 'Ein Trace besteht aus einem Baum von Spans.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-19', 4, 'Welches Akronym beschreibt den standardisierten HTTP-Header des W3C für verteiltes Tracing, der Traceparent und Tracestate überträgt?', 'Trace Context', 'W3C Trace Context Standard (traceparent Header).'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-20', 4, 'Welcher Metrik-Typ in Prometheus zählt Ereignisse in konfigurierbaren Wertebereichen (Buckets), um Quantile zu berechnen?', 'Histogram', 'Prometheus Histogramm (mit le-Label).'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-21', 4, 'Welcher standardisierte Exporter sammelt Hardware- und Betriebssystem-Metriken auf Linux-Servern für Prometheus?', 'node_exporter', 'Prometheus Node Exporter.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-22', 4, 'Wie nennt man das geplante, absichtliche Injizieren von Fehlern in Produktionssysteme, um deren Ausfallsicherheit zu beweisen?', 'Chaos Engineering', 'Pionierarbeit durch Netflix (Chaos Monkey).'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-23', 4, 'Welche Abkürzung bezeichnet die mittlere Betriebsdauer eines Systems zwischen zwei aufeinanderfolgenden Ausfällen?', 'MTBF', 'Mean Time Between Failures.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-24', 4, 'Wie heißt die strukturierte Analyse nach einem Ausfall, die ohne persönliche Schuldzuweisungen Ursachen und Maßnahmen klärt?', 'Blameless Post-Mortem', 'Schuldfreie Nachbesprechung / Incident Postmortem.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-25', 5, 'Welches CNCF-Komponenten-Tool nimmt Telemetriedaten von OpenTelemetry entgegen, filtert sie und leitet sie an Backends weiter?', 'OTel Collector', 'OpenTelemetry Collector.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-26', 5, 'Wie heißt die verteilte Open-Source-Tracing-Engine von Grafana Labs, die Traces extrem kostengünstig auf Objektspeichern ablegt?', 'Tempo', 'Grafana Tempo.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-27', 5, 'Wie nennt man im SRE-Bereich repetitive, manuelle, taktische Arbeit ohne nachhaltigen Wertzuwachs, die automatisiert werden sollte?', 'Toil', 'Nach Google SRE: Toil sollte unter 50 % der Arbeitszeit gehalten werden.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-28', 5, 'Welche PromQL-Funktion berechnet die pro Sekunde gemessene Steigerungsrate eines monoton wachsenden Counters über ein Zeitfenster?', 'rate', 'rate(http_requests_total[5m]).'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-29', 5, 'Welcher Tracing-Vorgänger von Twitter bildete neben OpenTracing eines der ersten bekannten Open-Source-Tracing-Frameworks?', 'Zipkin', 'Apache Zipkin.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-30', 5, 'Wie nennt man den prozentualen Multiplikator, der angibt, wie schnell ein Team sein Fehlerbudget bei einer aktuellen Störung aufbraucht?', 'Burn Rate', 'Burn Rate Alerting für SLOs.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-31', 6, 'Welcher Service-Mesh-Bestandteil fungiert typischerweise als Sidecar-Proxy zur Erfassung von L7-Metriken und Tracing-Headern?', 'Envoy', 'Envoy Proxy.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-32', 6, 'Welches Open-Source-Profiling-Tool der CNCF ermöglicht kontinuierliches Profiling von CPU und Speicher im Produktionsbetrieb via eBPF?', 'Parca', 'Parca / Pyroscope continuous profilers.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-33', 6, 'Wie nennt man das Problem, wenn zu viele gleichzeitige Alerts die Aufmerksamkeit von Bereitschaftsingenieuren abstumpfen lassen?', 'Alert Fatigue', 'Alarmmüdigkeit.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-34', 6, 'Welcher Algorithmus wird in Prometheus verwendet, um Metriken hochkomprimiert im Chunk-Format im Arbeitsspeicher abzulegen?', 'Gorilla', 'Gorilla TSDB Compression Algorithm (von Facebook).'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-35', 6, 'Welche PromQL-Funktion extrapoliert lineare Trends, um vorherzusagen, wann eine Festplatte voraussichtlich vollläuft?', 'predict_linear', 'predict_linear(node_filesystem_free_bytes[4h], 86400).'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-36', 7, 'Wie nennt man den eBPF-basierten Open-Source-Kernel-Tracer von Pixie, der automatische No-Code-Observability für K8s liefert?', 'Pixie', 'CNCF Pixie.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-37', 7, 'Welche Tracing-Sampling-Strategie entscheidet erst am Ende einer Transaktion anhand von Fehlern oder Dauer, ob der Trace gespeichert wird?', 'Tail-based Sampling', 'Im Gegensatz zu Head-based Sampling beim Start.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-38', 7, 'Wie lautet der Name des hochskalierbaren, multi-tenantfähigen Langzeit-Backends für Prometheus, das früher Cortex hieß?', 'Mimir', 'Grafana Mimir / Thanos.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-39', 7, 'Welche Datenstruktur wird in OpenTelemetry verwendet, um Baggage über Prozess- und Netzwerkgrenzen hinweg im Kontext weiterzuleiten?', 'Baggage', 'W3C Baggage Header für anwendungsweite Metadaten.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-40', 7, 'Welcher Begriff bezeichnet das Phänomen, wenn Metriken durch dynamische Labels (wie User-IDs oder UUIDs) explodieren und TSDBs überlasten?', 'High Cardinality', 'Hohe Kardinalität.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-41', 8, 'Welches Open-Source-Projekt von Red Hat und CNCF bietet eine hochskalierbare Prometheus-Langzeitlösung mit Thanos Sidecars auf Object Storage?', 'Thanos', 'Thanos (Compact, Store, Query, Sidecar).'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-42', 8, 'Wie nennt man das mathematische Modell für Multi-Window-Multi-Burn-Rate-Alerting, um Fehlalarme bei SLOs drastisch zu reduzieren?', 'Multi-Window Alerting', 'Google SRE Workbook Kapitel 5.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-43', 8, 'Welche Linux-Kernel-Fähigkeit liest Hardwaredaten und CPU-Performance-Counter direkt über das Subsystem perf_events aus?', 'perf_event_open', 'Syscall perf_event_open() für Profiling.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-44', 8, 'Welches Protokoll überträgt im OpenTelemetry-Standard Telemetriedaten binär und hochkomprimiert über Protobuf und gRPC?', 'OTLP', 'OpenTelemetry Protocol (OTLP/gRPC oder OTLP/HTTP).'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-45', 8, 'Welches Grafana-Tool simuliert synthetische Benutzerinteraktionen weltweit, um Latenzen vor echten Benutzeranfragen zu messen?', 'k6', 'Grafana k6 Synthetic Monitoring / Load Testing.'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-46', 9, 'Welche mathematische Datenstruktur ermöglicht in modernen TSDBs wie VictoriaMetrics extrem schnelle Regex- und N-Gramm-Labelindizierungen?', 'Invertierter Index', 'Inverted Index mit Finite State Transducers (FST).'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-47', 9, 'Welcher Linux-eBPF-Mechanismus fängt Funktionsaufrufe direkt in kompilierten Userspace-Binärdateien (wie Go oder Rust) ohne Recompilation ab?', 'uprobes', 'User-space Probes (uprobes / uretprobes).'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-48', 9, 'Welcher PromQL-Aggregator berechnet 99-Perzentil-Latenzen mathematisch exakt aus Histogramm-Buckets?', 'histogram_quantile', 'histogram_quantile(0.99, sum(rate(...)) by (le)).'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-49', 9, 'Wie heißt das CNCF-Framework, das deklarative SLO-Definitionen als Kubernetes-CRDs ermöglicht und automatisch Prometheus-Alerts generiert?', 'Sloth', 'Sloth / Pyrra (SLO-Generatoren).'),
('devops-platform-cloud', 'observability-sre', 'obs-de8785-50', 9, 'Welcher Algorithmus wird in OpenTelemetry für Streaming-Exponential-Histogramme verwendet, um feste Bucket-Grenzen unnötig zu machen?', 'Exponential Bucketing', 'High-resolution exponential histograms in OTel.'),
-- Rubrik: Cloud-Security & Networking (cloud-security-networking) - 50 Fragen
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-1', 1, 'Welches grundlegende Sicherheitsprotokoll verschlüsselt den Webverkehr zwischen Browser und Server mit dem Schloss-Symbol in der Adresszeile?', 'HTTPS', 'Hypertext Transfer Protocol Secure (TLS/SSL).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-2', 1, 'Welcher Netzwerkdienst übersetzt menschenlesbare Domainnamen wie www.example.com in maschinenlesbare IP-Adressen?', 'DNS', 'Domain Name System.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-3', 1, 'Wie nennt man ein Sicherheitsnetzwerk-Element, das ein- und ausgehenden Datenverkehr anhand festgelegter Regeln filtert?', 'Firewall', 'Netzwerk- oder Web-Application-Firewall.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-4', 1, 'Welches Authentifizierungsverfahren fordert neben dem Passwort einen zweiten Faktor wie eine Authenticator-App oder SMS?', 'MFA', 'Multi-Faktor-Authentifizierung (auch 2FA).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-5', 1, 'Welches Protokoll ermöglicht den sicheren, verschlüsselten Terminalzugriff auf entfernte Linux-Server auf Port 22?', 'SSH', 'Secure Shell.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-6', 1, 'Wie lautet die Abkürzung für ein virtuelles privates Netzwerk, das eine verschlüsselte Verbindung über das öffentliche Internet herstellt?', 'VPN', 'Virtual Private Network.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-7', 2, 'Welche gemeinnützige Zertifizierungsstelle ermöglicht automatisierte, kostenlose TLS-Zertifikate für Webserver?', 'Let''s Encrypt', 'Nutzt das ACME-Protokoll.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-8', 2, 'Welche Netzwerkkomponente verteilt eingehenden Datenverkehr gleichmäßig auf mehrere dahinterliegende Serverinstanzen?', 'Load Balancer', 'Lastverteiler (L4 oder L7).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-9', 2, 'Wie lautet das Akronym für zustandslose Tokens im JSON-Format, die häufig zur Benutzerauthentifizierung mit Signatur verwendet werden?', 'JWT', 'JSON Web Token (RFC 7519).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-10', 2, 'Wie heißt der verteilte Netzwerkdienst, der Webinhalte an geografisch nahen Edge-Standorten zwischenspeichert, um Latenzen zu senken?', 'CDN', 'Content Delivery Network (z. B. Cloudflare, CloudFront).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-11', 2, 'Welches Sicherheitsprinzip geht davon aus, dass keinem Akteur oder Gerät standardmäßig vertraut werden darf, weder intern noch extern?', 'Zero Trust', 'Zero-Trust-Architektur ("Never trust, always verify").'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-12', 2, 'Wie nennt man einen virtuellen Server in der Cloud, der als einziger SSH-Zugangspunkt für ein privates Subnetz dient?', 'Bastion Host', 'Auch Jump Host genannt.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-13', 3, 'Welche Art von Firewall schützt Webanwendungen speziell vor Angriffen wie SQL-Injections und Cross-Site-Scripting auf Layer 7?', 'WAF', 'Web Application Firewall.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-14', 3, 'Wie nennt man den Netzwerkdienst in einer Cloud, der Instanzen in privaten Subnetzen ausgehenden Internetzugriff ohne eigene öffentliche IP ermöglicht?', 'NAT Gateway', 'Network Address Translation Gateway.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-15', 3, 'Welches offene Authentifizierungsprotokoll ermöglicht Drittanwendungen den delegierten Zugriff auf Benutzerressourcen ohne Passwörter?', 'OAuth 2.0', 'OAuth 2.0 Authorization Framework.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-16', 3, 'Welche Identitätsschicht baut direkt auf OAuth 2.0 auf und standardisiert die Authentifizierung und Profilübermittlung von Benutzern?', 'OpenID Connect', 'OIDC (OpenID Connect).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-17', 3, 'Welches Kubernetes-Objekt steuert den erlaubten Datenverkehr zwischen Pods auf IP- und Port-Ebene wie eine interne Firewall?', 'NetworkPolicy', 'k8s NetworkPolicy (erfordert ein kompatibles CNI wie Calico oder Cilium).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-18', 3, 'Wie nennt man die Verbindungsstrecke (Peering), die zwei getrennte VPCs im selben Cloud-Netzwerk direkt routingfähig verbindet?', 'VPC Peering', 'Direkte Verbindung zwischen Virtual Private Clouds.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-19', 4, 'Welcher Kubernetes-Zertifikatsmanager automatisiert die Ausstellung und Verlängerung von TLS-Zertifikaten direkt über Let''s Encrypt oder Vault?', 'cert-manager', 'CNCF cert-manager.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-20', 4, 'Welches CNCF-Graduated-Tool bietet ein vollständiges Service Mesh mit mTLS, Traffic Routing und Richtliniendurchsetzung für Kubernetes?', 'Istio', 'Basiert meist auf Envoy-Sidecars oder Ambient Mesh.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-21', 4, 'Welche Abkürzung bezeichnet die offizielle Datenbank öffentlich bekannter Softwareschwachstellen mit Kennungen wie CVE-2024-1234?', 'CVE', 'Common Vulnerabilities and Exposures.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-22', 4, 'Welches Bewertungssystem quantifiziert den Schweregrad von Sicherheitslücken auf einer Skala von 0,0 bis 10,0?', 'CVSS', 'Common Vulnerability Scoring System.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-23', 4, 'Welches Open-Source-Tool von FalcoSecurity überwacht Linux-Systemaufrufe in Echtzeit und schlägt bei verdächtigem Laufzeitverhalten Alarm?', 'Falco', 'CNCF Graduated Runtime Security Tool.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-24', 4, 'Wie nennt man die Technik, bei der Anfragen durch ein zentrales Hub-Netzwerk geroutet werden, um sternförmige VPC-Verbindungen zu verwalten?', 'Transit Gateway', 'AWS Transit Gateway / Hub-and-Spoke Topology.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-25', 5, 'Welche Policy Engine der CNCF erzwingt deklarative Richtlinien in Kubernetes über einen Validating/Mutating Webhook mittels OPA?', 'Gatekeeper', 'OPA Gatekeeper.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-26', 5, 'Welche moderne Richtlinien-Engine für Kubernetes wurde speziell entwickelt, um Policies direkt als native YAML-Ressourcen ohne Rego zu schreiben?', 'Kyverno', 'CNCF Kyverno.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-27', 5, 'Welcher Angriffsvektor wird ausgenutzt, wenn ein Angreifer eine Serveranwendung dazu bringt, ungewollte Anfragen an interne Cloud-Metadatendienste (169.254.169.254) zu senden?', 'SSRF', 'Server-Side Request Forgery.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-28', 5, 'Welche Version des AWS Instance Metadata Service schützt vor SSRF durch session-orientierte Header-Tokens?', 'IMDSv2', 'AWS Instance Metadata Service Version 2.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-29', 5, 'Wie lautet der Fachbegriff für ein Sicherheitsmodul in Hardwareform, das kryptografische Schlüssel unextrahierbar speichert und Operationen darin ausführt?', 'HSM', 'Hardware Security Module.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-30', 5, 'Welches Protokoll regelt im BGP-Routing den sicheren Austausch von Pfaden zwischen Autonomen Systemen im globalen Internet?', 'BGP', 'Border Gateway Protocol (auch von Calico und Cilium für Cluster-Peering genutzt).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-31', 6, 'Welches Open-Source-Framework ermöglicht SPIFFE-konforme, kryptografisch verifizierbare Arbeitslast-Identitäten in heterogenen Umgebungen?', 'SPIRE', 'SPIFFE Runtime Environment (SPIRE).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-32', 6, 'Wie heißt die Spezifikation zur Ausstellung kryptografischer X.509-SVIDs für Microservices im Zero-Trust-Bereich?', 'SPIFFE', 'Secure Production Identity Framework for Everyone.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-33', 6, 'Welche Linux-Technologie erlaubt es Cilium, Paketfilterung und Load-Balancing direkt auf der Netzwerk-Treiber-Ebene ohne Kernel-Overhead durchzuführen?', 'XDP', 'eXpress Data Path (unterstützt durch eBPF).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-34', 6, 'Wie nennt man die Sicherheitskategorie von Tools, die Cloud-Konten kontinuierlich auf Compliance-Verstöße und Fehlkonfigurationen überwachen?', 'CSPM', 'Cloud Security Posture Management.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-35', 6, 'Wie nennt man die Plattform-Kategorie, die Laufzeitschutz für Cloud-Workloads (CWPP) und CSPM in einer einheitlichen Lösung bündelt?', 'CNAPP', 'Cloud-Native Application Protection Platform.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-36', 7, 'Welches Verschlüsselungsprotokoll nutzt modernes WireGuard-VPN, das durch schlanke 4000 Zeilen C-Code im Linux-Kernel besticht?', 'Noise Protocol', 'Noise Protocol Framework (ChaCha20-Poly1305, Curve25519).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-37', 7, 'Welches Kubernetes-Feature erlaubt es Pods, temporäre Cloud-IAM-Rollen direkt über OIDC ohne statische Secrets auf Cloud-APIs anzunehmen?', 'IRSA', 'IAM Roles for Service Accounts (bei AWS; Workload Identity bei Azure/GCP).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-38', 7, 'Welches eBPF-basierte Netzwerk-Feature ermöglicht Socket-Level-Redirection zwischen lokalen Pods und umgeht TCP/IP-Stacks komplett?', 'sockops', 'BPF sockops / sockmap redirection.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-39', 7, 'Wie nennt man die Kapselungsmethode, die Layer-2-Ethernet-Frames in standardmäßige Layer-3-UDP-Pakete packt, um virtuelle Overlays zu bilden?', 'VXLAN', 'Virtual Extensible LAN.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-40', 7, 'Welche Bedrohungsmodellierungsmethode klassifiziert Risiken in Spoofing, Tampering, Repudiation, Info Disclosure, DoS und Elevation of Privilege?', 'STRIDE', 'STRIDE-Modell von Microsoft.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-41', 8, 'Welche Hardware-Fähigkeit moderner CPUs (wie Intel SGX oder AMD SEV) ermöglicht Confidential Computing mit verschlüsseltem Arbeitsspeicher?', 'Enklaven', 'Secure Enclaves / TEE (Trusted Execution Environments).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-42', 8, 'Welche kryptografische Methode erlaubt es, Berechnungen direkt auf verschlüsselten Daten durchzuführen, ohne sie jemals zu entschlüsseln?', 'Homomorphe Verschlüsselung', 'Homomorphic Encryption (FHE).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-43', 8, 'Welcher Linux-Syscall wird von eBPF-LSM verwendet, um Sicherheitsrichtlinien dynamisch an Kernel-Sicherheits-Hooks wie bprm_check_security zu binden?', 'bpf', 'BPF_PROG_TYPE_LSM.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-44', 8, 'Welcher Algorithmus verhindert in modernen TLS-1.3-Verbindungen, dass später kompromittierte Server-Schlüssel vergangene Sitzungen entschlüsseln?', 'PFS', 'Perfect Forward Secrecy (DHE / ECDHE).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-45', 8, 'Welcher HashiCorp-Vault-Mechanismus generiert bei jedem Datenbankzugriff ein eigenes, kurzlebiges DB-Passwort mit automatischem Ablauf?', 'Dynamic Secrets', 'Dynamische Secrets Engine in Vault.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-46', 9, 'Welche Angriffsart hebelt die Isolation von MicroVMs durch Ausnutzen von spekulativen CPU-Seitenkanälen wie Spectre oder Meltdown aus?', 'Transient Execution Attack', 'Spekulativer Seitenkanalangriff (Spectre / Meltdown / Downfall).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-47', 9, 'Welche Krypto-Primitive ermöglicht Zero-Knowledge-Beweise für komplexe Aussagen ohne Preisgabe der zugrundeliegenden Geheimnisse?', 'zk-SNARKs', 'Zero-Knowledge Succinct Non-Interactive Argument of Knowledge.'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-48', 9, 'Welcher post-quanten-sichere Schlüsselaustausch-Algorithmus wurde vom NIST als Standard für TLS der nächsten Generation ausgewählt?', 'ML-KEM', 'Module-Lattice-based Key-Encapsulation Mechanism (früher CRYSTALS-Kyber).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-49', 9, 'Welcher post-quanten-sichere Signaturalgorithmus wurde vom NIST für digitale Signaturen neben Sphincs+ standardisiert?', 'ML-DSA', 'Module-Lattice-based Digital Signature Algorithm (früher CRYSTALS-Dilithium).'),
('devops-platform-cloud', 'cloud-security-networking', 'sec-80a592-50', 9, 'Welcher eBPF-Kernel-Mechanismus in Cilium ermöglicht transparente L7-Paketinspektion ohne Sidecar-Proxy durch direkten Envoy-Upstream-Handshake?', 'Envoy Go Extension', 'Cilium In-Kernel Envoy Integration / Socket Parsing.');

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

COMMIT;
