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
