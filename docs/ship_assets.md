# Ship asset list (Version 11 walk-through)

Legend: GLB = real Meshy model in web/ship3d_babylon/glb; PROC = procedural placeholder built in ship3d_bjs.js; MISSING = nothing yet.
Credit figures are rough planning estimates (about 450 of the authorised 500 credits are spent, so roughly 50 remain); confirm with `meshy` cost preview before each run.

## Have (25 GLBs)
engine_bell, couch, hatch, tubebase, console, crew (seated), pumptower, bunk, reactor, messtable, airlock_door, suit_locker, galley_range, galley_fridge, captain_bunk, captain_desk, med_cot, washer, head_unit, shower_pod, supply_crate, warhead, command_chair, dc_locker, player (standing).

## By room
| Room | GLB in use | Still PROC / MISSING |
|---|---|---|
| A1 CIC | console, couch, command_chair, crew | dome ceiling (PROC flat); laser dome + PD blisters on hull (MISSING); wall screen frames fine |
| A2 Officer berths + captain's pod | bunk, captain_bunk, captain_desk, dc_locker | 6 officer racks (only part built); unreachable flank bunk pods; personal lockers, curtains |
| A3 Array hall | none | array cabinets, signal racks, cable trunks (all PROC) |
| B1 Mess + galley | messtable, galley_range, galley_fridge | stools/benches, serving hatch, galley sink, cupboards (PROC) |
| B2 Junction + airlock | airlock_door, hatch, suit_locker | collar/tube/hatch discs are PROC (fine); suit rack, EVA suits (MISSING), tool wall, pressure gauge panel |
| B3 Utility | head_unit, shower_pod, washer, med_cot, dc_locker | sinks, mirror, med cabinet, laundry racks (PROC) |
| T Missile hall | tubebase, warhead, supply_crate, hatch | catwalk rail kit, loader crane, ladder cages (PROC), tube cap detail, magazine split 54/3/3 vs 48/6/6 undecided |
| C1 Thermal control | none | heat exchangers, coolant manifold, thermal console (PROC/MISSING) |
| C2 Sink machinery | pumptower | sink tanks, chillers (PROC) |
| C3 Valve gallery | none | valve wheels, manifold, gauge boards (PROC) |
| D1/D2 Engineering | reactor, pumptower | engineering console, turbine/generator, fuel cassette rack (D-He3), water propellant tanks, shaft couplings, engine room console (MISSING) |
| Exterior | engine_bell | hull plating kit, sponsons (beam 23 m vs 14 m spec conflict), dorsal tube caps (PROC), laser dome, PD blisters, antenna/sensor masts, soft-dock collar ring, docking lights |

## Characters
- Have: player (standing, one pose, unrigged), crew (seated, static).
- Need: 6-8 distinct crew (captain, XO, helm, sensors, weapons, engineer, medic, cook), each with a seated and standing variant; walk cycle + idle + sit; suited EVA variant; Corvane and other NPCs for boarding scenes.

## Priority order
1. Engineering set (reactor hall is a showcase room and mostly placeholder).
2. EVA suit + suit rack (needed for the airlock mission mechanic).
3. Crew variants + rigging/walk cycle.
4. Thermal / valve / array machinery kit (one reusable "machine" pack can serve all three).
5. Exterior dressing (dome, PD blisters, masts).
6. Small props: stools, sinks, lockers, wall panels.

## Gemini -> Meshy for characters
Image-to-3D from a clean Gemini reference sheet (neutral A-pose, plain background, even light, no cropped limbs, same costume language across crew) normally gives noticeably better and more consistent results than text-to-3D: the silhouette, face and costume are fixed by the picture rather than guessed. Multi-view input (front/side/back) improves it further. Limits: hands, faces and fine insignia are still soft; topology is auto-generated; rigging and animation are separate paid steps. Recommended: one test with a single Gemini A-pose of an existing crew member, compare to player.glb, then decide.
