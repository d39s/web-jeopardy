#!/bin/sh
# Erzeugt beim Start eine Laufzeitkonfiguration aus Umgebungsvariablen, damit
# dasselbe Image in verschiedenen Umgebungen laufen kann (etwa mit der
# Server-Adresse für den späteren Online-Modus).
set -eu

cat >/usr/share/nginx/html/config.json <<EOF
{
  "wsUrl": "${JEOPARDY_WS_URL:-}"
}
EOF
