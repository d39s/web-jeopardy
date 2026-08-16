# ADR 0004 – Auslieferung im Container

Status: angenommen · Datum: 2026-08-16

## Kontext

Vorgabe: „dist läuft über einen Docker-Container." Zusätzlich sollen neue Fragensets ohne
Neubau des Images möglich sein, und dasselbe Image soll später auch mit Server-Adresse für
den Online-Modus funktionieren.

## Entscheidung

Zweistufiges Image: Eine Node-Stufe baut die Anwendung, eine nginx-Stufe liefert `dist`
statisch aus. Dazu drei Festlegungen:

1. **Fragensets als Volume.** `content/topics` wird nach `/usr/share/nginx/html/topics`
   gemountet. Neue oder geänderte Fragensets wirken nach einem Neuladen der Seite. Die im
   Image enthaltene Kopie dient als Standardbestückung.
2. **Getrennte Cache-Regeln.** Gehashte Dateien unter `/assets` gelten als unveränderlich
   und werden dauerhaft zwischengespeichert; `index.html`, `/topics/*` und `/config.json`
   ausdrücklich nicht – sonst wären nachgereichte Fragensets unsichtbar.
3. **Laufzeitkonfiguration statt Build-Variablen.** Ein Einstiegsskript schreibt beim Start
   `config.json` aus Umgebungsvariablen (derzeit `JEOPARDY_WS_URL`). So bleibt es bei einem
   Image für alle Umgebungen.

Der SPA-Fallback (`try_files $uri $uri/ /index.html`) sorgt dafür, dass auch der direkte
Aufruf von `/game` funktioniert.

## Konsequenzen

- Das Image ist rund 62 MB groß, im Wesentlichen die nginx-alpine-Basis.
- Für Phase 2 kommt ein zweiter Dienst in `docker-compose.yml` hinzu; die Weiterleitung von
  `/ws` gehört dann in dieselbe nginx-Konfiguration.
- Wer Fragensets nur ausprobieren will, braucht kein Volume: Die Startseite nimmt eine
  JSON-Datei direkt entgegen.
