# Ship conditions — naming and behaviours (proposal, 2026-11-20)

## 1. Naming: recommendation
Three options were weighed.
- **Condition 1/2/3**: authentic and short, but numbers carry no meaning and the order is famously ambiguous (is 1 the worst?). Poor for a new player.
- **Red/Yellow/Blue alert**: instantly readable and the colour is a ready HUD lamp, but colour alone fails colour-blind players and Blue means nothing without a legend.
- **Descriptive names** (Battle Stations, Silent Running): the name tells you what the crew will do, and the player says them aloud in the radial. But they mix two different ideas (how ready the crew is, and how loud the ship is).

**Recommendation: two independent axes, descriptive names, colour as a secondary cue.**
- **Readiness** (how the crew is posted): *Standing Watch* (green) / *Alert* (amber) / *Battle Stations* (red). One-word radial label, a lamp with a distinct shape per level (circle, triangle, square) so colour is never the only cue.
- **Posture** (how the ship moves and emits): already built as presets: *Silent Running* / *Cruise* / *Combat* / *Evade*. Silent Running is a posture, not a readiness, so "Battle Stations + Silent Running" (the ambush) is a legal, meaningful pair.
- **Overlays** (events, not choices): *Brace*, *Damage Control* (fire, breach), *Jump Prep*. They sit on top of any readiness. Brace stays separate from posture (decided earlier).
- The old "Condition N" and colour-alert words are accepted as voice aliases ("go to red", "condition one" = Battle Stations).

## 2. Readiness behaviours
| | Standing Watch (green) | Alert (amber) | Battle Stations (red) |
|---|---|---|---|
| When | Transit, docked, quiet space, a long hunt with nothing on scope | Unidentified contact, hostile transmission, entering a known hunting ground, before any jump | Hostile inside weapon range, vampire inbound, ship damaged, ordered by the captain |
| Crew | Watch rota: one officer per critical station, others off-shift in the mess or quarters; stations on Auto | All officers at their stations within about 60 s, off-shift recalled; Auto or Supervised | Everyone at station or at a brace point; non-essential crew sent below; no wandering |
| Station autonomy | Auto everywhere | Auto, with a call-out on anything new | Supervised or Hands-on at the stations the player chooses; the rest Auto |
| Lighting | Full white | Dimmed with amber trim on corridors | Red-tinted low light, consoles brightest; corridor strips pulse on transitions |
| Audio | Ambient hum, relaxed chatter | Quieter chatter, a soft two-tone on entry | Terse comms only, klaxon once on entry then silent, heartbeat-style low pulse on a vampire |
| Hatches and doors | Open | Pressure doors on non-crew decks close | All pressure doors sealed; the player can open one (slow cycle, noisy) |
| Brace | Not needed | Auto-brace doctrine armed: crew brace on hard evasion or jump spool | Crew keep one hand on a rail or sit strapped in; brace on any order is near instant; the avatar must brace |
| Comms discipline | Free calls | Calls answered, one line each | Calls answered, short form only, queued by priority |
| Sensors and PD | Passive only; PD standby | Passive plus occasional probe; PD armed | PD hot, sensors at the posture's limit, auto-fire on missiles |
| Avatar movement | Free | Free, a walk-to-station prompt appears | Walk speed reduced in corridors, running disabled, a "get to a station or rail" prompt appears if unbraced for 10 s |
| Call frequency | Low; the ship only speaks up on a change | Medium; reports new contacts and state changes | High but filtered: only what needs a decision |
| Fatigue | Recovers off-shift | Neutral | Builds; efficiency drifts down after long periods |

## 3. Posture behaviours (existing presets)
- **Silent Running**: drives and active sensors off, passive only, no pings or PD hot unless a missile is inbound, hatches closed to damp noise, voice lines whispered (quiet caption style), lowest signature, slowest.
- **Cruise**: efficient burn, passive plus periodic sweeps.
- **Combat**: full sensors and PD, drives available up to the redline; loud.
- **Evade**: hard manoeuvres, spool and jink, high g, brace required, loudest.

## 4. Transitions
- Captain orders by radial or voice. Moving up a level takes 5 s for Alert and 8 s for Battle Stations (crew walking, doors sealing), shown as a progress arc on the lamp. Moving down is instant for lighting and audio, but crew stand down over 20 s.
- **Auto-escalation** (a call card tells the player; the captain can cancel within 3 s): Alert on any unidentified contact; Battle Stations on a vampire, a hit, a hull breach, or a hostile inside weapon range.
- **Auto de-escalation** is never automatic; the captain stands the crew down.
- Skipping a level is allowed ("Battle Stations" from Standing Watch). Crew take the full 8 s.

## 4a. Overlays
- **Brace**: crew and avatar go to brace points; the avatar is thrown on a hit, hard burn, jump or collision unless braced.
- **Damage Control**: fire or breach; the nearest off-station crew and the avatar are routed there, hatches seal on the affected zone, the station beside it loses 50% efficiency.
- **Jump Prep**: forces at least Alert, requires brace, locks posture changes during spool.

## 5. Knocked-out interaction
At Battle Stations an unbraced crew member is likelier to be knocked out. Their station runs at 25% unless the captain takes it; the captain can only take it once the officer has been moved to a free couch (takes about 15 s). No deaths in Act 1.

## 6. Decisions (Dave, 2026-11-20)
- **Battle Stations does not slow the avatar.** The "get to a station or rail" prompt is enough. (Table row in section 2 to be read as: no walk-speed change, prompt only.)
- **"Red alert" is a voice alias for Battle Stations**, and the voice that sounds the alert is Pell's: Pell is a ship system wired into the whole ship, so the klaxon, call-outs and "Battle stations" announcement are Pell lines, not a crew member's.
- **Two axes stay**: readiness and posture are separate because the ship moves between two kinds of space. In FTL transit the conditions mostly set crew posture. In arenas (a salvage run or other non-combat job) the player must find the target with the standard scanners while other ships may be present, and working out who they are is part of the game: **actively** (hail or ping: fast, but it gives you away) or **passively** (watching: slow, but stealthy). Readiness and posture therefore matter most in arenas, and the contact radial (option D in the mockups) is where that choice is made.
- Radial layout still open: four mockups made (one ring, two rings, top ring with drill-down, contact radial).
- Implementation note: Alert escalation should treat an unidentified contact as the normal trigger in an arena, and identification (by watch, hail or ping) as the normal way to step back down.
