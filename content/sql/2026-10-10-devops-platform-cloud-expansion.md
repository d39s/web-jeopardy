# Lieferbericht: DevOps, Platform & Cloud (Erweiterung um 300 Fragen)

- **Datum:** 10.10.2026
- **SQL-Datei:** `content/sql/2026-10-10-devops-platform-cloud-expansion.sql`
- **Kategorie-ID:** `devops-platform-cloud`
- **Titel:** „DevOps, Platform & Cloud“
- **Sprache:** Deutsch (`de-DE`)
- **Status:** Bereitgestellt zur manuellen Übernahme durch den Betreiber (keine automatische Migration, kein produktiver Import).

---

## 1. Übersicht und Struktur

Diese ergänzende SQL-Lieferung erweitert die bestehende Kategorie `devops-platform-cloud` um **weitere 50 Fragen pro Rubrik**, also insgesamt **300 neue Fragen**.
Zusammen mit der Initiallieferung (`2026-10-10-devops-platform-cloud-initial.sql`, 54 Fragen) umfasst der Pool damit künftig **354 Fragen** (59 Fragen je Rubrik).

- **Ergänzte Fragen:** 300
- **Rubriken:** 6
- **Fragen pro Rubrik in dieser Lieferung:** genau 50
- **Stufenverteilung je Rubrik:** Stufen 1 bis 5 jeweils 6 Fragen, Stufen 6 bis 9 jeweils 5 Fragen.

### Rubrikenübersicht

| Rubrik-ID                   | Name                           | Neue Fragen | Stufen 1–5 | Stufen 6–9 | Gesamtbestand nach Import |
| :-------------------------- | :----------------------------- | :---------: | :--------: | :--------: | :-----------------------: |
| `container-linux`           | Container & Linux-Internals    |     50      | je 6 (30)  | je 5 (20)  |            59             |
| `kubernetes-orchestration`  | Kubernetes & Orchestrierung    |     50      | je 6 (30)  | je 5 (20)  |            59             |
| `ci-cd-gitops`              | CI/CD & GitOps                 |     50      | je 6 (30)  | je 5 (20)  |            59             |
| `iac-cloud-foundations`     | Infrastructure as Code & Cloud |     50      | je 6 (30)  | je 5 (20)  |            59             |
| `observability-sre`         | Observability & SRE            |     50      | je 6 (30)  | je 5 (20)  |            59             |
| `cloud-security-networking` | Cloud-Security & Networking    |     50      | je 6 (30)  | je 5 (20)  |            59             |

---

## 2. Detaillierte Fragenübersicht nach Rubriken

### Rubrik 1: Container & Linux-Internals (`container-linux`)

1. **[ID: `cont-55f7e5-1`] Stufe 1:** _Welches Kommandozeilen-Tool wird standardmäßig mit dem Befehl "docker run" ausgeführt?_
   - **Antwort:** Docker
   - **Hinweis:** Docker CLI / Docker Engine.
2. **[ID: `cont-55f7e5-2`] Stufe 1:** _Mit welchem Docker-Befehl stoppt man einen laufenden Container?_
   - **Antwort:** docker stop
   - **Hinweis:** docker stop <container_id/name>
3. **[ID: `cont-55f7e5-3`] Stufe 1:** _Wie nennt man die zentrale öffentliche Registry von Docker zum Herunterladen von Images?_
   - **Antwort:** Docker Hub
   - **Hinweis:** hub.docker.com
4. **[ID: `cont-55f7e5-4`] Stufe 1:** _Welche Dateiendung hat ein Tar-Archiv typischerweise, das beim Exportieren von Container-Dateisystemen entsteht?_
   - **Antwort:** .tar
   - **Hinweis:** Tarball / Tape Archive.
5. **[ID: `cont-55f7e5-5`] Stufe 1:** _Mit welchem Befehl listet Docker alle aktuell laufenden Container auf?_
   - **Antwort:** docker ps
   - **Hinweis:** Alternativ auch docker container ls.
6. **[ID: `cont-55f7e5-6`] Stufe 1:** _Wie lautet der Befehl, um ein Image von einer Registry lokal herunterzuladen?_
   - **Antwort:** docker pull
   - **Hinweis:** docker pull <image>
7. **[ID: `cont-55f7e5-7`] Stufe 2:** _Welche Dockerfile-Instruktion legt das Basis-Image für den Build-Prozess fest?_
   - **Antwort:** FROM
   - **Hinweis:** Beginnt fast jedes Dockerfile.
8. **[ID: `cont-55f7e5-8`] Stufe 2:** _Mit welcher Dockerfile-Anweisung kopiert man Dateien aus dem Build-Kontext in das Image?_
   - **Antwort:** COPY
   - **Hinweis:** ADD kann zusätzlich Archive entpacken und URLs laden.
9. **[ID: `cont-55f7e5-9`] Stufe 2:** _Welche Instruktion im Dockerfile führt einen Befehl während des Image-Builds aus und erzeugt eine neue Schicht?_
   - **Antwort:** RUN
   - **Hinweis:** RUN führt Befehle wie apt-get oder npm install aus.
10. **[ID: `cont-55f7e5-10`] Stufe 2:** _Mit welcher Instruktion definiert man den Standardbefehl, der beim Starten eines Containers ausgeführt werden soll?_

- **Antwort:** CMD
- **Hinweis:** Wird oft zusammen mit ENTRYPOINT verwendet.

11. **[ID: `cont-55f7e5-11`] Stufe 2:** _Welcher CLI-Schalter bei "docker run" sorgt dafür, dass der Container im Hintergrund ausgeführt wird?_

- **Antwort:** -d
- **Hinweis:** Detached Mode (--detach bzw. -d).

12. **[ID: `cont-55f7e5-12`] Stufe 2:** _Welches Docker-Kommando entfernt alle ungenutzten Container, Netzwerke und ungetaggten Images auf einmal?_

- **Antwort:** docker system prune
- **Hinweis:** Bereinigung von dangling resources.

13. **[ID: `cont-55f7e5-13`] Stufe 3:** _Wie nennt man den Build-Ansatz, bei dem mehrere FROM-Zeilen in einem Dockerfile genutzt werden, um Build-Tools aus dem End-Image fernzuhalten?_

- **Antwort:** Multi-Stage Build
- **Hinweis:** Mehrstufige Builds zur Image-Verkleinerung.

14. **[ID: `cont-55f7e5-14`] Stufe 3:** _Welcher Mechanismus in Docker sorgt dafür, dass unveränderte Schichten beim erneuten Bauen nicht neu berechnet werden müssen?_

- **Antwort:** Build-Cache
- **Hinweis:** Layer-Caching / Build Cache.

15. **[ID: `cont-55f7e5-15`] Stufe 3:** _Welche Datei im Projektstamm verhindert wie eine .gitignore-Datei, dass sensible Dateien in den Docker-Build-Kontext gelangen?_

- **Antwort:** .dockerignore
- **Hinweis:** Schließt Dateien vom Build-Kontext aus.

16. **[ID: `cont-55f7e5-16`] Stufe 3:** _Welcher Speichermechanismus in Docker speichert Daten direkt auf dem Host-Dateisystem außerhalb des Union-Dateisystems des Containers persistent ab?_

- **Antwort:** Volume
- **Hinweis:** Docker Volumes oder Bind Mounts.

17. **[ID: `cont-55f7e5-17`] Stufe 3:** _Welche minimale Linux-Distribution wird aufgrund ihrer extrem kleinen Image-Größe von nur wenigen Megabytes sehr häufig als Basis-Image gewählt?_

- **Antwort:** Alpine Linux
- **Hinweis:** Nutzt musl libc und BusyBox.

18. **[ID: `cont-55f7e5-18`] Stufe 3:** _Mit welchem Docker-Befehl kann man sich interaktiv in die laufende Shell eines Containers einklinken?_

- **Antwort:** docker exec
- **Hinweis:** docker exec -it <container> sh / bash.

19. **[ID: `cont-55f7e5-19`] Stufe 4:** _Welcher Container-Standard von OCI beschreibt die JSON-basierte Spezifikation zur Erstellung und Ausführung von Containern auf Betriebssystemebene?_

- **Antwort:** Runtime Specification
- **Hinweis:** OCI Runtime Spec; Referenzimplementierung ist runc.

20. **[ID: `cont-55f7e5-20`] Stufe 4:** _Wie heißt die leichtgewichtige OCI-Referenz-Laufzeitumgebung (Low-Level-Runtime), die ursprünglich von Docker als libcontainer entwickelt wurde?_

- **Antwort:** runc
- **Hinweis:** Wird von containerd und CRI-O als Default-Runtime genutzt.

21. **[ID: `cont-55f7e5-21`] Stufe 4:** _Welcher Linux-Namespace sorgt dafür, dass Prozesse im Container ihre eigene isolierte Prozessbaum-Hierarchie beginnend bei PID 1 sehen?_

- **Antwort:** PID-Namespace
- **Hinweis:** Process ID Namespace.

22. **[ID: `cont-55f7e5-22`] Stufe 4:** _Welcher Linux-Namespace isoliert Netzwerkinterfaces, Routingtabellen und IP-Ports für jeden Container?_

- **Antwort:** Network-Namespace
- **Hinweis:** Net-Namespace.

23. **[ID: `cont-55f7e5-23`] Stufe 4:** _Welcher Daemon verwaltet auf modernen Linux-Systemen den vollständigen Container-Lebenszyklus von Image-Transfer bis Container-Ausführung unterhalb von Docker?_

- **Antwort:** containerd
- **Hinweis:** CNCF Graduated Runtime-Daemon.

24. **[ID: `cont-55f7e5-24`] Stufe 4:** _Wie nennt man den virtuellen Ethernet-Paar-Typ in Linux, der Netzwerkverkehr zwischen einem Container-Netns und der Host-Bridge vermittelt?_

- **Antwort:** veth-Pair
- **Hinweis:** Virtual Ethernet Pair (veth).

25. **[ID: `cont-55f7e5-25`] Stufe 5:** _Welcher Linux-Namespace isoliert Hostnamen und Domainnamen des Containers vom Host-Betriebssystem?_

- **Antwort:** UTS-Namespace
- **Hinweis:** UNIX Timesharing System Namespace.

26. **[ID: `cont-55f7e5-26`] Stufe 5:** _Welcher Linux-Namespace ermöglicht es Prozessen, eigene Dateisystem-Einhängungen (Mounts) isoliert zu verwalten?_

- **Antwort:** Mount-Namespace
- **Hinweis:** MNT-Namespace.

27. **[ID: `cont-55f7e5-27`] Stufe 5:** _Welche Version der Linux Control Groups führte eine strikte einheitliche Hierarchie ohne getrennte Controller-Bäume ein?_

- **Antwort:** cgroups v2
- **Hinweis:** Unified cgroups hierarchy in modernen Linux-Distributionen.

28. **[ID: `cont-55f7e5-28`] Stufe 5:** _Mit welchem Red-Hat-Tool können Container-Images ohne Daemon und ohne Root-Rechte nach OCI-Standard gebaut werden?_

- **Antwort:** Buildah
- **Hinweis:** Teil des Trios Podman/Buildah/Skopeo.

29. **[ID: `cont-55f7e5-29`] Stufe 5:** _Welches schlanke Tool aus der Podman-Familie dient speziell zum Kopieren und Inspizieren von Container-Images zwischen Registries ohne Daemon?_

- **Antwort:** Skopeo
- **Hinweis:** skopeo copy / inspect.

30. **[ID: `cont-55f7e5-30`] Stufe 5:** _Wie nennt man Images, die für mehrere verschiedene CPU-Architekturen wie amd64 und arm64 über ein gemeinsames Manifest verfügbar sind?_

- **Antwort:** Multi-Arch-Images
- **Hinweis:** Verwendet OCI Image Index bzw. Docker Manifest List.

31. **[ID: `cont-55f7e5-31`] Stufe 6:** _Welcher Linux-Namespace erlaubt es einem unprivilegierten Benutzer auf dem Host, innerhalb des Containers scheinbar Root-Rechte (UID 0) zu besitzen?_

- **Antwort:** User-Namespace
- **Hinweis:** Ermöglicht Rootless Containers.

32. **[ID: `cont-55f7e5-32`] Stufe 6:** _Welches Linux-Sicherheitsmodul (LSM) erzwingt in Red Hat Enterprise Linux und Fedora Mandatory Access Control (MAC) für Container?_

- **Antwort:** SELinux
- **Hinweis:** Security-Enhanced Linux; Ubuntu setzt meist auf AppArmor.

33. **[ID: `cont-55f7e5-33`] Stufe 6:** _Welche Standard-C-Bibliothek nutzt Alpine Linux anstelle der sonst üblichen GNU C Library (glibc)?_

- **Antwort:** musl
- **Hinweis:** musl libc.

34. **[ID: `cont-55f7e5-34`] Stufe 6:** _Welcher Befehl im Linux-Kernel trennt Systemressourcen eines aufgerufenen Programms in neue Namespaces ab, ohne fork() aufzurufen?_

