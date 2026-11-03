# P2: The Tutorial Hunt (built, 2026-10-31)

**Status:** playable. Code: `web/tutorial.js` (inlined into the hunt page by `web/build_hunt_rt.sh`); entry from the walk demo after Ostrow's briefing (`hunt.html?tutorial=tern&return=<page>`), return to `#after_hunt`.
**Where:** the Tern's hunt console (same assets as every hunt for now). **Length:** about 2 minutes of running clock at 1x for a player who does each order at once (the literal bot: 7.7 game minutes, 2.1 minutes of clock), plus reading time with the clock stopped (21 boxes); a person finding each control adds clock time, so about 3-4 minutes of clock in practice. A player who does nothing never leaves step 1: nothing advances on its own.
**Purpose:** teach the hunt (contacts, analysts, ruling out, lock, solution, fire, heat and venting) with a fixed outcome: Corvane surrenders.

## Set-up
- Fixed seed; four contacts: Corvane, one lure, two ghosts. Corvane flies a Shade-class hull (stealthy) with her guns throttled (she isn't trying to kill anyone yet).
- The Tern's crew on the console: **Riggs** (heat), **Okafor** (reactor), **Sato** (eclipse/visual), **Dunne** (fire control), Ostrow giving orders. No AI: the plot's alerts replace Pell's, and Pell's controls are hidden. (Riggs, Okafor and Sato are minor Tern crew, new here.)
- Mini-mission trims don't apply on the Tern (they're Corvane's ship's departments).

## Ostrow's orders (reworked 2026-11-02 after Dave's playtest)
One order at a time in a box docked over the SHIP zone's bottom row (the breach, spool and Pell cells the Tern hides), so it covers no live control in any view. The header reads "OSTROW · STEP n OF 16 · <title>"; the control named in the order is outlined. Once Corvane is locked, a one-row bar under the order shows Dunne's solution ("DUNNE: SOLVING 64%, ABOUT 12 S", or "PAUSED: NO ANALYST ON HER").

