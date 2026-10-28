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
 "Each compartment carries two standard fittings: a small recessed square wall panel at chest height with a ring in its center that is "
 "completely dark, unlit, switched off, dead black glass with no glow and no color at all; and a round slotted speaker grille set into the ceiling edge. "
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
   "rack cabinet and one more recoil chair. One heavy round-cornered bulkhead hatch with a wheel dog stands open in the short wall at the "
   "near end. A second smaller closed bulkhead door is set into the back-right wall near that end.",

 'stateroom':
   "the CAPTAIN'S STATEROOM, a very small square cabin, spartan and bare, the only private space on a working ship. A single fold-out bunk "
   "swung down from the back-left wall with a thin mattress, a folded grey blanket and a loose harness strap hanging beside it. A narrow "
   "fold-down desk hinged from the back-right wall with one dark blank screen above it and a clear empty desktop. A tall narrow steel locker "
   "with a plain door. A single small stool. One heavy round-cornered bulkhead door, closed, set into the back-right wall. Low ceiling, pipes "
   "crossing the overhead, one caged lamp.",

 'junction':
   "a small square JUNCTION compartment where the fore and aft passages meet and the deck ladder comes through. One heavy round-cornered "
   "bulkhead hatch stands open in the middle of the back-left wall and a second stands open in the middle of the back-right wall. In the "
   "center of the floor, a square opening in the deck plating ringed by a low steel railing, with the top of a vertical steel ladder rising "
   "through it from the deck below. Directly overhead, a round hatch set into the ceiling with a large wheel dog on it, leading up into a "
   "trunk. Against one wall a tall red fire locker with a plain unmarked door, a fold-down wall seat and one strapped crate. Bare steel "
   "grating floor, thick pipe runs and cable trays across the overhead.",

 'airlock':
   "the BOARDING AIRLOCK, a tiny cramped square chamber, the smallest compartment on the ship. One very heavy round pressure hatch with a "
   "large central wheel dog fills most of the back-right wall, closed and sealed. Along the back-left wall, three narrow open suit lockers "
   "holding bulky pressure suits on hangers, with helmets on a shelf above and empty hooks beside them. A short steel bench. A round drain "
   "grate set into the middle of the steel floor. A wall panel of plain unmarked round dials with needles. Heavy ribbed frames, very low "
   "ceiling, two caged lamps.",

 'missile':
   "the MISSILE COMPARTMENT, UPPER LEVEL, a very long narrow compartment about four times as long as it is wide, running from the far "
   "back-left corner down toward the near right. Two parallel rows of large circular missile tube caps are set flush into the steel floor "
   "plating down the whole length, twelve caps in each row, with a narrow clear walking lane running between the two rows. Half the caps are "
   "ringed with a warm amber band and half are plain flat unringed steel. A heavy overhead loading gantry rail runs the length of the "
   "compartment above the caps, hung from the ceiling frames. Thick cable bundles and pipe runs along both walls. One heavy round-cornered "
   "bulkhead hatch stands open in the short end wall at the near end.",

 'thermal':
   "the THERMAL CONTROL compartment, a small room slightly longer than it is wide. Tall heat exchanger stacks of stacked finned plates fill "
   "the back-left wall, with heavy insulated coolant pipes running from them across the ceiling and down the back-right wall, studded with "
   "large valve wheels and plain unmarked round dial gauges with needles. One control console with dark blank screens and a single plain "
   "swivel stool. A work shelf with a clear empty top. Condensation streaks down the pipes and a shallow drip tray on the grating floor. One "
   "heavy round-cornered bulkhead hatch stands open in each short end wall.",

 'eng_upper':
   "ENGINEERING, UPPER LEVEL, a compartment about two and a half times as long as it is wide, the chunkiest space on the ship. The upper "
   "third of a massive cylindrical reactor casing rises through the middle of the floor, its domed top standing well above waist height, "
   "ringed by a low steel railing where it passes through the deck. The floor is open steel grating catwalk through which darkness is visible "
   "below. A square opening in the grating near one end is ringed by a railing with the top of a vertical steel ladder rising through it. "
   "Heavy pipe manifolds with valve wheels along both walls, a workbench with a clear empty top, a board of hanging hand tools, a rack of "
   "spare parts. One heavy round-cornered bulkhead hatch stands open in the short end wall.",

 'eng_lower':
   "ENGINEERING, LOWER LEVEL, a very long compartment about four times as long as it is wide, dominated at the far end by the massive "
   "cylindrical base of a reactor casing that runs from the floor straight up through the ceiling, surrounded by thick shielding collars and "
   "heavy conduit. The ceiling overhead is open steel grating through which the underside of the deck above is visible, with a vertical steel "
   "ladder rising into a square opening in it. At the near end, heat sink machinery: squat coolant reservoirs, pump housings and insulated "
   "pipework climbing into the ceiling. Running low along one wall, a heavy cylindrical breech mechanism with a loading rail and a rack of "
   "plain blunt metal slugs. Oil-stained steel plate floor with drip trays.",

 'berths':
   "the OFFICER BERTHS, a small compartment slightly longer than it is wide, divided into three open bunk nooks by low partition bulkheads "
   "along the back walls. Each nook holds two narrow fold-out bunks, one above the other, swung down from the wall with thin mattresses, "
   "folded grey blankets and loose harness straps, a small fold-down desk with a clear empty top between them and a steel locker below. A "
   "narrow clear walking lane runs past the nooks. One heavy round-cornered bulkhead hatch stands open in the short end wall. Low ceiling "
   "with pipe runs, two caged lamps, worn plating.",

 'utility':
   "the UTILITY compartment, a small cramped square room combining the heads, washroom and a dormant sickbay. Two narrow toilet stalls with "
   "plain closed steel doors along the back-left wall, beside them a shallow wash basin with a dull scratched steel mirror above it and a "
   "shower stall with a heavy grey curtain. A round drain grate in the middle of the steel floor. In the far corner, a fold-down padded exam "
   "table hinged against the wall with a closed instrument cabinet mounted above it and a small sheeted trolley, clearly unused for a long "
   "time. One heavy round-cornered bulkhead door, closed, in the back-right wall.",

 'mess':
   "the MESS AND GALLEY, a compartment about twice as long as it is wide, built to feed far more people than are aboard. Three long fixed "
   "steel bench tables with attached benches run down the length, enough for about twenty-five, most of them bare and clearly unused. Along "
   "the back-left wall a galley counter with a steel range, large dented steel pots, a deep sink and overhead stowage lockers with latched "
   "doors. At the far end, dry and cold stores: a bank of heavy latched locker doors and strapped crates. A large flat dark blank display "
   "panel on the back-right wall for briefings. In the ceiling near one end, a square opening ringed by a railing with a vertical steel "
   "ladder coming down through it into the compartment. Warm amber strip lights under the lockers.",

 'bunks':
   "the CREW BUNK COMPARTMENT, a very long narrow space about four times as long as it is wide, wrapped around the bases of the missile "
   "tubes. Down the center of the compartment runs a row of twelve large cylindrical tube bases rising from the floor to the ceiling, "
   "surrounded by carousel handling machinery, hydraulic rams and cable looms. Along both side walls are stacked fold-out crew bunks, three "
   "high; most are folded flat against the wall with strapped crates and sealed cases lashed into them as stowage, while two or three are "
   "still made up with thin mattresses and folded grey blankets. Steel lockers below the racks. One heavy round-cornered bulkhead hatch "
   "stands open in the short end wall. The compartment is obviously used more for storage than for sleeping.",
}

