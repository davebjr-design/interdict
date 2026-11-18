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
