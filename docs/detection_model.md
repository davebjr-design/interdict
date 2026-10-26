# Detection and heat model (proposal 2026-10-23; "Current engine rules" at the bottom is authoritative, updated 2026-10-25)

Principle: everyone always leaves a trace. Detection is an information RATE, not a yes/no. Same rules for both sides.

- Every ship has a signature (thermal, reactor, eclipse) and a sensor rating. Information rate on a target = sensor rating x signature strength x range falloff. Resolution time = information needed / rate. A faint trace is slow, not invisible.
- Behavior moves the signature: burning, firing and pinging raise thermal; stopped and quiet lowers thermal and reactor; eclipse (mass against a bright background) does not change but needs a star or body behind it.
- Firing solution = sustained track quality. A target going cold lowers the rate, grows the uncertainty bubble, and a held solution decays instead of lasting a fixed time.
- The enemy tracks us the same way: our signature against their sensor rating. Their aim spread widens when we go cold and still, which is what makes dodging and going quiet work. The hunter "sweeps" become the enemy's information accumulating on us.
- Loadouts: about six enemy loadouts (sensor rating, signature, crew skill, weapons, speed), randomly assigned. Our ship uses the same fields.
- Celestial bodies: first pass is backdrops for eclipse and cover (line of sight blocked both ways). Later: nebulae that scatter signatures.
- Field: large arena (now 240 km), speeds and ranges scaled with it, zoom and pan everywhere.

## As built (2026-10-23, approved by Dave). Superseded where "Current engine rules" below differs

Detection (`infoMult`, `ourVis`, `enemyVis`, `enemyAI` in the engine)
- Visibility of a ship = exposure (what it is doing) scaled to 0.06 to 0.85, times its loadout signature; venting is fixed at 1.0.
- Our information rate on a contact = our sensor rating x its trace per channel x range falloff x 0.12 if a planet blocks the line x 0.85 if hull is damaged, floored at 0.12 so everyone always has a trace. Each read's precision and weight scale with it, so cold or far ships resolve slowly, hot or near ones quickly. Firing solution time scales with the average rate (0.75x to 2x) and pauses below 0.22.
- Enemy knowledge of us (`know`, 0 to 1.2) grows at 0.4 x vis^2 x their sensor x range falloff per minute and decays when our visibility is under 0.35. One third: aware (hunts and shoots, wide aim error), two thirds: closing, full: firm solution (aim error 2.4 km, cone shrinks). If it drops under 0.15 they lose us and go back to patrol. The old abstract hunter, sweeps and "found" ending are gone; the Enemy fix pips show the best-informed enemy.
- Events (pings, launches, coilgun flashes, bait) add knowledge to every warship, weighed by range.
- Aware ships steer toward where they believe we are (error from their knowledge) and hold about 30 km standoff.

Heat (`sinkStep`, `startVent`, `stopVent`)
- Stored heat only rises. Fill per minute = 1.4 x exposure; going quiet or holding still only slows it. A ping costs about 17 percent of the sink. Nothing drains it except venting.
- Vent (key V): fins out, we are 100 percent visible, sinks drain at 40 percent per minute (2.5 min for a full dump), retract any time. Warnings at 60, 80 and 95 percent. At 100 percent the fins open by themselves and close at 25 percent (the cost of neglect, never a dead end).
- Enemies obey the same rules: random starting heat, capacity by loadout, no vent in the first 5 to 9 minutes. Veteran crews vent early but only when they believe we have no fix; the rest vent at 82 percent regardless; everyone at 100. A venting ship is a thermal blaze (thermal rate x1.6), Dace calls it out, and a ship we had ruled out comes back into play. Only real warships vent, so a vent is also a tell.

Loadouts (`LOADOUTS`): Picket, Hound (sharp, loud), Shade (quiet, weak), Veteran (crew 1.25), Green crew (0.75), Brute (big sinks, hits hard). Our cutter is the plain one. Revealed on the end screen.

Field and bodies: 80 km square (everything scaled x2: speeds, ranges, missile speed, kill and cone sizes, uncertainty). Two stars (bright discs with a glow ring: eclipse works when a ship passes in front of the glow as seen from us) and one or two planets (solid, block sight both ways, ships steer around them). Zoom and pan on the scope and Strategic map; the briefing chart shows the bodies for the seed it will use.

Tuning knobs: P.sinkK, P.ventFull, P.knowK, P.knowDecay, P.enemySink, P.sensR, P.aimSigMax/Min, P.standoff, LOADOUTS table.

## Current engine rules (2026-10-25, matches web/hunt_rt_engine.js)

Field and bodies
- Arena 240 km square. Contacts start 100+ km away. Speeds: creep 1.2, cruise 3, burn 6 km per game minute. Sensor reference range P.sensRef 40 km.
- At most one star per arena (bright disc, eclipse works when a ship crosses its glow as seen from us), plus planets that block sight both ways. Right-click on the scope or map opens the navigation menu.
- Time: 16 real seconds per game minute (P.secPerMin).

