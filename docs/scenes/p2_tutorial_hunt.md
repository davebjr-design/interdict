# P2: The Tutorial Hunt (built, 2026-10-31)

**Status:** playable. Code: `web/tutorial.js` (inlined into the hunt page by `web/build_hunt_rt.sh`); entry from the walk demo after Ostrow's briefing (`hunt.html?tutorial=tern&return=<page>`), return to `#after_hunt`.
**Where:** the Tern's hunt console (same assets as every hunt for now). **Length:** about 4-6 minutes for a player who follows the orders; under 8 at 1x if they do nothing.
**Purpose:** teach the hunt (contacts, analysts, ruling out, lock, solution, fire, heat and venting) with a fixed outcome: Corvane surrenders.

## Set-up
- Fixed seed; four contacts: Corvane, one lure, two ghosts. Corvane flies a Shade-class hull (stealthy) with her guns throttled (she isn't trying to kill anyone yet).
- The Tern's crew on the console: **Riggs** (heat), **Okafor** (reactor), **Sato** (eclipse/visual), **Dunne** (fire control), Ostrow giving orders. No AI: the plot's alerts replace Pell's, and Pell's controls are hidden. (Riggs, Okafor and Sato are minor Tern crew, new here.)
- Mini-mission trims don't apply on the Tern (they're Corvane's ship's departments).

## Ostrow's orders (restructured 2026-11-02)
One order at a time in a box docked over the SHIP zone's bottom row (the breach, spool and Pell cells the Tern hides), so it covers no live control in any view. The header reads "OSTROW · STEP n OF 11 · <title>" with **Skip step** on every step (and **Understood** where there is nothing to press); the control named in the order is outlined. Once Corvane is locked, a one-row bar under the order shows Dunne's solution ("DUNNE: SOLVING 64%, ABOUT 12 S", or "PAUSED: NO ANALYST ON HER"). Every step completes on the player's action, and doing something early counts. If the player waits, the box border pulses at 60% of the step's wait ("Your call. Or press Skip step and I'll do it.") and at 100% Ostrow does it himself, with a one-line order shown under the next step ("That's her. Dunne, lock contact 3."). Skip step does the same at once. After the last order the box collapses to "Volleys away. Watch them land."

| # | Step | Ostrow (short form) | Highlight | Done when | Ostrow does it after |
|---|---|---|---|---|---|
| 1 | Read the board | Four contacts, every one a maybe; Riggs reads heat (H), Okafor reactors (R), Sato watches for an eclipse (V). | the three analyst cards, the contact slips | Understood, or any order given | clock held up to 45 s, then it runs |
| 2 | Investigate | Select contact G (the nearest ghost), press INVESTIGATE. | G's slip, INVESTIGATE | any analyst tasked | 35 s: investigates G |
| 3 | Dismiss the decoy | G reads cold and dead: junk. Select it, DISMISS. | G's slip, DISMISS | any contact other than Corvane ruled out | 45 s: rules out G |
| 4 | Lock on | Contact N. Warm, quiet, keeping to the dark. That's her. LOCK ON. | her slip, LOCK ON | Corvane locked | 40 s: locks her |
| 5 | Hold the track | Dunne solves from a live track: INVESTIGATE with her slip selected, or one H / R / V cell. No eyes, no solution. | INVESTIGATE and her channel cells (or her slip if someone is already on her) | an analyst on her, then Understood or 8 s | 20 s: puts Riggs on her |
| 6 | Set a course | While Dunne works, the helm: right-click open space on the scope, Go here. | the scope (the map on Strategic; TACTICAL on Target) | a flight plan, or any maneuver | 35 s: a short leg at 40% |
| 7 | Try EVASIVE | We weave: reads and Dunne's solve about 10% faster; we're about 20% louder. | EVASIVE | EVASIVE pressed | 30 s |
| 8 | HOLD STILL | Drive off, the quietest we can be. Faster or quieter: that trade is every hunt. | HOLD STILL | still, after evasive | 25 s |
| 9 | Fire | Watch the bar; when ready, open the Target view (TARGET or 3); FIRE SALVO has a guard: click once to lift it, again to fire. | TARGET keys, then FIRE SALVO | first volley at her | 40 s after the solution is ready: Dunne fires |
| 10 | Vent | Launch heat's in the sinks: VENT, and don't leave the fins out long. | VENT | fins opened once | 30 s: opens them (Ostrow pulls them in after about 20 s either way) |
| 11 | Fire again | Lift the guard and fire. She'll shoot back now. | TARGET keys, then FIRE SALVO | second volley at her | 40 s after ready: Dunne fires |

Surrender (below) follows when the second volley lands, or her hull reaches 60%, or ours drops under 45, or four game minutes after step 11 opens.

### Tutorial-only guarantees
None of this reaches a normal hunt: the engine reads `s.tut`, which only `web/tutorial.js` sets (`tools/balance_bot.js` tables are unchanged).
- **Solution:** about 2.2 game minutes from lock to ready (35 real seconds at 1x; EVASIVE or under way about 10% faster). It never bleeds for low certainty, never goes stale, is never cut by a target maneuver, and never pauses as "too faint"; it pauses only while no analyst is on her, which is the lesson of step 5.
- **Eyes on her:** once step 5 is past, if the player pulls every analyst off her for 4 s, Riggs goes back on ("Riggs. Back on her. No eyes, no solution.").
- **Corvane:** drifts at 1.2 km/min, never maneuvers, holds her fire until our first volley has landed, then fires back throttled (35% damage). She can't be dismissed ("Not her. That one reads warm.").
- **No failing states:** no breach, no running quiet, no dismissing her; the only junk lock costs is the usual chase.

### Tested
`tests/tutorial_bots.py` plays the tutorial through the real UI with four players: *literal* (does exactly what the outlined control says, 1x), *skipper* (Skip step on every step, 1x), *idle* (only Understood, otherwise waits, 4x) and *wander* (seeded random legal clicks, 4x). Each must reach the surrender with Corvane alive, the solution bar seen rising to 100%, every highlight on a visible control, and the box never overflowing or covering a live control; the literal player's solution must be ready within 90 real seconds of the lock.

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
- If the player never finds her, step 4 names her contact number and Ostrow locks her after 40 s.
