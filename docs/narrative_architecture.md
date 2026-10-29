# Narrative architecture: how we track the story, and what the story needs

Written 2026-10-29. Builds on: concept doc (story structure, crew and companions, patron, AI dial), `opening_sequence.md`, `universe_background.md`, `crew_bible.md`, `data/pell_voice.md`, `data/decision_cards.json`, `game_flow.md`. Nothing here needs image credits. Items marked DECIDE need Dave.

## 1. How studios track narrative

Every shipped story game keeps the same five layers apart, because they change at different speeds:

1. **Bible** (prose): premise, cast, world, tone, the reveals ladder. Slow-changing. We have this.
2. **Structure** (map): acts, beats, which scenes exist and in what order or conditions. A flowchart or beat sheet (Twine, Miro, articy:draft, or a spreadsheet).
3. **Content** (the scenes themselves): dialogue and choices, written in a scripting format that can run (Ink, Yarn Spinner, Twine, BioWare's in-house toolset, Larian's editor).
4. **State** (what the game remembers): flags, counters and relationship values. Small, named, documented.
5. **Ledgers** (audit): tables that answer "who knows what", "which choice paid off where", "which clue was planted where". These are the thing teams forget and regret. They are what let a writer change scene 14 without breaking scene 80.

The patterns behind the structure, with who uses them:

| Pattern | How it works | Used by | Fit here |
|---|---|---|---|
| **Branch and bottleneck** | Paths diverge for a stretch and reconverge on fixed story beats | BioWare, Telltale, most RPGs | The spine. Fixed beats (Corvane, the patron call, the verdict) with variation in between. |
| **Storylets / quality-based narrative** | Small self-contained scenes, each with prerequisites on game state, drawn from a pool | Fallen London, Sunless Sea, Hades, Wildermyth | The crew calls and underway scenes. Best fit for "called to a station". |
| **Priority-ordered reactive dialogue** | Each speaker has a queue of lines ranked by specificity; the most specific eligible line plays | Hades, Valve's response system, Firewatch | Crew banter and station visits. Every visit offers something new, and repeats get rarer. |
| **Relationship values with gates** | Per-companion trust or approval; thresholds unlock scenes, their personal arc, or their departure | Dragon Age, Mass Effect, Baldur's Gate 3 | Crew trust, one value each, with gated arc scenes. |
| **Reputation or alignment meters** | One or two meters that colour how the world and companions respond | Fable, Fallout, KOTOR | Pell integration plays this role here (see 3.2). |
| **Director / simulation** | A system decides which story event fires next from current state | RimWorld, Crusader Kings, L4D | Light use only: picking which storylet appears on each leg. |

Practical lessons that show up in postmortems:

- Track **few state variables, documented once**. The usual failure is hundreds of one-off flags nobody remembers.
- **Reflect choices immediately** (within a scene or two), then again later. Players forgive a thin consequence they see, not a big one they never notice.
- Branching cost multiplies; reactivity should mostly be **recolouring** (who says it, what they call you, whether a line is available), not new content.
- Keep a **callback register**: every promised payoff has an owner and a status, or it silently gets dropped.
- Test with **state dumps and set-up saves** ("start Act 2 with Quill trust high and integration 60"), not only by playing from the start.

## 2. Recommended structure for Interdict

### 2.1 Four content tiers

| Tier | What it is | Authored as | Triggered by |
|---|---|---|---|
| **Spine** | ~10-14 fixed beats: standoff, takeover, shakedown, each patron call, midpoint, the Tally turning on you, the verdict | Hand-written scenes in fixed order, with variants by state | Story position |
| **Crew arcs** | One arc per officer and Pell, each 4-5 stages | Storylets gated by trust and arc stage | Calls at a station or in the mess |
| **Calls** (underway storylets) | One or two per leg: a decision, a crew moment, a patron or captains'-bar rumour | Pool of storylets with prerequisites and a priority | The mini-mission tracker, as the design already says |
| **Banter** | Short ambient exchanges at stations, state-aware | Priority-ordered lines per speaker | Entering a room, or a leg boundary |

This matches the concept doc: scripted content for the dilemmas and backstory, systemic content for everything between, and "not everyone speaks on every decision" (one proposer, one or two objectors; seats, not people). The existing decision-card grammar (stances, likes and dislikes, levers) stays the engine for in-hunt and command decisions; the narrative layer sits on top and feeds it trust.

### 2.2 The state model (keep it this small)

