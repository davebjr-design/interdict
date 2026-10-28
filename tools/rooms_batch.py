#!/usr/bin/env python3
"""Create image-to-image tasks for every ship room (docs/room_art_standard.md language). Usage: rooms_batch.py [room ...]  -> writes ids to design/assets/meshy_output/rooms/ids.json"""
import json, os, subprocess, sys
ENV = dict(os.environ, NODE_USE_ENV_PROXY='1', NODE_EXTRA_CA_CERTS='/root/.ccr/ca-bundle.crt')
M = ['npm', 'exec', '--yes', '--package=meshy-cli@0.4.0', '--', 'meshy']
OUT = '/home/claude/interdict/design/assets/meshy_output/rooms/ids.json'
REFS = 'design/assets/engineering_room_src.png,design/assets/mess_room_v2_src.png'
HEAD = ("The first image is the style reference and the second image is the lighting and detail reference. Draw a different room in exactly the same style: ")
TAIL = (" Wide floating isometric room cutaway (floor plus two back walls), true 2:1 isometric camera, same angle and scale feel as the references. "
 "Lighting standard: even neutral mid-dark base lighting from the upper left with soft ambient occlusion and readable floor detail; light comes only from small distinct fixtures, "
 "4 to 6 warm amber recessed strip lights in the walls and under counters and small cool cyan indicator lamps on doors and consoles; no strong colored spotlights, no light shafts, no baked glow halos, no fog. "
 "Hand-painted stylized sci-fi, muted charcoal and deep teal metal, worn orange accents. Plain solid flat magenta (#FF00FF) background outside the room, no gradients, no shadow on the background. "
 "Keep two blank flat wall panels, two clear empty shelf or desk tops, and one clear empty floor patch. No people, no posters, no text, no clutter.")
ROOMS = {
 'bridge': "the ship's BRIDGE, a large room. A big forward viewport window on the back-right wall showing stars, a raised captain's chair in the middle, a helm console and a tactical console in front of the window, a small round pedestal with an empty glowing ring for the ship AI, two more command seats with dust sheets over them, a navigation console on the left. A doorway in the back-left wall and one in the front-facing side wall.",
 'thermal': "the THERMAL MANAGEMENT room, a medium room. Rows of coolant pipes and heat exchangers along the back walls, a large empty square mounting cradle in the middle of the floor where a radiator unit would be fitted, a workbench with an empty clear tabletop, a pressure gauge panel. A doorway in the back-right wall.",
 'sensors': "the SENSORS AND ECM room, a medium room. Banks of dark monitor consoles with empty screens along the back walls, a rack of electronic countermeasure units, a clear mounting plate in the floor where an antenna array would be fitted, two empty operator chairs, a headset hook. A doorway in the back-left wall.",
 'weapons': "the TACTICAL AND WEAPONS bay, a large room. Three closed missile launch tubes in a row along the back-right wall with a loader rail overhead, plain missile racks with three kinds of plain warhead crates, a fire control console with an empty clear desktop, an empty square mounting plate in the floor for a weapon module. A doorway in the back-left wall.",
 'stores': "the SUPPLY STORES, a small room. Floor-to-ceiling shelving full of plain crates and labeled bins along the back-left wall, a quartermaster's desk with an empty clear top and an empty clear shelf above it, a tidy stack of ration boxes, a ladder. A doorway in the back-right wall.",
 'captain_cabin': "the CAPTAIN'S CABIN, a medium-large room, simple and bare. A single bunk with a plain blanket against the back-left wall, a desk with a terminal and an empty clear tabletop, a small round table with two chairs, a locker, a round porthole window on the back-right wall, an empty clear shelf above the desk. A doorway in the back-right wall.",
 'officer_cabin': "a shared OFFICER CABIN, a small room split into two mirrored sides. Two single bunks, one against each back wall, a small desk with an empty clear top and an empty clear shelf on each side, a locker each, a clear rug-sized floor patch between the two sides, a single door in the back-right wall.",
 'bunk_room': "a CREW BUNK ROOM, a large room. Four double-stacked bunk frames, two along each back wall, with plain mattresses and folded gray blankets, lockers at the foot of each bunk, a small central table with stools, an empty clear tabletop. A doorway in the back-left wall.",
 'head': "the crew HEAD (bathroom), a small room. Three toilet stalls with doors, a row of sinks with mirrors on the back-left wall, a shower stall, a floor drain, a doorway in the back-right wall. Clean and plain.",
 'junction': "a ship CORRIDOR JUNCTION, a small square room with four doorways, one in each of the four wall segments, thick pipes along the ceiling edge, a floor with yellow guide arrows, an empty blank wall panel for a deck plan board, a fire extinguisher cabinet.",
 'cargo': "the CARGO AND SALVAGE BAY, a very large room. Stacked cargo crates and tied-down containers, a salvage sorting table with an empty clear top, a cargo lift platform in the floor, a wall rack of twelve empty small module slots, a wide loading door in the back-right wall and a doorway in the back-left wall.",
 'airlock': "the AIRLOCK, a small room. A heavy round inner door and a heavy round outer door on the two back walls, a bench, a row of empty hooks and suit lockers, hazard stripes on the floor, a pressure gauge panel.",
 'sickbay': "the dormant SICKBAY, a small room. One medical bed with a dust sheet, a closed supply cabinet, a wall panel with an empty medical scanner mount, a small sink, an empty clear shelf. Quiet and tidy, a doorway in the back-right wall.",
}
def main():
    names = sys.argv[1:] or list(ROOMS)
    ids = json.load(open(OUT)) if os.path.exists(OUT) else {}
    for n in names:
        prompt = HEAD + ROOMS[n] + TAIL
        r = subprocess.run(M + ['image-to-image', 'create', '--ai-model', 'gpt-image-2', '--reference-image-urls', REFS, '--aspect-ratio', '3:2', '--async', '--output-schema', 'v1', '--format', 'json', '--no-update-check', '--prompt', prompt], capture_output=True, text=True, env=ENV, cwd='/home/claude/interdict')
        try:
            ids[n] = json.loads(r.stdout)['result']['task_id']
        except Exception:
            print(n, 'FAILED', r.stdout[-200:], r.stderr[-200:]); continue
        json.dump(ids, open(OUT, 'w'), indent=1); print(n, ids[n], flush=True)
main()
