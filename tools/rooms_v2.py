#!/usr/bin/env python3
"""Submarine-pass room generation (docs/room_art_brief_v2.md). Usage: rooms_v2.py name:variants ... e.g. bridge:2 junction:2. Submits, waits, downloads, keys magenta.
Outputs design/assets/rooms/<name>_v2<letter>.png (keyed) and *_src.png (git-ignored). Run from the repo root."""
import json, os, subprocess, sys, time
import numpy as np
from PIL import Image
ENV = dict(os.environ, NODE_USE_ENV_PROXY='1', NODE_EXTRA_CA_CERTS='/root/.ccr/ca-bundle.crt')
M = ['npm', 'exec', '--yes', '--package=meshy-cli@0.4.0', '--', 'meshy']
REFS = 'design/assets/engineering_room_src.png,design/assets/mess_room_v2_src.png'
ASPECT = os.environ.get('ASPECT', '3:2'); D = 'design/assets/meshy_output/rooms_v2'; OUTD = 'design/assets/rooms'
os.makedirs(D, exist_ok=True)
HEAD = "The two images are style references for the hand-painted look, palette and lighting only. Draw a different room in the same painted style but as the interior of a cramped submarine-style spaceship pressure hull: "
TAIL = (" Isometric cutaway of the room (floor plus the back-left and back-right walls only), true 2:1 isometric camera, same angle and scale feel as the references. "
 "Scarred painted steel and dull yellowed plastic panels, riveted seams, welded patches, ribbed hull frames, exposed cable bundles, steel pipes with valve wheels, caged ceiling lamps, steel grating or diamond-tread plate floor, heavy round-cornered bulkhead doors with gaskets and wheel dogs. Low and crowded, equipment packed close to the walls. "
 "Lighting standard: even neutral mid-dark base lighting from the upper left with soft ambient occlusion and readable floor detail; light comes only from a few small distinct fixtures, warm amber strip lights and small cool cyan indicator lamps; no spotlights, no light shafts, no halos, no fog. "
 "Plain solid flat magenta (#FF00FF) background outside the room, no gradients. Keep two blank flat wall panels, two clear empty shelf or desk tops and one clear empty floor patch. "
 "Strictly: no windows, no viewports, no stars, no text, no numbers, no letters, no signs, no placards, no labels, no posters, no arrows, no chevrons, no painted markings on the floor, no people.")
ROOMS = {
 'spine': "the ship's main SPINE CORRIDOR, a very long, narrow passage about five times as long as it is wide and only wide enough for two people to pass. The long axis runs along the back-right wall from the back corner toward the right. The long back-right wall has three heavy round-cornered bulkhead hatches standing open, evenly spaced, and between them pipe runs, cable trays, a fold-down wall seat, a strapped crate and a red fire locker with a plain unmarked door. The short back-left wall at the left end has one heavy round-cornered bulkhead hatch standing open. Ribbed hull frames repeat along the whole length. Plain steel grating floor with nothing painted on it.",
 'bridge': "the ship's BRIDGE, a tight, congested combat control room with no window of any kind. Three or four consoles packed close together around a small central control pedestal with an empty glowing ring for the ship AI, two or three heavy recoil chairs with folded harness straps, a chart table folded up from the floor, a dark blank flat display panel set into one wall, thick cable trays and pipes along the ceiling edge. One heavy round-cornered bulkhead door in the back-left wall, standing open.",
 'junction': "a ship passage JUNCTION where the main spine passage meets a crossing passage, a small square room with three heavy round-cornered bulkhead doors standing open, two in the back-left wall and one in the back-right wall, thick pipes and cable trays along the ceiling edge, a red fire locker with a plain unmarked door, one strapped crate against a wall, a plain bare steel floor with a single square hatch plate in the middle, a fold-down seat on the wall.",
}
def sh(args): return subprocess.run(M + args, capture_output=True, text=True, env=ENV)
def key(src, dst):
    im = np.array(Image.open(src).convert('RGB')).astype(int); r, g, b = im[..., 0], im[..., 1], im[..., 2]
    mag = np.clip(np.minimum(r, b) - g, 0, 255)
    alpha = np.where(mag > 120, 0, np.where(mag > 40, 255 * (120 - mag) / 80, 255)).astype(int)
    spill = np.clip((np.minimum(r, b) - g) * (alpha < 255), 0, 255)
    out = np.dstack([np.clip(r - spill * .8, 0, 255), g, np.clip(b - spill * .8, 0, 255), alpha]).astype('uint8')
    img = Image.fromarray(out, 'RGBA'); bb = img.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox(); img.crop(bb).save(dst)
jobs = {}
for a in sys.argv[1:]:
    n, k = a.split(':')
    for v in range(int(k)):
        tag = f'{n}_v2{"abcdef"[v]}'
        r = sh(['image-to-image', 'create', '--ai-model', 'gpt-image-2', '--reference-image-urls', REFS, '--aspect-ratio', ASPECT, '--async', '--output-schema', 'v1', '--format', 'json', '--no-update-check', '--prompt', HEAD + ROOMS[n] + TAIL])
        try: jobs[tag] = json.loads(r.stdout)['result']['task_id']; print('submitted', tag, jobs[tag], flush=True)
        except Exception: print('FAILED to submit', tag, r.stdout[-200:], r.stderr[-200:], flush=True)
json.dump(jobs, open(f'{D}/ids_{os.getpid()}.json', 'w'), indent=1)
done = set()
while len(done) < len(jobs):
    for tag, tid in jobs.items():
        if tag in done: continue
        r = sh(['image-to-image', 'get', tid, '--output-schema', 'v1', '--format', 'json', '--no-update-check'])
        try: st = json.loads(r.stdout)['result']['task']['status']
        except Exception: st = 'UNKNOWN'
        if st == 'SUCCEEDED':
            sh(['download', '--resource', 'image-to-image', '--task-id', tid, '--kind', 'image', '--output-dir', f'{D}/{tag}', '--no-update-check'])
            src = f'{D}/{tag}/image_0.png'
            if os.path.exists(src):
                Image.open(src).save(f'{OUTD}/{tag}_src.png'); key(src, f'{OUTD}/{tag}.png'); done.add(tag); print(time.strftime('%T'), 'done', tag, flush=True)
        elif st in ('FAILED', 'CANCELED'): print('FAILED', tag, flush=True); done.add(tag)
    time.sleep(20)
print('ALL DONE')
