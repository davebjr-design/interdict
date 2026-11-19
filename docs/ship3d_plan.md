# 3D gameplay ship: plan and status (18 November 2026)

## Decisions (Dave, 18 November)
- First milestone: **walkable interior** (exterior stays a simple hull for now).
- Movement: **click-to-move, character follows, fixed per-room camera the player can orbit**; ladders move between decks (hybrid of click-to-move and room camera).
- Scale: **shrink the 3D control room props to about 0.8** (CIC floor 9.6 m); hull, cell and ring numbers stay locked.
- Rooms: **procedural shells from the spec plus a few Meshy props** (couches, reactor, tube bases); Meshy credits only for props, not whole rooms.

## Built (first slice): `web/ship3d/ship3d.html`
- All 12 deck spaces generated from one data table that mirrors the spec's room schedule (A1-A3, B1-B3, T, C1-C3, D1-D2), standing upright with the bow up and floors on the aft face.
- Two wall-built shafts, port and starboard, with a 1.2 m door ring in every room.
- Click the floor to walk; drag to orbit; wheel to zoom; pick a deck to walk to the shaft door, climb and step out. Ship view shows the full 140 m cutaway.
- Bay T: 12 tube stations (24 tubes) from the skin, tube-load colours, 3 m ventral gallery strip.
- Placeholder props per room kind; rooms are simple shells.

## Next steps (in order)
1. Fold the live control room (`web/cic3d`) into the spine as deck A1, scaling props about 0.8 to match the 9.6 m floor.
2. Hull exterior built in code to the dimension table (cylinder, domes, bone bands, 24 caps in two rows of 12, radiator channels); Meshy engine bell and other parts later.
3. Real wall detail: shaft doors that open, the airlock chamber off B2, the 2 m ring visible through service hatches, tube bases in bay T.
4. Walk-camera polish: snap to each room on entry, collision with props, ladder animation, brace and thrust gravity cues.
5. Hook the walk to the story layer (dialogue runner, moments) once the Ink runner exists.
6. A small Meshy prop budget: couch, reactor casing, tube base, probe cradle, docking collar (remesh to game size first; the engine-bell GLB was 125 MB).

## Open
- Position of laser domes, mast well, docking collar, probe cradle and radiator channels along the hull is still schematic in the spec.
- Gravity cue: under thrust, down is aft (floor), at coast weightless; the spine currently always shows floor-down.

## Engine decision and Babylon.js spike (18 November)
- Stay on the web for a personal project (no Steam release). Keep the simulation headless; treat the renderer as swappable.
- `web/ship3d_babylon/` is a Babylon.js 7 port of the ship spine with the same room table and controls (click-to-move, orbit camera, shaft climb, ship view), PBR materials and an asset manifest (`assets_manifest.json`) with GLB slots.
- Slot loader checked: the Meshy engine-bell GLB loaded and was rescaled to its manifest size (3.2 m longest side) in place of the placeholder. The raw GLB is 125 MB and is NOT committed (`glb/*.glb` is gitignored); it needs a remesh and a smaller texture first.
- Known rough edges in the Babylon spike: floor shading shows faint banding in software rendering, and the translucent shaft cylinders show from inside. Compare against `web/ship3d` (three.js) before deciding which to keep.
- Babylon needs no account: bundled `babylon.js` (7.54.3) and the glTF loader are copied from npm.

