# Vampire detection rule (2026-11-15)

The captain's rule, verbatim: "vampires are detected at launch if the launching vessel is also detected (if the launching vessel is detected with some level of probability, the probability of detecting the missile launch is the same), and then when the missiles go from cold to hot (seeking), they're detected and can be intercepted by point defence. It's possible to drag the sliders so that the missiles don't go hot before detonation, but keep in mind space is huge, so this is like blind depth charging in an area against a submarine: very survivable but also unnerving for the submarine, on an even larger scale."

Code: `web/hunt_rt_engine.js` (`detectLevel`, `launchSeenBy`, `foes`, `RULES.launchDetect`, `RULES.launchSym`, `AI.blind`). Tests: `tests/vampire_detect_test.js` (plus `tests/seen_stun_test.js` and `tests/engine_contract_test.js`, adjusted to the rule).

## The quantity: detection level

`E.detectLevel(s, a)` is a number from 0 to 1: **how firmly we hold that ship on our plot**, which is the engine's position confidence for the contact, `uncertainty(s, a).conf`.

* An **open** contact: the read evidence from the three analysts (sum of the channel weights, decayed with the 3 minute half life) divided by `uncDen` (20), capped at 1. Never read: 0. Read to completion and left alone: it decays, about 0.5 after four minutes.
* A **locked** contact: the quality of the track (age and spread of the last fix). Fresh and tight is about 1; an old track is lower; a lost track ("LAST") is below 0.5.
* A ruled-out contact keeps whatever evidence is left, so it decays too. A wreck is 0.
* Theirs of us (the symmetric case): `min(1, a.know)`, the enemy's own fix on us, which is already what decides how well it aims.

## The rule (enemy volleys at us)

1. **Launch.** One roll per volley, from its own random stream (`s.rDet`, so no other draw moves). The volley is seen at launch (`v.seen`, `v.via = 'launch'`) when the roll is under the launcher's detection level. A firmly locked ship is seen essentially always; an unread one essentially never. The volley records the level it was rolled against (`v.level`).
2. **Seeker hot.** When the seeker goes from cold to hot (`v.seekAt`, `AI.seekerActive` = 12 units, about 5 s out, scaled by lineage) the volley is always seen (`v.hot = true`; if it was not already seen it is now, `via = 'seeker'`, Dace calls "Vampire, seeker active").
3. **Blind volley.** A volley whose seeker never goes hot before detonation (`v.blind`, `v.seekAt = Infinity`) and whose launch roll failed is never called: no warning, no brace, no point defence, the target only learns by the hit. Ways to get one: the hunt option `seekerActive: 0`, or the AI parameter `AI.blind` (the chance that a volley fired at a stale fix, that is while we are quiet, is a dark depth charge; default 0, so normal hunts are unchanged). Mission data, not a branch.
4. **Point defence** engages only seen volleys (`pdP = 0` for `v.seen === false` at impact). Since every ordinary volley lights its seeker before impact, the gate bites only for blind volleys.

`RULES.launchDetect = 0` is the off switch: no launch is ever detected (every volley is first seen when its seeker lights), and our own launches use the old flat roll.

## The symmetric case

The engine already modelled their detection of our launches, as one flat roll (`PLAYER.launchSeen` = 0.35) that alerted every hunter by `launchAlert` weighted by range. It now uses the same rule: each live warship rolls once per volley against **its own detection level of us** (`min(1, know)`), and those that notice get the alert. An enemy that has no fix on us never sees us launch; one that has a firm fix always does. The old flat roll is still drawn (so paired sweeps stay paired) and is used when `RULES.launchSym = 0` or `RULES.launchDetect = 0`. Probes (`E.probe`) use the same rule.

What is not simulated: our volleys' seeker-hot moment. `rte` (run to enable) is stored on the presets but not simulated yet, so a target's warning of our volley is still `reactOf` (a probability over the flight, much higher for a homing volley). When RTE is simulated, the same "hot is always seen" rule applies to it: the hook is `v.seekAt` on our volleys.

## The 2D pages

