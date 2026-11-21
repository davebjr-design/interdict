# Mechanics: Newtonian flight and the waypoint planner (2026-11-15)

Spec: `docs/maneuver_model.md` and `sim/maneuver_proto.js` (decided: ring rooms, thrust is "down", flip and burn). This file is what was built, the numbers, the tests, the balance effect, and where the build departs from the spec. One engine for every mission type: the planner, the limits and the heat rule are the same in a hunt, a salvage job or anything else; a mission is data (arena, objectives, hull parameters in `a.ai.ship` / `s.me.ship`).

Code: `web/flight_model.js` (pure physics and planner, global `Flight`, no engine import), `web/hunt_rt_engine.js` (the flight block: `navStep`, `navPosture`, `planInfo`, enemy `maneuver`), `web/station_adapter.js` (`A.plan()`, the `plan` event, `route` / `stop_here` verbs), `web/hunt_rt_template.html` (`drawPlan`, the 2D overlay). Tests: `tests/flight_model_test.js` (48 closed-form checks), `tests/flight_engine_test.js` (24 checks: the engine flies the plan, heat, enemies, water, adapter).

## Stages and commits

| Stage | Commit | What |
|---|---|---|
| A | `68b0031` | Vampire detection rule (see `docs/mechanics_vampire_detect.md`) |
| B1 | `63bbb5b` | The physics module and its tests |
| B2 | `2203528` | Player ship on the module |
| B3 | `182dc5e` | Enemies on the module, water tracked |
| B4 | `0fccdbd` | 2D plan overlay |

## The numbers

| Quantity | Value | Where |
|---|---|---|
| Hull mass | 11,000 t | `SHIP.mass` |
| 100 percent drive | 1 g (9.81 m/s2), 108 MN, 1.4 t/s of water (retuned 2026-11-20; was 0.15 g) | `SHIP.a100` |
| Redline | 3 g for about 30 s (retuned; was 0.4 g, 3 min) | `SHIP.aRedline`, `redlineT` (the 3 min limit is a parameter, not yet enforced) |
| Emergency | 6 g for about 5 s (retuned; was 2.5 g, 9 s) | `SHIP.aEmergency`, `emergencyT` (not wired to any control) |
| RCS rotation | default 5.6e-4 rad/s2 (150 s flip) is now overridden by the maneuver presets in `FL.MANEUVER` (see docs/firing_solution_and_g_load.md s1a) | `SHIP.alpha` |
| Gimbal | 5e-3 rad/s2, plus or minus 5 degrees, while burning only | `SHIP.alphaGimbal` (integrator only; the planner ignores it, which is the conservative side) |
| Isp, tank | 8,000 s, 250 t of water in the drive tanks | `SHIP.isp`, `SHIP.tank`; the 20 t crew reserve is locked and not touched |
| Time | physics in SI, converted at the engine boundary: 1 game minute = 60 s of fiction = 16 real s; 1 km/gmin = 16.67 m/s | `KM`, `GM`, `MS`, `KMGM` |
| Arena | 240 km in the engine (unchanged in this pass); design target 150 km after the balance sweep | |

The five speed rungs (v1 to v5, 1.2 to 6 km/gmin, redline 9) are now **cruise-speed caps** for the planner: the drive always burns at 100 percent (0.15 g), the rung says how fast to go before coasting. A normal burn to 60 m/s (v5) takes 41 s.

## The planner (`Flight.plan`)

Waypoints are `turn` (change velocity toward the next point and carry on at cruise; the corner burn is centred on the waypoint by a fixed-point iteration, arrival error under 0.001 m in the tests) or `stop` (flip, brake, rest on the point). The plan is a list of segments: `rotate`, `burn`, `turnburn`, `coast`, `brake`, and a final `rotate` that settles the heading. Everything is closed form (`stateAt(plan, tau)`): no integration drift, and the same function serves the player, the enemy, the console and the tests. The rotation limiter is time-optimal bang-bang (rest-to-rest time 2 sqrt(theta / alpha)). The planner warns (and does its best) when a leg is too short for the flip, when a corner leaves no room to rotate, and cuts the peak speed on a short stop leg (`plan.cuts`). `Flight.hold(state)` is flip-to-retrograde and brake in place (what "all stop" does). Rocket equation: `Flight.propellant`.

Sample plan (engine test): a 50 km leg, a corner, a 50 km leg, stop, at v3: burn 41 s, coast, rotate 130 s, corner burn, coast, flip 150 s, brake 41 s, settle; 1,707 s, delta-v 205 m/s, 28.7 t of water. The old prototype route (three clicks, 250 km): 3,279 s, 344 m/s, 48.1 t.

