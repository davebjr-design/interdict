# Hailing and identification (2026-11-20)

Context (Dave): in FTL transit the ship is mostly alone. In arenas (salvage and other non-combat runs) the target is found with the standard scanners, other ships may be around, and working out who they are is part of the game: actively (hail, challenge, ping: fast, but it gives you away) or passively (watch: slow, stealthy). A voice hail is optional flavour; the core is a transponder challenge. If hailing exists, replies are generic and context dependent, as in X3.

## The four ways to identify a contact (contact radial)
| Action | Kind | Cost and risk | What it tells you |
|---|---|---|---|
| **Watch** (classify) | passive | slow, quiet | analysts firm up heat, reactor, eclipse readings |
| **Challenge** | active, directional | beam cooldown; a hostile may read the beam (bump chance) | **proof**: a friend answers with the countersign (confirmed), no answer means "not ours" |
| **Hail** | active, open channel | small emission (alert 0.04, reach 1.2, cooldown 0.4 min); a hostile warship is made aware | **soft evidence only**: a reply says who they claim to be. Anyone can lie on a radio |
| **Ping** | active, loud | big emission | exact fix and sharper channels, no identity |

Hail never changes `idStatus`; only the challenge confirms a friend, and only observation or being fired on marks a hostile.

## Replies (generic, context dependent)
A line is chosen from **role x mood** (hailLine in the engine, table HAIL.lines), with overlays:
- **repeat**: a second hail gets a shorter or more irritated line.
- **locked**: hailing while we hold a lock gets a "you have a lock on us" line.
- **damaged**: below 60 percent hull a friendly offers help.
Roles: ally, trader, salvager, patrol, pirate, civilian, warship (arena contacts set `role` and optionally `stance`; hunt contacts derive it: friend is ally, real is warship, lure is a drone). Moods: friendly, neutral, wary, hostile, silent.
- A **hunting warship** stays silent (55 percent), bluffs as a trader (25 percent) or warns us off (20 percent). A **lure** never answers. A **friend** answers friendly (wary if we lock it).
- Silence is information too, but weak: a drone and a crew running dark both say nothing.

## To do
- Add arena contacts with a `role` and `stance` (trader, salvager, patrol, pirate) when the arena content lands; the line table already covers them.
- More lines per role (X3 has dozens), authored later; voice them with Pell's contact-voice treatment.
- Show the last reply on the contact's tile and the overview scope.
- Readiness hook: Alert or Battle Stations should cut hail lines and raise the emission cost of a hail.
- Engine: `E.hailContact`, `E.hailLine`, `E.HAIL`; adapter verbs `hail` and `challenge` (station comms, officer Pell); CTL ids `act:hail`, `act:challenge`. Tests: tests/hail_test.js.
