# Detection model proposal (2026-10-23, awaiting Dave's go-ahead)

Principle: everyone always leaves a trace. Detection is an information RATE, not a yes/no. Same rules for both sides.

- Every ship has a signature (thermal, reactor, eclipse) and a sensor rating. Information rate on a target = sensor rating x signature strength x range falloff. Resolution time = information needed / rate. A faint trace is slow, not invisible.
- Behavior moves the signature: burning, firing and pinging raise thermal; stopped and quiet lowers thermal and reactor; eclipse (mass against a bright background) does not change but needs a star or body behind it.
- Firing solution = sustained track quality. A target going cold lowers the rate, grows the uncertainty bubble, and a held solution decays instead of lasting a fixed time.
- The enemy tracks us the same way: our signature against their sensor rating. Their aim spread widens when we go cold and still, which is what makes dodging and going quiet work. The hunter "sweeps" become the enemy's information accumulating on us.
- Loadouts: about six enemy loadouts (sensor rating, signature, crew skill, weapons, speed), randomly assigned. Our ship uses the same fields.
- Celestial bodies: first pass is backdrops for eclipse and cover (line of sight blocked both ways). Later: nebulae that scatter signatures.
- Field: larger arena (80 km proposed), speeds and ranges scaled with it, zoom and pan everywhere.

## As built (2026-10-23, approved by Dave)

Detection (`infoMult`, `ourVis`, `enemyVis`, `enemyAI` in the engine)
- Visibility of a ship = exposure (what it is doing) scaled to 0.06 to 0.85, times its loadout signature; venting is fixed at 1.0.
- Our information rate on a contact = our sensor rating x its trace per channel x range falloff x 0.12 if a planet blocks the line x 0.85 if hull is damaged, floored at 0.12 so everyone always has a trace. Each read's precision and weight scale with it, so cold or far ships resolve slowly, hot or near ones quickly. Firing solution time scales with the average rate (0.75x to 2x) and pauses below 0.22.
- Enemy knowledge of us (`know`, 0 to 1.2) grows at 0.4 x vis^2 x their sensor x range falloff per minute and decays when our visibility is under 0.35. One third: aware (hunts and shoots, wide aim error), two thirds: closing, full: firm solution (aim error 2.4 km, cone shrinks). If it drops under 0.15 they lose us and go back to patrol. The old abstract hunter, sweeps and "found" ending are gone; the Enemy fix pips show the best-informed enemy.
- Events (pings, launches, coilgun flashes, bait) add knowledge to every warship, weighed by range.
- Aware ships steer toward where they believe we are (error from their knowledge) and hold about 30 km standoff.

Heat (`sinkStep`, `startVent`, `stopVent`)
- Stored heat only rises. Fill per minute = 1.4 x exposure; going quiet or holding still only slows it. A ping costs about 17 percent of the sink. Nothing drains it except venting.
- Vent (key V): fins out, we are 100 percent visible, sinks drain at 20 percent per minute (5 min for a full dump), retract any time. Warnings at 60, 80 and 95 percent. At 100 percent the fins open by themselves and close at 25 percent (the cost of neglect, never a dead end).
- Enemies obey the same rules: random starting heat, capacity by loadout, no vent in the first 5 to 9 minutes. Veteran crews vent early but only when they believe we have no fix; the rest vent at 82 percent regardless; everyone at 100. A venting ship is a thermal blaze (thermal rate x1.6), Dace calls it out, and a ship we had ruled out comes back into play. Only real warships vent, so a vent is also a tell.

Loadouts (`LOADOUTS`): Picket, Hound (sharp, loud), Shade (quiet, weak), Veteran (crew 1.25), Green crew (0.75), Brute (big sinks, hits hard). Our cutter is the plain one. Revealed on the end screen.

Field and bodies: 80 km square (everything scaled x2: speeds, ranges, missile speed, kill and cone sizes, uncertainty). Two stars (bright discs with a glow ring: eclipse works when a ship passes in front of the glow as seen from us) and one or two planets (solid, block sight both ways, ships steer around them). Zoom and pan on the scope and Strategic map; the briefing chart shows the bodies for the seed it will use.

Tuning knobs: P.sinkK, P.ventFull, P.knowK, P.knowDecay, P.enemySink, P.sensR, P.aimSigMax/Min, P.standoff, LOADOUTS table.
