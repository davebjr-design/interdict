# Maneuver model: flip-and-burn flight and the click-a-waypoint planner (draft, 2026-11-15)

Status: proposal. Prototype in `sim/maneuver_proto.js` (not wired to the engine); picture in `design/mockups/maneuver_plan.png`.
Premise (decided): ring rooms, thrust is "down", so ships accelerate, flip, and brake hard. Flight is Newtonian; the player gives positions, the ship works out the burns.

## 1. The model (what each piece comes from)

| Piece | Source | Use here |
|---|---|---|
| State = position + velocity (+ heading) | Kinodynamic planning (Donald, Xavier, Canny, Reif 1993; Reif and Tate 1994, bounded velocity and acceleration) | Planning in position-velocity space, not position alone. We use the simple end of it: no obstacles, so the answer is closed form. |
| Flip and burn (brachistochrone) | Standard constant-thrust transfer: accelerate half way, flip, decelerate | The STOP waypoint. Switch point where the forward and backward speed curves cross. |
| Delta-v "turn and burn" | Common game heuristic: desired velocity minus current velocity, rotate to that vector, burn until zero | The TURN waypoint. Velocity out = cruise speed toward the next point. |
| Rest-to-rest bang-bang rotation | Time-optimal slew: t = 2 sqrt(theta I / torque) | Time to flip or turn while coasting. |
| Linear tangent steering (NASA PEG) | Burn direction changes slowly, thrust always max | Later: long burns while gimbal-steering. Not needed for the first pass. |

Sources: Reif and Tate (https://scholars.duke.edu/publication/795347), NASA PEG (https://ntrs.nasa.gov/api/citations/20250011251/downloads/PEG_ASC25_Mahajan.pdf), gamedev.net threads on spaceship motion planning, itch.io brachistochrone devlog.

## 2. Numbers for the 140 m hull (targets)

* Mass about 11,000 t, 100 percent thrust 1 g (9.81 m/s2) since 2026-11-20 (was 0.15 g), Isp 8,000 s.
* (Superseded 2026-11-20: flips now come from maneuver presets, `FL.maneuverShip(mode)`: normal 0.25 g about 31 s, firm 1 g about 15 s, combat 3 g about 9 s, emergency 6 g about 6 s for 180 degrees, game seconds, at a 57 m crew distance.) Original: rotation by RCS couple: about 5.6e-4 rad/s2, so a 180 degree flip takes **150 s** (about 290 s on two nozzles). A 90 degree turn takes about 106 s.
* Rotation by pod gimbal (plus or minus 5 degrees): about 5e-3 rad/s2, flip about 50 s, but only while burning. Used for steering inside a burn, not for flips at rest.
* Stop from 80 m/s (4.8 km/min): 54 s burn over 2.2 km. The flip costs more time than the burn.
* Prototype route (three clicks, 250 km): 54 min 39 s, delta-v 344 m/s, 48 t of water reaction mass. Compare 250 t tank: about 1.8 km/s of delta-v total.

Consequence worth designing around: **turning is slow and braking is fast.** Changing course by more than about 90 degrees at speed costs two minutes of coast. A ship with its nose on the wrong side cannot snap-shoot or snap-flee. This is what makes the sneaking and the pinger tactics bite.

## 3. The interface

Click a point: **Turn here** (default, left click). Click a point with the stop modifier (or the radial menu): **Stop here**. The plan shows immediately:

* **Arcs by forward simulation.** The planner simulates the burns and draws the actual path, not the straight segments. At cruise speed the arcs are small relative to the legs, so the plan also shows a ghost "instant turn" line and, per waypoint, how far the ship cuts the corner (overshoot in metres).
* **Colour by phase:** blue burn (loud, hot), yellow flip or turn (coasting, quiet), red brake burn. Heading arrows every 25 s. Phase durations as labels.
* **Panel:** total time, delta-v, propellant, warnings (leg too short for the flip; burn heats the sink beyond the silent budget; crosses a known hazard).
* **Drag a waypoint** to replan live. **Cruise speed** is the engine speed rung (1.2 to 4.8 km/min); changing it replans.
* **Autonomy:** Auto flies the plan; Hands-on at Helm lets the player trim the burn timing.

## 4. Engine work

1. Replace the speed-rung kinematics with a Newtonian integrator: velocity and heading are state; thrust along heading; rotation by bang-bang torque with a rate limit.
2. `plan(state, waypoints, cruise)` as in the prototype, returning segments; the Helm executes segments in order and replans on any disturbance (hit, new waypoint, thrust limit).
3. Burn noise and heat feed the existing signature model (blue and red phases are emission; yellow is quiet).
4. Test: closed-form checks (stop distance v2 / 2a, flip time formula), waypoint arrival tolerance, replan after interruption.
5. Balance: expect hunts to change materially (the pinger and the sprint-and-coast tactics both lean on turn rate). Rebuild the bots' steering on waypoints first.

## 5. Open points

* Does the player see the flip as a mandatory pause before a hard reversal, or does the planner try to hide it by starting the rotation early? (Prototype starts the rotation early.)
* Limits for the turn: should a turn waypoint demand a minimum leg length, or warn only?
* Cruise speed per leg, or one for the whole plan?
* How a hunter's plan (AI) shares the model: same planner, so enemies also take two minutes to flip.

## 6. One engine, many missions (decided 2026-11-15)

The control interface, flight physics and ship rules are identical in a hunt, a salvage job or any other mode. The engine is the engine; a mission is **data**: arena, objectives, timers, what is in the field, and a schedule of events (for example "hostiles drop in at minute 12"). Modes may cross over: a salvage mission can have bogies drop in, and the player then plays the same hunt with the same stations, planner and moments. Rule for builders: no hunt-only or salvage-only physics. If a rule only makes sense in one mission, it is a mission parameter, not an engine branch.

## 7. Salvage maneuvering set pieces (proposals, same physics)

Standard maneuvering is anticipatory (commitment, flips, stop distances); combat is reactive (redline, gimbal, signature). Tension for salvage comes from the planner, not from new rules:

* **Tow:** a captured wreck adds mass and inertia: less acceleration, slower flips (about 2.5 min becomes maybe 6), longer stop distance.
* **Point of no return:** the planner shows when the ship can no longer stop before the target; overshoot means a long flip and re-burn.
* **Rendezvous with a tumbling derelict:** match velocity, approach on a vector, tolerances at docking; early correction is cheap, late is expensive.
* **Silent approach:** ballistic coast with the drive off; the course was committed minutes earlier.
* **People outside:** EVA or recovery crew on the hull or tethers; no burns until they are in (hold on thrust, tied to the brace and UNSECURE rules).
* **Window or race:** a derelict decaying toward a planet, or a rival crew heading for the same wreck.
* Moments for these are "loose" moments (faster answer, visible ceiling): overshoot, debris ahead, flash on the scope.

Build order: tow and the point-of-no-return display first.