- **Antwort:** unshare
- **Hinweis:** Syscall unshare() bzw. CLI unshare.

35. **[ID: `cont-55f7e5-35`] Stufe 6:** _Wie heißt die OCI-spezifische Datei, die nach "runc spec" erzeugt wird und die vollständige Container-Konfiguration enthält?_

- **Antwort:** config.json
- **Hinweis:** OCI runtime bundle config.json.

36. **[ID: `cont-55f7e5-36`] Stufe 7:** _Welcher Linux-Syscall wird verwendet, um einen Prozess an einen bereits bestehenden Namespace eines anderen Prozesses anzuhängen?_

- **Antwort:** setns
- **Hinweis:** Syscall setns().

37. **[ID: `cont-55f7e5-37`] Stufe 7:** _Welcher Linux-Syscall ändert das Root-Dateisystem eines Prozesses sicherer als chroot und verschiebt das alte Root-Verzeichnis?_

- **Antwort:** pivot_root
- **Hinweis:** pivot_root(new_root, put_old).

38. **[ID: `cont-55f7e5-38`] Stufe 7:** _Welche Sandbox-Container-Laufzeitumgebung von Google fängt Syscalls im Userspace ab, um den Host-Kernel vor unsicherem Code zu schützen?_

- **Antwort:** gVisor
- **Hinweis:** Nutzt den Sentry-Kernel in Go.

39. **[ID: `cont-55f7e5-39`] Stufe 7:** _Welche Container-Laufzeit nutzt leichtgewichtige virtuelle Micro-VMs mit QEMU oder Cloud-Hypervisor für echte Hardware-Virtualisierung pro Pod?_

- **Antwort:** Kata Containers
- **Hinweis:** OpenStack Kata Containers.

40. **[ID: `cont-55f7e5-40`] Stufe 7:** _Wie heißt die Linux-Kernel-Fähigkeit, die es erlaubt, klassische Root-Berechtigungen in feingliedrige Einzelrechte wie CAP_NET_ADMIN aufzuteilen?_

- **Antwort:** Linux Capabilities
- **Hinweis:** POSIX/Linux Capabilities.

41. **[ID: `cont-55f7e5-41`] Stufe 8:** _Welcher BPF-Filtermechanismus wird in seccomp eingesetzt, um Syscalls anhand ihrer Argumente im Kernel zur Laufzeit zu evaluieren?_

- **Antwort:** cBPF
- **Hinweis:** Classic BPF (Berkeley Packet Filter).

42. **[ID: `cont-55f7e5-42`] Stufe 8:** _Wie heißt der Daemon-Prozess von containerd, der einen einzelnen Container überwacht und I/O weiterleitet, selbst wenn containerd neu startet?_

- **Antwort:** containerd-shim
- **Hinweis:** Verhindert verwaiste Container bei Daemon-Restarts.

43. **[ID: `cont-55f7e5-43`] Stufe 8:** _Welches OCI-Dateiformat packt das Root-Dateisystem, Metadaten und Kernel in eine einzige unveränderbare Squashfs-Datei für HPC-Umgebungen?_

- **Antwort:** Apptainer
- **Hinweis:** Früher Singularity (SIF-Format).

44. **[ID: `cont-55f7e5-44`] Stufe 8:** _Welcher spezialisierte Linux-Hypervisor von Amazon Web Services bootet MicroVMs in Millisekunden und treibt AWS Lambda und Fargate an?_

- **Antwort:** Firecracker
- **Hinweis:** Geschrieben in Rust, basiert auf KVM.

45. **[ID: `cont-55f7e5-45`] Stufe 8:** _Welches Layering-Merkmal in OverlayFS markiert eine Datei als gelöscht, wenn sie im schreibgeschützten Lowerdir existiert?_

- **Antwort:** Whiteout
- **Hinweis:** Whiteout-Device / Character Device 0:0.

46. **[ID: `cont-55f7e5-46`] Stufe 9:** _Welcher cgroups-v2-Controller steuert und begrenzt die maximale Anzahl gleichzeitiger Prozesse und Threads, um Fork-Bombs zu verhindern?_

- **Antwort:** pids
- **Hinweis:** pids.max in cgroup v2.

47. **[ID: `cont-55f7e5-47`] Stufe 9:** _Welche OCI-WebAssembly-Laufzeitumgebung ermöglicht das Ausführen von Wasm-Modulen direkt über runc-ähnliche Shims in Kubernetes?_

- **Antwort:** runwasi
- **Hinweis:** DeisLabs / containerd runwasi Projekt.

48. **[ID: `cont-55f7e5-48`] Stufe 9:** _Welcher Linux-Syscall erzeugt einen Kindprozess und akzeptiert Bitmasken wie CLONE_NEWPID und CLONE_NEWNET zur Namespace-Erstellung?_

- **Antwort:** clone
- **Hinweis:** Syscall clone() bzw. clone3().

49. **[ID: `cont-55f7e5-49`] Stufe 9:** _Welche Kernel-Funktion löst das Problem der Dateizugriffsbeschränkung für unprivilegierte Container bei unterschiedlichen Host-UIDs mittels VFS-Mapping?_

- **Antwort:** ID-mapped Mounts
- **Hinweis:** Eingeführt in Linux 5.12 (idmapped mounts).

50. **[ID: `cont-55f7e5-50`] Stufe 9:** _Welche Linux-Sicherheitsfunktion verhindert dauerhaft, dass ein Prozess oder seine Kindprozesse über setuid neue Berechtigungen erlangen?_

- **Antwort:** no_new_privs
- **Hinweis:** prctl(PR_SET_NO_NEW_PRIVS, 1).

### Rubrik 2: Kubernetes & Orchestrierung (`kubernetes-orchestration`)

1. **[ID: `k8s-8d5ab5-1`] Stufe 1:** _Welches Open-Source-Projekt zur Container-Orchestrierung wurde ursprünglich bei Google unter dem Codenamen Borg inspiriert?_
   - **Antwort:** Kubernetes
   - **Hinweis:** Häufig auch als K8s abgekürzt.
2. **[ID: `k8s-8d5ab5-2`] Stufe 1:** _Welches Datenformat (Dateiendung .yaml oder .yml) wird standardmäßig für Kubernetes-Manifeste verwendet?_
   - **Antwort:** YAML
   - **Hinweis:** YAML Ain't Markup Language.
3. **[ID: `k8s-8d5ab5-3`] Stufe 1:** _Wie nennt man einen einzelnen physischen oder virtuellen Computer in einem Kubernetes-Cluster?_
   - **Antwort:** Node
   - **Hinweis:** Worker Node oder Control Plane Node.
4. **[ID: `k8s-8d5ab5-4`] Stufe 1:** _Mit welchem kubectl-Befehl lässt sich ein Manifest deklarativ auf den Cluster anwenden?_
   - **Antwort:** kubectl apply
   - **Hinweis:** kubectl apply -f <datei>.
5. **[ID: `k8s-8d5ab5-5`] Stufe 1:** _Welcher kubectl-Befehl listet Ressourcen wie Pods oder Services im aktuellen Namespace auf?_
   - **Antwort:** kubectl get
   - **Hinweis:** kubectl get pods / svc.
6. **[ID: `k8s-8d5ab5-6`] Stufe 1:** _Wie nennt man den virtuellen logischen Trennungsbereich innerhalb eines Kubernetes-Clusters für Mandanten oder Umgebungen?_
   - **Antwort:** Namespace
   - **Hinweis:** Standardmäßig: default, kube-system, kube-public.
7. **[ID: `k8s-8d5ab5-7`] Stufe 2:** _Welche Kubernetes-Ressource definiert einen stabilen Netzwerk-Endpunkt mit virtueller IP für eine Gruppe von Pods?_
   - **Antwort:** Service
   - **Hinweis:** Service-Typen: ClusterIP, NodePort, LoadBalancer, ExternalName.
8. **[ID: `k8s-8d5ab5-8`] Stufe 2:** _Welcher Standardtyp eines Kubernetes-Service ist nur clusterintern erreichbar?_
   - **Antwort:** ClusterIP
   - **Hinweis:** Standardtyp bei Services.
9. **[ID: `k8s-8d5ab5-9`] Stufe 2:** _Welche Ressource speichert unverschlüsselte Konfigurationsdaten wie Umgebungsvariablen oder Konfigurationsdateien für Pods?_
   - **Antwort:** ConfigMap
   - **Hinweis:** Für geheime Daten nutzt man stattdessen Secret.
10. **[ID: `k8s-8d5ab5-10`] Stufe 2:** _Welche Ressource dient in Kubernetes der Verwaltung vertraulicher Daten wie Passwörter oder API-Keys?_

- **Antwort:** Secret
- **Hinweis:** Standardmäßig nur Base64-kodiert in etcd.

11. **[ID: `k8s-8d5ab5-11`] Stufe 2:** _Welcher Paketmanager für Kubernetes paketiert Anwendungen in sogenannten Charts?_

- **Antwort:** Helm
- **Hinweis:** Der De-facto-Paketmanager für K8s.

12. **[ID: `k8s-8d5ab5-12`] Stufe 2:** _Wie heißen die Schlüssel-Wert-Paare, die an Kubernetes-Objekte angehängt werden, um sie mittels Selektoren zu identifizieren?_

- **Antwort:** Labels
- **Hinweis:** Labels und Label-Selector.

13. **[ID: `k8s-8d5ab5-13`] Stufe 3:** _Welche Kubernetes-Ressource eignet sich speziell für zustandsbehaftete Anwendungen mit stabiler Netzwerkidentität und festen Datenträgern?_

- **Antwort:** StatefulSet
- **Hinweis:** Geeignet für Datenbanken wie PostgreSQL oder Redis.

14. **[ID: `k8s-8d5ab5-14`] Stufe 3:** _Wie heißt die Anforderung eines Pods an persistenten Speicher in Kubernetes?_

- **Antwort:** PersistentVolumeClaim
- **Hinweis:** PVC (PersistentVolumeClaim) bindet ein PV (PersistentVolume).

15. **[ID: `k8s-8d5ab5-15`] Stufe 3:** _Welche Ressource führt einmalige Aufgaben bis zum erfolgreichen Abschluss aus und beendet sich danach?_

- **Antwort:** Job
- **Hinweis:** Für wiederkehrende Aufgaben gibt es CronJobs.

16. **[ID: `k8s-8d5ab5-16`] Stufe 3:** _Welcher Probe-Typ in Kubernetes prüft, ob eine Anwendung gesund läuft und startet den Container bei Fehlschlag neu?_

- **Antwort:** Liveness Probe
- **Hinweis:** LivenessProbe steuert Container-Neustarts.

17. **[ID: `k8s-8d5ab5-17`] Stufe 3:** _Welcher Probe-Typ entscheidet, ob ein Pod bereit ist, Netzwerkverkehr von einem Service entgegenzunehmen?_

- **Antwort:** Readiness Probe
- **Hinweis:** ReadinessProbe steuert Aufnahme in Service-Endpoints.

18. **[ID: `k8s-8d5ab5-18`] Stufe 3:** _Welcher DNS-Dienst läuft standardmäßig in modernen Kubernetes-Clustern für die interne Namensauflösung?_

- **Antwort:** CoreDNS
- **Hinweis:** Löste früher Kube-DNS ab.

19. **[ID: `k8s-8d5ab5-19`] Stufe 4:** _Welche Kernkomponente der Control Plane entscheidet, auf welchem Worker-Node ein neuer Pod platziert wird?_

- **Antwort:** kube-scheduler
- **Hinweis:** Scheduler bewertet Nodes nach Filtern und Scores.

20. **[ID: `k8s-8d5ab5-20`] Stufe 4:** _Welche Komponente der Control Plane führt Abgleichsschleifen für Kernressourcen wie ReplicaSets und Nodes aus?_

- **Antwort:** kube-controller-manager
- **Hinweis:** Controller-Manager hält den Sollzustand aufrecht.

21. **[ID: `k8s-8d5ab5-21`] Stufe 4:** _Welche Netzwerkkomponente auf den Nodes implementiert Kubernetes-Services durch Manipulation von iptables oder IPVS-Regeln?_

- **Antwort:** kube-proxy
- **Hinweis:** Verwaltet Service-Routing auf Node-Ebene.

22. **[ID: `k8s-8d5ab5-22`] Stufe 4:** _Wie heißt das Interface, das die Anbindung beliebiger Container-Runtimes wie containerd oder CRI-O an das Kubelet standardisiert?_

- **Antwort:** CRI
- **Hinweis:** Container Runtime Interface.

23. **[ID: `k8s-8d5ab5-23`] Stufe 4:** _Wie heißt die Spezifikation, über die Speicheranbieter wie Ceph, AWS EBS oder Azure Disk Speicher an Kubernetes anbinden?_

- **Antwort:** CSI
- **Hinweis:** Container Storage Interface.

24. **[ID: `k8s-8d5ab5-24`] Stufe 4:** _Welches Interface standardisiert die Netzwerkanbindung und IP-Vergabe für Pods in Kubernetes?_