# Per-room aspect ratio. In true 2:1 isometric every floor projects to a 2:1 diamond, so the
# ratio is set by how much wall height there is relative to the floor: small rooms need a squarer frame.
ASPECT = {
 'control': '16:9', 'missile': '16:9', 'bunks': '16:9', 'eng_lower': '16:9', 'eng_upper': '16:9',
 'mess': '3:2', 'berths': '3:2', 'junction': '3:2', 'thermal': '3:2', 'utility': '3:2',
 'stateroom': '4:3', 'airlock': '4:3',
}
MAX_INFLIGHT = 8


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


def submit(n, tag):
    r = sh(['image-to-image', 'create', '--ai-model', 'gpt-image-2', '--reference-image-urls', REFS,
            '--aspect-ratio', ASPECT.get(n, '16:9'), '--async', '--output-schema', 'v1', '--format', 'json',
            '--no-update-check', '--prompt', HEAD + ROOMS[n] + TAIL])
    try:
        return json.loads(r.stdout)['result']['task_id']
    except Exception:
        return None


# Work queue: keep at most MAX_INFLIGHT tasks pending so the queue limit never rejects a submit.
queue = []
for a in sys.argv[1:]:
    n, k = a.split(':')
    for v in range(int(k)):
        queue.append((n, f'{n}_v3{"abcdef"[v]}'))

inflight, done, failed = {}, [], []
while queue or inflight:
    while queue and len(inflight) < MAX_INFLIGHT:
        n, tag = queue.pop(0)
        tid = submit(n, tag)
        if tid:
            inflight[tag] = tid
            print(time.strftime('%T'), 'submitted', tag, flush=True)
        else:
            queue.append((n, tag))   # queue was full; try again after the next poll
            break
    time.sleep(12)
    for tag, tid in list(inflight.items()):
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
                done.append(tag)
                print(time.strftime('%T'), 'DONE', tag, flush=True)
            del inflight[tag]
        elif st in ('FAILED', 'CANCELED'):
            failed.append(tag)
            print(time.strftime('%T'), 'FAILED', tag, flush=True)
            del inflight[tag]
print('ALL DONE', len(done), 'ok,', len(failed), 'failed', failed)
