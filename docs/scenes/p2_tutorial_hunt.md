# P2: The Tutorial Hunt (built, 2026-10-31)

**Status:** playable. Code: `web/tutorial.js` (inlined into the hunt page by `web/build_hunt_rt.sh`); entry from the walk demo after Ostrow's briefing (`hunt.html?tutorial=tern&return=<page>`), return to `#after_hunt`.
**Where:** the Tern's hunt console (same assets as every hunt for now). **Length:** about 10-15 minutes of play.
**Purpose:** teach the hunt (contacts, analysts, ruling out, lock, solution, fire, heat and venting) with a fixed outcome: Corvane surrenders.

## Set-up
- Fixed seed; four contacts: Corvane, one lure, two ghosts. Corvane flies a Shade-class hull (stealthy) with her guns throttled (she isn't trying to kill anyone yet).
- The Tern's crew on the console: **Riggs** (heat), **Okafor** (reactor), **Sato** (eclipse/visual), **Dunne** (fire control), Ostrow giving orders. No AI: the plot's alerts replace Pell's, and Pell's controls are hidden. (Riggs, Okafor and Sato are minor Tern crew, new here.)
- Mini-mission trims don't apply on the Tern (they're Corvane's ship's departments).

## Ostrow's orders (one at a time; the matching control is highlighted; each step can be skipped)
1. "Clockwork and patience: that's the Tern. Corvane is somewhere in this field, running quiet. Every dot on the scope is a maybe. We find out which maybe is her." *(Understood)*
2. "Put someone on a contact. Pick a contact slip on the left, then press INVESTIGATE, or click one of its H / R / V cells for one analyst: Riggs reads heat, Okafor reads reactors, Sato watches for a silhouette against the bright stuff." *(any analyst assigned; outlines INVESTIGATE and the slip's channel cells)*
3. "Readings build under the contact while they work. Junk reads cold and dead; a ship doesn't. Let them work. Rule out anything that's plainly junk with DISMISS." *(two readings on her, or anything ruled out; outlines DISMISS)*
4. "Contact N. Warm, quiet, keeping to the dark. That's her. Select her slip and LOCK ON." *(Corvane locked; outlines her slip and LOCK ON)*
5. "Dunne's working a firing solution. When it's ready, open the Target view: TARGET at the top, or press 3. FIRE SALVO has a guard: click once to lift it, then click again to fire. We're not here to kill her. We're here to make her stop." *(first volley; outlines the TARGET view key and the orders bank's TARGET key, then FIRE SALVO once the Target view is open)*
6. "Watch your heat. Everything we do warms the sinks. Past three quarters, press VENT to open the fins. She'll see us while they're out, so don't leave them out long." *(vented, or three minutes pass; outlines VENT)*
7. "Again: Target view, lift the guard, fire. She'll shoot back now. Watch the hull, keep moving if you have to, and keep the pressure on." *(her hull at 60%, ours under 45, or six volleys)*

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
- If the player never finds her, there's no hint system beyond step 4 naming her contact number.