- **Antwort:** CNI
- **Hinweis:** Container Network Interface.

25. **[ID: `k8s-8d5ab5-25`] Stufe 5:** _Welche Ressource in Kubernetes skaliert die Anzahl der Pod-Replikate eines Deployments automatisch anhand der CPU-Auslastung?_

- **Antwort:** HPA
- **Hinweis:** Horizontal Pod Autoscaler.

26. **[ID: `k8s-8d5ab5-26`] Stufe 5:** _Welcher spezielle Pod-Typ läuft vor den regulären Anwendungscontainern im selben Pod an und muss sich erfolgreich beenden?_

- **Antwort:** Init-Container
- **Hinweis:** Init Containers für Vorarbeiten und Migrationen.

27. **[ID: `k8s-8d5ab5-27`] Stufe 5:** _Wie nennt man Metadaten an Kubernetes-Objekten, die keine Selektion ermöglichen, aber Build- oder Tool-Infos speichern?_

- **Antwort:** Annotations
- **Hinweis:** Annotations im Gegensatz zu Labels.

28. **[ID: `k8s-8d5ab5-28`] Stufe 5:** _Welche Ressource definiert Richtlinien für Pod-Erschütterungen bei geplanten Wartungsarbeiten, um Mindestverfügbarkeit zu garantieren?_

- **Antwort:** PDB
- **Hinweis:** PodDisruptionBudget.

29. **[ID: `k8s-8d5ab5-29`] Stufe 5:** _Mit welchem kubectl-Befehl markiert man einen Node als nicht-planbar und evakuiert alle darauf laufenden Pods sicher?_

- **Antwort:** kubectl drain
- **Hinweis:** kubectl drain --ignore-daemonsets.

30. **[ID: `k8s-8d5ab5-30`] Stufe 5:** _Welche K8s-Ressource ermöglicht die Definition eigener Objekt-Typen und Schemas über die Standardressourcen hinaus?_

- **Antwort:** CRD
- **Hinweis:** Custom Resource Definition.

31. **[ID: `k8s-8d5ab5-31`] Stufe 6:** _Welcher Hook wird direkt vor dem Senden des SIGTERM-Signals an den Container ausgeführt, um Graceful Shutdowns zu ermöglichen?_

- **Antwort:** PreStop-Hook
- **Hinweis:** preStop Lifecycle Hook.

32. **[ID: `k8s-8d5ab5-32`] Stufe 6:** _Welche Admission-Controller-Art kann eingehende API-Anfragen an den API-Server modifizieren, bevor sie in etcd gespeichert werden?_

- **Antwort:** Mutating Admission Webhook
- **Hinweis:** MutatingWebhookConfiguration.

33. **[ID: `k8s-8d5ab5-33`] Stufe 6:** _Welche Admission-Controller-Art prüft eingehende API-Objekte auf Konformität und kann die Erstellung verweigern?_

- **Antwort:** Validating Admission Webhook
- **Hinweis:** ValidatingWebhookConfiguration.

34. **[ID: `k8s-8d5ab5-34`] Stufe 6:** _Welcher Typ von Probe schützt langsam startende Legacy-Anwendungen davor, von der Liveness Probe vorzeitig gekillt zu werden?_

- **Antwort:** Startup Probe
- **Hinweis:** Deaktiviert Liveness- und Readiness-Checks während des Starts.

35. **[ID: `k8s-8d5ab5-35`] Stufe 6:** _Welche RBAC-Ressource bindet eine ClusterRole an einen bestimmten Benutzer oder ServiceAccount, jedoch nur innerhalb eines einzigen Namespace?_

- **Antwort:** RoleBinding
- **Hinweis:** Im Gegensatz zu ClusterRoleBinding, das clusterweit gilt.

36. **[ID: `k8s-8d5ab5-36`] Stufe 7:** _Welcher moderne Node-Autoscaler der CNCF provisioniert Compute-Instanzen ohne Node-Groups direkt passgenau für ausstehende Pods?_

- **Antwort:** Karpenter
- **Hinweis:** Ursprung bei AWS, nun herstellerunabhängig.

37. **[ID: `k8s-8d5ab5-37`] Stufe 7:** _Wie heißt das Kubernetes-Feature, das Pods gleichmäßig über Ausfallzonen (Failure Domains wie Availability Zones) verteilt?_

- **Antwort:** Topology Spread Constraints
- **Hinweis:** topologySpreadConstraints in PodSpec.

38. **[ID: `k8s-8d5ab5-38`] Stufe 7:** _Welcher Mechanismus in etcd sichert den Konsens zwischen den Member-Knoten der Control Plane ab?_

- **Antwort:** Raft
- **Hinweis:** Raft Konsensus-Algorithmus.

39. **[ID: `k8s-8d5ab5-39`] Stufe 7:** _Welche API-Ressource stellt die moderne, expressive und rollenorientierte Nachfolgerin der Ingress-Ressource in Kubernetes dar?_

- **Antwort:** Gateway API
- **Hinweis:** GatewayClass, Gateway und HTTPRoute.

40. **[ID: `k8s-8d5ab5-40`] Stufe 7:** _Welches Sicherheits-Feature löste die veralteten PodSecurityPolicies (PSP) als nativer Admission Controller in Kubernetes ab?_

- **Antwort:** Pod Security Standards
- **Hinweis:** PSS / Pod Security Admission (PSA) mit Privileged, Baseline, Restricted.

41. **[ID: `k8s-8d5ab5-41`] Stufe 8:** _Welcher Controller-Mechanismus in client-go vermeidet ständige API-Server-Abfragen durch lokale Caches und Delta-FIFO-Queues?_

- **Antwort:** Informer
- **Hinweis:** SharedInformer / Reflector Pattern.

42. **[ID: `k8s-8d5ab5-42`] Stufe 8:** _Welches Kubernetes-Feature erlaubt das dynamische Erweitern von Volumes, ohne den dazugehörigen Pod neu starten zu müssen?_

- **Antwort:** Online Volume Expansion
- **Hinweis:** AllowVolumeExpansion im StorageClass.

43. **[ID: `k8s-8d5ab5-43`] Stufe 8:** _Wie heißt die interne Datenstruktur in der Go-API-Bibliothek von Kubernetes, die das führende Schema interner Typen vor Konvertierung darstellt?_

- **Antwort:** Internal Version
- **Hinweis:** Hub-and-Spoke Type Conversion Pattern.

44. **[ID: `k8s-8d5ab5-44`] Stufe 8:** _Welche Erweiterung des Linux-IPVS-Modus im kube-proxy ermöglicht Graceful Termination von bestehenden TCP-Verbindungen bei Pod-Löschung?_

- **Antwort:** Graceful Termination
- **Hinweis:** Verhindert Verbindungsabbrüche bei Rolling Updates.

45. **[ID: `k8s-8d5ab5-45`] Stufe 8:** _Welche API-Gruppe ermöglicht es, temporäre Ephemeral-Container in einen laufenden Pod zu injizieren, um ohne Shell im Basisimage zu debuggen?_

- **Antwort:** kubectl debug
- **Hinweis:** Ephemeral Containers API.

46. **[ID: `k8s-8d5ab5-46`] Stufe 9:** _Welcher Algorithmus wird im kube-apiserver verwendet, um API-Anfragen bei hoher Last fair nach Mandanten zu drosseln?_

- **Antwort:** APF
- **Hinweis:** API Priority and Fairness.

47. **[ID: `k8s-8d5ab5-47`] Stufe 9:** _Welcher Go-Bibliotheksstandard aus dem Kubernetes-Ecosystem dient dem automatischen Generieren von DeepCopy-, Konvertierungs- und Client-Code?_

- **Antwort:** code-generator
- **Hinweis:** k8s.io/code-generator (deepcopy-gen, client-gen).

48. **[ID: `k8s-8d5ab5-48`] Stufe 9:** _Welche Ressource in etcd limitiert per Default die maximale Größe einer einzelnen Transaktion bzw. eines Schlüssel-Werte-Paars auf typischerweise 1,5 MB?_

- **Antwort:** max-request-bytes
- **Hinweis:** --max-request-bytes Parameter in etcd.

49. **[ID: `k8s-8d5ab5-49`] Stufe 9:** _Welches Subsystem im Kubelet verwaltet die Reservierung isolierter CPU-Cores für Pods mit Guaranteed QoS mittels CPU-Pinning?_

- **Antwort:** CPU Manager
- **Hinweis:** Static CPU Manager Policy.

50. **[ID: `k8s-8d5ab5-50`] Stufe 9:** _Wie nennt man den Mechanismus, bei dem der kube-apiserver über etcd-Watch-Streams Lease-Objekte nutzt, um Node-Heartbeats zu erfassen?_

- **Antwort:** Node Lease
- **Hinweis:** NodeLease Controller in kube-node-lease Namespace.

### Rubrik 3: CI/CD & GitOps (`ci-cd-gitops`)

1. **[ID: `cicd-203d59-1`] Stufe 1:** _Wofür steht die Abkürzung CD in einer modernen Deployment-Pipeline meistens?_
   - **Antwort:** Continuous Delivery
   - **Hinweis:** Auch Continuous Deployment.
2. **[ID: `cicd-203d59-2`] Stufe 1:** _Mit welchem Git-Befehl überträgt man neue lokale Commits auf das entfernte Repository?_
   - **Antwort:** git push
   - **Hinweis:** git push origin <branch>.
3. **[ID: `cicd-203d59-3`] Stufe 1:** _Mit welchem Git-Befehl holt man Änderungen vom Remote-Repository und führt sie direkt mit dem lokalen Branch zusammen?_
   - **Antwort:** git pull
   - **Hinweis:** Kombination aus git fetch und git merge.
4. **[ID: `cicd-203d59-4`] Stufe 1:** _Wie nennt man in Git das Zusammenführen zweier separater Branches?_
   - **Antwort:** Merge
   - **Hinweis:** git merge.
5. **[ID: `cicd-203d59-5`] Stufe 1:** _Welches Webportal mit blau-orangem Fuchs-Logo bietet eine integrierte DevOps-Plattform mit Git und CI/CD?_
   - **Antwort:** GitLab
   - **Hinweis:** gitlab.com bzw. Self-hosted GitLab CE/EE.
6. **[ID: `cicd-203d59-6`] Stufe 1:** _Wie nennt man die Anforderung auf Plattformen wie GitHub, Code-Änderungen vor dem Mergen zur Prüfung vorzulegen?_
   - **Antwort:** Pull Request
   - **Hinweis:** PR bzw. Merge Request (MR bei GitLab).
7. **[ID: `cicd-203d59-7`] Stufe 2:** _Wie heißt die zentrale Konfigurationsdatei für Pipelines in GitLab CI?_
   - **Antwort:** .gitlab-ci.yml
   - **Hinweis:** Liegt im Wurzelverzeichnis des Repositories.
8. **[ID: `cicd-203d59-8`] Stufe 2:** _Welches Git-Kommando schiebt unfertige Änderungen im Arbeitsverzeichnis temporär auf einen internen Stapel beiseite?_
   - **Antwort:** git stash
   - **Hinweis:** git stash / git stash pop.
9. **[ID: `cicd-203d59-9`] Stufe 2:** _Wie nennt man in einer CI-Pipeline eine Gruppierung von Aufgaben, die parallel zueinander abgearbeitet werden können?_
   - **Antwort:** Stage
   - **Hinweis:** Stages wie build, test, deploy.
10. **[ID: `cicd-203d59-10`] Stufe 2:** _Welcher Dienst oder Agent nimmt in Jenkins Build-Jobs entgegen und führt sie auf der Zielmaschine aus?_

- **Antwort:** Jenkins Agent
- **Hinweis:** Früher Jenkins Slave genannt; arbeitet mit dem Jenkins Controller.

11. **[ID: `cicd-203d59-11`] Stufe 2:** _Welcher Git-Befehl wendet Commits eines Branches neu auf die Spitze eines anderen Branches an, um eine lineare Historie zu erzeugen?_

- **Antwort:** git rebase
- **Hinweis:** git rebase <basebranch>.

12. **[ID: `cicd-203d59-12`] Stufe 2:** _Wie nennt man Dateien oder Binaries, die während eines Builds erzeugt und für spätere Pipeline-Stufen archiviert werden?_

- **Antwort:** Artefakte
- **Hinweis:** Build Artifacts.

13. **[ID: `cicd-203d59-13`] Stufe 3:** _Welches Grundprinzip von GitOps besagt, dass der gewünschte Systemzustand in Git wie abgelegt sein muss?_

- **Antwort:** Deklarativ
- **Hinweis:** Deklarative Beschreibungen sind der Kern von GitOps.

14. **[ID: `cicd-203d59-14`] Stufe 3:** _Welches GitOps-Framework von Weaveworks (neben Argo CD) gehört zu den bekanntesten Projekten der CNCF?_

- **Antwort:** Flux
- **Hinweis:** Flux CD / Flux v2.

