# 1 g retune: coherence audit (2026-11-20)

What changed, what still fits together, what is open. Physics model first; the interface pass follows.

## What changed in the engine
- Drive: 100 percent = 1 g (was 0.15), redline 3 g for about 30 s (was 0.4 g, 3 min), emergency 6 g for about 5 s (was 2.5 g, 9 s). `flight_model.js` `SHIP`.
- Flips: `FL.MANEUVER` presets give the peak felt g at the farthest crewed deck (57 m): normal 0.25 g, firm 1 g, combat 3 g, emergency 6 g. Plans use `normal`; the Evade posture uses `combat`. A 180 degree flip is about 31 / 15.5 / 9 / 6.3 game-seconds.
- g-load: `s.gLoad` now includes the flip's spin load (`s.gSpin`) and a forced load hook for the sandbox (`E.forceLoad`). Brace threshold `gThresh` is 2 g (was 0.3), so 1 g cruise needs no brace, redline, a combat flip and the jump spool do.
- Crew: per-officer `gTol` (Quill 4.5, Abara 6.5, Castellan 5, Dace 4.5, Fenwick 4). Above 2 g crew accumulate `gFat` (0 to 1), which lowers efficiency up to 50 percent through `crewEff`, Abara's solve time and Quill's and Dace's work rate. Braced crew tire at 40 percent of the rate and black out at 1.3 times the tolerance. A sudden jump of 2 g or more cuts tolerance by 15 percent for 3 game-seconds. Blackout reuses the knocked-out state (cause `blackout`). Recovery is slow at 1 g or less and fast in free fall.
- Auto-brace: the crew look ahead in the plan and brace by themselves about 10 real seconds before a planned burn or flip over 2 g (`brace_plan` event), unless the captain chose "Go now".
- Injury from an unsecure crew under load now starts at 2 g (`injGate`) at a quarter of the old rate (`injK`), which keeps the old injury frequency at redline.

## Time scale (important)
A game minute is 60 game-seconds and 16 real seconds, so the simulation runs 3.75 game-seconds per real second. Physical times in this document are game-seconds unless stated. A normal flip (31 s) is about 8 real seconds, a combat flip (9 s) about 2.4 real seconds, a 30 s redline burn about 8 real seconds. Crew speak in game minutes.

## What still fits together
- Tests: all engine and station tests pass with the new numbers (expectations updated, see the commit). A few were hard-coding the old 0.15 g and 0.3 g values.
- Propellant per delta-v is unchanged (rocket equation); at 1 g the flow is 6.7 times higher, so a 250 t tank is about 3 minutes of 1 g burn. Typical start-stop transits use about 28 t, so a tank is roughly nine start-stops.
- Heat: engine heat follows the thrust fraction, so a 1 g burn is as hot as a 100 percent burn used to be and a 3 g redline as hot as the old redline. A burn to cruise now lasts a couple of real seconds, so burn signatures are short flashes and cruising is quiet. Starting, stopping and turning are the loud moments.
- Evasion damage in the engine barely changed against the old model (about 5.8 hull per volley static, 4.4 with a lateral dodge at 100 m/s, old 6.7).

## What is open or inconsistent
1. **What bounds evasion?** Missiles fly at 667 m/s with a 7 km kill radius and 30 to 150 game-second flights. A ship at 3 g that turns early could displace by 0.5 a t^2 (about 13 km in 30 s, 42 km in 60 s), enough to dodge nearly everything, which is exactly what the crew g-limits are meant to prevent. Today the speed rungs (cruise caps of 20 to 150 m/s) bound displacement, not g, so dodging is still weak (about 3 km in 30 s). To make g the real limit, an evasion burn must be allowed above the rung cap for up to the redline time, bounded by fatigue, blackout, propellant (about 4 t/s) and heat. This is a design decision: see the question to Dave.
2. **Evade posture is a jink**, not a sustained burn: it is a one-second 3 g burn on a 0.35 rad heading change, then coast. It gives very little displacement.
3. **Spec tables** quote 0.15 g thrust, flow, tank life and sink-fill times in several places. The key lines are updated; the rest of the heat and sink arithmetic needs a pass (burn heat is 6.7 times higher for a shorter time).
4. **Redline propellant**: the spec table uses a lower Isp at redline (11 t/s) while the engine uses a fixed 8,000 s (4.1 t/s). Needs one rule.
5. **Spool g**: the jump spool counts as 2.5 g for brace purposes but is not sustained g, so it causes no fatigue. Intentional.
6. **Call rhythm**: the adapter flood test allows 5 raised calls in 5 s instead of 4. One seed clusters a vampire report with four follow-ups. Needs a look in the interface pass.
7. **Enemy ships** fly with the same presets (normal flips) but have no crew g-limits yet; their `a_max` for the firing solution is the same 3 g.
8. **Brace lead**: strapping in takes 0.4 game-minutes (24 game-seconds, 6.4 real seconds); the planner starts it 36 game-seconds (9.6 real) ahead.
