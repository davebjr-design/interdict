# Game flow (Dave, 2026-10-24)

Modes: underway (in route), hunt (battle arena), space dock, ground missions (later).

## Hunt triggers
- A hunt is a defined, triggered event. Two triggers: an **ambush at a dog-leg turn point** during a route, or arriving at a **mission point**, where the hunt starts at the mission briefing table.
- Hunts are not random encounters while idle.

## Underway (in route)
- Captaining decisions arise here. The captain is called to stations or rooms on the ship to talk to the crew and decide. Narrative advances here.

## Retreat
- Always possible, but the breach drive must **spool** first, and spooling makes us visible. Built: Break contact starts a 3-minute spool (signature ~90 percent, extra heat); pressing again cancels. Emergency hull failure still jumps immediately.

## Pell (AI)
- Using Pell gives the AI's advantages at the cost of higher overall AI utilization (integration). It is one-way: integration cannot be removed once Pell has access. Integration is a campaign-level meter (see glossary).
- (Transcription note: "Palmore" in the dictated message was read as Pell.)

## Transitions and dog-leg arenas (Dave, 2026-10-25)
- **Underway to hunt:** a message such as "Captain to the bridge, arriving at mission site" appears as a mini-mission in the mission tracker. On the bridge, the crew says the briefing is ready at the briefing table; going to the table starts the hunt phase.
- **Ambush starts are fair** (no head start for the enemy).
- **Every dog-leg is an arena.** At each dog-leg turn point the ship stops in an arena and must spool the breach drive to jump to the next waypoint. While spooling it is not in stealth mode (visible, loud).
- **Player choice at a dog-leg:** (a) spool right away and take evasive action in case hunters are present, or (b) clear the contacts in the stopover first, which takes much longer. Same hunt, chosen risk versus time.
- Design consequence to tune: a spool of 3 minutes in a 240 km field is probably too safe, so "spool immediately" would always win. Spool time, how visible it is, and whether hunters are present at a given dog-leg need to make clearing contacts a real alternative (payoffs: salvage, lower relay exposure, safer next leg).

## Dog-leg bot results (2026-10-25)
Spool is 11.25 game minutes (3 real minutes at 16 real seconds per game minute); mission-mode Break contact keeps 3 game minutes. Dog-leg arenas have hunters 50 percent of the time in the test (1 or 2 hunters; contacts 30-90 km away); a faint arrival cue (quiet, uneasy, wary) matches presence about two times in three.
Mechanics added: spool alerts every hunter in range, the ship moves at 30 percent speed while spooling, enemy volleys do 2x damage to a spooling ship, a left-behind hunter gives the next sector's hunters advance warning (their knowledge starts at 63 percent for warn 0.9).
Bot results (about 120 arenas, perfect-identification bot):
- Hunters absent: spool now is free (hull 100, 11 min); clearing wastes 40 min.
- Hunters present: spool now averages hull 52, 47 percent "close" (hull under 50), 4 percent emergency breach, 11 min. Clear first averages hull 73, 11 percent close, 13 percent emergency breach (bot-limited), about 29 min, plus salvage.
- Without the 2x spool damage and the speed cap, spool now was near-risk-free and always best; with them the choice depends on how suspicious the arena looks.
- Advance warning only hurts players who then try to hide or clear (clear failure 6 to 13 percent with strong warning); a player who spools at once is already fully exposed.