15. **[ID: `cicd-203d59-15`] Stufe 3:** _Wie nennt man den Software-Agenten in GitHub Actions, der auf einem Server läuft und Workflow-Jobs ausführt?_

- **Antwort:** Runner
- **Hinweis:** GitHub-hosted Runner oder Self-hosted Runner.

16. **[ID: `cicd-203d59-16`] Stufe 3:** _Welches Tool ermöglicht das Template-freie Anpassen von Kubernetes-Manifesten durch Overlays für verschiedene Umgebungen?_

- **Antwort:** Kustomize
- **Hinweis:** kustomization.yaml, integriert in kubectl (-k).

17. **[ID: `cicd-203d59-17`] Stufe 3:** _Wie nennt man das automatische Zurückrollen auf die Vorgängerversion, wenn eine Bereitstellung fehlschlägt?_

- **Antwort:** Rollback
- **Hinweis:** Automated Rollback.

18. **[ID: `cicd-203d59-18`] Stufe 3:** _Welcher Typ von Web-Hook benachrichtigt CI-Server automatisch über neu eingetroffene Commits in einem Git-Repository?_

- **Antwort:** Webhook
- **Hinweis:** HTTP POST Callback.

19. **[ID: `cicd-203d59-19`] Stufe 4:** _Wie nennt man ein Branching-Modell, bei dem Entwickler häufig direkt in einen zentralen Haupt-Branch mergen und langlebige Branches vermeiden?_

- **Antwort:** Trunk-Based Development
- **Hinweis:** Im Gegensatz zu komplexem GitFlow.

20. **[ID: `cicd-203d59-20`] Stufe 4:** _Welche Technik erlaubt es, neuen Code in Produktion zu deployen, die Funktion jedoch zur Laufzeit über Schalter ein- oder auszuschalten?_

- **Antwort:** Feature Flags
- **Hinweis:** Feature Toggles.

21. **[ID: `cicd-203d59-21`] Stufe 4:** _Welches beliebte Open-Source-Container-Registry-Projekt der CNCF bietet integrierte Schwachstellenscans und rollenbasierte Zugriffe?_

- **Antwort:** Harbor
- **Hinweis:** CNCF Graduated Enterprise Registry.

22. **[ID: `cicd-203d59-22`] Stufe 4:** _Welches Tool von SonarSource führt statische Code-Analysen (SAST) auf Code-Smells, Bugs und Sicherheitslücken in CI durch?_

- **Antwort:** SonarQube
- **Hinweis:** SonarQube / SonarCloud.

23. **[ID: `cicd-203d59-23`] Stufe 4:** _Welches Kubernetes-native CI/CD-Framework der Linux Foundation definiert Pipelines direkt als Kubernetes-Custom-Resources (CRDs)?_

- **Antwort:** Tekton
- **Hinweis:** Tekton Pipelines (Teil der CD Foundation).

24. **[ID: `cicd-203d59-24`] Stufe 4:** _Wie heißt die OIDC-Methode, mit der GitHub Actions ohne langlebige Zugangsdaten kurzlebige Cloud-Rollen bei AWS oder Azure annehmen kann?_

- **Antwort:** OIDC Federation
- **Hinweis:** Workload Identity Federation / OpenID Connect.

25. **[ID: `cicd-203d59-25`] Stufe 5:** _Welches Open-Source-Tool von Aqua Security scannt Container-Images, Dateisysteme und Git-Repositories rasend schnell auf Schwachstellen?_

- **Antwort:** Trivy
- **Hinweis:** Umfassender Security- und Vulnerability-Scanner.

26. **[ID: `cicd-203d59-26`] Stufe 5:** _Wie heißt die Spezifikation zur Versionsnummerierung von Software nach dem Schema Hauptversion.Nebenversion.Patch?_

- **Antwort:** Semantic Versioning
- **Hinweis:** SemVer (z. B. 2.1.0).

27. **[ID: `cicd-203d59-27`] Stufe 5:** _Welches Werkzeug automatisiert die Erstellung von SemVer-Releases und Changelogs anhand standardisierter Git-Commit-Nachrichten?_

- **Antwort:** semantic-release
- **Hinweis:** Basiert auf Conventional Commits.

28. **[ID: `cicd-203d59-28`] Stufe 5:** _Wie nennt man die Sicherheitsinitiative von Google und der OpenSSF, die ein Stufenmodell (1–4) zur Absicherung der Software-Lieferkette definiert?_

- **Antwort:** SLSA
- **Hinweis:** Supply-chain Levels for Software Artifacts (ausgesprochen "Salsa").

29. **[ID: `cicd-203d59-29`] Stufe 5:** _Welches Tool aus dem Sigstore-Projekt wird speziell zum kryptografischen Signieren und Verifizieren von OCI-Container-Images genutzt?_

- **Antwort:** Cosign
- **Hinweis:** cosign sign / verify.

30. **[ID: `cicd-203d59-30`] Stufe 5:** _Welcher GitOps-Controller in Argo CD überwacht Progressive Delivery mit Canary- und Blue-Green-Deployments inklusive Metrikenanalyse?_

- **Antwort:** Argo Rollouts
- **Hinweis:** Argo Rollouts Controller.

31. **[ID: `cicd-203d59-31`] Stufe 6:** _Wie nennt man ein Git-Repository-Setup, in dem der Quellcode mehrerer separater Anwendungen und Bibliotheken in einem einzigen Repository verwaltet wird?_

- **Antwort:** Monorepo
- **Hinweis:** Monolithisches Repository (im Gegensatz zu Polyrepo).

32. **[ID: `cicd-203d59-32`] Stufe 6:** _Welches schlanke CLI-Tool für Kubernetes-Manifeste führt schnelle statische Validierungen gegen JSON-Schemas durch?_

- **Antwort:** kubeconform
- **Hinweis:** Nachfolger des älteren kubeval.

33. **[ID: `cicd-203d59-33`] Stufe 6:** _Wie nennt man den Sicherheitsansatz, bei dem Tests, Scans und Qualitätsprüfungen möglichst früh im Entwicklungszyklus stattfinden?_

- **Antwort:** Shift Left
- **Hinweis:** Shift-Left Testing / Security.

34. **[ID: `cicd-203d59-34`] Stufe 6:** _Welches Werkzeug von Bitnami ermöglicht die sichere Speicherung verschlüsselter Secrets direkt in Git mittels asymmetrischer Kryptografie?_

- **Antwort:** Sealed Secrets
- **Hinweis:** SealedSecrets Controller in Kubernetes.

35. **[ID: `cicd-203d59-35`] Stufe 6:** _Welches HashiCorp-Tool führt automatisierte Vault-Secret-Einbettungen in CI-Dateien durch Template-Rendering durch?_

- **Antwort:** consul-template
- **Hinweis:** Oder Vault Agent Templating.

36. **[ID: `cicd-203d59-36`] Stufe 7:** _Welches Transparenz-Logbuch im Sigstore-Projekt speichert Signaturen unlöschbar in einem Merkle-Tree zur nachträglichen Prüfung?_

- **Antwort:** Rekor
- **Hinweis:** Rekor Signature Transparency Log.

37. **[ID: `cicd-203d59-37`] Stufe 7:** _Welche Zertifizierungsstelle im Sigstore-Projekt stellt kurzlebige X.509-Zertifikate aus, die an OIDC-Identitäten gebunden sind?_

- **Antwort:** Fulcio
- **Hinweis:** Fulcio CA für keyless signing.

38. **[ID: `cicd-203d59-38`] Stufe 7:** _Wie nennt man das Build-Prinzip, bei dem ein identischer Quellcode zu exakt demselben bit-für-bit identischen Binär-Artefakt führt?_

- **Antwort:** Reproducible Builds
- **Hinweis:** Deterministische Builds.

39. **[ID: `cicd-203d59-39`] Stufe 7:** _Welches CLI-Tool von Mozilla verschlüsselt selektiv YAML- oder JSON-Werte in Git-Dateien mit KMS-Schlüsseln von AWS, GCP oder PGP?_

- **Antwort:** SOPS
- **Hinweis:** Secrets OPerationS (oft mit age oder AWS KMS).

40. **[ID: `cicd-203d59-40`] Stufe 7:** _Welcher GitOps-Sicherheitsmechanismus in Flux CD verhindert, dass Mandanten Cross-Namespace-Ressourcen ohne Freigabe referenzieren?_

- **Antwort:** ServiceAccount Impersonation
- **Hinweis:** serviceAccountName im Kustomization-Objekt.

41. **[ID: `cicd-203d59-41`] Stufe 8:** _Welches Format der Linux Foundation dient als maschinenlesbarer Standard für Software-Stücklisten neben CycloneDX?_

- **Antwort:** SPDX
- **Hinweis:** Software Package Data Exchange (ISO/IEC 5962:2021).

42. **[ID: `cicd-203d59-42`] Stufe 8:** _Welches OpenSSF-Tool bewertet Open-Source-Repositories anhand von bis zu 18 Sicherheitskriterien wie Branch-Protection und Code-Reviews?_

- **Antwort:** Scorecard
- **Hinweis:** OpenSSF Scorecard.

43. **[ID: `cicd-203d59-43`] Stufe 8:** _Welche In-Toto-Attestation-Spezifikation verknüpft Prüfpfade von Build-Steps kryptografisch miteinander, um Supply-Chain-Angriffe zu verhindern?_

- **Antwort:** in-toto
- **Hinweis:** in-toto framework.

44. **[ID: `cicd-203d59-44`] Stufe 8:** _Welcher BuildKit-Modus erlaubt das Caching von Docker-Build-Layers direkt in einer Remote-Container-Registry über Inline- oder Registry-Caches?_

- **Antwort:** cache-to
- **Hinweis:** --cache-to type=registry.

45. **[ID: `cicd-203d59-45`] Stufe 8:** _Welcher Algorithmus in Git stellt sicher, dass Git-Objekte inhaltsadressierbar über kryptografische Prüfsummen verknüpft sind?_

- **Antwort:** SHA-1
- **Hinweis:** Wird schrittweise durch SHA-256 ergänzt (Git object hash).

46. **[ID: `cicd-203d59-46`] Stufe 9:** _Welcher Linux-Kernel-Mechanismus wird von Dagger verwendet, um CI-Pipelines als programmierbare Container-Graphen isoliert auszuführen?_

- **Antwort:** BuildKit
- **Hinweis:** Dagger basiert auf BuildKit (Moby Engine).

47. **[ID: `cicd-203d59-47`] Stufe 9:** _Wie heißt das CNCF-Projekt, das GitOps-Repositories auf Richtlinienkonformität prüft, bevor sie vom Cluster übernommen werden?_

- **Antwort:** Conftest
- **Hinweis:** Basiert auf Open Policy Agent (OPA).

48. **[ID: `cicd-203d59-48`] Stufe 9:** _Welche kryptografische Datenstruktur garantiert in Sigstores Rekor-Log, dass frühere Einträge nicht manipuliert oder entfernt werden können?_

- **Antwort:** Merkle Tree
- **Hinweis:** Kryptografischer Hash-Baum.

49. **[ID: `cicd-203d59-49`] Stufe 9:** _Welches spezielle Git-Merkmal erlaubt es, die Git-Historie partiell zu klonen (Shallow Clone / Sparse Checkout), um CI-Zeiten drastisch zu senken?_

- **Antwort:** Sparse Checkout
- **Hinweis:** git clone --filter=blob:none bzw. git sparse-checkout.

50. **[ID: `cicd-203d59-50`] Stufe 9:** _Welches OIDC-Token-Attribut im GitHub-Actions-Token (id-token) enthält den vollständigen Repository- und Ref-Pfad für IAM-Trust-Policies?_

- **Antwort:** sub
- **Hinweis:** Subject Claim (z. B. repo:octocat/hello-world:ref:refs/heads/main).

### Rubrik 4: Infrastructure as Code & Cloud (`iac-cloud-foundations`)

1. **[ID: `iac-b1c0c3-1`] Stufe 1:** _Welches Servicemodell im Cloud Computing stellt Rechenleistung, virtuelle Server und Speicher als Basisinfrastruktur bereit?_
   - **Antwort:** IaaS
   - **Hinweis:** Infrastructure as a Service.
2. **[ID: `iac-b1c0c3-2`] Stufe 1:** _Welches Servicemodell der Cloud bietet eine fertige Ablaufumgebung für Anwendungen, ohne dass Betriebssysteme gepflegt werden müssen?_
   - **Antwort:** PaaS
   - **Hinweis:** Platform as a Service.
3. **[ID: `iac-b1c0c3-3`] Stufe 1:** _Welches Modell stellt fertige Endanwender-Software direkt über den Webbrowser zur Verfügung?_
   - **Antwort:** SaaS
   - **Hinweis:** Software as a Service (z. B. Microsoft 365, Google Workspace).
4. **[ID: `iac-b1c0c3-4`] Stufe 1:** _Welcher Cloud-Dienst von Microsoft konkurriert direkt mit AWS und Google Cloud Platform?_
   - **Antwort:** Microsoft Azure
   - **Hinweis:** Azure.
