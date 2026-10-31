#!/bin/sh
# Inline the real-time engine into the template -> web/hunt_rt.html
cd "$(dirname "$0")" && python3 - <<'PY'
t=open('hunt_rt_template.html').read(); e=open('hunt_rt_engine.js').read(); y=open('symbols.js').read(); cs=open('hunt_console.css').read(); cj=open('hunt_console.js').read(); tr=open('trims.js').read(); tu=open('tutorial.js').read()
open('hunt_rt.html','w').write(t.replace('/*ENGINE*/', e).replace('/*TRIMS*/', tr).replace('/*TUTORIAL*/', tu).replace('/*SYMBOLS*/', y).replace('/*CONSOLECSS*/', cs).replace('/*CONSOLE*/', cj))
PY
