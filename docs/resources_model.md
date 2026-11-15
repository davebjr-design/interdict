# Resources: water and fuel cassettes (decided 2026-11-15; engine-facing summary)

Source of truth for the ship's tanks and the physics is the Ship Spec doc ("Water and fuel stores"). This file is the rules the engine and the economy pass need. Nothing here is built unless it says so.

## Two stores, two clocks
| | Water (reaction mass) | Fuel cassettes (fusion fuel) |
|---|---|---|
| Sets | how far and how fast the ship can go | how long the pods run, and whether the ship can jump |
| Character | bulk, cheap, common | small, dense, valuable, controlled |
| Capacity | 330 m3: 4 drive tanks (250 t), 20 t crew reserve, 60 m3 settling and filter tank | magazine of 8 (about 37 kg) |
| Draw | thrust / exhaust velocity: 200 kg/s at 100 percent, 1.5 t/s at redline, 5.4 kg/s at cruise | one per 21 min of 100 percent drive (pro rata by pod power); one per breach-drive spool; hotel load none |
| Empty | no change of velocity (drift), reactor, sensors and guns still work | pods dead, no jump; fission plant and creep only |
| Full tank / magazine | about 1.8 km/s of delta-v; about 9 arena crossings at the top rung (about 200 m/s each) | 8 flat-out tank equivalents, or 8 jumps |

Target pressure: a water refill every two or three hunts; cassettes scarce enough that lean cassettes and salvage matter. Tune in a campaign sim (not a hunt sim).

## Rules
- **Reserve floor:** the 20 t crew reserve is locked from the drive by a guarded BURN RESERVE valve. Burning it is worth about 140 m/s and leaves weeks (not days, not forever) of life-support margin.
- **Grades, water:** Clean (full performance), Hard (filters used up, pods derate 5 percent), Foul (derate 10 percent, may trip, a second filtration takes hours).
- **Grades, cassettes:** Full (D-He-3, full performance) and Lean (D only: thrust capped at about 30 percent, hotter blanket). Lean is cheaper and commoner.
- **Sources, water:** depot or tender (about 2 h for 250 t, cheap, leaves a record), derelict transfer (20 to 200 t, hours, may be fouled), ice bodies (about 100 t/h cutting, melt is the bottleneck: 250 t of 100 K ice is about 170 GJ, about 2 h of the full plant; about 3 h parked per tank).
- **Sources, cassettes:** wrecks (cargo), purchase (controlled; a record). Never made aboard.
- **Settling step (proposal):** 30 s of creep thrust before a burn that follows a flip or a long coast; the planner inserts it.
- **Creep thrusters** burn steam at about 200 s Isp (53 kg/s for 0.1 MN): attitude, docking and settling, not travel. An hour of translation at 0.001 g costs about 190 t.

## Risks (hooks for moments and missions)
Fouled feed, freezing in a long silent run (heaters 0.2 MW), slosh and steam ingestion after a flip, a hit on a water tank (a bright steam-and-ice leak, tens of tonnes a minute), water meeting lithium (never; bulkhead), parked-to-mine exposure (melt plume, heaters, outgassing ice, rivals), bad salvage (mislabelled tanks, tritium in reactor-loop cassettes), cassette theft and forged labels.

## Engine notes
- The flight model (`docs/maneuver_model.md`, agent work in progress) tracks propellant mass; the numbers do not change with water. Cassette count is not in that pass.
- UI: one water gauge with the reserve line marked; one annunciator lamp for cassettes; the status board shows both.
- Moments: a salvage mission that needs water or cassettes is a natural source of loose decisions (parked to mine, ice outgassing); gated specials can use cassettes and grades.