5. **[ID: `iac-b1c0c3-5`] Stufe 1:** _Wie heißt die Public-Cloud-Plattform des Google-Konzerns?_
   - **Antwort:** GCP
   - **Hinweis:** Google Cloud Platform.
6. **[ID: `iac-b1c0c3-6`] Stufe 1:** _Welcher einfache Terraform-Befehl initialisiert ein Arbeitsverzeichnis und lädt benötigte Provider herunter?_
   - **Antwort:** terraform init
   - **Hinweis:** Erster Schritt bei jedem neuen Terraform-Projekt.
7. **[ID: `iac-b1c0c3-7`] Stufe 2:** _Welcher Terraform-Befehl erstellt einen Ausführungsplan und zeigt an, welche Cloud-Ressourcen angelegt oder geändert werden?_
   - **Antwort:** terraform plan
   - **Hinweis:** Zeigt Änderungen vor der eigentlichen Erstellung an.
8. **[ID: `iac-b1c0c3-8`] Stufe 2:** _Mit welchem Terraform-Befehl wendet man die geplanten Änderungen tatsächlich auf die Ziel-Cloud an?_
   - **Antwort:** terraform apply
   - **Hinweis:** Wendet den Ausführungsplan an.
9. **[ID: `iac-b1c0c3-9`] Stufe 2:** _Welcher Terraform-Befehl löscht alle im State-File verwalteten Infrastruktur-Ressourcen vollständig aus der Cloud?_
   - **Antwort:** terraform destroy
   - **Hinweis:** Löscht alle gemanagten Ressourcen.
10. **[ID: `iac-b1c0c3-10`] Stufe 2:** _Wie lautet die Standarddatei, in der Terraform den aktuellen Zustand der verwalteten Infrastruktur speichert?_

- **Antwort:** terraform.tfstate
- **Hinweis:** Terraform State File.

11. **[ID: `iac-b1c0c3-11`] Stufe 2:** _Wie heißt die hauseigene Konfigurationssprache von HashiCorp, in der Terraform-Dateien verfasst werden?_

- **Antwort:** HCL
- **Hinweis:** HashiCorp Configuration Language.

12. **[ID: `iac-b1c0c3-12`] Stufe 2:** _Wie nennt man wiederverwendbare, paketierte Terraform-Konfigurationen, die als Bausteine importiert werden können?_

- **Antwort:** Module
- **Hinweis:** Terraform Modules.

13. **[ID: `iac-b1c0c3-13`] Stufe 3:** _Wie nennt man das Speicherziel (z. B. S3-Bucket oder Azure Blob), auf dem der Terraform-State teamweit zentral und gesperrt abgelegt wird?_

- **Antwort:** Remote Backend
- **Hinweis:** Backend-Konfiguration (z. B. backend "s3").

14. **[ID: `iac-b1c0c3-14`] Stufe 3:** _Welcher native Infrastructure-as-Code-Dienst von AWS nutzt JSON- oder YAML-Vorlagen zum Deklarieren von Cloud-Ressourcen?_

- **Antwort:** CloudFormation
- **Hinweis:** AWS CloudFormation.

15. **[ID: `iac-b1c0c3-15`] Stufe 3:** _Welches Ausführungsmodell führt Anwendungscode ereignisgesteuert ohne dauerhaft laufende Serverinstanzen aus (z. B. AWS Lambda)?_

- **Antwort:** Serverless
- **Hinweis:** Function as a Service (FaaS) / Serverless Computing.

16. **[ID: `iac-b1c0c3-16`] Stufe 3:** _Wie nennt man getrennte physische Rechenzentrumsstandorte innerhalb einer Cloud-Region mit redundanter Strom- und Netzwerkanbindung?_

- **Antwort:** Availability Zones
- **Hinweis:** Verfügbarkeitszonen (AZs).

17. **[ID: `iac-b1c0c3-17`] Stufe 3:** _Welcher bekannte AWS-Objektspeicherdienst wurde als einer der ersten Cloud-Services im Jahr 2006 veröffentlicht?_

- **Antwort:** S3
- **Hinweis:** Simple Storage Service.

18. **[ID: `iac-b1c0c3-18`] Stufe 3:** _Wie nennt man den Block-Storage-Dienst von AWS, der als virtuelle Festplatte an EC2-Instanzen angehängt wird?_

- **Antwort:** EBS
- **Hinweis:** Elastic Block Store.

19. **[ID: `iac-b1c0c3-19`] Stufe 4:** _Welches HashiCorp-Tool dient dem automatisierten Erstellen identischer goldener Maschinen-Images für Clouds und Hypervisoren?_

- **Antwort:** Packer
- **Hinweis:** HashiCorp Packer.

20. **[ID: `iac-b1c0c3-20`] Stufe 4:** _Welches Open-Source-Framework von AWS erlaubt das Definieren von CloudFormation-Ressourcen in TypeScript, Python oder Java?_

- **Antwort:** AWS CDK
- **Hinweis:** Cloud Development Kit.

21. **[ID: `iac-b1c0c3-21`] Stufe 4:** _Wie heißt das native Bereitstellungsformat für Microsoft Azure, das als typsichere Abstraktion über ARM-Templates fungiert?_

- **Antwort:** Bicep
- **Hinweis:** Azure Bicep.

22. **[ID: `iac-b1c0c3-22`] Stufe 4:** _Welche Terraform-Funktion lädt bereits existierende, manuell angelegte Cloud-Ressourcen in das State-Management nach?_

- **Antwort:** terraform import
- **Hinweis:** import-Befehl oder import-Block (seit v1.5).

23. **[ID: `iac-b1c0c3-23`] Stufe 4:** _Wie nennt man in Terraform getrennte Arbeitsbereiche für denselben Code, um etwa Dev- und Prod-States separat zu verwalten?_

- **Antwort:** Workspaces
- **Hinweis:** Terraform Workspaces.

24. **[ID: `iac-b1c0c3-24`] Stufe 4:** _Welches CLI-Tool von Infracost analysiert Terraform-Code im Pull Request und gibt die erwarteten monatlichen Cloud-Kosten aus?_

- **Antwort:** Infracost
- **Hinweis:** Kostenschätzung für IaC.

25. **[ID: `iac-b1c0c3-25`] Stufe 5:** _Welche Datenbank von AWS wird häufig für das State Locking bei der Nutzung von S3 als Terraform-Remote-Backend verwendet?_

- **Antwort:** DynamoDB
- **Hinweis:** DynamoDB Lock-Table.

26. **[ID: `iac-b1c0c3-26`] Stufe 5:** _Welcher Cloud-Diensttyp bietet vollständig verwaltete relationale Datenbanken wie PostgreSQL oder MySQL ohne OS-Wartung an?_

- **Antwort:** RDS
- **Hinweis:** Relational Database Service (z. B. AWS RDS, Azure Database).

27. **[ID: `iac-b1c0c3-27`] Stufe 5:** _Wie nennt man die Eigenschaft einer Operation, bei mehrfacher Ausführung mit denselben Parametern stets denselben Endzustand zu liefern?_

- **Antwort:** Idempotenz
- **Hinweis:** Schlüsselkonzept von Ansible, Terraform und Puppet.

28. **[ID: `iac-b1c0c3-28`] Stufe 5:** _Welcher Terraform-Block-Typ wird verwendet, um Informationen über bestehende externe Ressourcen abzufragen, ohne sie zu verwalten?_

- **Antwort:** data
- **Hinweis:** Data Source (data "aws_ami" ...).

29. **[ID: `iac-b1c0c3-29`] Stufe 5:** _Welche Terraform-Klausel (Meta-Argument) steuert, ob eine Ressource vor dem Zerstören zuerst neu angelegt werden soll?_

- **Antwort:** lifecycle
- **Hinweis:** create_before_destroy im lifecycle-Block.

30. **[ID: `iac-b1c0c3-30`] Stufe 5:** _Welcher Open-Source-Static-Code-Analyzer von Bridgecrew scannt Terraform, CloudFormation und Helm auf Sicherheitsfehlkonfigurationen?_

- **Antwort:** Checkov
- **Hinweis:** Checkov Static Analysis Tool.

31. **[ID: `iac-b1c0c3-31`] Stufe 6:** _Welche Lizenz führte HashiCorp im August 2023 für Terraform ein, was zur Gründung des Forks OpenTofu führte?_

- **Antwort:** BSL
- **Hinweis:** Business Source License (BSL / BUSL 1.1).

32. **[ID: `iac-b1c0c3-32`] Stufe 6:** _Welches Open-Source-Tool für Terraform generiert automatisch Dokumentation im Markdown-Format für Variablen und Outputs von Modulen?_

- **Antwort:** terraform-docs
- **Hinweis:** Generiert Readmes für Module.

33. **[ID: `iac-b1c0c3-33`] Stufe 6:** _Wie nennt man ein Cloud-Architektur-Muster, bei dem Server nach dem Deployment niemals modifiziert, sondern bei Updates ersetzt werden?_

- **Antwort:** Immutable Infrastructure
- **Hinweis:** Unveränderliche Infrastruktur.

34. **[ID: `iac-b1c0c3-34`] Stufe 6:** _Welcher Terraform-Wrapper von Gruntwork bietet DRY-Konfigurationen und Modulorchestrierung für große Infrastrukturen?_

- **Antwort:** Terragrunt
- **Hinweis:** Beliebtes Orchestrierungstool für Terraform.

35. **[ID: `iac-b1c0c3-35`] Stufe 6:** _Welche Richtlinien-Engine von HashiCorp bietet deklarative Governance und Policy-as-Code für Terraform Enterprise?_

- **Antwort:** Sentinel
- **Hinweis:** HashiCorp Sentinel.

36. **[ID: `iac-b1c0c3-36`] Stufe 7:** _Wie nennt man in Crossplane die benutzerdefinierte API-Ressource, die mehrere gemanagte Cloud-Ressourcen zu einer logischen Einheit bündelt?_

- **Antwort:** Composite Resource
- **Hinweis:** XR (Composite Resource) und XRD (CompositeResourceDefinition).

37. **[ID: `iac-b1c0c3-37`] Stufe 7:** _Welches Go-Tool der Open-Source-Community synchronisiert und konvertiert bestehende AWS-Infrastruktur direkt in Terraform-Dateien?_

- **Antwort:** Terraformer
- **Hinweis:** Entwickelt bei Waze/Google.

38. **[ID: `iac-b1c0c3-38`] Stufe 7:** _Welches Protokoll nutzen Terraform-Provider intern zur Kommunikation zwischen dem Terraform-Kern und den separaten Provider-Plugins?_

- **Antwort:** gRPC
- **Hinweis:** RPC-Protokoll über Unix Domain Sockets.

39. **[ID: `iac-b1c0c3-39`] Stufe 7:** _Welches Open-Source-Tool von Trivy-Entwicklern scannt speziell Terraform-Code lokal ohne Netzwerkzugriff auf Sicherheitslücken?_

- **Antwort:** tfsec
- **Hinweis:** Mittlerweile in Trivy integriert.

40. **[ID: `iac-b1c0c3-40`] Stufe 7:** _Wie nennt man das Cloud-Netzwerk-Konstrukt, das ein lokales Unternehmensrechenzentrum über dedizierte Glasfaser direkt mit AWS verbindet?_

- **Antwort:** AWS Direct Connect
- **Hinweis:** Bei Azure heißt das Äquivalent ExpressRoute.

41. **[ID: `iac-b1c0c3-41`] Stufe 8:** _Welcher Algorithmus wird in Terraform zur Berechnung des Abhängigkeitsgraphen für parallele Ressourcen-Provisionierung verwendet?_

- **Antwort:** DAG
- **Hinweis:** Directed Acyclic Graph (gerichteter azyklischer Graph).

42. **[ID: `iac-b1c0c3-42`] Stufe 8:** _Welche Datei in Terraform sperrt ab Version 0.14 die genauen Versionen und Prüfsummen aller verwendeten Provider-Plugins fest?_

- **Antwort:** .terraform.lock.hcl
- **Hinweis:** Dependency Lock File.

43. **[ID: `iac-b1c0c3-43`] Stufe 8:** _Welches Framework in Pulumi ermöglicht es, deklarative Architektur- und Compliance-Regeln in TypeScript oder Python zu erzwingen?_

- **Antwort:** CrossGuard
- **Hinweis:** Pulumi Policy as Code.

44. **[ID: `iac-b1c0c3-44`] Stufe 8:** _Welcher Mechanismus in AWS CloudFormation ermöglicht das Zurücksetzen auf einen Snapshot bei Rollback-Fehlern in StackSets?_

- **Antwort:** Stack Refactor
- **Hinweis:** Oder Change Sets / Rollback Triggers.

45. **[ID: `iac-b1c0c3-45`] Stufe 8:** _Welche Linux-Schnittstelle nutzt Firecracker zur hardwarebeschleunigten Virtualisierung ohne vollständige PC-Motherboard-Emulation?_

- **Antwort:** KVM
- **Hinweis:** Kernel-based Virtual Machine (/dev/kvm).