`web/hunt_console.js` (INCOMING lamp, master lamp, the "INCOMING FIRE" prompt) and `web/hunt_rt_template.html` (the warn text, the strategic map missiles, the sweep banner, the plot missiles) read `S.inc` unfiltered, so they showed INCOMING at launch whatever the detection. They now read `E.seenInc(S)`, like the 3D CIC and the station adapter. `tests/vampire_detect_test.js` fails if either file reads a bare `S.inc` again. `web/hunt_rt.html` and `design/hunt.html` are rebuilt with `web/build_hunt_rt.sh`.

## Tests (`node tests/vampire_detect_test.js`)

* The level: 0 unread, 0.5 for half the evidence, capped at 1, halves in three minutes, locked and fresh about 1, falls with track age, a wreck 0.
* Probability follows the level: 400 seeded forced launches at each of 0, 0.25, 0.5, 0.75, 1: seen 0, 25.0, 50.5, 73.0, 100 percent (within 9 points of the mean level for the middle three, exact at the ends); rises monotonically.
* Seeker hot is always seen: 100 launches that were not seen at launch, all seen via seeker before impact; a launch-seen volley keeps `via = 'launch'` and goes hot.
* Blind volley, launch roll failed: never seen, never called (no log line, no `warn`, no vampire event), no auto-brace, and it still lands (60 of 60). A blind volley whose roll succeeded is called at launch only. `AI.blind` is 0 by default.
* Point defence: 120 unseen volleys, no cuts; the same volleys seen, 100 cuts.
* The symmetric case: their level 0 / 0.5 / 1 gives our launch noticed 0 / 49 / 100 percent; `launchSym = 0` gives the old flat 35 percent.
* The two 2D files contain no unfiltered `S.inc`.

## Balance

Harness `sim/balance_hunt.js`, n = 300 paired hunts, entry mix, normal difficulty (win %, 1 / 2 / 3 ships):

| Bot | Before (engine at the previous commit) | Rule only, our launches on the old roll (`launchSym=0`) | Rule both ways, `launchAlert` 0.15 | **Final (rule both ways, `launchAlert` 0.3)** | Rule off (`launchDetect=0`) |
|---|---|---|---|---|---|
| steady | 61 (97 / 67 / 20) | 62 (98 / 67 / 21) | 69 (97 / 78 / 31) | **65 (96 / 73 / 27)** | 61 (96 / 65 / 21) |
| reader | 60 | | 66 | 62 | |
| pinger | 56 (91 / 64 / 12) | 56 (94 / 60 / 13) | 56 (94 / 59 / 14) | **56 (94 / 58 / 16)** | 55 (94 / 56 / 14) |
| pingfire | 44 | | 44 | 44 | |
| camper / random | 3 / 3 | | 3 / 2 | 3 / 2 | |

* **The enemy side of the rule barely moves anything** (steady 61 to 62, pinger 56 to 56). Bots keep contacts locked, so most enemy volleys are seen at launch anyway: 76 percent of the steady bot's volleys and 58 percent of the pinger's are seen at launch (the rest are seen when the seeker lights, 5 s out). The brace and stun rules cost almost nothing here, as the earlier brace pass found.
* **The symmetric side moves the competent bot by +7**: with detection tied to their fix on us, an enemy that has not found us does not see our opening salvo, so the first shots against an unaware ship are free. With `launchAlert` left at 0.15, steady sat at 69, above the 60 to 65 band. Retune: `PLAYER.launchAlert` 0.15 to **0.3** (an enemy that does notice a launch learns twice as much from it; the expected alert per launch stays about where the flat roll had it). Sweeps of 0.3 / 0.45 / 0.6 gave steady 65 / 66 / 68 and pinger 56 / 56 / 56; 0.3 is the smallest change that returns to the band.
* Easy: steady 67 (was 67), pinger 66 (was 65). Hard: steady 49 (was 52), pinger 34 (was 32).
* **Pinger by fleet size** (1 / 2 / 3 ships): 94 / 58 / 16 against 91 / 64 / 12 before, 56 overall, unchanged. Still clearly under the competent bot against two and three ships; the rush-and-ping open item in `docs/mechanics_balance.md` is not touched by this rule.
* Competent bot target 60 to 65: steady 65 (reader 62), at the top edge of the band.
