#!/usr/bin/env python3
"""Edit an existing room image with a precise instruction, key the magenta, save as <out>.png.
Usage: room_edit.py <src_png> <out_name> <model> "<instruction>"   (run from the repo root)"""
import json, os, subprocess, sys, time
import numpy as np
from PIL import Image
ENV = dict(os.environ, NODE_USE_ENV_PROXY='1', NODE_EXTRA_CA_CERTS='/root/.ccr/ca-bundle.crt')
M = ['npm', 'exec', '--yes', '--package=meshy-cli@0.4.0', '--', 'meshy']
src, out, model, prompt = sys.argv[1:5]; aspect = sys.argv[5] if len(sys.argv) > 5 else '16:9'
def sh(a): return subprocess.run(M + a, capture_output=True, text=True, env=ENV)
def key(s, d):
    im = np.array(Image.open(s).convert('RGB')).astype(int); r, g, b = im[..., 0], im[..., 1], im[..., 2]
    mag = np.clip(np.minimum(r, b) - g, 0, 255)
    alpha = np.where(mag > 120, 0, np.where(mag > 40, 255 * (120 - mag) / 80, 255)).astype(int)
    spill = np.clip((np.minimum(r, b) - g) * (alpha < 255), 0, 255)
    o = np.dstack([np.clip(r - spill * .8, 0, 255), g, np.clip(b - spill * .8, 0, 255), alpha]).astype('uint8')
    img = Image.fromarray(o, 'RGBA'); bb = img.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox(); img.crop(bb).save(d)
r = sh(['image-to-image', 'create', '--ai-model', model, '--reference-image-urls', src, '--aspect-ratio', aspect, '--async',
        '--output-schema', 'v1', '--format', 'json', '--no-update-check', '--prompt', prompt])
tid = json.loads(r.stdout)['result']['task_id']; print('task', tid, flush=True)
while True:
    time.sleep(12)
    st = json.loads(sh(['image-to-image', 'get', tid, '--output-schema', 'v1', '--format', 'json', '--no-update-check']).stdout)['result']['task']['status']
    if st == 'SUCCEEDED': break
    if st in ('FAILED', 'CANCELED'): print('FAILED'); sys.exit(1)
d = f'design/assets/meshy_output/edits/{out}'; os.makedirs(d, exist_ok=True)
sh(['download', '--resource', 'image-to-image', '--task-id', tid, '--kind', 'image', '--output-dir', d, '--no-update-check'])
Image.open(f'{d}/image_0.png').save(f'design/assets/rooms/{out}_src.png'); key(f'{d}/image_0.png', f'design/assets/rooms/{out}.png'); print('DONE', out)
