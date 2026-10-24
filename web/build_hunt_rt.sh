#!/bin/sh
# Inline the real-time engine into the template -> web/hunt_rt.html
cd "$(dirname "$0")" && python3 - <<'PY'
t=open('hunt_rt_template.html').read(); e=open('hunt_rt_engine.js').read(); y=open('symbols.js').read()
open('hunt_rt.html','w').write(t.replace('/*ENGINE*/', e).replace('/*SYMBOLS*/', y))
PY
