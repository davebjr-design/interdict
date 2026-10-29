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
- Mess v2 (Meshy image-to-image, 12 credits, task 01a18406-5349-72cd-9233-63fa0dd48442): same layout, lighting standard applied (docs/room_art_standard.md), magenta background keyed to alpha (`design/assets/mess_room.png`, source `mess_room_v2_src.png`). Mess grid is 13 x 13 cells at Engineering's cell size. Doors: Engineering right-wall door to Mess left door; Mess right door to corridor (not built).
- Light flicker is coded in the demo (patterns: steady, pulse, reactor, blink, flicker, fault), not generated. Meshy has no 2D animation tool in this CLI.
- Engineering's amber "hatch" became the room's door; the coupling inspection moved to the manifold by the tanks.
- Depth occlusion (2026-10-28): furniture is part of the room image, so a character standing behind a table looked like standing on it. Fix: each room lists props (footprint cells plus height); when an entity stands behind a prop, the prop's silhouette (footprint hull raised by its height) is redrawn from the room image over the entity. Standard for every room: list the props with their cell footprints and heights next to the blocked cells. The orange outlines appear with Show walk grid.

## 14. Room art batch (2026-10-28)
13 rooms generated with the lighting standard (Meshy image-to-image, gpt-image-2, 12 credits each, 156 total): bridge, thermal, sensors, weapons, stores, captain_cabin, officer_cabin (template for the three shared cabins), bunk_room (template for three bunk rooms), head, junction, cargo, airlock, sickbay. Keyed images: `design/assets/rooms/<name>.png` (magenta keyed to alpha; magenta sources stay local and git-ignored). Prompts: `tools/rooms_batch.py`. Task IDs: `design/assets/meshy_output/rooms/ids.json` (git-ignored).
- Equipment mounts are visible and empty: Thermal has a square cradle (SINK), Sensors a floor plate (SENSOR), Weapons a floor plate (WEAPON), Cargo a module wall rack. Drive mount stays in Engineering.
- Staging areas are present in every room: blank wall panels, clear shelf and desk tops, a clear floor patch.
- Next: calibrate each room's scale from its door height (Mess: door about 60 world units), choose its grid size N from floor width, define blocked cells, props with heights and door links, then add a deck-plan map so doors connect. Pair the three shared cabins and three bunk rooms by re-dressing the template (overlay layers).
- Meshy limits how many tasks can queue at once (about 10 pending on the current plan).

## 15. Connected slice and deck plan (2026-10-28)

**Shape.** The ship is long and thin, like a submarine: one fore-aft spine, rooms strung along it, short branches off the spine. Aft is left on the deck plan, fore is right. The plan is drawn in the demo as a minimap (bottom left) with the current room highlighted.

**Spine, aft to fore:** Engineering, Mess, Junction, Bridge. Every step along the spine leaves through a back-right wall door and enters through the next room's back-left wall door, so the walking direction is the same all the way and the ship reads as one line.

**Branches (art exists, not wired yet):** Thermal off Engineering; Stores off the Mess; the crew passage (cabins, bunk rooms, head, sickbay) off the Junction, through its second left-wall door; Sensors and Weapons off the Bridge. The Junction is the hub: aft door to the Mess, crew passage door, forward door to the Bridge.

**Door links in the demo**

| From | Door | To | Arrive |
|---|---|---|---|
| Engineering | right wall, cells 7-9 | Mess | (0,4) |
| Mess | left wall | Engineering | (8,1) |
| Mess | right wall | Junction | (0,6) |
| Junction | left wall, far door | Mess | (12,1) |
| Junction | right wall | Bridge | (0,5) |
| Junction | left wall, near door | crew passage | not built |
| Bridge | left wall | Junction | (5,1) |

**Per-room scale.** Each room image carries its own scale k (world units per image pixel), set so a door is about 60 world units tall. Mess and Bridge: k 0.362, 13x13 cells. Junction: k 0.296, 9x9 cells (a smaller room whose doors are big in the image). Cell size stays about 39 world units, so the captain looks the same size everywhere.

**Still to do:** wire the branch rooms, repeat the officer-cabin and bunk-room art for the three cabins and three bunk rooms, add equipment mounts, then damage and style overlays. The bridge has a second door on its front wall that cannot be reached from the camera angle; leave it for a later camera option.

## 16. Submarine pass: Junction and Bridge redone (2026-10-28)

