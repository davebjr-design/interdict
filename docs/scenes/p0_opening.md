# P0: The Opening (wake-up on the Tern)

**Status:** built in the walk demo (`design/proto_iso.html`), 2026-11-02. Plays before P1. Test: `node tests/opening.js`.
**Where:** the *Tern*'s crew bunks (`design/rooms/tern_bunks.json`), then the junction, then the control room (the CIC). **Length:** under a minute.
**Speakers:** Ostrow, over the ship intercom. The player has not met anyone yet.

## Beat
1. Black screen, 1 second.
2. Lights fade up over 1.5 seconds on the crew bunks. The player stands next to the last rack, by the crates and the aft hatch (the new hand gets the worst rack). There is no lying-down pose, so they are already up.
3. The call:
   OSTROW (intercom): (Ship intercom.) New guy, report to the CIC.
   → "On my way."
4. OSTROW: What's your name again?
   [text entry, 12 characters, same sanitizing as before (letters, digits, space, `.'-`); blank means **Rookie**; saved in localStorage `interdict.pname`]
   → "That's me."
5. OSTROW: <Name>. Right. Forward, through the junction. Don't make me call twice.
6. Ship log shows the room blurb. Tracker: **FIRST JOB: Report to the CIC**.
7. The player walks forward: bunks → junction → control room. On arrival the tracker ticks and the P1 briefing starts ("You're late. Sit.").

## Why it reads this way
- Ostrow not remembering the new hand's name is the first hint of Dunne's line in P1: "nobody's attached to you yet." It also gives the name entry a reason to exist inside the fiction.
- "You're late" in P1 now lands: the player was called, and walked.
- The Cptn. prefix still appears only at the handover on Corvane's ship.

## Demo controls
- **Restart at the Tern** replays the opening (the saved name is kept and prefilled).
- **Skip opening** (tester link) jumps straight to the briefing in the control room with the saved name.
- `#after_hunt` (return from the tutorial hunt) skips the opening.

## Art
`tern_bunks_v1.png`: Meshy gpt-image-2, one image (12 credits), bunks_v5 as the layout reference and the Tern control room and junction as the style references. Fallback: `bunks_v5.png` with the old bunks grid. Known flaw: crates are painted in front of the aft hatch, so that hatch is a locked object ("Crates stacked against it"), not a walkable link.