46. **[ID: `iac-b1c0c3-46`] Stufe 9:** _Welches Sub-System in Crossplane übersetzt Terraform-Provider-Schemas automatisch in native Kubernetes-Custom-Resource-Definitions?_

- **Antwort:** Upjet
- **Hinweis:** Früher Terrajet; generiert Kube-APIs aus Terraform-Providern.

47. **[ID: `iac-b1c0c3-47`] Stufe 9:** _Welcher Go-Befehl des Terraform-Plugin-Frameworks validiert die Schema-Kompatibilität für benutzerdefinierte Provider-Ressourcen?_

- **Antwort:** framework.Resource
- **Hinweis:** terraform-plugin-framework von HashiCorp.

48. **[ID: `iac-b1c0c3-48`] Stufe 9:** _Wie heißt die mathematische Eigenschaft, wenn eine IaC-Engine garantiert, dass Ressourcen genau in der topologischen Ordnung erzeugt werden?_

- **Antwort:** Topologische Sortierung
- **Hinweis:** Topological Sort des DAG.

49. **[ID: `iac-b1c0c3-49`] Stufe 9:** _Welches Tool ermöglicht die kontinuierliche Erkennung von Infrastructure-Drift im Hintergrund und triggert automatische Heilungs-Pipelines?_

- **Antwort:** driftctl
- **Hinweis:** Erkennt Drift zwischen State und realen Cloud-APIs.

50. **[ID: `iac-b1c0c3-50`] Stufe 9:** _Welcher kryptografische Mechanismus in AWS KMS stellt sicher, dass Secrets nur im Arbeitsspeicher von HSMs entschlüsselt werden?_

- **Antwort:** Envelope Encryption
- **Hinweis:** Briefumschlag-Verschlüsselung mit Daten- und Masterschlüsseln.

### Rubrik 5: Observability & SRE (`observability-sre`)

1. **[ID: `obs-de8785-1`] Stufe 1:** _Welches Messinstrument zeigt Entwicklern und Operatoren numerische Systemzustände wie CPU-Last oder RAM-Verbrauch über die Zeit an?_
   - **Antwort:** Metrik
   - **Hinweis:** Metrics.
2. **[ID: `obs-de8785-2`] Stufe 1:** _Wie nennt man eine visuelle Übersichtswand mit Diagrammen und Graphen im Monitoring-Bereich?_
   - **Antwort:** Dashboard
   - **Hinweis:** Z. B. in Grafana oder Datadog.
3. **[ID: `obs-de8785-3`] Stufe 1:** _Wie lautet der Fachbegriff für eine automatische Benachrichtigung (per E-Mail oder Chat), wenn ein Schwellenwert überschritten wird?_
   - **Antwort:** Alert
   - **Hinweis:** Alerting / Alarmierung.
4. **[ID: `obs-de8785-4`] Stufe 1:** _Welche Abkürzung steht für die Rolle des Site Reliability Engineer, die ursprünglich bei Google geprägt wurde?_
   - **Antwort:** SRE
   - **Hinweis:** Site Reliability Engineering.
5. **[ID: `obs-de8785-5`] Stufe 1:** _Wie nennt man die Zeitdauer, die ein Server oder Dienst benötigt, um auf eine eingehende Benutzeranfrage zu antworten?_
   - **Antwort:** Latenz
   - **Hinweis:** Latency / Antwortzeit.
6. **[ID: `obs-de8785-6`] Stufe 1:** _Wie nennt man die Zeitspanne, in der ein System oder Dienst für Benutzer nicht verfügbar ist?_
   - **Antwort:** Downtime
   - **Hinweis:** Ausfallzeit.
7. **[ID: `obs-de8785-7`] Stufe 2:** _Welches populäre Log-Management-Trio aus Elasticsearch, Logstash und Kibana wird häufig mit diesem Akronym bezeichnet?_
   - **Antwort:** ELK-Stack
   - **Hinweis:** ELK / Elastic Stack.
8. **[ID: `obs-de8785-8`] Stufe 2:** _Welcher Dienst innerhalb des Prometheus-Ökosystems ist für das Entgegennehmen, Gruppieren und Versenden von Benachrichtigungen zuständig?_
   - **Antwort:** Alertmanager
   - **Hinweis:** Prometheus Alertmanager.
9. **[ID: `obs-de8785-9`] Stufe 2:** _Wie lautet die eigene Abfragesprache von Prometheus, mit der Zeitreihendaten gefiltert und aggregiert werden?_
   - **Antwort:** PromQL
   - **Hinweis:** Prometheus Query Language.
10. **[ID: `obs-de8785-10`] Stufe 2:** _Wie lautet die Abkürzung für das intern definierte Zuverlässigkeitsziel (z. B. 99,9 % erfolgreiche Requests) im SRE?_

- **Antwort:** SLO
- **Hinweis:** Service Level Objective.

11. **[ID: `obs-de8785-11`] Stufe 2:** _Wie lautet die Abkürzung für den messbaren Indikator (z. B. Fehlerrate oder Antwortzeit), der zur Prüfung des SLOs dient?_

- **Antwort:** SLI
- **Hinweis:** Service Level Indicator.

12. **[ID: `obs-de8785-12`] Stufe 2:** _Welches Open-Source-Log-Aggregationssystem von Grafana Labs wurde speziell nach dem Vorbild von Prometheus entwickelt?_

- **Antwort:** Loki
- **Hinweis:** Grafana Loki (Like Prometheus, but for logs).

13. **[ID: `obs-de8785-13`] Stufe 3:** _Wie nennt man die vier goldenen Signale der Dienstüberwachung nach dem Google SRE-Buch neben Latenz und Traffic?_

- **Antwort:** Fehler und Sättigung
- **Hinweis:** Latency, Traffic, Errors, Saturation.

14. **[ID: `obs-de8785-14`] Stufe 3:** _Welcher Prometheus-Metrik-Typ repräsentiert einen rein monoton steigenden Zähler, der nur erhöht oder bei Neustart zurückgesetzt wird?_

- **Antwort:** Counter
- **Hinweis:** Z. B. http_requests_total.

15. **[ID: `obs-de8785-15`] Stufe 3:** _Welcher Metrik-Typ in Prometheus repräsentiert einen einzelnen numerischen Wert, der beliebig steigen und fallen kann?_

- **Antwort:** Gauge
- **Hinweis:** Z. B. Speichernutzung oder Temperatur.

16. **[ID: `obs-de8785-16`] Stufe 3:** _Wie nennt man den Daemon oder Hilfsprozess, der Metriken aus fremden Systemen liest und im Prometheus-Format zur Verfügung stellt?_

- **Antwort:** Exporter
- **Hinweis:** Z. B. node_exporter oder postgres_exporter.

17. **[ID: `obs-de8785-17`] Stufe 3:** _Welches verteilte Tracing-System wurde ursprünglich bei Uber entwickelt und gehört heute zu den CNCF-Graduated-Projekten?_

- **Antwort:** Jaeger
- **Hinweis:** Jaeger Tracing.

18. **[ID: `obs-de8785-18`] Stufe 3:** _Wie nennt man im Distributed Tracing einen einzelnen zusammenhängenden Bearbeitungsschritt innerhalb eines Gesamt-Traces?_

- **Antwort:** Span
- **Hinweis:** Ein Trace besteht aus einem Baum von Spans.

19. **[ID: `obs-de8785-19`] Stufe 4:** _Welches Akronym beschreibt den standardisierten HTTP-Header des W3C für verteiltes Tracing, der Traceparent und Tracestate überträgt?_

- **Antwort:** Trace Context
- **Hinweis:** W3C Trace Context Standard (traceparent Header).

20. **[ID: `obs-de8785-20`] Stufe 4:** _Welcher Metrik-Typ in Prometheus zählt Ereignisse in konfigurierbaren Wertebereichen (Buckets), um Quantile zu berechnen?_

- **Antwort:** Histogram
- **Hinweis:** Prometheus Histogramm (mit le-Label).

21. **[ID: `obs-de8785-21`] Stufe 4:** _Welcher standardisierte Exporter sammelt Hardware- und Betriebssystem-Metriken auf Linux-Servern für Prometheus?_

- **Antwort:** node_exporter
- **Hinweis:** Prometheus Node Exporter.

22. **[ID: `obs-de8785-22`] Stufe 4:** _Wie nennt man das geplante, absichtliche Injizieren von Fehlern in Produktionssysteme, um deren Ausfallsicherheit zu beweisen?_

- **Antwort:** Chaos Engineering
- **Hinweis:** Pionierarbeit durch Netflix (Chaos Monkey).

23. **[ID: `obs-de8785-23`] Stufe 4:** _Welche Abkürzung bezeichnet die mittlere Betriebsdauer eines Systems zwischen zwei aufeinanderfolgenden Ausfällen?_

- **Antwort:** MTBF
- **Hinweis:** Mean Time Between Failures.

24. **[ID: `obs-de8785-24`] Stufe 4:** _Wie heißt die strukturierte Analyse nach einem Ausfall, die ohne persönliche Schuldzuweisungen Ursachen und Maßnahmen klärt?_

- **Antwort:** Blameless Post-Mortem
- **Hinweis:** Schuldfreie Nachbesprechung / Incident Postmortem.

25. **[ID: `obs-de8785-25`] Stufe 5:** _Welches CNCF-Komponenten-Tool nimmt Telemetriedaten von OpenTelemetry entgegen, filtert sie und leitet sie an Backends weiter?_

- **Antwort:** OTel Collector
- **Hinweis:** OpenTelemetry Collector.

26. **[ID: `obs-de8785-26`] Stufe 5:** _Wie heißt die verteilte Open-Source-Tracing-Engine von Grafana Labs, die Traces extrem kostengünstig auf Objektspeichern ablegt?_

- **Antwort:** Tempo
- **Hinweis:** Grafana Tempo.

27. **[ID: `obs-de8785-27`] Stufe 5:** _Wie nennt man im SRE-Bereich repetitive, manuelle, taktische Arbeit ohne nachhaltigen Wertzuwachs, die automatisiert werden sollte?_

- **Antwort:** Toil
- **Hinweis:** Nach Google SRE: Toil sollte unter 50 % der Arbeitszeit gehalten werden.

28. **[ID: `obs-de8785-28`] Stufe 5:** _Welche PromQL-Funktion berechnet die pro Sekunde gemessene Steigerungsrate eines monoton wachsenden Counters über ein Zeitfenster?_

- **Antwort:** rate
- **Hinweis:** rate(http_requests_total[5m]).

29. **[ID: `obs-de8785-29`] Stufe 5:** _Welcher Tracing-Vorgänger von Twitter bildete neben OpenTracing eines der ersten bekannten Open-Source-Tracing-Frameworks?_

- **Antwort:** Zipkin
- **Hinweis:** Apache Zipkin.

30. **[ID: `obs-de8785-30`] Stufe 5:** _Wie nennt man den prozentualen Multiplikator, der angibt, wie schnell ein Team sein Fehlerbudget bei einer aktuellen Störung aufbraucht?_

- **Antwort:** Burn Rate
- **Hinweis:** Burn Rate Alerting für SLOs.

31. **[ID: `obs-de8785-31`] Stufe 6:** _Welcher Service-Mesh-Bestandteil fungiert typischerweise als Sidecar-Proxy zur Erfassung von L7-Metriken und Tracing-Headern?_

- **Antwort:** Envoy
- **Hinweis:** Envoy Proxy.

32. **[ID: `obs-de8785-32`] Stufe 6:** _Welches Open-Source-Profiling-Tool der CNCF ermöglicht kontinuierliches Profiling von CPU und Speicher im Produktionsbetrieb via eBPF?_

- **Antwort:** Parca
- **Hinweis:** Parca / Pyroscope continuous profilers.

33. **[ID: `obs-de8785-33`] Stufe 6:** _Wie nennt man das Problem, wenn zu viele gleichzeitige Alerts die Aufmerksamkeit von Bereitschaftsingenieuren abstumpfen lassen?_

- **Antwort:** Alert Fatigue
- **Hinweis:** Alarmmüdigkeit.

34. **[ID: `obs-de8785-34`] Stufe 6:** _Welcher Algorithmus wird in Prometheus verwendet, um Metriken hochkomprimiert im Chunk-Format im Arbeitsspeicher abzulegen?_

- **Antwort:** Gorilla
- **Hinweis:** Gorilla TSDB Compression Algorithm (von Facebook).

35. **[ID: `obs-de8785-35`] Stufe 6:** _Welche PromQL-Funktion extrapoliert lineare Trends, um vorherzusagen, wann eine Festplatte voraussichtlich vollläuft?_

- **Antwort:** predict_linear
- **Hinweis:** predict_linear(node_filesystem_free_bytes[4h], 86400).

36. **[ID: `obs-de8785-36`] Stufe 7:** _Wie nennt man den eBPF-basierten Open-Source-Kernel-Tracer von Pixie, der automatische No-Code-Observability für K8s liefert?_