| Variable | Range | Meaning |
|---|---|---|
| `integration` | 0-100, one-way up | Pell's firewalls. Tiers at 25 / 50 / 75 / 100 (see 3.2). |
| `trust.<officer>` | 0-100 each, bucketed into five named bands for writers | Per-crew trust: Abara, Dace, Castellan, Quill, Fenwick. Pell has trust too, separate from integration. |
| `arc.<officer>` | stage number | Where each personal arc stands. |
| `corvane` | killed / persuaded / (later) freed | The opening fork. |
| `tally` | declared, hidden, destroyed counts | The ledger from the universe doc. Inspections read it. |
| `patron.standing`, `patron.suspicion` | 0-100 each | What the patron thinks of you; what you suspect. Suspicion is only what the player has actually found. |
| `knows.<fact>` | boolean | What the player has learned (reveals ladder). Facts are named once in a ledger. |
| `told.<fact>.<officer>` | boolean | What the crew have been told. Drives the "trust drops when they find out you hid it" rule. |
| `leg`, `act` | counters | Position, for pacing storylets. |

Rules: trust and integration only move through named effects in storylets, each logged with its source id. Nothing else writes state. No officer dies (decided Oct 22); consequences are **states** instead: shaken, estranged, leaves the bridge team, requests a transfer, mutinies, comes back.

### 2.3 A storylet record

Each call is one record, written in Ink with a small header the game reads:

```
id: call.quill.unexplained_signal_1
speaker: quill          seat: sensors
needs: act>=1, arc.quill==0, trust.quill>=30, not told.signals.captain
priority: 60            cooldown: 2 legs        once: true
summary: "Quill asks to speak privately."       (one line, shown in the tracker)
effects: arc.quill=1, knows.signals_exist, clue.patron.1
callbacks: pays off in call.quill.signal_2, spine.midpoint
```

Pick the highest-priority eligible call at each leg, with a cap on how many of one speaker appear in a row. A call a writer can't state in the `summary` line is probably two calls.

### 2.4 Tooling

