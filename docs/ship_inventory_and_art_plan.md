# Ship inventory, swappable equipment and art plan (proposal, 2026-10-28)

Status: PROPOSAL for Dave to approve. Nothing here is built except the Engineering room demo and the captain sprite.

## 1. Rooms (the ship floor plan)
Built from the greybox walk (docs and `design/proto_shipwalk.html`) plus the design notes. One deck. Each room is its own isometric image (same camera as Engineering) joined by door transitions, with a deck-plan minimap for navigation and auto-walk. Room-by-room is easier to generate consistently than one huge ship image.

| # | Room | Purpose | Who / what happens | Slots it holds |
|---|---|---|---|---|
| 1 | Bridge | arrival, helm, command | Abara at helm, Pell node, command chair; "briefing is ready" call | Pell alcove, helm |
| 2 | Briefing room | table starts the hunt | briefing table scope | table |
| 3 | Engineering (built) | reactor, drive, heat sinks | Castellan; coupling inspection | DRIVE mount, SINK bank |
| 4 | Sensor and comms room | passive array, hails | Quill; hail console | SENSOR mount |
| 5 | Weapons bay / magazine | launch tubes (3), missile racks | Abara off duty; warhead crates (standard, EMP, flare) | WEAPON mount, missile racks |
| 6 | Mess / galley | social hub | Dace relational scene, meals | none (style showpiece) |
| 7 | Captain's cabin (larger) | the player's room | personal space, decisions in private | none (memento showpiece) |
| 7b | Head (crew, one to start) | small room, humor and ambient scenes; second head or captain's ensuite later | | none |
| 8 | Crew cabins x2 | two officers each, one side per officer | shared cabin template, mirrored sides, each side dressed by its owner; mementos | none |
| 9 | Cargo hold and salvage bay | salvage kg, module rack, loot sorting | after-action loot appears here | module rack |
| 10 | Airlock | docking, boarding | derelict salvage | none |
| 11 | Sickbay | later (crew injury is deferred) | | |
| 12 | Corridors and junctions | connectors | | |
| 13 | AI core (optional, later) | Pell integration made visible | | |
Also needed outside the walk: a ship profile cutaway for the space-dock equipment screen (Silent Hunter style) with the four slots drawn on it.

## 2. Swappable equipment (16 components, 4 slots, 3 makers)
Each slot is a standard mount (fixed footprint and anchor point in the room image). A part is a separate transparent sprite placed on the mount, so swapping is just drawing a different sprite.
- **Tier = size:** light small, medium mid, heavy large and bulky.
- **Maker = visual language and palette (proposal):** Orrin (light, recon): sleek, pale teal-white, thin lines. Vask (heavy, battleship): dark gunmetal with deep red marks, armored. Halden (medium, freighter and station): boxy ochre industrial, hazard striping.
- **Set bonus and friction made visible:** matching makers look like one coherent set; mixed makers show patch cables, adapter plates and mismatched paint. Friction becomes something you can see.
- **Parts per slot:** DRIVE (Wisp, Maul, Plod, Anchor thrusters); SINK (Fin radiator, Bastion radiator, Haul coil, Reservoir); SENSOR (Whisper array, Fire director, Cargo scanner, Station array); WEAPON (Dart rack, Lance battery, Hauler tube, Fixed station mount). 16 sprites in all.
- **Modules (12 small buffs):** shown as chips in a rack in the salvage bay, not modeled one by one at first.
- **Damage states (later):** scorch, sparks and off-lights as overlays on each slot.
- **Production:** each part can be a Meshy static prop rendered to a sprite through the same sprite renderer as the captain. Rough cost about 30 credits per part (about 500 for all 16; balance is 1,070). Risk: lighting and style must match the painted rooms, so test one part first.

## 3. Leadership style changes the ship (Dave's idea; my view: yes, with guardrails)
Loose leadership: messier, more character (art on the walls, a dartboard, mismatched mugs). Tight leadership: clean, orderly, polished, sterile.

Why it works: it makes the player's choices visible in the place they spend time, with no stat attached.