## Meshy prop test (18 November): about 95 credits
Spent: remesh of the engine bell 5; couch, round hatch and revolver tube base 30 each (20 geometry + 10 texture at 2K).
- Raw GLBs were 36-125 MB. Free local pass (gltf-transform: simplify to ~15 percent, textures to 1024 WebP) brought them to 1.1-6.6 MB; they live in `web/ship3d_babylon/glb/` and are wired in via `assets_manifest.json`.
- In the Babylon spine: 4 couches and the shaft hatches in the CIC, 2 tube bases in bay T, the bell at the aft end. All slots load; each GLB is loaded once and instanced, rescaled to its manifest size in metres.
- Observations: geometry quality is strong (belts, bolts, hazard-stripe rims, brass); the couch came out as a two-seat bench (fine as a test); the tube base is a horizontal housing, not yet a six-pocket revolver drum; prompts can steer but exact counts and proportions are not reliable, so code-built shells stay the source of truth for scale and counts.
- Meshy task IDs: bell remesh 01a1f094-017e-7308-ab07-462c1511983b; couch 01a1f094-067f-749a-bbe7-604f545a224a / refine 01a1f097-753a-70dd-91f1-a273c9fa77a0; hatch 01a1f094-15d9-7192-90ec-e30d5c353ae0 / 01a1f097-7bef-7437-8d5b-8bdb4a1597b4; tube base 01a1f094-21c3-76a1-b886-4fb7f7b3b270 / 01a1f097-8120-74ee-a538-b40c665e11b1.

## "Make it feel alive" pass (18 November): 180 more credits, live station screens
Balance 3045 -> 2865 (six previews at 20, six 2K refines at 10).
- New Meshy props (all geometry and textures came out usable first time; local gltf-transform pass to 512-1024 px WebP, total GLBs now 11 MB): console, seated crew member, thermal pump tower, bunk rack, reactor casing, mess ring table. Task IDs: console 01a1f13d-54af-74cd-8d08-a5758213551c / refine 01a1f13f-3c90-7475-9c82-f494cacb1cb0; crew 01a1f13d-62bc-7605-9e52-130db43f284b / refine 01a1f13f-4843-70a4-a011-e0bebb435c9d; pumptower 01a1f13d-705b-77e0-9793-3e717662e238 / refine 01a1f13f-56d9-7217-be5b-ab1db88613de; bunk 01a1f13d-7e8d-75aa-8e3b-ec0f7aa9fcdd / refine 01a1f13f-5e1c-726f-a07a-5fa5001ce4a0; reactor 01a1f13d-916c-7687-bae9-bc8c980134d4 / refine 01a1f13f-6555-7137-a137-b68fd1764455; messtable 01a1f13d-a054-75bc-95ea-f2e45b88b963 / refine 01a1f13f-7230-7319-93c4-2a2b436f9381.
- Placement: CIC has five stations on the aft arc (console on the wall, seat, seated crew facing it); A2 bunks and a seated crew member; B1 mess table with two seated crew; C1 pump tower; D1 reactor with a pulsing core ring. The older couch, hatch and tube base GLBs were re-decimated (6 MB -> 0.3-0.7 MB each).
- Ambience: blinking wall LEDs (four colours, per-LED phase), pulsing ring lights and tube cue colours, crew breathing and sway, drifting dust motes in the current room, reactor and engine glow, nav strobes.
- Starfield, planet and sun behind the hull; exterior nod to ship form drawn only in ship view: bow ogive with mast and docking collar, laser dome, bone-white bands, tapered tail with four engine pods and plumes, four radiator panels each side with thermal stripes, 24 glowing dorsal tube caps (colour cues match the tubes). Positions are still schematic.
- Hotkeys (revised: two player cameras, orbit and over-the-shoulder; first person is now only the screen-zoom camera): 1 orbit, 2 over the shoulder, 3 ship view, WASD or arrows walk (Shift runs; relative to where the camera looks), Q/E deck down/up, Esc leaves a screen. First person did follow the character in code (checked headless); what was missing was keyboard walking, which is now in.
- Live station screens: the screens are generated, not art. The existing web/cic3d painters draw 1024x768 canvases from the running hunt (HuntRT, StationAdapter, Annunciator); web/ship3d_babylon/hunt/ holds copies of the engine and painters, with THREE stubbed so the painters run unchanged. Each canvas feeds a Babylon DynamicTexture on a plane over the console monitors (sensors, ID/TMA, engage/payload, thermal/damage, comms). Tap a screen to step up to it; its soft keys are live through hunt/ctl_bjs.js, which is the action dispatcher (can / order / run / activate) lifted unchanged from cic3d/interact.js lines 9-104 against a small CIC shim. Checked headless: hover highlight, guard lift via a real click.
- Not yet ported: radial menu, brace, annunciator lamps and hologram, hardware toggles and guard switches on the console model (the desk GLB has baked keys, not hotspots), audio, the per-station Auto / Hands-on switch UI. Hunt runs in the background whenever the page is open; screens only repaint while you are in A1.
- Hosted page is packaged by web/ship3d_babylon/build_hosted.py (GLBs become base64 .js because the artifact host will not serve .glb).
- Open: tune monitor overlay positions per console (they are placed by fraction of the model, one pair of offsets for all five); decide Babylon vs three.js (the three.js CIC still has the full interaction set).