Brief: `docs/room_art_brief_v2.md` (no windows, no directional markers, no placards or lettering; pressure-hull look). Generator: `tools/rooms_v2.py`. Two variants each were generated; all four came back clean (no windows, arrows or text). Chosen: `bridge_v2` (variant b: tight, four recoil chairs, folded chart table, blank wall display, central AI pedestal) and `junction_v2` (variant b: three heavy bulkhead doors, red fire locker, strapped crate, bare floor with one hatch plate). The old `bridge.png` and `junction.png` are superseded.

**Scale (so the captain and crew look right everywhere).** Each room image has its own k (world units per image pixel). The captain's head reaches the top of a door arch in the Mess, so the new rooms were set so the same is true there. Bridge: k 0.235, 8x8 cells. Junction: k 0.185, 7x7 cells. Mess: k 0.362, 13x13. Because the new rooms draw doors much larger relative to the room, they are physically small (the bridge is about 8 cells across), which is on purpose; on the 1280x720 stage they fill about half the width. A per-room camera zoom is possible later but would make the crew look bigger in small rooms, so it is not done.

**Note on the floor shape.** The generated images are not a perfect 2:1 diamond; the walk grid is fitted by corner points (T, R, L) per room, found by overlaying a labeled grid (scratchpad `ov.py` approach: draw the grid on the image, adjust until the wall base and door sills line up).

**Next:** regenerate Engineering and Mess in the same pass for a consistent set, then the branch rooms.

## 17. Room size on screen and rectangular rooms (2026-10-28)

Dave: the cramped feel is right but the rooms look artificially small on the stage; and should rooms be long and narrow like a submarine?

**Done: per-room camera zoom.** Each room has a `zoom` (Bridge 1.45, Junction 1.7, others 1). The whole scene, crew included, is scaled together, so the captain-to-door proportions stay right while the room fills the stage. Mouse picking and the fade overlay account for it.

**Done: rectangular grids in the engine.** A room can now set `Ni` and `Nj` (cells along each axis) instead of a square `N`. Existing rooms are unchanged.

**Proposed: long, narrow rooms in the next art pass.** Generate rooms as about 2:1 or 3:1 rectangles with the long axis along the ship (the spine) and doors on the short ends, so walking through a room is walking down the ship. Rooms that are naturally wide (Mess, Engineering) can be 2:1; passages, bunk rooms, cabins, head, thermal and sensors 3:1 or more; the Junction stays square. Prompt addition: "a long narrow room about three times as long as it is wide, long axis running from the back-left wall to the front-right, doors in the two short end walls". Generated art may not follow the ratio exactly, so expect to pick from variants.

## 18. Doorway fit and stepping through hatches (2026-10-28)

- Crew sprites are scaled 0.9x globally (`CHAR`) so a person is about 90% of a door's height.
- Each door has a `wall` tag ('i' = back-left wall, 'j' = back-right wall). Leaving a room, the person walks to the wall plane and out through the opening, clipped to the opening and darkened, then the screen fades. Arriving, the reverse: they step out of the opening and into the room. Input is locked during the step.
- Answer to "continuous room or hallway with doorways?": see section 19.

## 19. Spine corridor and scrolling camera (2026-10-28)

**Layout decision (answer to "one continuous shot, or a hallway with doorways?").** A hallway with doorways. The ship is a tube, so a long spine corridor is one scene and compartments are separate scenes entered through hatches (with the step-through animation). The corridor is the thing you walk; rooms branch off it. The earlier Junction room is retired from the slice (art kept in the repo); the spine takes its place.

**Spine corridor** (`assets/rooms/spine_v2.png`, variant c of three, about 5:1): aft hatch at the left end to Engineering; three hatches along the long wall: Mess, crew passage (placeholder), Bridge at the forward end. Rooms hang off one side in the cutaway; the other side (stores, thermal, sensors, weapons) will connect later. Walk grid is 15 x 3 cells.

**Engine additions:** scrolling camera (`scroll: true`) that follows the captain, clamped to the room image with a 30-unit margin; bilinear floor mapping (`B` corner) because generated corridor floors are trapezoids, with Newton-step click picking; deck-plan minimap redrawn as a spine with branches.

**Wiring:** Engineering door -> spine aft hatch; spine Mess hatch <-> Mess left door; spine Bridge hatch <-> Bridge door; Mess right door is a placeholder (stores). Spine k 0.29, zoom 1.75.

**Next:** regenerate Mess and Engineering in the long/narrow submarine style with the corridor as the style reference; branch rooms (cabins, bunks, head, sickbay) as long narrow rooms with doors on the short ends.

## 20. Hull layout revision 2: two decks, no corridor (2026-10-28)

Settled with Dave. Schematic: `design/ship_schematic.html`. This supersedes the spine-corridor layout in section 19.