Guardrails:
- **Keep it expressive, not a score.** If one style is better, it becomes forced min/maxing. Neither style should have a mechanical advantage; at most flavor in dialogue.
- **Make it drift slowly** from clear choices (relational and command decisions), with hysteresis so the ship does not flicker, and ideally never feel like a good/evil bar. Keep it separate from the Pell integration meter.
- **Build it as layers, not whole repaints.** Painting 3-5 full versions of every room is expensive and hard to keep consistent. Instead each room is a bare, neutral base plus two independent overlay layers: a CHARACTER layer (decals, art, clutter, personal items) and a POLISH layer (clean labels, matched panels, uniform lockers, status boards, shine). Both vary in 5 steps (1 spartan-tight, 2 tidy, 3 lived-in, 4 cluttered, 5 chaotic and homey). The base should be semi-bare so "tight" is a polish overlay, not removal.
- **Companion mementos are a third layer:** each cabin has memento slots (a shelf of 3-4 items, a wall piece, a floor item) that fill as that companion's sub-missions are completed (Outer Worlds style).
- This gives a lot of variety from a small asset set: shell x style layers x mementos x equipment.

## 4. Art staging standard (applies to every room image and model)
So any room can be dressed later, every room must be generated with these CLEAR zones. Posters and decals are flat images that I skew onto wall slots in code, so decorations can be cheap flat art, while 3D objects come through the sprite renderer.
- At least 2 plain wall panels (about 1.0 x 1.5 m each, one per back wall if possible), blank and without baked text.
- At least 2 clear horizontal surfaces (shelf, desk or table top, about 1.2 m wide), clear of baked clutter.
- At least 1 clear floor patch (about 1.5 x 1.5 m) for a rug or crate.
- Cabins: add a bulletin board or locker door, a 3-4 slot trophy shelf, a bunk wall and a desk.
- Per room a small data file lists each slot: id, type (wall-left, wall-right, shelf, desk, floor), anchor point and corner points in the image, and size.
- Prompt wording for generators: "keep two blank wall panels, two clear shelf or desk tops and one clear floor patch; no posters, no clutter, no text baked in."
- Base rooms: no baked-in personal items; neutral lighting; same camera, scale and wall height as Engineering.

## 5. Proposed next room: the Mess
Why: same footprint as Engineering (consistent scale), a small, simple room; hosts the Dace relational scene; and it is the best showpiece for the style layers (dartboard and mismatched mugs versus tidy rows and a polished table). It also tests the door transition and the staging slots without the complexity of the Bridge.
Order after it: a corridor junction (joins Engineering and Mess), then the Captain's cabin (memento showpiece), then the Bridge, the Sensor room and the Weapons bay (which need equipment overlays).

## 6. Open questions for Dave
1. Individual cabins for each companion (recommended, one template dressed four ways) or one shared crew quarters at first?
2. OK to give each maker a color language (Orrin teal-white, Vask gunmetal and red, Halden ochre)?
3. Start with the Mess?

## 7. Decisions from Dave (2026-10-28)
- Maker color languages approved (Orrin teal-white, Vask gunmetal and red, Halden ochre).
- Tight/loose is aesthetic and narrative only: it tracks NPC relationships and plot, not gameplay buffs.
- Base plus overlay layers approved.
- Cabins: two small cabins, each shared by two officers (one side each), plus a larger captain's cabin. One or two heads.
- Damage should show graphically and be room and component specific. Style should drift.

## 8. Damage display plan (proposal)
Third overlay layer, independent of style layers and equipment sprites.
- Every room gets named damage zones: one per equipment mount plus 3 room-level zones (wall panels, ceiling and lights, floor). Zones are listed in the same per-room data file as the art staging slots.
- Each zone has a state: 0 clean, 1 scuffed or flickering, 2 damaged (sparks, scorch, venting), 3 disabled (dark, dead panel, hazard tape).
- Overlays are shared decals (scorch, crack, spark, steam, leak, patch plate, hazard tape) placed at zone anchors, so the library is about a dozen images reused in every room. Lighting damage is a separate dim or flicker mask over the room, which is why base rooms are rendered with neutral lighting.
- Equipment parts do not need damaged variants; zone overlays go on top of the part sprite.
- Source of damage: hunt events write to zones through a lookup (heat redline hits Engineering sink zone, sensor hits hit the Sensor room, a near miss shakes the bridge and scuffs the nearest wall). Keep it cosmetic plus the effects the hunt already has.
- Repair is an underway mechanical mini-mission (go inspect, fix). Leftover patch plates stay after repair as scars, which feeds the style layers.
- No-stress rule: damage is visible and recoverable between legs, never a death spiral.

