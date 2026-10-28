#!/usr/bin/env python3
"""Wait for room image tasks, submit the ones that were rate-limited, then download and key the magenta background. Run from the repo root."""
import json, os, subprocess, sys, time
import numpy as np
from PIL import Image
ENV = dict(os.environ, NODE_USE_ENV_PROXY='1', NODE_EXTRA_CA_CERTS='/root/.ccr/ca-bundle.crt')
M = ['npm', 'exec', '--yes', '--package=meshy-cli@0.4.0', '--', 'meshy']
D = 'design/assets/meshy_output/rooms'; OUTD = 'design/assets/rooms'
os.makedirs(OUTD, exist_ok=True)
ALL = ['bridge','thermal','sensors','weapons','stores','captain_cabin','officer_cabin','bunk_room','head','junction','cargo','airlock','sickbay']
def sh(args):
    return subprocess.run(M + args, capture_output=True, text=True, env=ENV)
def status(tid):
    r = sh(['image-to-image', 'get', tid, '--output-schema', 'v1', '--format', 'json', '--no-update-check'])
    try: t = json.loads(r.stdout)['result']['task']; return t['status']
    except Exception: return 'UNKNOWN'
def key(src, dst):
    im = np.array(Image.open(src).convert('RGB')).astype(int); r, g, b = im[..., 0], im[..., 1], im[..., 2]
    mag = np.clip(np.minimum(r, b) - g, 0, 255)
    alpha = np.where(mag > 120, 0, np.where(mag > 40, 255 * (120 - mag) / 80, 255)).astype(int)
    spill = np.clip((np.minimum(r, b) - g) * (alpha < 255), 0, 255)
    out = np.dstack([np.clip(r - spill * .8, 0, 255), g, np.clip(b - spill * .8, 0, 255), alpha]).astype('uint8')
    img = Image.fromarray(out, 'RGBA'); bb = img.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox(); img.crop(bb).save(dst)
done = set()
while True:
    ids = json.load(open(f'{D}/ids.json'))
    missing = [n for n in ALL if n not in ids]
    pend = [n for n in ids if n not in done]
    for n in pend:
        st = status(ids[n])
        if st == 'SUCCEEDED':
            sh(['download', '--resource', 'image-to-image', '--task-id', ids[n], '--kind', 'image', '--output-dir', f'{D}/{n}', '--no-update-check'])
            src = f'{D}/{n}/image_0.png'
            if os.path.exists(src):
                os.makedirs(OUTD, exist_ok=True); Image.open(src).save(f'{OUTD}/{n}_src.png'); key(src, f'{OUTD}/{n}.png'); done.add(n); print(time.strftime('%T'), 'done', n, flush=True)
        elif st in ('FAILED', 'CANCELED'):
            print('FAILED', n, flush=True); done.add(n)
    active = len([n for n in ids if n not in done])
    if missing and active < 5:
        subprocess.run(['python3', 'tools/rooms_batch.py'] + missing[:max(1, 8 - active)], env=ENV)
    if not missing and not [n for n in ids if n not in done]: break
    time.sleep(30)
print('ALL DONE', sorted(done))
