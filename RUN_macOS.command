#!/bin/bash
cd "$(dirname "$0")"
PORT=$(python3 - <<'PYPORT'
import socket
s=socket.socket()
s.bind(('127.0.0.1',0))
print(s.getsockname()[1])
s.close()
PYPORT
)
echo "Summerflow Physics v10 — starting fresh server on port ${PORT}"
python3 -m http.server "$PORT" --bind 127.0.0.1 &
PID=$!
sleep 0.8
STAMP=$(date +%s)
open "http://127.0.0.1:${PORT}/?build=physics-v10-${STAMP}"
wait "$PID"
