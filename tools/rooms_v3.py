#!/usr/bin/env python3
"""Revision-2 hull compartments (docs/room_art_brief_v2.md + hull layout rev 2).
Usage: rooms_v3.py name:variants ...   e.g.  control:3
Style references are the approved submarine-look rooms. Writes keyed PNGs to design/assets/rooms/<name>_v3<letter>.png.
Run from the repo root."""
import json, os, subprocess, sys, time
import numpy as np
from PIL import Image

ENV = dict(os.environ, NODE_USE_ENV_PROXY='1', NODE_EXTRA_CA_CERTS='/root/.ccr/ca-bundle.crt')
M = ['npm', 'exec', '--yes', '--package=meshy-cli@0.4.0', '--', 'meshy']
REFS = 'design/assets/rooms/spine_v2c_src.png,design/assets/rooms/bridge_v2b_src.png'
D = 'design/assets/meshy_output/rooms_v3'
OUTD = 'design/assets/rooms'
os.makedirs(D, exist_ok=True)

HEAD = ("The two images are style references for the hand-painted look, palette, materials and lighting only. "
        "Draw a different compartment in exactly that style, as the interior of a cramped submarine-style spaceship pressure hull: ")

# Everything the generator must positively see. Negatives are phrased as positive statements wherever possible,
# because the model largely ignores "no X" wording (see docs/character_art_brief.md lessons).
TAIL = (
 " Built like the inside of a pressure hull: scarred painted steel and dull yellowed plastic panels, riveted seams, welded repair patches, "
 "ribbed hull frames repeating along the full length, bundled cable runs and steel pipes with valve wheels clamped along the walls and ceiling edge, "
 "small caged ceiling lamps, steel grating and diamond-tread plate floor, heavy round-cornered bulkhead hatches with thick gaskets and wheel dogs. "
 "Low, tight and crowded, with every piece of equipment packed hard against the walls and a narrow clear walking lane down the middle. "
 "The compartment is fully sealed: every wall is solid plain steel plating from floor to ceiling, enclosed on all sides, deep inside the hull, "
 "with nothing but more plating beyond it. All display screens are switched off and show flat dark blank glass. "
 "Every surface is unmarked and bare: plain bare floor plating, plain blank wall panels, plain smooth equipment casings. "
 "Isometric cutaway of the compartment showing the floor plus the back-left and back-right walls only, near walls removed, "
 "true 2:1 isometric camera, same camera angle and the same scale feel as the reference images. "
 "Lighting: even neutral mid-dark base light from the upper left with soft ambient occlusion and clearly readable floor detail; "
 "light comes only from a few small distinct fixtures, warm amber strip lights and small cool cyan indicator lamps. "
 "Plain solid flat magenta (#FF00FF) background outside the compartment, no gradients, no shadow cast onto the background. "
 "Leave two blank flat wall panels, two clear empty desk or shelf tops and one clear empty patch of floor. "
 "Strictly forbidden, do not draw any of these: windows, viewports, portholes, glass panes, openings to space, stars, starfields, sky, planets, "
 "exterior views, spotlights, light shafts, glowing halos, fog, haze, people, crew, figures, "
 "text, writing, letters, numbers, digits, signs, placards, labels, nameplates, posters, stencils, decals, logos, symbols, "
 "arrows, chevrons, painted floor markings, painted stripes, hazard stripes."
)

ROOMS = {
 'control':
   "the ship's CONTROL ROOM, a long narrow compartment roughly two and a half times as long as it is wide, its long axis running from the "
   "far back-left corner down toward the near right. It is a tight, congested combat control space divided into three work zones along its "
   "length by low equipment racks. At the far end, a navigation station: two angled consoles against the wall and one heavy padded recoil "
   "chair with folded harness straps. In the middle, the attack center: a flat rectangular chart table that folds up out of the floor "
   "plating, standing waist high, with two more heavy recoil chairs facing it and a short squat pedestal on the centerline beside it with a "
   "softly glowing cyan ring set flush into its top. At the near end, a sensor and countermeasures station: a bank of dark blank screens in a "
   "rack cabinet and one more recoil chair. A small recessed square wall panel with a dark unlit ring in its center is set at chest height on "
   "the back-right wall. A round slotted speaker grille is set into the ceiling edge above it. One heavy round-cornered bulkhead hatch with a "
   "wheel dog stands open in the short wall at the near end. A second smaller closed bulkhead door is set into the back-right wall near that end.",
}

ASPECT = os.environ.get('ASPECT', '16:9')

def sh(args):
    return subprocess.run(M + args, capture_output=True, text=True, env=ENV)

def key(src, dst):
    im = np.array(Image.open(src).convert('RGB')).astype(int)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    mag = np.clip(np.minimum(r, b) - g, 0, 255)
    alpha = np.where(mag > 120, 0, np.where(mag > 40, 255 * (120 - mag) / 80, 255)).astype(int)
    spill = np.clip((np.minimum(r, b) - g) * (alpha < 255), 0, 255)
    out = np.dstack([np.clip(r - spill * .8, 0, 255), g, np.clip(b - spill * .8, 0, 255), alpha]).astype('uint8')
    img = Image.fromarray(out, 'RGBA')
    bb = img.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox()
    img.crop(bb).save(dst)

jobs = {}
for a in sys.argv[1:]:
    n, k = a.split(':')
    for v in range(int(k)):
        tag = f'{n}_v3{"abcdef"[v]}'
        r = sh(['image-to-image', 'create', '--ai-model', 'gpt-image-2', '--reference-image-urls', REFS,
                '--aspect-ratio', ASPECT, '--async', '--output-schema', 'v1', '--format', 'json',
                '--no-update-check', '--prompt', HEAD + ROOMS[n] + TAIL])
        try:
            jobs[tag] = json.loads(r.stdout)['result']['task_id']
            print('submitted', tag, jobs[tag], flush=True)
        except Exception:
            print('FAILED to submit', tag, r.stdout[-200:], r.stderr[-200:], flush=True)
json.dump(jobs, open(f'{D}/ids_{os.getpid()}.json', 'w'), indent=1)

done = set()
while len(done) < len(jobs):
    for tag, tid in jobs.items():
        if tag in done:
            continue
        r = sh(['image-to-image', 'get', tid, '--output-schema', 'v1', '--format', 'json', '--no-update-check'])
        try:
            st = json.loads(r.stdout)['result']['task']['status']
        except Exception:
            st = 'UNKNOWN'
        if st == 'SUCCEEDED':
            sh(['download', '--resource', 'image-to-image', '--task-id', tid, '--kind', 'image',
                '--output-dir', f'{D}/{tag}', '--no-update-check'])
            src = f'{D}/{tag}/image_0.png'
            if os.path.exists(src):
                Image.open(src).save(f'{OUTD}/{tag}_src.png')
                key(src, f'{OUTD}/{tag}.png')
                done.add(tag)
                print(time.strftime('%T'), 'done', tag, flush=True)
        elif st in ('FAILED', 'CANCELED'):
            print('FAILED', tag, flush=True)
            done.add(tag)
    time.sleep(15)
print('ALL DONE')