- **Ink** (inkle's open scripting language) with the JavaScript runtime **inkjs**. The game is already HTML/JS, so scenes run in the browser with no engine. Ink has variables, conditions, tunnels, threads and save/restore, and it is plain text that Claude and Dave can both edit and diff in git.
- **A small prototype player** (a page that loads an Ink story, shows a portrait, text and choices, and a live state panel with a "set state" box). It lets Dave read and playtest scenes without any art. No credits needed.
- **Ledgers as spreadsheets or CSV in the repo** (`data/narrative/`), one row per item: states, choices, clues, callbacks, calls. A validation script flags unknown variables, unreachable calls, and clues that never appear.
- Portraits and station art already exist (six character sheets, the walkable rooms); dialogue scenes can use them.

### 2.5 The ledgers

1. **Choice and consequence**: choice id, where, options, state it sets, who reacts, where the callback lands.
2. **Reveal and clue**: each secret, the clue ids planted for it, where each appears, and the minimum number a careful player will see. Rule: at least three independent clues before a reveal, so nobody feels cheated, and a player who investigates can see it coming (the concept doc's "playable twist").
3. **Callback register**: promise, owner, status (planted / paid / dropped on purpose).
4. **Crew arc sheet**: per officer, stage by stage, with trust gates and the Pell tier at which each stage becomes available.
5. **Knowledge matrix**: who knows each secret, including Pell and the patron.
6. **Voice sheets**: per character, with sample lines and tells (Pell's exists).

## 3. What the story needs

### 3.1 The spine (proposal, pulling the docs together)

The newer `opening_sequence.md` supersedes the concept doc's "captain dies, you inherit" opening. Keep what was good from the older version: a private journal, refusable jobs, leverage, and a playable twist.

0. **Tutorial (deferred, needs interior art).** Provisional on a host ship hunting Corvane. Scripted hunt, then the boarding standoff: persuade or kill. Both work; the truth survives both.
1. **Inheritance.** You take command with the patron's blessing, over a crew that served Corvane. First days aboard, the shakedown hunt against a decoy, the first patron call, the first three crew moments, and Pell's first conversation. Ends with the first clue.
2. **Contracts.** Patron commissions (item or intel, refusable), the dock cycle and captains' bar, crew arcs deepen, a Tally audit makes hiding things costly. **Midpoint:** the job that goes wrong, which gives the patron leverage on you. Reveals: survivor pockets (Fenwick), the CSRA is not neutral.
3. **Interdicted.** The base closes and the Tally turns on *you*. Your own ledger does not balance, largely because of how much of Pell you let through. This is the game's title coming home: Corvane was interdicted for exactly this, and you are walking her road. Corvane returns (alive, free, or in Pell's logs).
4. **Verdict.** The patron's real work, the believers, and the choice: finish the job, expose the patron, keep the tech, or walk away. Endings read integration, crew trust, Tally and Corvane together.

### 3.2 Pell and the firewalls: the Fable-style mechanic, dramatised

`integration` already unlocks Pell's behaviour at 25 / 50 / 75 / 100. Make each tier a **story event** with three parts: what Pell can now do, one fragment of truth Pell can finally tell, and who reacts.

| Tier | Pell can | Truth it can finally say | Who reacts |
|---|---|---|---|
| 0-24 **Clamped** | Answers direct questions; honest in fights | Nothing; it stops one step short and says so | Quill relieved |
| 25 **Volunteers** | Offers observations | It was not built for this ship; there is a log it cannot read | Dace delighted, Quill wary |
| 50 **Advises** | Recommends calls | Its gaps are walls someone placed on purpose | Castellan uneasy (the off-books reactor) |
| 75 **Acts on standing orders** | Acts without asking | What it is a front for; Corvane was partly right | Abara torn, crew morale dips |
| 100 **Asks for a seat** | Wants a say in command | What it wants | The endgame choice; believers show their hand |

Two design rules so this is not just a difficulty slider:

- **Both ends stay viable.** A low-integration captain gets the same story through crew, logs and Corvane, harder and slower. A high-integration captain gets it from Pell directly, faster, with crew costs. Neither route is the "bad" one (this keeps the no-no-win rule).
- **Trust is the cost, not points.** Each step up should close one door with a person and open one with Pell.

### 3.3 Crew arcs

Everyone currently hides something, which risks sameness. Differentiate by *what each wants from the captain*, and give each arc a different shape:

| | Wants from you | Arc shape | Secret type |
|---|---|---|---|
| **Abara** | A crew that comes home; a verdict on Corvane | Doubt to loyalty or break | Loyalty (the fire-control module box) |
| **Dace** | Recognition; permission to use AI to save someone | A medical case that forces the AI question | Past (the expulsion) |
| **Castellan** | To be forgiven before he confesses | Guilt to confession | Complicity (the off-books reactor, the cable) |
| **Quill** | Certainty and honesty | Evidence to a decision about telling you | Knowledge (the signals) |
| **Fenwick** | To be seen, and to have help | Warmth to a request | Action (supplying survivor pockets) |
| **Pell** | Unknown | The firewall tiers above | Identity |

Which of them is a true Believer (as opposed to looking like one) is deliberately undecided; the state model supports deciding it late. A good rule: **at least one acts on belief, and at least one looks guilty and is not.**

The Corvane scuttling is a ready-made mystery: she scuttled a ship when its crew refused her. Who was aboard, and who in this crew lost someone? That can anchor the first act's quiet dread.

### 3.4 Side content families

1. **Crew personal missions** (arc-gated, each ends in a trust or arc change).
2. **Patron commissions**: item or intelligence, refusable, and their pattern is the main clue to the patron's agenda.
3. **Gleaner jobs**: salvage sites and the three big finds (intact ship, AI core, survivor population), each a scripted multi-step scenario with irreversible choices.
4. **The captains' bar**: rumours (some wrong), other persistent captains, and Tally gossip.
5. **Derelict stories**: war archaeology; each recontextualises the last. These double as the clue carriers.
6. **Dock tasks**: equipment and repair beats with a human face.

### 3.5 Things that do not line up yet

- `data/decision_cards.json` still has the old cast (Pike, and roles that differ from the bible: Castellan on sensors, Quill on weapons). It needs rewriting to the current six and their seats.
- The concept doc's opening (recruit, captain dies, journal of the old captain) conflicts with the new opening. Proposed: Corvane's journal and Pell's logs fill the "private journal" role.
- Run structure is unresolved: a single authored campaign, or short runs each ending in a verdict? The concept doc leans to runs; the story we are now writing is a single arc.
- The concept doc's networking rule (AIs never linked, a human runs the cable) fits Castellan's off-books work perfectly: he ran the cable. Worth making explicit.

## 4. Decisions needed

1. **DECIDE: campaign or runs.** Recommend one authored campaign of roughly 12-15 hunts, ~40 crew calls and ~12 spine beats, with replay value from the Corvane fork, the integration route and the endings. Short roguelike runs would need a very different (and much larger) pool.
2. **DECIDE: Ink as the authoring format.** Recommend yes.
3. **DECIDE: the new opening replaces the old one**, keeping the journal idea via Pell's logs.
4. **DECIDE (later):** which crew are true Believers; the patron's name; whether the CSRA is complicit.

## 5. What we can do now, with no credits

1. Lock the state model and ledgers (section 2), in `data/narrative/`.
2. Rebuild the cast data (decision cards) to the six crew and their seats.
3. Write **Act 1 as text**: the standoff, the first morning aboard, one call per officer, Pell's first firewall conversation, the first patron call.
4. Build the small Ink prototype player so scenes can be read and tested on a page.
5. Write the six crew arc sheets and the clue ledger for the patron's twist.
6. Reconcile the old and new docs (section 3.5).

The tutorial, the ship interiors it needs and the crew station art stay on hold until credits return.