**Pause while reading.** The hunt starts paused. Every order, and every note from Ostrow with something to read, stops the engine while it is up (the engine's hold: `s.hold` and `__tutHold`, and the tutorial's `E.tick` does nothing, so a direct call can't advance it either); the header reads CLOCK STOPPED and the box has **Understood**. Understood resumes the clock exactly as it was (still paused if the player had paused it, same speed). The step then completes when the player does it, and doing something early counts. If an order's words change because the situation did (readings settle, the solution comes ready, another view is open), it is read again with the clock stopped. There are no idle timers: nothing re-prompts and nothing is done for the player. **Skip step** (a tester convenience) has Ostrow do the step; where the step needs time (readings, the solution) it completes when that arrives. On the Tern, PAUSE leaves the displays up and orders still go in while paused (in a normal hunt pausing blanks the displays).

**Identification from the readings.** Contact 3 is "contact 3" until the engine's own evidence says otherwise: `E.advice` calls it a ship, or `E.classify` is 90% sure it is real on two or more channels. Before that Ostrow never says ship, Corvane, her or she about it, and LOCK ON is not outlined. Decoys are ruled out on their own readings: the dismiss orders are built from what the H, R and V channels show (cold or warm, reactor or none, stars blocked, seen through, or nothing behind it to eclipse). Dismissing contact 3 is refused in words that match what is known ("We haven't read contact 3 yet" / "...readings aren't junk" / "Not her. That one is a ship.").

| # | Step | Ostrow (short form) | Outlined | Done when | Skip step |
|---|---|---|---|---|---|
| 1 | Start the clock | We're stopped. PAUSE holds the clock and orders still go in; 1x is real time, 2x for quiet stretches. RESUME (or P) to start. | PAUSE, the speed keys, the mission clock | the clock runs (RESUME, P, or a speed key) | starts it |
| 2 | Read the board | Four contacts, every slip reads ?; Riggs heat (H), Okafor reactors (R), Sato eclipse (V): a solid hull blocks the stars. | analyst cards, the slips | Understood | - |
| 3 | Investigate | One at a time: contact 4 (nearest), INVESTIGATE. | contact 4's slip, INVESTIGATE | any analyst tasked | investigates 4 |
| 4 | Read the channels | The H, R, V bars fill as readings come in; let them settle (2x if slow). | contact 4's slip | 4's readings settle (`E.advice` makes a call) | puts the analysts on 4 |
| 5 | Rule it out | "Contact 4: cold, no reactor, and nothing behind it to eclipse. Cold and drifting: junk." DISMISS. | 4's slip, DISMISS | 4 ruled out | rules it out |
| 6 | Next contact | Contact 2: INVESTIGATE, let it settle. | 2's slip, INVESTIGATE | 2's readings settle | investigates 2 |
| 7 | Rule out the decoy | "Contact 2: warm, a live reactor, and Sato sees stars right through it. Heat with no hull behind it: a decoy." DISMISS. | 2's slip, DISMISS | 2 ruled out | rules it out |
| 8 | Investigate again | Now contact 3: the readings decide what it is, not a hunch. | 3's slip, INVESTIGATE | the readings identify a ship | investigates 3 |
| 9 | Lock on | "Contact 3: warm, a live reactor, and it blocks the stars. Hot, live and solid: that's a ship. That'll be Corvane." LOCK ON. | her slip, LOCK ON | Corvane locked | locks her |
| 10 | Hold the track | Dunne solves from a live track: keep an analyst on her. The % on her slip: LOCK fresh, TRACK ageing, LAST lost. | her slip's % cell (INVESTIGATE if nobody is on her) | an analyst on her, Understood | puts Riggs on her |
| 11 | Set a course | While Dunne works, the helm: right-click open space, Go here. | the scope (the map on Strategic; TACTICAL on Target) | a flight plan or any maneuver | a short leg at 40% |
| 12 | Try EVASIVE | Reads and the solve run about 10% faster; we're louder and hotter. | EVASIVE | EVASIVE pressed | |
| 13 | HOLD STILL | Drive off, the quietest we can be. Faster or quieter: that trade is every hunt. | HOLD STILL | still, after evasive | |
| 14 | Fire | Watch the bar; when ready, open the Target view (TARGET or 3); FIRE SALVO has a guard: click once to lift it, again to fire. | TARGET keys, then FIRE SALVO | first volley at her | Dunne fires when the solution is ready |
| 15 | Vent | That launch dumped heat in the sink; VENT, and not for long. | VENT, the heat sink | fins opened once | opens them |
| 16 | Fire again | Lift the guard and fire. She'll shoot back now. | TARGET keys, then FIRE SALVO | second volley at her | Dunne fires when ready and reloaded |

**Notes** (each stops the clock until Understood, and pulses its gauge in cyan): on the first INVESTIGATE, *sensors* ("Sensor work isn't free. SENSE just lit beside DRIVE and PING... It all goes in the sink, the tall gauge. At the red line, we vent": the SENSE, DRIVE and PING lamps and the sink) and *seen* ("heat is noise. SEEN BY ENEMY is how loud we look": the signature meter); Riggs's first heat reading ("the H bar. Long is warm, short is cold. Ships run warm; junk runs cold"); EVASIVE engaged ("SEEN BY ENEMY climbs and the heat rate needle swings right": signature meter and heat-rate dial); and the guarantee lines below (Riggs back on her, fins in). Launch heat is in step 15's order, which comes up the moment the first volley is away.

Surrender (below) follows when the second volley lands, or her hull reaches 60%, or ours drops under 45. There is no timed fallback.

### Tutorial-only guarantees
None of this reaches a normal hunt: the engine reads `s.tut`, which only `web/tutorial.js` sets (`tools/balance_bot.js` tables are unchanged).
- **Solution:** about 2.2 game minutes from lock to ready (35 real seconds at 1x; EVASIVE or under way about 10% faster). It never bleeds for low certainty, never goes stale, is never cut by a target maneuver, and never pauses as "too faint"; it pauses only while no analyst is on her, which is the lesson of step 10.
- **Eyes on her:** once step 10 is past, if the player pulls every analyst off her for a quarter of a game minute (4 s of clock at 1x), Riggs goes back on ("Riggs. Back on her. No eyes, no solution.", a note).
- **Fins:** from step 15 on, Ostrow pulls the fins in after 1.2 game minutes out (a note).
- **Corvane:** drifts at 1.2 km/min, never maneuvers, holds her fire until our first volley has landed, then fires back throttled (35% damage). She can't be dismissed ("Not her. That one reads warm.").
- **No failing states:** no breach, no running quiet, no dismissing her; the only junk lock costs is the usual chase.

### Tested
`tests/tutorial_bots.py` plays the tutorial through the real UI with four players. *literal* starts the clock, reads each box for about a second, presses Understood and does exactly what is outlined (1x); *skipper* presses Skip step on every step and Understood on every note (1x); *wander* makes seeded random legal clicks, including PAUSE and the speed keys, and presses Understood about a third of the time (4x); *idle* never acts. For all four: game time never moves while a box is being read or the clock is paused, no page errors, every outline on a visible control, the box never overflows or covers a live control, and the box never calls contact 3 a ship, Corvane, her or she before the readings identify it. literal and skipper reach the surrender with Corvane alive and the solution bar seen rising to 100%; literal's solution is ready within 90 s of running clock at 1x (measured: 35 s), no step was done for it, and game time advances after each Understood. wander must keep Corvane alive (in the seeded run it locks her and gets the solution to 96% in 5 real minutes without firing). idle: 12 s at the start pause and 10 s with the first order up, game time unchanged. `tests/hunt_pages.py` checks the paused start, that contact 3 is unnamed before any reading (slip and box), and plays the steps through the engine to the surrender.

Measured 2026-11-02: literal 7.7 game minutes = 2.1 minutes of running clock at 1x, 21 boxes read, 3.0 real minutes in all; skipper 2.2 minutes of clock.

## The surrender (fixed outcome)
The hunt pauses. A low-power pulsed laser lights the Tern: the challenge-laser mechanic, used as a message.
- SATO: "Laser on us, Captain. Low power, pulsed. It's not a weapon. It's a message."
- CORVANE (by laser): *"Hold your fire, Ostrow. I'll take visitors. Send me the new one."* (If our hull went under 45 before we fired a shot: *"Enough, Ostrow. Nobody needs to die tonight. Send me the new one."*)
- OSTROW: "...She asked for you. Get to the airlock."
Back on the Tern: "She's holding still and her guns are cold. She asked for you, by name. I don't like that." Tracker: *Report to the airlock.*

## Why "send me the new one"
Corvane knows who is aboard the Tern (Pell told her, P3 POV sheet). Asking for the probationer is her first move in the standoff: she wants someone with no history to hear her case. It also seeds P3 R1, where she greets the player by role, and the R5 callback ("You asked Ostrow what happens if I'm right").

## Isolation (2026-11-02)
The hunt page's `TUT` flag keeps the Tern clean: no trims (URL or localStorage), no saved or carried integration, no `localStorage` writes, no decision moments, and the Pell gate hides PELL ASSIST, PELL ACTS, the INTEGRATION gauge, the PELL heat lamp and "Pell" in the SHIP zone header. Display names go through `crewName()`, so the Target view reads FOLLOW DUNNE and the aim marker "Dunne". BREACH and GO QUIET are hidden and their engine calls stubbed (Ostrow doesn't run), so the surrender can't be triggered by a jump. `tests/hunt_pages.py` checks all of this and that every highlight lands on a visible control.

## Known gaps
- Corvane's damage is throttled to 35%; tune so her return fire is felt but never lethal.
- Ostrow names the contacts to read in order (4, then 2, then 3); a player who investigates contact 1 or goes to 3 first is not stopped, and earlier actions count, but the orders keep pointing at the named contact. Contact 1 is never discussed.
- PAUSE behaves differently here (displays stay up, orders go in) than in a normal hunt (displays blank, the pause box blocks orders). Decide whether normal hunts should match.
- With 21 boxes to read, a reading player may find the stops frequent; the notes could be trimmed if playtests say so.
