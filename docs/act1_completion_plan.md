# Act 1: what's done and what's left (2026-10-31)

"Act 1" here means the playable opening: Act 0 (the Tern, the hunt for Corvane, the standoff, the blessing) through 1.9 (the signal, the audit notice), ending on arrival at Vesper.

## Done
- **Story:** every scene drafted and continuity-checked: P1, P3, P4, 1.1-1.9 (`docs/scenes/`), with POV sheets, state model, clue/callback ledgers and a validator. Plot recap: `plot_so_far.md`.
- **Systems on paper:** command model (style, trust, integration, Tally, visitors, props); mini-mission trims (17 + 3 Pell assists, `data/mini_missions.json`); decision cards 3-5 voiced for the shakedown.
- **Walkable ships:** Corvane's ship, 12 rooms (about 60% polished). **New: the Tern** (Ostrow's ship): control and junction re-rendered in the tight look, the airlock reused. Demo flow: briefing with Ostrow at the chart table → tracker "Report to the airlock" → walk aft and up → outer hatch prompt (Begin boarding / Look around first) → Corvane's ship.
- **Hunt:** real-time engine and console UI playable (`web/hunt_rt.html`), balance pass pending.
- **Art test:** one animated hunt switch (4 frames).

## Left to do, in order
### A. Make the hunt interface 100% playable (no credits)
1. Hunt balance pass (the open items in `game_flow.md`: spool vs. clear, ~68% win baseline).
2. **Trims layer:** wire `data/mini_missions.json` multipliers into `P.*`; run the bot per trim so none is strictly better.
3. **Decision cards in the hunt:** cards 3-5 fire during the shakedown with their voiced lines.
4. **Tutorial director (P2):** fixed seed, scripted enemy track, step gating, highlighted controls, Ostrow's one-line instructions. Needs a short script (writing, below).
5. **The shakedown's scripted event:** the decoy's forty-second turn (1.6).
6. Only then: switch art for the final control set (see C).

### B. Writing still needed (no credits)
1. **P2 tutorial script:** Ostrow's instruction line per step (about 12-15 lines).
2. **The standoff as a playable text scene:** P3 is written; it needs its round structure and tells laid out for the dialogue runner.
3. **Return calls** promised by earlier scenes: `call.corvane.cabin`, `call.pell.logs`, `call.pell.background`, `call.pell.quiet_hour`, `call.corvane.cabin_key` (short, 5 small storylets).
4. **Ambient banter:** 3-4 state-aware lines per officer per station, so a second visit says something new.
5. **Mini-mission pitches as scenes:** the lines are in the data; they need the proposer/objector framing in the dialogue runner.
6. **Voice pass on the remaining decision cards** (1, 6-12) before they appear in Act 2.

### C. Engine for the story (no credits)
1. **Dialogue runner:** scenes into Ink (inkjs) and a runner wired to the walk demo's dialogue panel, with the state model (`data/narrative/state.json`) as Ink variables. Then convert P1 → 1.9.
2. **Mission tracker v2:** several entries at once, mutually exclusive branches, done/failed states.
3. **Storylet picker:** chooses 1.8 calls per leg by priority and gates (`calls.csv`).
4. **Save/load** of narrative state.
5. **The red key on the pedestal:** the integration switch as an object in the control room.
6. **Command-style props layer** (code side): swap prop sprites by band.

### D. Art (credits; current balance 17)
| Item | Why | Estimate |
|---|---|---|
| Ostrow, Dunne, Ames (Tern) | currently placeholder figures | ~40 each as rigged walkers; or ~10 each as portrait-only |
| Corvane | the standoff's centre | ~40 rigged, or a portrait for the text scene (~10) |
| Dialogue portraits for the six crew | the panel shows a letter today | ~10 each (cheapest model ~3-5) |
| Command-style prop sheets | the ship changes with style | 2 sheets (loose / tight), ~12 each |
| Final hunt switch set | after the UI is final | ~9 per control type |
| Pell's pedestal dark state | Pell clamped on day 1 | code only |
| Teapot, cups, the burnt notebook | standoff and cabin props | one prop sheet, ~12 |
**Suggestion:** for Act 1, do portraits (cheap) and keep Tern crew and Corvane as portraits plus placeholder walkers; spend the next big credit batch on Corvane as a rigged walker, since she's on screen at the turning point.

## Design note: mutually exclusive mini-missions [D]
The tracker can offer two missions that exclude each other ("go here to side with X / go there to side with Y"). Taking one closes the other and sets a branch flag. First use: Act 2 (Vesper). Act 0's airlock teaches the basic flow (tracker entry → walk there → prompt → commit or look around) without a branch.