## The player ship (B2)

* `s.nav` holds the plan; each posture is a controller that picks waypoints (`navPosture`): route (the clicked points), close (stop at the hold-off distance, replanned when the target drifts 4 km or two minutes pass), separate, orbit (a lookahead turn waypoint), still (`hold`), evade.
* `navStep` evaluates the plan every substep and publishes `s.player`, `s.vel` (km/gmin), `s.hdg` (the real heading, no longer the velocity direction), `s.omega`, `s.thrust`, `s.phase`, `s.gNow`. If something moves the ship (a planet push-out, a test teleport) the plan re-anchors on the new position with the velocity kept.
* **Evade** is a redline (0.4 g) jink to a point 35 km off at 20 degrees to the present heading, a new leg when the last is flown. A half-turn takes minutes on the RCS, so an evasion that needed a 90 degree turn first would never burn; the small deflection starts at once.
* **g and brace.** `GLOAD` now reads the real thrust-derived g: a normal burn 0.15 g (under the 0.3 g brace threshold), redline and a jink 0.4 g (needs SECURE), the flip and every coast are weightless. Injury gate rebased to 0.3 g and rate 2.5 (was 0.5 g and 0.5 against the old 1.5 g redline stub), so redline on an unsecured crew still hurts; `impact` 1.5 and `spool` 0.8 stay as stubs.
* **Heat and noise** follow the burn: `THRUST_HEAT` is the old rung table read as burn level (0.3 at 100 percent, 0.9 at redline, nothing under 20 percent), so burn, turnburn and brake phases are hot and coast and rotate are quiet. Sensor rate by thrust: a coasting ship hears best (`THRUST_RATE`).
* **Propellant** is water: `s.water` (tonnes, 250 at the start), consumed at thrust x 206 kg/s, `s.waterUsed`, a `tanks_dry` event and drift when empty (tested: 28.8 t used against 28.7 t planned). The crew reserve and the BURN RESERVE valve are not modelled; fuel cassettes are left out of this pass as agreed.
* **Adapter:** `A.plan()` returns the live plan (km and game minutes: segments, path samples, waypoints with times, `dv`, `propT`, `peakG`, warnings, `cuts`, and `now` with the phase, speed, g and time remaining); a `{type:'plan'}` out event with a summary when the plan changes; verbs `route {pts}` and `stop_here`.
* Browser builds inline `flight_model.js` before the engine (`/*FLIGHT*/` in the template, `web/build_hunt_rt.sh`; `hunt3d.html` loads it by script tag).

## Enemies (B3)

A warship flies the same planner and limits (`a.navs`, a list of plans evaluated by `truePos0` / `legVel`; before its first manoeuvre it coasts on the straight line `x0 + vx t`; the old `a.legs` list is still read for ships without navs, which tests and the tutorial dummies use).

* `maneuver(s, a, dh, steer)` is a replan to a far waypoint on the new heading at the ship's own cruise speed. The ship must flip and burn first: a 29 degree course change takes 114 s of rotation and 17 s of burn, 90 degrees 130 s and 49 s, 180 degrees 150 s and 68 s (delta-v 25, 71, 100 m/s at 3 km/gmin).
* The track on a contact is spoilt (`manLoss`, the "has changed course" call) when the velocity starts to change, not when the order is given: `a.manFx`.
* **Edges and planets** are avoided with lead time (a flip and a burn: about 3 game minutes at cruise), checked on the projected position, with a guard so a ship already turning is not replanned every tick. 0 of 276 samples outside a 5 km margin in the test.
* **Signature** follows the thrust, the same rule as ours: `enemyAct` = 0.016 base + 0.03 x thrust (capped at 2) + aware and firing terms. A coasting warship is quiet; a manoeuvre is a visible burn. (Before: heat by speed squared, so a fast ship was always loud.)
* The tracking rules (`estAt`, `spreadAt`, `anchor`) are unchanged; a contact that holds its velocity is easier to track, one that burns hard is not.

## Tests

`node tests/flight_model_test.js` (48), `node tests/flight_engine_test.js` (30). The other suites were rewritten where they assumed instant velocity: `brace_test` (loaded cases use a redline-thrust jink: `hardBurn`), `combattest` (heat follows the burn), `probes_test` (the laser link breaks on a real burn; stopping takes a flip and a brake before the link returns), `tracktest` (the manoeuvre penalty lands when the burn starts), `station_model_test` (flood limit 4 to 5: the engine log is ingested once a game minute so a ping and a hot burn can land together), `cic3d_smoke` (PD falls back to armed when nothing is incoming, so the test reads the `pd` event). All of `tests/*.js` pass (`moments_test` is wall-clock flaky and passed; `tests/smoke4.py` "investigate order" is a pre-existing flake that fails about one run in two, before and after this work).