## 9. Style drift plan (proposal)
- One hidden tone value (loose to tight) plus a relationship value per crew member. Never shown as a meter.
- Story beats, dialogue choices and mission outcomes carry small tone nudges. Recent events weigh more (decay), so drift responds but slowly.
- A room reads from the blend that fits it: common spaces use ship tone, the bridge uses captain tone, each cabin side uses that officer's relationship and mementos.
- Hysteresis: a room changes style step only after tone passes the threshold by a margin, at most one step per leg, and only at rest points between legs. A line of dialogue or a small scene points it out ("someone hung a dartboard").
- Specific decor can be trigger-driven (for example the dartboard needs a loose tone and a good Dace relationship), so the ship tells story instead of only following a slider.
- Save state is small: one float and one number per crew member.

## 10. Crew beyond the core
Core cast: captain, Abara, Dace, Castellan, Quill, and Pell (no body).
- Recommendation: no permanent random crew at first. Small complement keeps relationships meaningful.
- Later: two or three ambient "hands" made from palette swaps of an existing body, with one-line barks and the odd small mini-mission.
- Visitors from derelicts (survivors, passengers, a prisoner) ride along for a few legs and leave at the next dock. This is a story hook and uses the spare bunk or sickbay.
- Cost: each new unique body is about 40 credits; palette swaps are free.
- Cabin pairing is a content hook, since roommates generate relationship scenes. Pairing is open (see open questions).

## 11. Open questions (updated)
1. Who shares a cabin? Suggestion: Abara and Castellan (odd couple) and Dace and Quill.
2. One head to start, with a captain's ensuite later?
3. Start with the Mess?

## 12. Update after crew roster (see docs/crew_roster.md)
- New room: Thermal Management (Dace's department). The SINK mount moves here from Engineering; Engineering keeps the reactor and DRIVE mount.
- New room: Supply and stores (quartermaster, supply crew, cargo and salvage bay nearby).
- Rooms for departments: Engineering, Thermal, Sensors and ECM, Tactical and Weapons, Astrogation and Helm (bridge stations), Supply/Mess/Maintenance, plus dormant sickbay.
- Berths: captain's cabin, three officer cabins (two sides each), three 8-rack crew bunk rooms, crew head.
- Empty stations and racks are visual story: covered consoles, empty chairs (no XO seat user, no chief of the boat), racks stacked with cargo. Handle with the style and damage overlay system, not extra base art.

## 13. Mess hall decisions (Dave, 2026-10-28)
- The Mess is scaled for about a third of the design crew (about 25 seats) and doubles as the briefing room, as on real submarines. The separate briefing room is dropped; the briefing table lives in the Mess.
- Mess is larger than Engineering, same camera and scale. Contents: galley serving line, lockers and water, four long tables with benches, a round briefing table with a floor projector ring.
- Mess art task (Meshy image-to-image from the Engineering art, task 01a183f4-498f-77aa-8ea5-a79b38177416, 12 credits) is generated, then cleaned, then wired into a demo.
- The scripted tutorial hunt waits until the ship interior model works; the tutorial ship then derives from it.
- Mess v1 generated (12 credits): `design/assets/mess_room_v1.png`, 1536 x 1024, black background, crisp (no dithering, unlike the Engineering source). Darker and cooler than Engineering, so it needs a warmer pass or an amber light layer. Two doorways, two blank wall panels, a clear floor patch; no clear shelf tops yet. Next: key the background, measure the floor grid and scale to Engineering's cell size, then a walkable demo.