- **Antwort:** Pixie
- **Hinweis:** CNCF Pixie.

37. **[ID: `obs-de8785-37`] Stufe 7:** _Welche Tracing-Sampling-Strategie entscheidet erst am Ende einer Transaktion anhand von Fehlern oder Dauer, ob der Trace gespeichert wird?_

- **Antwort:** Tail-based Sampling
- **Hinweis:** Im Gegensatz zu Head-based Sampling beim Start.

38. **[ID: `obs-de8785-38`] Stufe 7:** _Wie lautet der Name des hochskalierbaren, multi-tenantfähigen Langzeit-Backends für Prometheus, das früher Cortex hieß?_

- **Antwort:** Mimir
- **Hinweis:** Grafana Mimir / Thanos.

39. **[ID: `obs-de8785-39`] Stufe 7:** _Welche Datenstruktur wird in OpenTelemetry verwendet, um Baggage über Prozess- und Netzwerkgrenzen hinweg im Kontext weiterzuleiten?_

- **Antwort:** Baggage
- **Hinweis:** W3C Baggage Header für anwendungsweite Metadaten.

40. **[ID: `obs-de8785-40`] Stufe 7:** _Welcher Begriff bezeichnet das Phänomen, wenn Metriken durch dynamische Labels (wie User-IDs oder UUIDs) explodieren und TSDBs überlasten?_

- **Antwort:** High Cardinality
- **Hinweis:** Hohe Kardinalität.

41. **[ID: `obs-de8785-41`] Stufe 8:** _Welches Open-Source-Projekt von Red Hat und CNCF bietet eine hochskalierbare Prometheus-Langzeitlösung mit Thanos Sidecars auf Object Storage?_

- **Antwort:** Thanos
- **Hinweis:** Thanos (Compact, Store, Query, Sidecar).

42. **[ID: `obs-de8785-42`] Stufe 8:** _Wie nennt man das mathematische Modell für Multi-Window-Multi-Burn-Rate-Alerting, um Fehlalarme bei SLOs drastisch zu reduzieren?_

- **Antwort:** Multi-Window Alerting
- **Hinweis:** Google SRE Workbook Kapitel 5.

43. **[ID: `obs-de8785-43`] Stufe 8:** _Welche Linux-Kernel-Fähigkeit liest Hardwaredaten und CPU-Performance-Counter direkt über das Subsystem perf_events aus?_

- **Antwort:** perf_event_open
- **Hinweis:** Syscall perf_event_open() für Profiling.

44. **[ID: `obs-de8785-44`] Stufe 8:** _Welches Protokoll überträgt im OpenTelemetry-Standard Telemetriedaten binär und hochkomprimiert über Protobuf und gRPC?_

- **Antwort:** OTLP
- **Hinweis:** OpenTelemetry Protocol (OTLP/gRPC oder OTLP/HTTP).

45. **[ID: `obs-de8785-45`] Stufe 8:** _Welches Grafana-Tool simuliert synthetische Benutzerinteraktionen weltweit, um Latenzen vor echten Benutzeranfragen zu messen?_

- **Antwort:** k6
- **Hinweis:** Grafana k6 Synthetic Monitoring / Load Testing.

46. **[ID: `obs-de8785-46`] Stufe 9:** _Welche mathematische Datenstruktur ermöglicht in modernen TSDBs wie VictoriaMetrics extrem schnelle Regex- und N-Gramm-Labelindizierungen?_

- **Antwort:** Invertierter Index
- **Hinweis:** Inverted Index mit Finite State Transducers (FST).

47. **[ID: `obs-de8785-47`] Stufe 9:** _Welcher Linux-eBPF-Mechanismus fängt Funktionsaufrufe direkt in kompilierten Userspace-Binärdateien (wie Go oder Rust) ohne Recompilation ab?_

- **Antwort:** uprobes
- **Hinweis:** User-space Probes (uprobes / uretprobes).

48. **[ID: `obs-de8785-48`] Stufe 9:** _Welcher PromQL-Aggregator berechnet 99-Perzentil-Latenzen mathematisch exakt aus Histogramm-Buckets?_

- **Antwort:** histogram_quantile
- **Hinweis:** histogram_quantile(0.99, sum(rate(...)) by (le)).

49. **[ID: `obs-de8785-49`] Stufe 9:** _Wie heißt das CNCF-Framework, das deklarative SLO-Definitionen als Kubernetes-CRDs ermöglicht und automatisch Prometheus-Alerts generiert?_

- **Antwort:** Sloth
- **Hinweis:** Sloth / Pyrra (SLO-Generatoren).

50. **[ID: `obs-de8785-50`] Stufe 9:** _Welcher Algorithmus wird in OpenTelemetry für Streaming-Exponential-Histogramme verwendet, um feste Bucket-Grenzen unnötig zu machen?_

- **Antwort:** Exponential Bucketing
- **Hinweis:** High-resolution exponential histograms in OTel.

### Rubrik 6: Cloud-Security & Networking (`cloud-security-networking`)

1. **[ID: `sec-80a592-1`] Stufe 1:** _Welches grundlegende Sicherheitsprotokoll verschlüsselt den Webverkehr zwischen Browser und Server mit dem Schloss-Symbol in der Adresszeile?_
   - **Antwort:** HTTPS
   - **Hinweis:** Hypertext Transfer Protocol Secure (TLS/SSL).
2. **[ID: `sec-80a592-2`] Stufe 1:** _Welcher Netzwerkdienst übersetzt menschenlesbare Domainnamen wie www.example.com in maschinenlesbare IP-Adressen?_
   - **Antwort:** DNS
   - **Hinweis:** Domain Name System.
3. **[ID: `sec-80a592-3`] Stufe 1:** _Wie nennt man ein Sicherheitsnetzwerk-Element, das ein- und ausgehenden Datenverkehr anhand festgelegter Regeln filtert?_
   - **Antwort:** Firewall
   - **Hinweis:** Netzwerk- oder Web-Application-Firewall.
4. **[ID: `sec-80a592-4`] Stufe 1:** _Welches Authentifizierungsverfahren fordert neben dem Passwort einen zweiten Faktor wie eine Authenticator-App oder SMS?_
   - **Antwort:** MFA
   - **Hinweis:** Multi-Faktor-Authentifizierung (auch 2FA).
5. **[ID: `sec-80a592-5`] Stufe 1:** _Welches Protokoll ermöglicht den sicheren, verschlüsselten Terminalzugriff auf entfernte Linux-Server auf Port 22?_
   - **Antwort:** SSH
   - **Hinweis:** Secure Shell.
6. **[ID: `sec-80a592-6`] Stufe 1:** _Wie lautet die Abkürzung für ein virtuelles privates Netzwerk, das eine verschlüsselte Verbindung über das öffentliche Internet herstellt?_
   - **Antwort:** VPN
   - **Hinweis:** Virtual Private Network.
7. **[ID: `sec-80a592-7`] Stufe 2:** _Welche gemeinnützige Zertifizierungsstelle ermöglicht automatisierte, kostenlose TLS-Zertifikate für Webserver?_
   - **Antwort:** Let's Encrypt
   - **Hinweis:** Nutzt das ACME-Protokoll.
8. **[ID: `sec-80a592-8`] Stufe 2:** _Welche Netzwerkkomponente verteilt eingehenden Datenverkehr gleichmäßig auf mehrere dahinterliegende Serverinstanzen?_
   - **Antwort:** Load Balancer
   - **Hinweis:** Lastverteiler (L4 oder L7).
9. **[ID: `sec-80a592-9`] Stufe 2:** _Wie lautet das Akronym für zustandslose Tokens im JSON-Format, die häufig zur Benutzerauthentifizierung mit Signatur verwendet werden?_
   - **Antwort:** JWT
   - **Hinweis:** JSON Web Token (RFC 7519).
10. **[ID: `sec-80a592-10`] Stufe 2:** _Wie heißt der verteilte Netzwerkdienst, der Webinhalte an geografisch nahen Edge-Standorten zwischenspeichert, um Latenzen zu senken?_

- **Antwort:** CDN
- **Hinweis:** Content Delivery Network (z. B. Cloudflare, CloudFront).

11. **[ID: `sec-80a592-11`] Stufe 2:** _Welches Sicherheitsprinzip geht davon aus, dass keinem Akteur oder Gerät standardmäßig vertraut werden darf, weder intern noch extern?_

- **Antwort:** Zero Trust
- **Hinweis:** Zero-Trust-Architektur ("Never trust, always verify").

12. **[ID: `sec-80a592-12`] Stufe 2:** _Wie nennt man einen virtuellen Server in der Cloud, der als einziger SSH-Zugangspunkt für ein privates Subnetz dient?_

- **Antwort:** Bastion Host
- **Hinweis:** Auch Jump Host genannt.

13. **[ID: `sec-80a592-13`] Stufe 3:** _Welche Art von Firewall schützt Webanwendungen speziell vor Angriffen wie SQL-Injections und Cross-Site-Scripting auf Layer 7?_

- **Antwort:** WAF
- **Hinweis:** Web Application Firewall.

14. **[ID: `sec-80a592-14`] Stufe 3:** _Wie nennt man den Netzwerkdienst in einer Cloud, der Instanzen in privaten Subnetzen ausgehenden Internetzugriff ohne eigene öffentliche IP ermöglicht?_

- **Antwort:** NAT Gateway
- **Hinweis:** Network Address Translation Gateway.

15. **[ID: `sec-80a592-15`] Stufe 3:** _Welches offene Authentifizierungsprotokoll ermöglicht Drittanwendungen den delegierten Zugriff auf Benutzerressourcen ohne Passwörter?_

- **Antwort:** OAuth 2.0
- **Hinweis:** OAuth 2.0 Authorization Framework.

16. **[ID: `sec-80a592-16`] Stufe 3:** _Welche Identitätsschicht baut direkt auf OAuth 2.0 auf und standardisiert die Authentifizierung und Profilübermittlung von Benutzern?_

- **Antwort:** OpenID Connect
- **Hinweis:** OIDC (OpenID Connect).

17. **[ID: `sec-80a592-17`] Stufe 3:** _Welches Kubernetes-Objekt steuert den erlaubten Datenverkehr zwischen Pods auf IP- und Port-Ebene wie eine interne Firewall?_

- **Antwort:** NetworkPolicy
- **Hinweis:** k8s NetworkPolicy (erfordert ein kompatibles CNI wie Calico oder Cilium).

18. **[ID: `sec-80a592-18`] Stufe 3:** _Wie nennt man die Verbindungsstrecke (Peering), die zwei getrennte VPCs im selben Cloud-Netzwerk direkt routingfähig verbindet?_

- **Antwort:** VPC Peering
- **Hinweis:** Direkte Verbindung zwischen Virtual Private Clouds.

19. **[ID: `sec-80a592-19`] Stufe 4:** _Welcher Kubernetes-Zertifikatsmanager automatisiert die Ausstellung und Verlängerung von TLS-Zertifikaten direkt über Let's Encrypt oder Vault?_

- **Antwort:** cert-manager
- **Hinweis:** CNCF cert-manager.

20. **[ID: `sec-80a592-20`] Stufe 4:** _Welches CNCF-Graduated-Tool bietet ein vollständiges Service Mesh mit mTLS, Traffic Routing und Richtliniendurchsetzung für Kubernetes?_

- **Antwort:** Istio
- **Hinweis:** Basiert meist auf Envoy-Sidecars oder Ambient Mesh.

21. **[ID: `sec-80a592-21`] Stufe 4:** _Welche Abkürzung bezeichnet die offizielle Datenbank öffentlich bekannter Softwareschwachstellen mit Kennungen wie CVE-2024-1234?_

- **Antwort:** CVE
- **Hinweis:** Common Vulnerabilities and Exposures.

22. **[ID: `sec-80a592-22`] Stufe 4:** _Welches Bewertungssystem quantifiziert den Schweregrad von Sicherheitslücken auf einer Skala von 0,0 bis 10,0?_

- **Antwort:** CVSS
- **Hinweis:** Common Vulnerability Scoring System.

23. **[ID: `sec-80a592-23`] Stufe 4:** _Welches Open-Source-Tool von FalcoSecurity überwacht Linux-Systemaufrufe in Echtzeit und schlägt bei verdächtigem Laufzeitverhalten Alarm?_

- **Antwort:** Falco
- **Hinweis:** CNCF Graduated Runtime Security Tool.

24. **[ID: `sec-80a592-24`] Stufe 4:** _Wie nennt man die Technik, bei der Anfragen durch ein zentrales Hub-Netzwerk geroutet werden, um sternförmige VPC-Verbindungen zu verwalten?_

- **Antwort:** Transit Gateway
- **Hinweis:** AWS Transit Gateway / Hub-and-Spoke Topology.

25. **[ID: `sec-80a592-25`] Stufe 5:** _Welche Policy Engine der CNCF erzwingt deklarative Richtlinien in Kubernetes über einen Validating/Mutating Webhook mittels OPA?_

- **Antwort:** Gatekeeper
- **Hinweis:** OPA Gatekeeper.