## Balance (`sim/balance_hunt.js`, n = 300 paired hunts, entry mix, normal; win %, 1 / 2 / 3 ships)

| Bot | A (before flight) | B2 (our ship on the model) | **B3 (enemies too)** | B3 minus A |
|---|---|---|---|---|
| steady | 65 (96 / 73 / 27) | 62 (95 / 64 / 28) | **66 (96 / 74 / 27)** | +1 |
| reader | 62 | 61 | **66** | +4 |
| pinger | 56 (94 / 58 / 16) | 54 (95 / 52 / 14) | **59 (97 / 65 / 16)** | +3 |
| pingfire | 44 | 44 | **53** | +9 |
| camper / random | 3 / 2 | 3 / 2 | **2 / 4** | |

Easy: steady 67 (was 67), pinger 63 (was 66). Hard: steady 48 (was 49), pinger 37 (was 34). The competent bot is 66, one point over the 60 to 65 target; the pinger is still clearly below it against two and three ships (65 and 16 against 74 and 27).

What moved, and why (reported, not tuned away):

* **Our own flight (B2) cost the competent bot about 3 points**: a jink or a close now takes a flip first, and the old instant dodge is gone. A dodge experiment with the reader bot (route 66, no dodge 64, evade 60) shows the dodge hardly matters either way, so the bots keep the route dodge.
* **Enemy physics (B3) gave it all back and more**: enemies change course slowly (two to three game minutes for a turn), so tracks hold longer and shots land more; a coasting enemy is quieter (harder to find passively) but the slower turn wins. The active-sensor bots gain most (pingfire +9): a pinged ship cannot dodge the ping or the volley.
* **Proposed tuning (not done)**: raise enemy patrol manoeuvre rate (`AI.manPatrol` / `manAware`, shorter intervals) so the loss of agility is paid back in more burns (louder, more track loss); or give enemies a higher base heat (`0.016`) so coasting is not free; or lower enemy thrust (`ai.ship.a100`) for the opposite. The first is the cheapest and keeps the physics honest. Re-sweep the competent bot to 62 to 64 with `--set ai.manPatrol` pairs before touching the others.

## Departures from `docs/maneuver_model.md` (and open items)

1. **Rung semantics.** The spec says "cruise speed is the engine speed rung"; kept, but the old rung also set the load and heat; both now come from the thrust, so every normal burn is 0.15 g whatever the rung.
2. **Dodge is abstract.** `reactOf` (a probability from the enemy's cunning) still decides whether an enemy reacts to a probe or a salvo, and `maneuver` then replans: there is no missile-versus-manoeuvre geometry beyond the velocity lead already in the aim. Real physics makes a 14 km sidestep in 40 s impossible; the player's dodge is only the acceleration over the flight time (about 3 km for a 0.4 g jink over 40 s).
3. **Ghosts and lures** use the same `maneuver` (no special case); friendly dummies keep their legs.
4. **`fold()`** (reflecting positions at the arena edge) is kept as a safety net; the lead-time avoidance means it rarely triggers.
5. **Gimbal** is in the integrator only; the planner flips on RCS even for a small correction (conservative).
6. **Redline duration (180 s) and the emergency burn (2.5 g, 9 s)** are parameters only; no control enforces or uses them yet.
7. **Redline propellant flow.** The model burns 0.54 t/s at redline (thrust over Isp); `docs/resources_model.md` says 1.5 t/s. One of them needs reconciling (probably a lower Isp at redline).
8. **Settling step** (30 s of creep thrust after a flip, in the resources model) is not inserted by the planner.
9. **Arena** stays 240 km; at 200 m/s a crossing is about 20 minutes. The map and hunt length were not rescaled.
10. **Mission data**: `s.me.ship` and `a.ai.ship` override the hull parameters per ship; there is no per-mission loader yet.

## 2D hunt console (B4)

`drawPlan` in the template paints the planned path on the strategic map (and the Helm page map): blue for burn and corner burn, yellow for the flip and coasting (quiet), red for the brake; a heading arrow every 25 s of flight; the ETA at each waypoint; a panel in the corner with the plan time, delta-v, water, the phase now (speed, g, heading, time left) and the planner's warnings. The helm page's PLAN ETA uses the planner's time. Screenshot: `tests/shots/flight_plan_2d.png`. Not done: dragging a waypoint to replan, the Hands-on burn trim, a per-leg cruise picker (the rung picker per click is unchanged), and the overlay on the tactical scope.
