# Lessons for generating new locations (stations, other ships, derelicts)

Distilled from building the twelve-compartment player ship (sections 15-26 of `ship_inventory_and_art_plan.md`). Read this before generating any new walkable interior. Status when written (2026-10-29): the ship is roughly 60% there and good enough to move on.

## 1. Generate the art

1. **Describe the room as a sealed box, positively.** "Plain bare plating, sealed, no openings" works. A list of forbidden things (windows, arrows, placards) is mostly ignored, and the node/speaker fixture sentence made the Pell node come out lit every time. Say what is there, not what is absent.
2. **Reference the shell, not just the style.** Style references alone gave chamfered corners and diagonal plating that "dies into the corner". Passing a good room as the shell reference ("redraw the contents inside the first image's shell, straight walls, rectangular floor") gave a clean rectangular room. Always pass a known-good room.
3. **Every room needs its hatches in the art.** Compartments came back with fewer hatches than the plan needs; we then invented doors on blank wall, which never looked right. Put the exact hatch count and wall position in the prompt, and reject art that lacks them.
4. **Image edits are cheap and precise, but they rewrite more than you asked.** The sunburst edit tier (`gpt-image-2-5-sunburst`, ~12 credits) fixed a blocking cabinet, added an airlock floor hatch, and added a mess hatch. It also painted over the engineering to bunks hatch when asked only to redraw the reactor. After every edit, diff the hatches against the previous image. Restore lost regions by pasting the old crop back with a feathered mask.
5. **A constant-scale rule beats per-room tuning.** Fit each room so its painted hatch height equals a fixed world height. Never size by room width. Rooms of very different sizes then give the same captain-to-door ratio.
6. **Budget credits for two variants per room plus one edit round.** The balance ran out twice mid-fix. Check `meshy balance` before a batch.
7. **Generated floors are not true isometric parallelograms.** They are flatter (~3:1) and the near edge is not parallel to the far edge. Use a four-corner (bilinear) floor quad, not three corners.

## 2. Fit the art to a walkable grid

1. **Read the room off the art with a labeled coordinate grid** (`tools/ticks.py`) rather than estimating from alpha silhouettes. Automated floor-quad estimation failed twice: the silhouette's lower edge is the hull plinth, not the floor.
2. **Describe a room as data, not code.** `design/rooms/<id>.json` holds the floor quad, cell counts, hatch size, floor outline, solid footprints, hatches, crew and lights. `tools/build_rooms.py` bundles them; `tools/room_overlay.js` draws the fit on the art. Iteration time per room dropped from a code edit to a data edit.
3. **Block by footprint polygons, not by cell rectangles.** Trace each table, console and machine as a floor polygon plus a height. A cell is blocked if it is mostly under a polygon or mostly off the floor outline. Hand-written cell rectangles were the source of nearly every "walking through the bench" report.
4. **Overdraw (hiding the person behind furniture) needs the cell box, not just the extruded hull.** Test "is the person behind this prop" against the prop's actual cell range, or small props will hide people standing beside them. Thin and small solids need their cells computed from touched samples. Ladders and floor hatches must never occlude anyone. Never occlude while the person stands on a hatch cell or is stepping through one.
5. **The stand cell is derived, not chosen.** For a wall hatch, take the floor cell on that wall edge nearest the hatch's floor contact point. Hand-picked stand cells were wrong on 11 of 16 hatches.
6. **Do not open blocked cells to make a door reachable.** That put the path through tables. Find the real gap, or move the door or the crew member.
7. **Crew standing in a one-cell lane is a wall.** Test reachability with crew placed, and keep crew off counter edges (their feet read as floating on the counter).

## 3. Connect rooms

1. **Walk direction must continue across a hatch.** Exit through a back-right wall walks up-right; entering through a back-left wall walks down-right. Alternate the two along a chain. Same wall on both sides reverses direction and looks like entering backwards. Far end walls need their own tags for the cases that cannot alternate.
2. **No clipping masks for hatch transitions.** Clipping a character to a door rectangle cut him in half whenever the stand cell, scale or rect was off by a little. Fade out at the sill and fade in on the other side instead.
3. **Where two doors share a wall type and neither art can change, use a plain fade** and say so. Do not force a step-through.

## 4. Process

1. **Test in the browser by walking every link, not only the static check.** `tests/check_ship.js` catches alignment, reciprocity, direction and reachability. It cannot see whether a hatch is actually painted where the door is, whether the scale looks right, or whether a path crosses a table. Visual passes found most of the user's reports.
2. **After any art swap, rerun the fit.** A swapped image keeps its old size setting and floor corners. Three bugs this session (missile scale, bunks scale, lost engineering hatch) were exactly that. Check every room's hatch height against its size setting after any regeneration.
3. **Keep a stateful tool for each repeated step.** `room_edit.py` (image edit plus keying), `ticks.py`, `rs.py`, `room_ascii.js` made each fix minutes. Build the equivalents before the second location.
4. **Honest scope.** For a station or another ship, expect the same cost per compartment: art (2 variants + 1 edit), a fit pass (2-3 overlays), a hatch check, a walk test.

## 5. Open issues carried forward

- Bunks: tubes are one row of 13, not two rows of 12; no wall-mounted bunks hanging off the tubes; crates piled against the bow-end hatch (repaint without them).
- Engineering lower: the reactor is solid with a lane in front; there is no walking behind it.
- Mess ladder hides the name label at its foot. Pell node panels are painted lit and need a dark state drawn in code.
- Seated and at-station crew poses do not exist; crew facing and scripted movement are next.
