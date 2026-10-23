#!/bin/sh
# Inline the engine into the template: web/hunt.html (published artifact)
cd "$(dirname "$0")" && python3 - <<'PY'
t=open('hunt_template.html').read(); e=open('hunt_engine.js').read()
open('hunt.html','w').write(t.replace('/*ENGINE*/', e))
PY
