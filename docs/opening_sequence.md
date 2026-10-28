# Opening sequence (Dave, 2026-10-28; revised)

The tutorial puts the player on ANOTHER ship, joined provisionally. That crew is hunting a rogue captain flagged for removal because he or she is reactivating AI too aggressively. Even among thieves there are rules, and watching each other's responsible use of AI is chief among them.

The tutorial teaches the game modes. Its hunt ends when the rogue captain's ship is found and the player BOARDS it. The player either kills the captain or persuades him or her to stand down. Then the player takes over as captain with the blessing of the shadowy patron who oversees all this, into obviously tense relationships with a crew that served the rogue captain. The rogue ship carries Pell and the named crew (Abara, Dace, Castellan, Quill, Fenwick).

## Design consequences
- Tutorial hunt teaches hunt mode before the ship layer exists. The host ship needs only a minimal interior (bridge, maybe a corridor) from base rooms with different dressing.
- NEW: the boarding needs a combat or standoff mechanic. Keep it small and scripted, not a full combat system. Must follow the fun rules: no no-win state, and a calm option (persuade) at a cost. See docs/boarding_options.md if written.
- Tight/loose tone starts neutral. Crew relationships start tense: the hunter who became captain.
- How the player ends the confrontation (kill versus persuade) is a big early narrative fork that colors crew relationships and the ship's early look.
- Pell is the reason the rogue captain was flagged, which ties the AI integration meter to the opening.
- Patron: shadowy, blesses the takeover, keeps oversight. Source of missions and tension.
- Open: the rogue captain's identity and motive, what the patron wants, how the crew learn Pell's history.

## Decisions (Dave, 2026-10-28, later)
- Boarding is a standoff scene with two routes: persuasion and violence. Both work.
- The tutorial hunt is fully scripted: the tutorial captain gives instructions ("do X"), the matching button is highlighted with a description of what it does, and the outcome of the hunt is fixed. Purpose is to teach the hunt mechanics.
- Rogue captain temperament profile: Khan from Star Trek (charming, intelligent, underlying violence). Original character, profile only. Believes he or she is righteous; the version of the greater good is morally disturbing.
- Patron's stated goal: stop the AI development.
- PLANNED TWIST (later): the rogue captain was trying to use more AI to counter the AI that the patron is secretly facilitating.

## Notes from Claude
- Twist must survive both standoff routes. If the rogue captain dies, the truth has to survive in another place (Pell's logs, a crew member, the ship records). Persuasion route lets the captain tell part of it early, and the player can choose not to believe it.
- Seed small hints early: the patron's blessing is a bit too convenient, and the crew are guarded about something.
- Tutorial implementation idea: scripted director on the existing hunt engine (fixed seed, scripted enemy track, step gating, highlight overlay), skippable, replayable from a codex.
