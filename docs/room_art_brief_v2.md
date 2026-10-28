# Room art brief v2: the submarine pass (2026-10-28)

Source: David Gerrold's Star Wolf (Starhunt, Voyage of the Star Wolf) as the interior reference, plus Dave's notes. Interdict is a spaceship that is a submarine. Every room should feel like the inside of a pressure hull, not a starship set.

## 1. Hard rules (these override anything in docs/room_art_standard.md)

1. **No windows, no viewports, no starfields.** Nothing shows the outside. The bridge gets no window wall.
2. **No directional markers.** No floor arrows, chevrons, hazard-stripe direction cues, or painted lines that point anywhere.
3. **No informational placards.** No signs, labels, door plates, deck numbers, posters, warning stickers, or any lettering or numerals anywhere. Screens show abstract shapes only (bars, traces, dots), never text.
4. Keep the existing standard for everything else: iso camera, even neutral mid-dark light from the upper left, small amber strips and cyan lamps only, magenta (#FF00FF) background, staging areas (two blank wall panels, two clear shelf or desk tops, one clear floor patch), floor diamond clean enough to fit a grid.

## 2. What the hull is

- A cylinder of pressure bulkheads. Rooms are tight and low; walls curve slightly and are ribbed with frames every meter or so.
- Surfaces: scarred painted steel, bare plastic panels gone dull and yellowed, riveted seams, welded patches over old repairs. Faded, not dirty-for-effect. The ship is old and mass-produced, built for a bigger crew and run by a few.
- **Exposed services everywhere:** bundled cable runs, steel tubing, pipes with valve wheels and gauges (dials without numerals), conduit clamped to the ceiling and walls. Services run along the walls and overhead, not hidden.
- Heavy **round-cornered bulkhead doors** with wheel or lever dogs and thick gaskets, standing open or ajar. No sliding sci-fi doors.
- **Low ceiling feeling** even though we cut the near walls away: overhead pipes and cable trays visible along the back walls, low door heads, equipment crowded close to the walls.
- Floor: steel grating or diamond-tread plate, narrow, with small drain scuffs and wear paths. Raised sills at the doors.

## 3. Multipurpose and fold-away furniture (space is the scarcest thing)

- **Fold-out bunks that swing from the wall** (they double as recoil chairs), stacked two or three high, with a harness or strap folded against each.
- **Chart table or work table that pulls up from the floor** or folds from the bulkhead; fold-down seats; stowage in every gap.
- Lockers, cage racks and strapped crates fill dead space. Nothing is decorative.
- Everything is hard-edged and anchored: bolts, straps and cargo nets, nothing loose-looking.

## 4. Lighting and mood

- Same lighting standard as the Mess (even, neutral, mid-dark, upper left). Add a few **small caged lamps** and amber strips along the ceiling pipework.
- Combat state (later, drawn in code): the amber and cyan lamps swap to red. Art stays neutral so code can tint it.
- Smell and sound can't be drawn, so show them: a haze-free but visibly stale space, ozone scorch marks near machinery, condensation streaks on pipes, a few drip marks.

## 5. Room by room

| Room | What it must contain | Must avoid |
|---|---|---|
| Bridge | Consoles packed close around a central control pedestal, 3 or 4 recoil chairs with harnesses, a chart table folded up from the floor, one blank flat display panel on a wall (dark, abstract bars at most), overhead cable trays | Window wall, starfield, big open space, captain's throne on a dais |
| Engineering | Reactor housing, heat exchangers, pipe manifolds, catwalk grating, valve wheels, coupling manifold (staging spot) | Clean glowing sci-fi core; signage |
| Mess | Fixed bench tables (about 25 seats), galley counter with steel pots, fold-down seats, stowage racks overhead, briefing display panel (blank) | Restaurant look, windows, shelving clutter (Dave: not needed) |
| Junction | Four pipe-lined bulkhead doors around a small hub, overhead cable trays, a fire locker, a strapped crate, plain floor with one hatch plate | Floor arrows, signs |
| Thermal | Heat-sink tanks, coolant pipework, gauge clusters, a work shelf | Sci-fi glow |
| Sensors and ECM | Dense console stacks in a narrow space, antenna lead-ins, rack cabinets, two recoil chairs | Windows, big dishes |
| Weapons | Launcher breech or magazine racks, loader rails, ordnance cradles, strapped ordnance, one crew station | Any sky view |
| Stores and Cargo | Cage racks, strapped crates, cargo nets, a lift hatch, floor tie-down rings | Pallets without straps |
| Captain's cabin | One fold-out bunk, a fold-down desk, a locker, a small wall panel (blank) | Luxury, large bed, window |
| Officer cabin (x3) | Two fold-out bunks, one per side, a shared fold-down desk, lockers | Any decoration beyond a hook or two |
| Bunk room (x3) | Eight fold-out racks in two walls, lockers underneath, straps | Gaps wider than one person |
| Head | Steel fixtures, a shower stall with a curtain, a wash basin, a drain grate | Domestic tiles |
| Sickbay | Two or three enclosed medical bunks, a wall-mounted instrument rack, a fold-down exam table | Open ward, clinical white |
| Airlock | Heavy pressure hatch with wheel, suit lockers, a bench, a decon-style drain | Windows, signage |

## 6. Prompt text to paste into every room generation

> Isometric cutaway of a cramped interior room inside a submarine-style spaceship pressure hull, viewed from a fixed three-quarter overhead angle, back-left wall and back-right wall visible, near walls removed. Scarred painted steel and dull plastic panels, riveted seams, welded patches, ribbed hull frames, exposed cable bundles, steel pipes with valve wheels, caged ceiling lamps, steel grating floor. Low and crowded; equipment packed close to the walls. Even neutral mid-dark light from the upper left with only small distinct amber strip lights and cyan indicator lamps; no spotlights, shafts of light, halos or fog. No windows or viewports, no stars, no text, no numbers, no signs, no placards, no labels, no arrows, no floor markings of any kind. Two blank wall panels, two clear shelf or desk tops and one clear floor patch left empty. Room is on a flat solid magenta (#FF00FF) background.

Keep the room-specific list from section 5 as a second paragraph. Meshy mostly ignores "no X" phrasing, so the positive description (plain bare floor plating, plain painted wall panels) matters more than the negatives; check every result for windows, arrows and lettering before accepting it.

## 7. Process

1. Regenerate the Junction and the Bridge first (the two rooms that broke the rules). Both are in the connected slice, so calibration is already known; if the door positions shift, redo the corners and door rects.
2. Review with Dave, then batch the rest (Engineering and Mess included, for a consistent look). Reference images for style: the new Junction and Bridge once approved, not the old rooms.
3. Anything generated with lettering or arrows gets rejected rather than painted out, unless the fault is small.

## 8. Revision 2 additions (2026-10-28)

These apply on top of sections 1 to 7 and override anything that conflicts.

**Compartments are long and narrow.** The hull is a tube and compartments chain end to end with no corridor. Most rooms are between 2:1 and 4:1, long axis running fore and aft, with bulkhead hatches in the short end walls. Side rooms (CO's stateroom, airlock, utility) are small and squarish and are entered through a door in a long wall. Sizes are in `docs/ship_inventory_and_art_plan.md` section 20 and drawn to scale in `design/ship_schematic.html`.

**Every compartment is sealed.** There is no window anywhere on this ship, and the generator takes "sealed on all sides, nothing but more plating beyond" far better than it takes "no windows". State the enclosure positively first, then list the forbidden items.

**Two fixtures are now standard furniture in every compartment**, alongside the staging areas:
- A **Pell node**: a small recessed square wall panel at chest height with a ring in its center, dark and unlit. The game lights it in code when that compartment's firewall is lowered, so the art must leave it dark.
- A **speaker grille**: a round slotted grille set into the ceiling edge.

**No people, ever.** Crew are sprites composited at runtime. The six models are final and are not being regenerated.

**Generation notes.** `tools/rooms_v3.py` holds the current prompt. Three variants per compartment at about 12 credits each; the queue takes roughly ten at once, so a whole deck can be generated in parallel in a few minutes. The slow part is not generation, it is fitting each walk grid by hand afterward. Reject any result with a window, a marking or any lettering rather than painting it out.
