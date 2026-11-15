#!/bin/sh
# Inline the real-time engine, console, station layer, call deck and station screens into the template -> web/hunt_rt.html, and the walk demo's copy design/hunt.html
cd "$(dirname "$0")" && python3 - <<'PY2'
import json, os
r = lambda f: open(f).read()
t=r('hunt_rt_template.html')
mf = json.load(open('voice_clips/manifest.json')) if os.path.exists('voice_clips/manifest.json') else {}
mf = {k: {'file': v['file'], 'ms': v.get('ms')} for k, v in mf.items()}
stations = r('station_model.js') + '\n' + r('salvo_presets.js') + '\n' + r('station_adapter.js') + '\n' + r('annunciator.js')
rep = {'/*FLIGHT*/': r('flight_model.js'), '/*ENGINE*/': r('hunt_rt_engine.js'), '/*TRIMS*/': r('trims.js'), '/*STATE*/': r('demo_state.js'), '/*TUTORIAL*/': r('tutorial.js'), '/*SYMBOLS*/': r('symbols.js'),
  '/*CONSOLECSS*/': r('hunt_console.css'), '/*DECKCSS*/': r('call_deck.css'), '/*CONSOLE*/': r('hunt_console.js'), '/*VOICE*/': r('voice.js'),
  '/*VOICEMANIFEST*/': 'window.VOICE_MANIFEST = ' + json.dumps(mf, separators=(',', ':')) + ';', '/*STATIONS*/': stations, '/*CALLDECK*/': r('call_deck.js'), '/*SCREENSCSS*/': r('station_screens.css'), '/*SCREENS*/': r('station_screens.js') + '\n' + r('station_pages.js')}
for k, v in rep.items(): t = t.replace(k, v)
open('hunt_rt.html','w').write(t)
open('../design/hunt.html','w').write('<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n' + t)
PY2
