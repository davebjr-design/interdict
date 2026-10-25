# Game flow (Dave, 2026-10-24)

Modes: underway (in route), hunt (battle arena), space dock, ground missions (later).

## Hunt triggers
- A hunt is a defined, triggered event. Two triggers: an **ambush at a dog-leg turn point** during a route, or arriving at a **mission point**, where the hunt starts at the mission briefing table.
- Hunts are not random encounters while idle.

## Underway (in route)
- Captaining decisions arise here. The captain is called to stations or rooms on the ship to talk to the crew and decide. Narrative advances here.

## Retreat
- Always possible, but the breach drive must **spool** first, and spooling makes us more visible (see Spool rules). Break contact starts a 3 game minute spool; pressing again cancels. Emergency hull failure still jumps immediately.

## Pell (AI)
- Using Pell gives the AI's advantages at the cost of higher overall AI utilization (integration). It is one-way: integration cannot be removed once Pell has access. Integration is a campaign-level meter (see glossary).
- (Transcription note: "Palmore" in the dictated message was read as Pell.)

## Transitions and dog-leg arenas (Dave, 2026-10-25)
- **Underway to hunt:** a message such as "Captain to the bridge, arriving at mission site" appears as a mini-mission in the mission tracker. On the bridge, the crew says the briefing is ready at the briefing table; going to the table starts the hunt phase.
- **Ambush starts are fair** (no head start for the enemy).
- **Every dog-leg is an arena.** At each dog-leg turn point the ship stops in an arena and must spool the breach drive to jump to the next waypoint. While spooling it is not in stealth mode (visible, loud).
- **Player choice at a dog-leg:** (a) spool right away and take evasive action in case hunters are present, or (b) clear the contacts in the stopover first, which takes much longer. Same hunt, chosen risk versus time.
- Design consequence to tune: a spool of 3 minutes in a 240 km field is probably too safe, so "spool immediately" would always win. Spool time, how visible it is, and whether hunters are present at a given dog-leg need to make clearing contacts a real alternative (payoffs: salvage, lower relay exposure, safer next leg).

## Spool rules (revised 2026-10-25)
- Spooling alerts enemies only the way any hunt activity does: it is a stealth modifier (we show at about 90 percent visibility, extra heat). No special alert burst.
- Ship speed is 30 percent while spooling, in every mode.
- Enemy salvos are not given bonus damage. Instead a slower target lets the enemy use a tighter cone (cone factor 0.7 at rest up to 1.0 at cruise speed), which raises damage on slow or still ships. This applies in all hunts, not just spooling.
- Spool is 11.25 game minutes at dog-legs (3 real minutes); mission Break contact is 3 game minutes.

## Bot results with the revised rules (about 100 to 120 arenas)
- Hunters absent: spool now is free (hull 100, 11 min); clear first wastes about 38 min.
- Hunters present (30 to 100 km away): spool now averages hull 73 with about 5 percent "close" and no failures; clear first averages hull 64 with 15 percent close and about 20 percent emergency breach (the bot plays a full two-ship hunt), about 26 min.
- Finding: with only the stealth modifier and the slow-speed rule, spooling at once is the safer choice almost always, and "that was close" moments are rare. The earlier version with a spool alert burst and doubled damage made the choice real (spool: 47 percent close). Levers that stay inside the rules: hunters closer in suspicious arenas, a longer spool, higher enemy fire rate, or a stronger penalty for leaving hunters behind.
- General hunt baseline moved to about 68 percent win, 31 percent breach after the tighter-cone-when-slow rule; needs a hunt balance pass.

## Underway: how it should feel (notes, not built)
- Mostly calm, a place to breathe between hunts. The ship is a place with rooms and people.
- Messages arrive as calls: "Captain to the bridge, arriving at mission site," a crew member asking for you, a companion wanting a word. Each call adds an entry to a **mini-mission tracker**, which also appears in the space dock. Tracker entries cover companion encounters, command decisions, mission arrivals and dock tasks.
- Going where you are called opens that scene: bridge (arrival and briefing, then the briefing table starts the hunt), stations and rooms (talk to officers, make captaining decisions, narrative advances), dock (equipment, repairs).
- Every dog-leg is a stopover arena; the next leg begins when the drive spools. Each leg should offer at least one captaining decision or crew moment so travel is not dead time.
- Pell is consulted here too; integration only moves one way.