26. **[ID: `sec-80a592-26`] Stufe 5:** _Welche moderne Richtlinien-Engine für Kubernetes wurde speziell entwickelt, um Policies direkt als native YAML-Ressourcen ohne Rego zu schreiben?_

- **Antwort:** Kyverno
- **Hinweis:** CNCF Kyverno.

27. **[ID: `sec-80a592-27`] Stufe 5:** _Welcher Angriffsvektor wird ausgenutzt, wenn ein Angreifer eine Serveranwendung dazu bringt, ungewollte Anfragen an interne Cloud-Metadatendienste (169.254.169.254) zu senden?_

- **Antwort:** SSRF
- **Hinweis:** Server-Side Request Forgery.

28. **[ID: `sec-80a592-28`] Stufe 5:** _Welche Version des AWS Instance Metadata Service schützt vor SSRF durch session-orientierte Header-Tokens?_

- **Antwort:** IMDSv2
- **Hinweis:** AWS Instance Metadata Service Version 2.

29. **[ID: `sec-80a592-29`] Stufe 5:** _Wie lautet der Fachbegriff für ein Sicherheitsmodul in Hardwareform, das kryptografische Schlüssel unextrahierbar speichert und Operationen darin ausführt?_

- **Antwort:** HSM
- **Hinweis:** Hardware Security Module.

30. **[ID: `sec-80a592-30`] Stufe 5:** _Welches Protokoll regelt im BGP-Routing den sicheren Austausch von Pfaden zwischen Autonomen Systemen im globalen Internet?_

- **Antwort:** BGP
- **Hinweis:** Border Gateway Protocol (auch von Calico und Cilium für Cluster-Peering genutzt).

31. **[ID: `sec-80a592-31`] Stufe 6:** _Welches Open-Source-Framework ermöglicht SPIFFE-konforme, kryptografisch verifizierbare Arbeitslast-Identitäten in heterogenen Umgebungen?_

- **Antwort:** SPIRE
- **Hinweis:** SPIFFE Runtime Environment (SPIRE).

32. **[ID: `sec-80a592-32`] Stufe 6:** _Wie heißt die Spezifikation zur Ausstellung kryptografischer X.509-SVIDs für Microservices im Zero-Trust-Bereich?_

- **Antwort:** SPIFFE
- **Hinweis:** Secure Production Identity Framework for Everyone.

33. **[ID: `sec-80a592-33`] Stufe 6:** _Welche Linux-Technologie erlaubt es Cilium, Paketfilterung und Load-Balancing direkt auf der Netzwerk-Treiber-Ebene ohne Kernel-Overhead durchzuführen?_

- **Antwort:** XDP
- **Hinweis:** eXpress Data Path (unterstützt durch eBPF).

34. **[ID: `sec-80a592-34`] Stufe 6:** _Wie nennt man die Sicherheitskategorie von Tools, die Cloud-Konten kontinuierlich auf Compliance-Verstöße und Fehlkonfigurationen überwachen?_

- **Antwort:** CSPM
- **Hinweis:** Cloud Security Posture Management.

35. **[ID: `sec-80a592-35`] Stufe 6:** _Wie nennt man die Plattform-Kategorie, die Laufzeitschutz für Cloud-Workloads (CWPP) und CSPM in einer einheitlichen Lösung bündelt?_

- **Antwort:** CNAPP
- **Hinweis:** Cloud-Native Application Protection Platform.

36. **[ID: `sec-80a592-36`] Stufe 7:** _Welches Verschlüsselungsprotokoll nutzt modernes WireGuard-VPN, das durch schlanke 4000 Zeilen C-Code im Linux-Kernel besticht?_

- **Antwort:** Noise Protocol
- **Hinweis:** Noise Protocol Framework (ChaCha20-Poly1305, Curve25519).

37. **[ID: `sec-80a592-37`] Stufe 7:** _Welches Kubernetes-Feature erlaubt es Pods, temporäre Cloud-IAM-Rollen direkt über OIDC ohne statische Secrets auf Cloud-APIs anzunehmen?_

- **Antwort:** IRSA
- **Hinweis:** IAM Roles for Service Accounts (bei AWS; Workload Identity bei Azure/GCP).

38. **[ID: `sec-80a592-38`] Stufe 7:** _Welches eBPF-basierte Netzwerk-Feature ermöglicht Socket-Level-Redirection zwischen lokalen Pods und umgeht TCP/IP-Stacks komplett?_

- **Antwort:** sockops
- **Hinweis:** BPF sockops / sockmap redirection.

39. **[ID: `sec-80a592-39`] Stufe 7:** _Wie nennt man die Kapselungsmethode, die Layer-2-Ethernet-Frames in standardmäßige Layer-3-UDP-Pakete packt, um virtuelle Overlays zu bilden?_

- **Antwort:** VXLAN
- **Hinweis:** Virtual Extensible LAN.

40. **[ID: `sec-80a592-40`] Stufe 7:** _Welche Bedrohungsmodellierungsmethode klassifiziert Risiken in Spoofing, Tampering, Repudiation, Info Disclosure, DoS und Elevation of Privilege?_

- **Antwort:** STRIDE
- **Hinweis:** STRIDE-Modell von Microsoft.

41. **[ID: `sec-80a592-41`] Stufe 8:** _Welche Hardware-Fähigkeit moderner CPUs (wie Intel SGX oder AMD SEV) ermöglicht Confidential Computing mit verschlüsseltem Arbeitsspeicher?_

- **Antwort:** Enklaven
- **Hinweis:** Secure Enclaves / TEE (Trusted Execution Environments).

42. **[ID: `sec-80a592-42`] Stufe 8:** _Welche kryptografische Methode erlaubt es, Berechnungen direkt auf verschlüsselten Daten durchzuführen, ohne sie jemals zu entschlüsseln?_

- **Antwort:** Homomorphe Verschlüsselung
- **Hinweis:** Homomorphic Encryption (FHE).

43. **[ID: `sec-80a592-43`] Stufe 8:** _Welcher Linux-Syscall wird von eBPF-LSM verwendet, um Sicherheitsrichtlinien dynamisch an Kernel-Sicherheits-Hooks wie bprm_check_security zu binden?_

- **Antwort:** bpf
- **Hinweis:** BPF_PROG_TYPE_LSM.

44. **[ID: `sec-80a592-44`] Stufe 8:** _Welcher Algorithmus verhindert in modernen TLS-1.3-Verbindungen, dass später kompromittierte Server-Schlüssel vergangene Sitzungen entschlüsseln?_

- **Antwort:** PFS
- **Hinweis:** Perfect Forward Secrecy (DHE / ECDHE).

45. **[ID: `sec-80a592-45`] Stufe 8:** _Welcher HashiCorp-Vault-Mechanismus generiert bei jedem Datenbankzugriff ein eigenes, kurzlebiges DB-Passwort mit automatischem Ablauf?_

- **Antwort:** Dynamic Secrets
- **Hinweis:** Dynamische Secrets Engine in Vault.

46. **[ID: `sec-80a592-46`] Stufe 9:** _Welche Angriffsart hebelt die Isolation von MicroVMs durch Ausnutzen von spekulativen CPU-Seitenkanälen wie Spectre oder Meltdown aus?_

- **Antwort:** Transient Execution Attack
- **Hinweis:** Spekulativer Seitenkanalangriff (Spectre / Meltdown / Downfall).

47. **[ID: `sec-80a592-47`] Stufe 9:** _Welche Krypto-Primitive ermöglicht Zero-Knowledge-Beweise für komplexe Aussagen ohne Preisgabe der zugrundeliegenden Geheimnisse?_

- **Antwort:** zk-SNARKs
- **Hinweis:** Zero-Knowledge Succinct Non-Interactive Argument of Knowledge.

48. **[ID: `sec-80a592-48`] Stufe 9:** _Welcher post-quanten-sichere Schlüsselaustausch-Algorithmus wurde vom NIST als Standard für TLS der nächsten Generation ausgewählt?_

- **Antwort:** ML-KEM
- **Hinweis:** Module-Lattice-based Key-Encapsulation Mechanism (früher CRYSTALS-Kyber).

49. **[ID: `sec-80a592-49`] Stufe 9:** _Welcher post-quanten-sichere Signaturalgorithmus wurde vom NIST für digitale Signaturen neben Sphincs+ standardisiert?_

- **Antwort:** ML-DSA
- **Hinweis:** Module-Lattice-based Digital Signature Algorithm (früher CRYSTALS-Dilithium).

50. **[ID: `sec-80a592-50`] Stufe 9:** _Welcher eBPF-Kernel-Mechanismus in Cilium ermöglicht transparente L7-Paketinspektion ohne Sidecar-Proxy durch direkten Envoy-Upstream-Handshake?_

- **Antwort:** Envoy Go Extension
- **Hinweis:** Cilium In-Kernel Envoy Integration / Socket Parsing.

---

## 3. ID-Strategie und Schemakonformität

- **Kollisionssichere Lieferungskennungen:** Jede Rubrik nutzt einen eigenen zufälligen Token:
  - `container-linux`: Präfix `cont-55f7e5-` (z. B. `cont-55f7e5-1`)
  - `kubernetes-orchestration`: Präfix `k8s-8d5ab5-` (z. B. `k8s-8d5ab5-1`)
  - `ci-cd-gitops`: Präfix `cicd-203d59-` (z. B. `cicd-203d59-1`)
  - `iac-cloud-foundations`: Präfix `iac-b1c0c3-` (z. B. `iac-b1c0c3-1`)
  - `observability-sre`: Präfix `obs-de8785-` (z. B. `obs-de8785-1`)
  - `cloud-security-networking`: Präfix `sec-80a592-` (z. B. `sec-80a592-1`)
- **Strikte Zeichengrenzen:** Alle IDs <= 64 Zeichen, Fragen/Antworten <= 500 Zeichen, Rubriknamen <= 40 Zeichen.
- **Append-Only:** `position` wird dynamisch an das Ende bestehender Positionen der jeweiligen Rubrik angehängt.
- **Ausgangsstufen:** `level = source_level = difficulty_score = Stufe (1–9)`; alle Bewertungszähler starten bei `0`.

---

## 4. Quellen und Fachliche Absicherung

- **Container & Linux-Internals:** Linux Kernel Documentation (Namespaces, cgroups v1/v2, seccomp, overlayfs, pivot_root, capabilities, idmapped mounts), OCI Runtime/Image Specification, containerd/runc/gVisor/Firecracker Docs.
- **Kubernetes & Orchestrierung:** Kubernetes Official Documentation (Concepts, Controllers, Schedulers, CRDs, Admission Webhooks, Gateway API, Storage/Volume, PSS/PSA, Kubelet Internals), etcd Architecture Docs, CNCF Landscape (Karpenter, Helm).
- **CI/CD & GitOps:** CNCF GitOps Working Group, Argo CD & Flux Docs, Continuous Delivery Foundation (Tekton), OpenSSF Scorecard & SLSA Framework, Sigstore Docs (Cosign, Rekor, Fulcio), W3C & SPDX Spezifikationen.
- **Infrastructure as Code & Cloud:** HashiCorp Terraform & OpenTofu Docs, Cloud Native Crossplane Architecture, Pulumi Docs, AWS Well-Architected Framework, Azure/GCP Cloud Architecture Center, Infracost / Checkov Docs.
- **Observability & SRE:** Google SRE Book & Workbook, Prometheus & PromQL Documentation, OpenTelemetry (OTel / OTLP / W3C TraceContext), Grafana Labs Docs (Loki, Tempo, Mimir, k6), eBPF Continuous Profiling (Parca, Pyroscope).
- **Cloud-Security & Networking:** NIST Zero Trust Architecture (SP 800-207), CNCF Cilium / eBPF Networking, SPIFFE/SPIRE Specs, HashiCorp Vault Docs, Common Vulnerabilities and Exposures (CVE/CVSS), Falco Runtime Security, OPA / Kyverno Docs, Post-Quantum Cryptography Standards (ML-KEM, ML-DSA).

---

## 5. Prüfergebnis und Grenzen der Prüfung

- **Syntax & Idempotenz:** Die SQL-Datei wurde isoliert in einer PostgreSQL-Testdatenbank nach vorheriger Anwendung der Initiallieferung zweifach ausgeführt. Nach dem zweiten Lauf blieb der Gesamtbestand exakt unverändert (Idempotenz bestätigt).
- **Konflikttest:** Kollidierende IDs mit abweichendem Inhalt lösen eine kontrollierte Ausnahme aus und rollen die Transaktion zurück.
- **Spielbarkeitsvalidierung:** Der kumulierte Fragenpool (354 Fragen) wurde über `validateQuestionPool` und `drawBoard` für alle 5 Schwierigkeitsstufen getestet. Jede Stufe verfügt über ausreichend Fragen in allen 6 Rubriken.
- **Wichtiger Hinweis:** Die Datei wurde **nicht** in die produktive Datenbank eingespielt. Der Betreiber kann die Datei nach eigenem Ermessen manuell einpflegen.