**Shape.** Two decks, both 76 m of pressure hull, about 10 m beam, 100 m overall. Compartments chain end to end through bulkhead hatches; there is no corridor. Decks must sum to the same length, which is what makes the map read.

| | Fore to aft |
|---|---|
| Upper | Control room (16) · Junction (8) · Missile compartment (26) · Thermal (8) · Engineering upper (18) |
| Lower | Officer berths (10) · Mess and galley (14) · Crew bunks and tube bases (26) · Engineering lower (26) |

Side rooms (dead ends): CO's stateroom off the aft end of control; boarding airlock off the junction; utility (head, showers, laundry, dormant sickbay) off the mess.

**Vertical.** Two ladders: junction down to the mess, and engineering upper to lower. That makes a circuit of about 150 m on foot, so deck-plan click-to-travel is required, not optional. Engineering is two scenes drawn as one space: the reactor casing holds the same plan position in both, seen from the top through the upper grating and from the base below; the ladder lands in the same spot.

**Weapons.** 24 missile tubes in two rows of 12. Twelve are live, each holding six missiles racked around a central handling hub: 72 missiles, one tube per salvo, twelve salvos of six. The other twelve are racked with salvage canisters, which gives the ship its cargo hold and explains why 28 crew fly this much hull. Missiles are 0.35 m by about 4 m in a 1.2 m tube, much smaller than an ICBM. Close range is a 65 m coil gun along the keel, breech and slug magazine at the forward end of lower engineering, muzzle at the bow. Fire control is in the control room, so there is no separate weapons bay.

**Heat.** Sink loops run the whole hull, dorsal panels and keel runs. Thermal control is Dace's compartment on the upper deck; the sink machinery sits below it in the forward third of lower engineering.

**Cost.** Twelve scenes. All existing room art (bridge, mess, junction, spine corridor, engineering) is the wrong proportion and gets regenerated as long narrow compartments, about 12 credits each. junction_v2 and spine_v2 are shelved, possibly reusable as a derelict interior later.

## 21. Crew, Pell's architecture, and tube reloading (2026-10-28)

### Main cast only
Six aboard, no ambient crew (see `docs/crew_roster.md`, revised). Visitors arrive by story and are temporary. Officer movement between hunts is **scripted**, not simulated: each compartment has a set of posed cells, and a ship state picks who is where. No schedules, no needs, no crowd AI.

### Pell is firewalled, and the firewalls are the mechanic
Dave's framing: closer to the Fable morality meter than to a skill tree. Lowering a firewall gives the player capability at a moral and narrative cost, and the drift is gradual and visible.

**Make it architecture, not a meter.** Pell's reach is physical and you can see it as you walk:

- **Core pedestal**, control room, attack center. A short squat pedestal with a glowing cyan ring. Already in the art direction and in the current bridge art.
- **Overhead speaker grilles**, every compartment. Pell's *voice* is never gated. This is also what keeps empty rooms from being silent, which matters at six crew.
- **Node panels**, one per compartment. A small recessed wall panel with a ring at chest height. Dark and unlit where Pell is firewalled out; lit cyan where he has been cleared in. Lowering a firewall lights that compartment's node, and the player can see how far Pell has spread by walking the ship or by looking at the deck plan.

So: **voice is ungated, action is gated.** Pell can always talk. What he can *do* in a compartment, and in some compartments what he can *sense*, depends on whether that node is lit. "I cannot see in there, Captain" is available as a line early and stops being available later, which is the drift made audible.

This fits Dave's standing rule that there is always a calm option at a cost: keeping the firewalls up is the calm path, and it costs capability rather than ending the run. There must be a viable low-Pell route through the game, harder but winnable, or the mechanic becomes a forced march.

Open: Pell's gender. "Hides a larger mind" reads well with a voice that does not settle into one, so leaving it ambiguous is a live option rather than an omission.

### Missile tubes are revolvers, reloaded only at dock
Each live tube is a rotary magazine: six missiles racked around a central handling hub, fired in sequence or as one salvo. Twelve live tubes, 72 missiles, one tube per salvo, twelve salvos of six.

**Reloading is a dockyard job and cannot be done underway.** Six crew could not handle 72 missiles in flight, and the carousel has to be struck down and refilled from outside the pressure hull. This is explicit so it never becomes a plot hole, and it gives the hunt layer a hard resource ceiling per sortie: twelve salvos, then the coil gun, then home.

The other twelve tubes are racked with salvage canisters and are the cargo hold.

## 22. Compartment art, revision 3 (2026-10-28)