Scanning and reads
- Three analysts: Dace (heat), Castellan (reactor), Quill (eclipse/occlusion). Reads are decaying averages (half life 3 min).
- Scanner bars show significance (the classification). The thin line under a bar shows collection progress and turns green with a check at P.readDone (8).
- When an analyst's read on an open contact is complete they stand down on it ("read complete") and stop adding heat. Auto-sweep skips finished channels. Locked contacts keep tracking.
- Active ping: three read rounds on every channel for an open contact. On a locked contact it gives a fresh fix and the firing solution is refreshed after P.pingSolve (0.6 game min, about 10 real seconds). Pings cost heat and alert warships.
- A stale solution (scan older than P.solveStale, 3 min) turns the Fire button into REFRESH SOLUTION, which recalculates on click.

Heat and venting
- Time in the UI is real time now (clock, ETAs, spool, heat clock). The engine still steps in game minutes (16 real seconds each, P.secPerMin); fmtMin and the heat rate convert. Rates below are per real minute.
- The sink fills at P.sinkK (0.7) x exposure / sink size. Speed is five drive settings (20 to 100 percent, 1.2 to 6 km per game minute) plus Redline (9 km per game minute). Rough fill rates for our cutter: idle 4 percent, 20% drive 5, 60% drive 15, full drive about 80, Redline about 240 (under half a minute to full: bursts only; a pegged sink melts the ship, 3 hull and 15 percent systems per game minute pegged, P.meltHull and P.meltSys), active ping adds a spike, spool 3 minutes adds about 15 percent. Going quiet cuts it to almost nothing.
- Heat rate dial (header, under the sink gauge): net fill or drain per real minute, and a clock on the sink reading "full in m:ss" or "empty in m:ss" if nothing changes. Hovering any button or menu item that changes heat (speed, Go quiet, Break contact, the sink/vent cell, Hold still, and the navigation menu) shows a ghost bar and "now -> after" for the rate and the clock. Engine: `heatRate(s, mod)` evaluates exposure on a copy with the action applied.
- The header Heat sink cell is the vent control (also key V). Venting: fins out, visibility 1.0, drains 25 percent of the sink per game minute (P.ventFull 4, about 94 percent per real minute), enough to beat a burning ship with all analysts working. A voluntary vent can be retracted any time, including with missiles incoming.
- Emergency vent: at 100 percent the fins open on their own. They cannot be retracted by hand until stored heat is under P.forcedRetract (80 percent); they close by themselves at P.forcedStop (25 percent).
- Enemies use P.enemyK (1.4), unchanged, with their own sink sizes. Venting enemies are a thermal blaze and Dace calls them out.

Navigation
- Right-click on the scope or the Strategic map: Go here at five drive settings or Redline, or Clear plan. Hold Shift (on the right-click or on the menu pick) to add a waypoint to the plan instead of replacing it. Each waypoint keeps its own speed; route legs are drawn in cyan to red by drive setting. Plan a burn-while-venting leg then a creep leg to return to stealth.

Dog-leg arrival attitude
- Arenas entered after clearing the previous one (no warning): hunters are relaxed and not running silent (visibility x1.25, no prior knowledge of us).
- Arenas entered after leaving a previous arena uncleared: hunters are alerted and running silent (visibility x0.7, starting knowledge 0.7 x warning).

Retreat and spool
- Break contact (mission) spools for 3 game minutes; dog-leg jump spools for 11.25 game minutes (3 real minutes). Spooling is a stealth modifier only (visibility about 0.9, extra heat 0.3), ship speed is 30 percent always, pressing again cancels. Slow targets let the enemy use a tighter cone (0.7 at rest to 1.0 at cruise).

Damage, ammo, salvage
- See docs/salvo_design.md (6-missile salvos, area damage with dropoff, EMP and flare warheads, grid intercept, four-tier hit popups) and docs/salvage_and_parts.md (yields, modules, parts, heat tiers not yet applied).

Contacts, analysts and targeting (2026-10-25, evening)
- Contact right-click menu has two groups. Scan: Active ping, Lock on (Target when locked), Investigate (all three analysts on it until released or done). Navigate: Close, Separate, Evade, Circle. A ruled-out contact can be brought back with Re-analyze (card button or menu); the wrong-call penalty from the dismissal is refunded.
- Analysts stand down on a contact when the read on their channel is complete, or the channel is blind (no screen behind it) for a few minutes. On a locked contact, once the solution is ready and the track is fresh (under about 1.8 min old) they go on hold and add no heat, resuming just before the track goes stale.
- Courses may not end inside a planet's pull (radius + 6 km) or the star's glare (radius + 16 km); the ship is pushed out of those zones.
- Target view: drag on the plot to move the aim point along the track, mouse wheel to tighten or loosen the cone. A solid bracket and LIVE tag means observed within the last 0.8 game minutes (or the target is venting); dashed and PROJECTED means extrapolated from the last scan. Same convention on the scope.


## Redline burns (Oct 25)
Redline is a timed burn, not a speed you sit at by accident: one press of the Redline key is a 30 second burn, two presses 2 minutes, three latch it on, a fourth turns it off. Times are on the mission clock (1 game minute = 16 seconds). When a timed burn ends, the ship goes back to the speed it was at before. Selecting any other speed cancels the burn. Heat and melt rules are unchanged (see above); the burn just bounds how long you can forget it. Engine: `redlineBurn(s)`, `s.burn = {level, prev, until}`.
