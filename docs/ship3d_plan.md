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
- Hotkeys: 1 orbit, 2 first person, 3 room centre, 4 ship view, WASD or arrows walk (Shift runs; relative to where the camera looks), Q/E deck down/up, Esc leaves a screen. First person did follow the character in code (checked headless); what was missing was keyboard walking, which is now in.
- Live station screens: the screens are generated, not art. The existing web/cic3d painters draw 1024x768 canvases from the running hunt (HuntRT, StationAdapter, Annunciator); web/ship3d_babylon/hunt/ holds copies of the engine and painters, with THREE stubbed so the painters run unchanged. Each canvas feeds a Babylon DynamicTexture on a plane over the console monitors (sensors, ID/TMA, engage/payload, thermal/damage, comms). Tap a screen to step up to it; its soft keys are live through hunt/ctl_bjs.js, which is the action dispatcher (can / order / run / activate) lifted unchanged from cic3d/interact.js lines 9-104 against a small CIC shim. Checked headless: hover highlight, guard lift via a real click.
- Not yet ported: radial menu, brace, annunciator lamps and hologram, hardware toggles and guard switches on the console model (the desk GLB has baked keys, not hotspots), audio, the per-station Auto / Hands-on switch UI. Hunt runs in the background whenever the page is open; screens only repaint while you are in A1.
- Hosted page is packaged by web/ship3d_babylon/build_hosted.py (GLBs become base64 .js because the artifact host will not serve .glb).
- Open: tune monitor overlay positions per console (they are placed by fraction of the model, one pair of offsets for all five); decide Babylon vs three.js (the three.js CIC still has the full interaction set).