All twelve compartments generated from `tools/rooms_v3.py`, two variants each (three for the control room), 22 tasks in one run through an eight-at-a-time work queue, about four minutes, zero failures. Every result came back clean: no windows, no markings, no lettering, no figures. Chosen variants are copied to `<name>_v3.png`; rejects stay on disk but are git-ignored.

| Compartment | File | Pick | Why |
|---|---|---|---|
| Control room | `control_v3.png` | c | Clearest three zones, end hatch reads as the exit, second door for the stateroom |
| Captain's stateroom | `stateroom_v3.png` | a | Fold-out bunk, fold-down desk, locker, visible door |
| Junction | `junction_v3.png` | a | Railed floor opening with ladder, overhead wheel hatch, both end hatches, fire locker |
| Boarding airlock | `airlock_v3.png` | a | Big round pressure hatch, three suits in lockers, bench, drain |
| Missile compartment | `missile_v3.png` | b | Two parallel rows of tube caps with a grated lane between, amber rings on the live tubes, overhead gantry |
| Thermal control | `thermal_v3.png` | a | Exchanger stacks, valve wheels, unmarked dials, hatches at both ends |
| Engineering upper | `eng_upper_v3.png` | a | Reactor dome above the grating plus a railed ladder opening |
| Engineering lower | `eng_lower_v3.png` | b | Clearest ladder rising into a ceiling opening; reactor base at the end |
| Officer berths | `berths_v3.png` | a | Three bunk nooks, lockers, clear walking lane |
| Utility | `utility_v3.png` | a | Two stall doors, basin and mirror, shower curtain, fold-down exam table and cabinet |
| Mess and galley | `mess_v3.png` | a | Galley counter, four bench tables, blank briefing panel, ladder down from a railed ceiling opening |
| Crew bunks | `bunks_v3.png` | a | Tube bases down the center, racks along the wall stowed with crates, clear lane |

**Lesson.** The "unlit, dead black glass, no glow" wording still did not stop the generator lighting the Pell node cyan. It is a small fixture, so the practical fix is to accept a lit node in the art and either key it out in code or treat the painted one as the cleared state and draw the dark state over it. Decide when the firewall mechanic gets built.

**Next:** fit walk grids. Each compartment needs its floor corners (T, R, L, and B for trapezoidal floors), cell counts from section 20, blocked cells, prop boxes with heights, door rects and stand cells. This is the serial part; generation was the fast part.

## 23. First fitted compartments: control, junction, mess (2026-10-28)

The junction loop is walkable: control room → junction → ladder down → mess → ladder up → junction → control. Tested headless; every walkable cell is reachable and the only exceptions are cells crew are standing on, which is correct.

**Fitted grids** (floor quads measured by overlaying a labeled grid on the art and iterating):

| Compartment | k | Cells | Floor quad T / R / L / B (image px) |
|---|---|---|---|
| Control room | 0.356 | 14 x 4 | (345,300) (1420,630) (45,395) (810,770) |
| Junction | 0.226 | 7 x 7 | (690,460) (1400,665) (-20,665) (690,920) |
| Mess and galley | 0.311 | 11 x 13 | (800,395) (1470,690) (25,700) (695,995) |

**The art does not match the planned proportions.** The generator draws whatever it likes: the control room came out about 3.5:1 in plan where the schematic says 2.3:1, and the mess came out nearly square where the schematic says 2:1. Rather than regenerate until the numbers match, grids are fitted to the art and the cell counts recorded here. The schematic in `design/ship_schematic.html` stays canonical for the fiction and for which compartment connects to which; it is not a measurement of the art. Nobody sees the hull from outside, so the discrepancy never shows.

**Engine additions:** `deck` tag per room; ladder doors (a door with `ladder` and no `wall` uses the plain fade rather than the step-through-a-hatch animation); the deck plan redrawn as two decks with link lines, the ladder shown as a vertical link between the junction and the mess.

**Fitting lessons.**
1. The generated floors are not true 2:1 isometric; they are flatter, roughly 3:1, and not perfect parallelograms. The bilinear quad (the `B` corner) is what makes them fit at all.
2. Three iterations per room is typical: read the corners off a coordinate ruler, render a labeled grid, correct, re-render.
3. **An NPC standing in a one-cell lane is a wall.** Fenwick at (1,6) sealed the galley aisle and cut the ladder's landing cell off from the rest of the mess. Always run the reachability check with crew placed, not just the blocked set.
4. Door stand cells must be checked against the blocked set; the mess aft hatch stand was inside a furniture block.

**Known rough edge:** the mess table prop hulls sit about a cell off the painted tables, so occlusion there will be slightly wrong until the strips are nudged.

**Next:** the remaining nine compartments, then click-to-travel on the deck plan.
