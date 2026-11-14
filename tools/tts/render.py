#!/usr/bin/env python3
"""Render crew dialogue to audio with Piper (offline neural TTS). Only changed lines are re-rendered.

  python3 tools/tts/render.py lines.json web/voice_clips        # lines.json: [{"id","who","text"}, ...]

Setup (once):  pip install piper-tts ; fetch voices (GitHub release, no account needed) into $PIPER_VOICES (default /tmp/pv):
  curl -L https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-libritts-high.tar.gz | tar xz
Casting is in tools/tts/cast.json: who -> {model, speaker (optional), length_scale (pace), noise_scale (variation)}.
Output: <out>/<id>.mp3 and <out>/manifest.json {id: {"file","who","text","ms"}} which web/voice.js can load with Voice.loadClips().
Measured here: 0.2-2 s of CPU per line, about 30 KB of mp3 per 4-second line.
"""
import json, os, sys, wave, hashlib, subprocess, io
from piper import PiperVoice, SynthesisConfig
here = os.path.dirname(os.path.abspath(__file__))
voices = os.environ.get('PIPER_VOICES', '/tmp/pv')
cast = json.load(open(os.path.join(here, 'cast.json')))
lines = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
mf_path = os.path.join(out, 'manifest.json')
mf = json.load(open(mf_path)) if os.path.exists(mf_path) else {}
loaded = {}
done = skipped = 0
for ln in lines:
    c = cast.get(ln['who'], cast['default'])
    key = hashlib.sha1(json.dumps([ln['text'], c], sort_keys=True).encode()).hexdigest()[:12]
    f = ln['id'] + '.mp3'
    if mf.get(ln['id'], {}).get('key') == key and os.path.exists(os.path.join(out, f)):
        skipped += 1; continue
    m = c['model']
    if m not in loaded: loaded[m] = PiperVoice.load(os.path.join(voices, m))
    cfg = SynthesisConfig(speaker_id=c.get('speaker'), length_scale=c.get('length_scale', 1.0), noise_scale=c.get('noise_scale', 0.667))
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as w: loaded[m].synthesize_wav(ln['text'], w, syn_config=cfg)
    buf.seek(0); wr = wave.open(buf); ms = int(1000 * wr.getnframes() / wr.getframerate())
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'wav', '-i', 'pipe:0', '-ac', '1', '-b:a', '48k', os.path.join(out, f)], input=buf.getvalue(), check=True)
    mf[ln['id']] = {'file': f, 'who': ln['who'], 'text': ln['text'], 'ms': ms, 'key': key}; done += 1
json.dump(mf, open(mf_path, 'w'), indent=1)
print('rendered', done, 'skipped (unchanged)', skipped)
