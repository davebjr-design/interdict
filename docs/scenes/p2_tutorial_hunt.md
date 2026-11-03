# P2: The Tutorial Hunt (built 2026-10-31; contact order and the fixed exchange of fire 2026-11-03)

**Status:** playable. Code: `web/tutorial.js` (inlined into the hunt page by `web/build_hunt_rt.sh`); entry from the walk demo after Ostrow's briefing (`hunt.html?tutorial=tern&return=<page>`), return to `#after_hunt`.
**Where:** the Tern's hunt console (same assets as every hunt for now). **Length:** 17 orders; about 3 minutes of running clock at 1x for a player who does each order at once (the literal bot: 11.2 game minutes, 3.0 minutes of clock), plus reading time with the clock stopped (28 boxes); a person finding each control adds clock time, so about 4-5 minutes of clock in practice. A player who does nothing never leaves step 1: nothing advances on its own.
**Purpose:** teach the hunt (contacts, analysts, ruling out, lock, solution, fire, heat and venting) with a fixed outcome: Corvane surrenders.

## Set-up
- Fixed seed; four contacts: Corvane, one lure, two ghosts. Corvane flies a Shade-class hull (stealthy) with her guns throttled (she isn't trying to kill anyone yet).
- The Tern's crew on the console: **Riggs** (heat), **Okafor** (reactor), **Sato** (eclipse/visual), **Dunne** (fire control), Ostrow giving orders. No AI: the plot's alerts replace Pell's, and Pell's controls are hidden. (Riggs, Okafor and Sato are minor Tern crew, new here.)
- Mini-mission trims don't apply on the Tern (they're Corvane's ship's departments).

## Ostrow's orders (reworked 2026-11-02 after Dave's playtest)
One order at a time in a box docked over the SHIP zone's bottom row (the breach, spool and Pell cells the Tern hides), so it covers no live control in any view. The header reads "OSTROW · STEP n OF 17 · <title>"; the control named in the order is outlined. Once Corvane is locked, a one-row bar under the order shows Dunne's solution ("DUNNE: SOLVING 64%, ABOUT 12 S", or "PAUSED: NO ANALYST ON HER").