## Deck plating and fading walls (18 November, evening)
- Floors and walls now carry generated normal maps: 1.2 m deck plates with chamfered seams, bolts, tread diamonds and dotted grip; wall panels with inset recess, vent slits, brass band and hazard marks. Brass coaming at the floor and a rim at the top of each wall.
- Each wall is 24 arc panels with ribs between them. In room view the panels that lie between the camera and the character fade to about 10 percent (only when the camera is outside the wall and the line of sight passes under the wall top), so the room is always readable from orbit or over-the-shoulder.
- The glowing squares were the wall status LEDs; they are now small annunciator strips (dark plate, three blinking LEDs) at the panel seams.
- CIC crew moved back onto the seats and dropped to floor level (feet were floating). Seating still approximate: the crew model's pelvis offset was tuned by eye.

## Exterior reshaped toward a submarine (18 November, night) - PROPOSAL, not yet in the hull spec
- Dave: the ship still looked like a rocket. Changes in the 3D only: blunt ellipsoid bow (no spike, no mast), tapered stern with a shroud ring and four cruciform tail planes (the four engine pods and big plumes are gone), and two broad flank sponsons (long ellipsoids, about 88 m by 7.5 m by 6.2 m, centres 8.6 m off the axis, overall beam about 23 m against the spec's 14 m).
- The sponsons hold the main heat-sink tanks (five per side, shown through the translucent skin) and the four radiator-blade channels; the eight blades (36 m by 6 m) stow flush and run out with V.
- Spec impact if accepted: beam and the "smooth teardrop, round section" line change; heat sink moves partly from the annulus into flank tanks (volumes, the lithium tank groups, the damage model and the sensor signature of the sponsons all need re-deriving); stair-shaft naming (port and starboard) vs the dorsal tube deck needs a check, since the 3D puts the shafts at plus and minus x and the tube columns at plus and minus z.

## Completeness audit and fit-out pass (18 Nov)

Audit of the 3D model against the hull spec room schedule:

| Spec item | 3D status |
|---|---|
| CIC, officer berths, array hall, mess, junction, thermal, sink, valve, reactor decks | present |
| Utility (heads, showers, laundry, sickbay), B3 | was an empty disc; now 3 stalls, 3 showers, 2 washers, sickbay cot and medical cabinet |
| Crew bunks, 24 racks in three pods of eight, bay T | was missing; now three pods (4 high x 2 columns) on alternating flanks |
| Ordnance gallery, bay T | now carries 9 spare warhead and probe canisters |
| Netted supply shelves between the tube columns (Dave's request) | six netted racks with crates in the aisle |
| Ladders (tube hall, stair shafts) | two full-height ladders up the tube hall (cosmetic); shaft ladders are still just the hatches |
| Mess seating for 28 | 5 seated crew now (was 2); the table is still one GLB |
| Boarding airlock off B2 (2.8 m x 4.2 m, six suit lockers) | NOT built |
| Galley crescent in B1 | NOT built |
| CO stateroom pod under the CIC hatch | stand-in cylinder in A2 only |
| Officer racks in A2 | three bunk GLBs stand for the six racks |

Open interpretation: "a little bit bigger overall... a few more, like it was built for a larger crew" was read as more crew places (24 bunk racks, more mess seats), not larger cells (cell radius stays locked at about 5 m). Confirm with Dave.
Axis check still open: the 3D puts the stair shafts at +/-x and the tube columns at +/-z; the spec says shafts are port and starboard and tubes sit on the dorsal line.

## Fit-out pass 2 (18-19 Nov, night): airlock, galley, stateroom, passive CIC monitors, player

Built (Babylon spine, `web/ship3d_babylon/`):
- Boarding airlock off the dorsal wall of the junction B2: **3.0 m long, not the 4.2 m in the hull spec** (a longer lock pokes through the 2 m annulus at this cell radius). Pressure door, six suit lockers, DC locker. The walking clamp lets the player enter the lock mouth only.
- Galley crescent (range, cold store, mess hall B1), captain's stateroom in A2 (bunk, desk, command chair) - sits in the officer-berth deck directly under the CIC hatch, the nearest sensible home; head, showers, washers, sickbay cot in B3; supply crates stacked in the tube hall; warheads in the ordnance gallery.
- Axes corrected to the spec: dorsal = -z (tube caps, airlock), port/starboard = +/-x (stair shafts, sponsons), ventral = +z (gallery). The earlier note "axis check still open" is closed.
- Crewed-station screens 46 percent larger (0.52 x 0.39 m to 0.76 x 0.57 m); the zoom distance fills the view with the screen, and the screen plane stands 8 cm proud of the baked console monitor so no mesh clips it. Verified converged zoom shots of Target ID, helm and annunciator: text readable, not mirrored.
- **Passive monitors** (six, CIC wall bank, 1.5 m wide): annunciator, helm, power bus, stores, crew, probes (`hunt/passive_screens.js`). Click to zoom like a crewed screen, read-only.
- Annunciator: 32 lamps derived from engine state in `web/annunciator.js` plus 8 more from `hunt/ship_systems.js`.
- `hunt/ship_systems.js` is **DISPLAY-ONLY and a proposal**: fusion cassettes (8, one per 21 min at 100 percent drive, one per breach-drive spool), 20 MW fission plant plus pod output on a power bus with named loads, cabin pressure/O2/CO2 (leak when hull below 40), lithium loop temperature (454 K base). Formulas marked `[proposal]` are mine, not the spec's; nothing feeds back into the hunt.
- Standing player avatar (Meshy, 178 KB) replaces the gold capsule; faces direction of travel; hidden in first-person screen view.

Meshy spend this pass: 14 props (preview 20 + refine 10 each = 420) plus the player (30) = about 450 of the 500 credits authorised. 25 GLBs total; 98 slots fill.

Known open: ladders in the stair shafts are still just hatches; the 31 m tube hall is long to walk at 3.2 m/s; radial menu, brace, audio and the autonomy-switch UI are not yet ported from the three.js cic3d.

### Sub-agent audit of the physical model (19 Nov) and what was fixed
Fixed: wall LED strips were random and are now state-driven (green normal, amber caution, red warning, cyan hunt running); V now fires the engine's real vent order and the exterior fins follow `S.vent.on`; a HUD alarm strip lists lit caution/warning lamps in every room (before, alarms only showed in the CIC); fusion pods 4 to 2 (spec); fission plant labelled 450 MWt / 60 MWe and now carries the bus (before, bus capacity wrongly grew with drive output); CO2 and cabin-air lamps made reachable under hull damage; cassette lamp labelled advisory (engine does not cut thrust at zero cassettes); airlock walkable width narrowed so the player no longer clips the suit lockers.
Still open (audit punch list): P1 prop collision in `clampIn`; tube hall racks and gallery unreachable (ladders cosmetic); airlock has no interaction and is 3.0 m not 4.2 m with no dorsal collar; no consoles in engineering/thermal; brace (B), alarm ack (Space), audio and radial menu not ported (the per-station Auto/Hands-on switch IS present as the comms screen's WHO IS DRIVING panel, so the earlier "not ported" note is stale); tube colour cues show two EMP and no flare; engine magazine split 54/3/3 vs spec 48/6/6; laser dome placed ventral not dorsal and no PD blisters; CIC ceiling flat 2.9 m vs spec dome; sponsons give about 23 m beam vs spec 14 m (unaccepted proposal); LINK BRK lamp is a deliberate stub.

### Collision and climb pass (19 Nov)
- **Collision:** solid props (consoles, couches, tables, bunks, galley and head fixtures, tanks, tubes, the reactor, the central hub and so on) register room-local boxes with a height range; the player is a 0.32 m disc and is pushed out of them. Keyboard walking slides along props. Click-to-walk now plans a route (A* on a 0.25 m grid, string-pulled) so the player walks around props rather than through them; a click on a prop walks to the nearest free spot. Door stand-points are never blocked; two CIC consoles that sit exactly at the hatch directions (stations 0 and 4) and the sink/valve tanks were left non-solid for that reason. The airlock mouth no longer forces a narrow strip across the whole dorsal half of the junction.
- **Tube-hall climb:** two ladders (z = -0.3 and 2.9) now work. Catwalk landings at 5, 15 and 25 m; R/F (or PageUp/PageDown, or the on-screen arrows) climb one landing; Q/E or picking another deck while on a landing climbs down first. On a landing the player walks the catwalk only; the shoulder camera switches to a close view from the clear side of the aisle. Landings give a vantage on the tubes, warhead spares and bunk pods; the flank racks and tube pairs themselves are still not walkable.
- **Shaft climb:** now eases down as it passes each deck (it was a constant-speed rise).
- **Camera bug fixed:** re-assigning `cam.target` each frame re-derived the shoulder camera's alpha/beta/radius from a stale position, so camera changes made during a frame were overwritten. Shoulder mode now copies its target in place only.
- Headless check: door-to-door walks complete in all 12 rooms with detours of at most about 0.3 s; ladder up/down verified through all landings.

## Airlock / collar, orbit camera, dust, controls port (Version 11)
- Airlock: 4.2 m lock, inner/outer hatch discs, hazard-striped collar with 12 bolts, status lamps, soft-dock tube node, vessel stub. State machine in hunt/airlock_sys.js (hatch 1.6 s, cycle 6 s, tube 4 s, interlocks, suit). Mission API: `SHIP_BJS.api.airlock.dock({id,label,p}) / arm({id,prompt}) / choose(i)`; listen to `airlock` CustomEvents (inner-open, outer-open, cycle-done, dock, undock, suit, board, look). Test panel in B2 near the lock mouth; keys H/J/C. The scripted boarding scene is still to be written on top of this API.
- Orbit camera: `cam.target = x` re-derives alpha/beta/radius and left the camera on the old deck; target is now changed in place (`copyFrom`), so the orbit follows the character to any deck.
- White dots were the dust motes; removed.
- Controls port from cic3d: B brace, T time x1/2/4, Space ack, K mute, Tab next contact, 1-3 answer a call, zoom-only letters (C L P O X R M U Y H Z F G, [ ]), call card, right-click radial menu on contacts, canvas shake, adapter events (calls, voice, toasts), status strip. Audio synth in hunt/audio.js.

## Named crew in the ship (Version 12)
- The crew from the 2026-10-28 Meshy run already exist as rigged GLBs (design/assets/meshy_output/crew/<name>/walk.glb, 40 credits each, no new spend). Pipeline per character: gltf-transform resize 1024 -> prune -> webp q85 (14.4 MB -> 2.0 MB), copy to web/ship3d_babylon/glb/<name>.glb, add a manifest entry (size_m = true height, Abara 1.72), place with `slot('<name>', fallback, parent, x, 0, z, {id, ry, ground:true})`.
- Abara placed standing at the CIC chart table. Rig is still in its A-pose; walk/idle clip not yet driven.