**Pause while reading.** The hunt starts paused. Every order, and every note from Ostrow with something to read, stops the engine while it is up (the engine's hold: `s.hold` and `__tutHold`, and the tutorial's `E.tick` does nothing, so a direct call can't advance it either); the header reads CLOCK STOPPED and the box has **Understood**. Understood resumes the clock exactly as it was (still paused if the player had paused it, same speed). The step then completes when the player does it, and doing something early counts. If an order's words change because the situation did (readings settle, the solution comes ready, another view is open), it is read again with the clock stopped. There are no idle timers: nothing re-prompts and nothing is done for the player. **Skip step** (a tester convenience) has Ostrow do the step; where the step needs time (readings, the solution) it completes when that arrives. On the Tern, PAUSE leaves the displays up and orders still go in while paused (in a normal hunt pausing blanks the displays).

**Identification from the readings.** Contact 3 is "contact 3" until the engine's own evidence says otherwise: `E.advice` calls it a ship, or `E.classify` is 90% sure it is real on two or more channels. Before that Ostrow never says ship, Corvane, her or she about it, and LOCK ON is not outlined. Decoys are ruled out on their own readings: the dismiss orders are built from what the H, R and V channels show (cold or warm, reactor or none, stars blocked, seen through, or nothing behind it to eclipse). Dismissing contact 3 is refused in words that match what is known ("We haven't read contact 3 yet" / "...readings aren't junk" / "Not her. That one is a ship.").

Ostrow reads the board **in contact order, 1, 2, 3, 4, all the way through** (2026-11-03, Dave): nothing is fired on until every contact has been read. The steps are built per hunt from the scenario (`buildSteps()`): each contact before Corvane gets a read and a ruling-out; Corvane's contact gets a read (identification gate), lock and track; each contact after her is investigated, then one analyst is sent back to her (the solve needs eyes), then it is ruled out. With the fixed seed Corvane is contact 3, so the list is:

| # | Step | Ostrow (short form) | Outlined | Done when | Skip step |
|---|---|---|---|---|---|
| 1 | Start the clock | We're stopped. PAUSE holds the clock and orders still go in; 1x is real time, 2x for quiet stretches. RESUME (or P) to start. | PAUSE, the speed keys, the mission clock | the clock runs | starts it |
| 2 | Read the board | Four contacts, every slip reads ?; Riggs heat (H), Okafor reactors (R), Sato eclipse (V): a solid hull blocks the stars. | analyst cards, the slips | Understood | - |
| 3 | Read contact 1 | "One contact at a time, in order, all the way through. We don't fire on anything until we know what everything out there is. Contact 1: INVESTIGATE... let the bars settle." | 1's slip, INVESTIGATE | an analyst has been on 1 and its readings settle | investigates 1 |
| 4 | Rule out contact 1 | Built from 1's readings, e.g. "Contact 1: cold, a faint reactor flutter, and nothing behind it to eclipse. Cold and drifting: junk." DISMISS. | 1's slip, DISMISS | 1 ruled out | rules it out |
| 5 | Read contact 2 | Contact 2 next: INVESTIGATE, let the bars settle. | 2's slip, INVESTIGATE | 2 read and settled | investigates 2 |
| 6 | Rule out contact 2 | "Contact 2: warm, ..., and Sato sees stars right through it. Heat with no hull behind it: a decoy." DISMISS. | 2's slip, DISMISS | 2 ruled out | rules it out |
| 7 | Read contact 3 | Now contact 3: the readings decide what it is, not a hunch. | 3's slip, INVESTIGATE | the readings identify a ship | investigates 3 |
| 8 | Lock on | "Contact 3: warm, a live reactor, and it blocks the stars. Hot, live and solid: that's a ship. That'll be Corvane." LOCK ON. | her slip, LOCK ON | Corvane locked | locks her |
| 9 | Hold the track | Dunne solves from a live track: keep an analyst on her. LOCK fresh, TRACK ageing, LAST lost. | her slip's % cell | an analyst on her, Understood | puts Riggs on her |
| 10 | Check contact 4 | "Nobody's on to us, so we finish the board while Dunne solves. Contact 4: select it and press INVESTIGATE." Then (read again, clock stopped): "That took all three off her, and the solve stops without eyes. Click her R cell: Okafor goes back to her, the other two finish contact 4." (Sato and her V cell instead when 4 has nothing behind it to eclipse; fixed when first asked.) An unread contact's slip is compact and has no channel cells, so INVESTIGATE then sending one back is the only way in. | 4's slip and INVESTIGATE, then her R cell | 4 read and settled, with an analyst on her | investigates 4 and sends Okafor back |
| 11 | Rule out contact 4 | From 4's readings, as step 4. DISMISS. | 4's slip, DISMISS | 4 ruled out | rules it out |
| 12 | Set a course | Now the helm: right-click open space, Go here. | the scope (the map on Strategic; TACTICAL on Target) | a flight plan or any maneuver | a short leg at 40% |
| 13 | Try EVASIVE | Reads (and the solve, if it isn't ready yet) run about 10% faster; we're louder and hotter. | EVASIVE | EVASIVE pressed | |
| 14 | HOLD STILL | Drive off, the quietest we can be. Faster or quieter: that trade is every hunt. | HOLD STILL | still, after evasive | |
| 15 | Fire | When ready, open the Target view; then the cone note (below); then "FIRE SALVO has a guard... HIT CHANCE reads 100%: the cone is wide enough that one of the six finds her." | TARGET keys, then FIRE SALVO | first volley at her | Dunne fires (wide cone) |
| 16 | Vent | That launch dumped heat in the sink; VENT, and not for long. | VENT, the heat sink | fins opened once | opens them |
| 17 | Fire again | "Lift the guard and fire again. Once she knows where we are, she'll answer. Don't give her time." | TARGET keys, then FIRE SALVO | second volley at her | Dunne fires when ready and reloaded |

If the scenario put Corvane elsewhere, the same pattern holds (e.g. Corvane as contact 1: read 1, lock, track, then check 2, 3, 4 with one analyst left on her). Ostrow never names her, or says ship, her or she, before the engine's readings identify her.

**Notes** (each stops the clock until Understood, and pulses its gauge in cyan): on the first INVESTIGATE, *sensors* ("Sensor work isn't free. SENSE just lit beside DRIVE and PING... It all goes in the sink, the tall gauge. At the red line, we vent": the SENSE, DRIVE and PING lamps and the sink) and *seen* ("heat is noise. SEEN BY ENEMY is how loud we look": the signature meter); Riggs's first heat reading ("the H bar. Long is warm, short is cold. Ships run warm; junk runs cold"); EVASIVE engaged ("SEEN BY ENEMY climbs and the heat rate needle swings right": signature meter and heat-rate dial); and the guarantee lines below (Riggs back on her, fins in). Launch heat is in step 15's order, which comes up the moment the first volley is away. The exchange of fire adds three dialogue notes, each with the clock stopped:
- *cone* (on the Target view with the solution ready, before the fire order; Dunne's cone is set to 16 km, the console default is 8): **OSTROW** "Wide cone. I'd rather not kill her if she might surrender." **DUNNE** "If she gets a good lock on us, we're open to a counterattack. So we hit once, hard enough to get her attention, and don't give her time." (pulses CONE WIDTH and HIT CHANCE)
- *hit1* (our first hit lands): **DUNNE** "Hit. Her hull is at 68 percent, and she knows we're here. She'll answer."
- *answer* (her one volley lands): **RIGGS** "We're hit. Hull 92 percent, plating only." **OSTROW** "That was her answer. We're still in this."

Surrender (below) follows once our second volley and her answer have both landed and been read (if her answer somehow never comes, 3 game minutes after our second hit), or if our hull drops under 45 (it can't: her one answer does 8-12 points).

### Tutorial-only guarantees
None of this reaches a normal hunt: the engine reads `s.tut`, which only `web/tutorial.js` sets (`tools/balance_bot.js` tables are unchanged).
- **Solution:** about 2.2 game minutes from lock to ready (35 real seconds at 1x; EVASIVE or under way about 10% faster). It never bleeds for low certainty, never goes stale, is never cut by a target maneuver, and never pauses as "too faint"; it pauses only while no analyst is on her, which is the lesson of step 9 (Hold the track) and step 10 (Check contact 4).
- **Eyes on her:** once Hold the track is past (step 9), if the player pulls every analyst off her for a quarter of a game minute (4 s of clock at 1x), Riggs goes back on ("Riggs. Back on her. No eyes, no solution.", a note).
- **Fins:** from step 15 on, Ostrow pulls the fins in after 1.2 game minutes out (a note).
- **The hit (s.tut.sure, s.tut.bands):** every volley of ours on her lands, whatever the aim or cone (no scatter-grid cut, no miss: if no warhead would reach her, the nearest is put at half kill radius). The first hit leaves her at 58-68% hull, the second at 38-42%; she is never destroyed. The Target view's HIT CHANCE reads 100% (the engine's `dmgEst` says so for her in the tutorial) and its tooltip says why ("Dunne's wide cone. One of the six will find her.").
- **Her answer (s.tut.foeSure, foeDmg):** 0.3 game minutes after our first hit she fires once (her reach is unlimited and her missiles fly at 60 km/min, about 30 s of clock), it lands, for 8-12 hull points; then she holds her fire.
- **Corvane:** drifts at 1.2 km/min, never maneuvers, holds her fire until our first volley has landed. She can't be dismissed ("Not her. That one is a ship.").
- **No failing states:** no breach, no running quiet, no dismissing her; the only junk lock costs is the usual chase.

### Tested
`tests/tutorial_bots.py` plays the tutorial through the real UI with four players. *literal* starts the clock, reads each box for about a second, presses Understood and does exactly what is outlined (1x); *skipper* presses Skip step on every step and Understood on every note (1x); *wander* makes seeded random legal clicks, including PAUSE and the speed keys, and presses Understood about a third of the time (4x); *idle* never acts. For all four: game time never moves while a box is being read or the clock is paused, no page errors, every outline on a visible control, the box never overflows or covers a live control, and the box never calls contact 3 a ship, Corvane, her or she before the readings identify it. literal and skipper reach the surrender with Corvane alive and the solution bar seen rising to 100%; literal's solution is ready within 90 s of running clock at 1x (measured: 35 s), no step was done for it, and game time advances after each Understood. wander must keep Corvane alive (in the seeded run it locks her and gets the solution to 96% in 5 real minutes without firing). idle: 12 s at the start pause and 10 s with the first order up, game time unchanged. `tests/hunt_pages.py` checks the paused start, that contact 3 is unnamed before any reading (slip and box), and plays the steps through the engine to the surrender.

Measured 2026-11-03 (17 steps): literal 11.2 game minutes = 3.0 minutes of running clock at 1x, 28 boxes read, 4.2 real minutes in all; her hull 100 -> 68 -> 42%, ours 100 -> 92; skipper 2.8 minutes of clock. (Before, 16 steps: literal 2.1 minutes of clock, 21 boxes.) literal also checks it read the contacts in order 1, 2, 3, 4, that the first hit left her at 58-68%, and that her one answer landed with our hull well above 45; `tests/hunt_pages.py` checks the same through the engine plus both hits landing her at 38-42%.

## The surrender (fixed outcome)
The hunt pauses. A low-power pulsed laser lights the Tern: the challenge-laser mechanic, used as a message.
- SATO: "Laser on us, Captain. Low power, pulsed. It's not a weapon. It's a message."
- CORVANE (by laser): *"Hold your fire, Ostrow. I'll take visitors. Send me the new one."* (If our hull went under 45 before we fired a shot: *"Enough, Ostrow. Nobody needs to die tonight. Send me the new one."*)
- OSTROW: "...She asked for you. Get to the airlock."
Back on the Tern: "She's holding still and her guns are cold. She asked for the new hand. I don't like that." Tracker: *Report to the airlock.*

## Why "send me the new one"
Corvane knows who is aboard the Tern (Pell told her, P3 POV sheet). Asking for the probationer is her first move in the standoff: she wants someone with no history to hear her case. It also seeds P3 R1, where she greets the player by role, and the R5 callback ("You asked Ostrow what happens if I'm right").

## Isolation (2026-11-02)
The hunt page's `TUT` flag keeps the Tern clean: no trims (URL or localStorage), no saved or carried integration, no `localStorage` writes, no decision moments, and the Pell gate hides PELL ASSIST, PELL ACTS, the INTEGRATION gauge, the PELL heat lamp and "Pell" in the SHIP zone header. Display names go through `crewName()`, so the Target view reads FOLLOW DUNNE and the aim marker "Dunne". BREACH and GO QUIET are hidden and their engine calls stubbed (Ostrow doesn't run), so the surrender can't be triggered by a jump. `tests/hunt_pages.py` checks all of this and that every highlight lands on a visible control.

## Known gaps
- A player who reads out of order is not stopped (earlier actions count), but the orders keep walking the board in order.
- The 'they have a jump on us because we're new' issue is left out on purpose (Dave, 2026-11-03).
- PAUSE behaves differently here (displays stay up, orders go in) than in a normal hunt (displays blank, the pause box blocks orders). Decide whether normal hunts should match.
- With 28 boxes to read, a reading player may find the stops frequent; the notes could be trimmed if playtests say so.
