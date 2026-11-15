# Generative content pipeline

Claude writes large volumes of scripted dialogue at authoring time. The game plays it back with a deterministic, seedable picker. No model runs while the player plays. Everything that ships is a JSON file that passed a validator, was read by a human, and can be diffed, tested and reverted like code.

This document says what the content kinds are, what a storylet looks like, how a writing pass is set up, what the validator refuses, how a batch is reviewed, how variety is measured, where the approach is likely to fail, and how an optional live layer could be added later without touching any of it.

Batch 01 is the first output: 135 storylets (130 ambient banter lines for the six officers, five return calls). Its review page is `docs/review_batch_01.md`.

## 1. Why storylets

A storylet is one small unit of content with a precondition. The picker looks at the world state, finds every storylet whose precondition holds, and chooses among them by priority and weight. This is the structure used for reactive barks in Hades and Valve's shooters: specific beats general, and fresh beats recent.

Two things follow. A writer (or a model) never has to think about order or branching across the whole game; each storylet only says when it may play. And variety is a measurable property: count how many storylets are eligible in each situation and how often they repeat.

The runtime never improvises. Given the same data, state, context, seed and history, the picker returns the same storylet. That makes it testable offline.

## 2. Content kinds

| kind | what it is | fires on | may reveal facts | choices |
|---|---|---|---|---|
| `banter` | what an officer says when the captain enters or lingers in their room | entering a station | no | no |
| `chatter` | two short sentences keyed to an engine event (call deck, hunt) | a named trigger | no | no |
| `call` | an officer or Pell asks for the captain while underway: the later form of a choice the player declined | state only | yes | yes |
| `pitch` | a mini-mission or decision: a proposer and an objector (seats, not people), then the captain decides | state only | no | yes |
| `react` | what an officer says when something happens in a hunt | a named trigger | no | no |
| `dress` | ship-state dressing: props, noise, light, a mess hall that looks different when the ship is loose | state only | no | no |
| `vig` | an event vignette: a short scene with consequences | state only | yes | yes |

The per-kind limits (sentences per line, words per line, whether it may reveal facts or carry choices) live in `data/narrative/lint.json` under `kinds`, and the validator enforces them.

Batch 01 covers `banter` and `call`. `chatter` and `react` wait on the real engine event names (open question 6 in the review page); `lint.json` lists proposed names in `triggers`, marked as proposed. `pitch`, `dress` and `vig` are defined and validated but not yet written.

Ambient kinds (banter, chatter, react, dress) can never move the story. They may mark themselves seen and nudge a trust or command-style number by 2 at most. Only `call`, `pitch` and `vig` may change anything that matters, and each of those writes only through named, logged effects.

## 3. The storylet schema

Files live in `data/narrative/storylets/*.json`. Each file is `{"_doc", "batch", "storylets": [...]}`. Files starting with an underscore are ignored.

```json
{"id": "banter.abara.control.kid_slip", "kind": "banter", "speaker": "abara", "station": "control", "priority": 55,
 "summary": "Trust is high enough that 'kid' slips out.",
 "needs": "trust.abara>=60 and not murdered",
 "lines": [
   {"who": "abara", "text": "Sit down, kid. Tea's hot."},
   {"who": "narr",  "text": "She hears it a second after you do."}],
 "variants": [{"needs": "murdered", "lines": [{"who": "abara", "text": "..."}]}],
 "echoes": [], "mentions": [],
 "meta": {"batch": "batch_01", "source": ["crew_cards.md: calls younger crew kid until she decides she likes them"]}}
```

| field | meaning |
|---|---|
| `id` | `kind.speaker.station.slug`, lowercase, unique. Calls: `call.speaker.slug`, and the id must also exist in `calls.csv`. |
| `kind`, `speaker`, `station` | `speaker` is a cast id (crew, Pell, Corvane). `station` is a room id or `any` (banter, chatter, dress). |
| `with` | co-speakers allowed besides `speaker` (for example `["fenwick"]` in a call). |
| `needs` | the precondition (section 3.1). Empty means always. |
| `priority` | 0 to 100, default 50. Specific storylets get higher numbers. |
| `weight` | a multiplier on top of priority, default 1. |
| `once` | plays at most once per save. |
| `cooldown_legs` | cannot repeat for this many legs. |
| `group` | storylets sharing a group cannot play within a few picks of each other (for two lines that make the same joke). |
| `trigger` | engine event name, for `chatter` and `react`. |
| `lines` | the beat: `[{who, text, needs?}]`. `who` is a speaker id or `narr`. A line-level `needs` drops that line when it does not hold. |
| `variants` | replacement lines for the same storylet under a narrower condition. The most specific matching variant wins; ties are broken by the seeded rng. This is how one idea is written for the murder route and the other routes. |
| `choices` | calls, pitches and vignettes only: `[{label, needs?, lines, effects?, choices?}]`, nestable. |
| `after` | a gather node: lines and choices that play once whichever branch was chosen is done. |
| `effects` | state changes, section 3.2. |
| `autoseen` | default true: playing the storylet sets `seen.<id>`. Set false for a call that can be declined without being consumed. |
| `mentions` | knowledge-ledger facts the text names. Checked against who knows what. |
| `echoes` | clue ids the text recalls. Only allowed behind a gate that says the player has already met the clue. |
| `reveals`, `clues` | facts and clues the storylet introduces. Calls only. |
| `callbacks` | callback ids from `callbacks.csv` this call pays off. |
| `status` | `draft` (default), `approved`, `rejected`. Rejected storylets never play and never count. |
| `meta` | `batch`, `source` (the canon doc each idea comes from), `question` (a canon gap flagged for the human). |

### 3.1 Conditions

A small shared language, implemented twice (Python in `tools/storylet_lib.py`, JavaScript in `web/storylets.js`) and tested against the same vectors in `tests/storylet_conditions.json`:

```
trust.abara>=60 and not murdered
corvane==persuaded or ames==dead
command.band==tight or command.band==very_tight
seen.shakedown.debrief and knows.decoy_turned
```

Names are state variables from `data/narrative/state.json`, plus `knows.<fact>`, `told.<fact>.<speaker>`, `seen.<scene or storylet id>`, `clue.<id>` and `visitor.<who>`. Operators: `== != >= <= > <`, `and or not`, parentheses. A bare name means truthy.

### 3.2 Effects

`name=value`, `name+=n`, `name-=n`, bare `name` (set true), `play:scene.id` (hand a scene to the engine; the picker does not run scenes). `lint.json` `effect_policy` sets, per kind, which names may be written and the largest numeric change. One-way variables (such as `integration`) can only go up. The runtime applies effects through one function and logs each change with the id of the storylet that caused it, so any state in a save can be traced back to the line that produced it.

## 4. The runtime picker (`web/storylets.js`)

No DOM, no clock, no `Math.random`. It loads from `web/storylets_data.js` (built by `tools/storylet_bundle.py`) or from any array of storylets.

Pick order:

1. Filter by kind, speaker, station, trigger and `needs`; drop `once` storylets already played, cooldowns still running, and groups still cooling.
2. Drop anything played in the last 4 picks for the same (kind, speaker, station). If that empties the pool, repeat only what was not played last.
3. Calls, pitches and vignettes: keep only candidates within 12 priority points of the best (a strongly relevant call outranks a mildly relevant one). Banter, chatter, react and dress: priority is a soft weight that halves for every 14 points below the best, so specific lines are favoured but universals stay in rotation.
4. Weight: base weight, times 1 + 0.15 per condition term (more specific wins more often), times 1.5 if never played, times a recency factor that returns to full over 12 picks, with a penalty if the same speaker would speak a third time in a row or is in `avoidSpeakers`.
5. Choose with a seeded mulberry32 stream keyed to (seed, pick number, kind, speaker, station).

`save()` and `restore()` serialise the history. `candidates()` is pure and explains every weight, which is what the tests and the coverage tool use. `start()` steps through lines, choices and gathers. `applyEffects()` writes state and returns the log.

## 5. Authoring prompt templates

`python3 -I tools/storylet_context.py --speaker quill --kind banter --station control --n 8 --focus "murder route"` assembles the pack for one writing pass. It is built from the canon files, never typed by hand, so it cannot go stale:

1. Task: how many, for whom, what kind rules apply (sentence and word limits, reveals, choices).
2. The schema and a worked example.
3. The character: `crew_cards.json` (role, voice, habits, wants, fear, relationships), the POV sheet from `docs/pov_sheets.md`, and the character's own `hides` field marked as private colour that may never be stated.
4. Voice rules from `lint.json` (`would_never` patterns, `never_words`, sentence limit, exclamation limit).
5. What the speaker knows: facts from `knowledge.csv` they hold at the start, and the facts they do not hold (off limits). What the player may be assumed to know. The gated words with the act they unlock in.
6. The state variables a `needs` may read, with types and values.
7. The speaker's existing lines, to avoid repeating the idea, the opening words or the joke shape.
8. Lines rejected in past reviews, with the reviewer's reason.

Rules the pack gives the writer, on purpose short: specific beats general; every line must work on every route in the first week, so use `not murdered` or a `murdered` variant; prefer one odd concrete detail to a summary of feeling; if canon does not cover what the idea needs, write a question in `meta.question` instead of inventing the answer.

The pack is plain markdown. Any capable model can run it. The output is JSON and goes straight into the validator; nothing is trusted until it passes.

## 6. The validator

`python3 -I tools/storylet_check.py` (exit code 1 on any error; `--strict` makes warnings fail; `--quiet` hides warnings). It runs the structural checks, then the style lint in `tools/storylet_lint.py`, then the repetition detector.

Errors (the batch does not go to review with any of these):

| rule | what it catches |
|---|---|
| schema | missing or unknown fields, bad id shape, kind or speaker unknown, station not a room, no lines, priority or weight out of range, a pitch without proposer and objector, a call missing from `calls.csv` or disagreeing with its priority or speaker |
| state names | every name in `needs`, line `needs`, variant `needs`, choice `needs`, effects and `{tokens}` must exist in `state.json` (or be a `knows.`, `told.`, `seen.`, `clue.` form of a real fact, speaker or clue) |
| values | comparing an enum to a value it does not have, or a number to a string |
| effects | writing unknown or derived or hidden state, writing outside the kind's policy, exceeding the numeric cap, moving a one-way variable down, banter setting `knows.*` or planting clues |
| who knows what | a speaker mentioning or revealing a fact they do not hold in `knowledge.csv` (unless gated on `told.<fact>.<speaker>`) |
| banned reveals | `mentions` without a `knows.<fact>` gate for the player (except three baseline facts); an ambient kind revealing anything; `echoes` of a clue the player cannot have met yet; gated words (Choir, Steward, survivor settlements, cathedral, Lagrange, the theology terms) below their act, from the wrong speaker, or without the fact gate |
| speaker discipline | a line from someone who is not the speaker, a co-speaker or a proposer or objector; a line carrying a dialogue tag; a speaker label at the start of a line |
| clock times | any hard-coded time of day: `14:30`, `o'clock`, `oh-six-hundred`, `quarter past`, `at midnight`. Time reaches the player only through the spoken-time token, which the runtime renders from state |
| choices | a choice with no label or no effect and no lines, a kind that may not carry choices |
| voice | a line matching a speaker's `would_never` pattern or `never_words` (for example Abara never says she misses someone), too many exclamation marks, too many sentences for the speaker |
| stock phrases | the banned list in `lint.json` (`delve`, `tapestry`, `a sense of`, `a shiver ran`, and the like) and exposition tells (`as you know`) |
| repetition | two storylets whose text overlaps above 70% (shingle Jaccard), see section 8 |

Warnings: no contractions in a long line (Quill, Pell and Corvane are exempt), a single choice, `once` with a cooldown, near duplicates between 45% and 70%, an opening three words used by more than two lines of one speaker, a four-word phrase repeated more than three times in one speaker's lines.

`tests/storylet_check_test.py` proves the rules fire: it takes a clean storylet and applies eighteen deliberate mistakes (an unknown state name, a clock time, a gated word, a speaker mentioning a fact they do not know, a banter that reveals, an over-cap trust nudge, and so on), and fails if any one is not caught.

What the validator cannot judge: whether a line is good, whether it sounds like the character, whether a joke lands. That is what the review is for.

## 7. The review queue

`python3 -I tools/storylet_review.py` writes `docs/review_<batch>.md`, grouped by character and then by kind. Each storylet gets a checkbox, its priority, a one-line summary, a plain-English statement of when it plays ("Plays when: shot Corvane in round 1 AND hull after last hunt below 60"), any facts it mentions or sets, and the full text including variants and choices. The open canon questions are at the top.

The reviewer ticks to approve. To reject or ask for a rewrite, they put `reject` or `edit` and a one-line reason against the id in `data/narrative/review/decisions.csv`. `--apply` then sets `status` in the JSON files (textually, so the hand-formatted files keep their layout). A rejection writes the lines and the reason to `data/narrative/review/negative_examples.json`, which the next prompt pack shows the writer under "do not write these again". `--diff` shows what a regenerated page would change.

The flow for a new batch: build packs, write, validate, run the coverage report, generate the review page, human decides, `--apply`, rebuild the bundle, run all checks, commit. Approval is per storylet, so a batch can ship partially. Drafts play in the editor and in tests; whether a build includes drafts is the `statuses` option of the picker.

Reviewer time is the scarce resource, so the page is written to be fast: the text is already checked mechanically, so the reviewer reads for voice, canon and dullness only.

## 8. Measuring variety

`python3 -I tools/storylet_coverage.py` (exit code 1 on a failing cell or a dead storylet; `--md FILE` writes it as a report).

1. **Inventory.** Kind by speaker, and status counts.
2. **State dimensions.** For each speaker, how many storylets react to route, quiet hour, command band, trust, integration, hunt results, the shakedown, the commission, the audit, the player's background, secrets known and earlier scenes seen. A zero means that officer ignores that part of the world.
3. **Home-station depth.** The matrix the completion plan asks for (act1_completion_plan B.4): each officer at their own station, across four timeline stages (first days, after the shakedown, the calls window, before Vesper) and four routes (persuaded, shot early, shot late, murdered). Each cell is 60 sampled worlds with the free dials (trust, command style, integration, quiet hour, background, which scenes have played) varied under the game's own consistency rules. The reported number is the minimum number of eligible lines in the worst sampled world. The bar is 4 (the plan's "4+ lines per officer per station"). Batch 01: every one of the 96 cells meets it.
4. **Dead and rare.** Storylets never eligible in any sampled world are an error (the condition is probably impossible); storylets eligible in under 2% of worlds are listed.
5. **Variety per speaker.** Distinct four-grams over total four-grams, and the commonest opening three words. Batch 01 sits at 0.97 to 1.00.

The repetition detector (`storylet_lint.py --repeat`, also part of the validator) works on the corpus per speaker: three-word shingles and Jaccard overlap for near-duplicates; repeated openings; repeated four-word phrases across lines. It exists because the usual failure of generated content is not an error, it is the same sentence shape forty times.

Static counts are not the whole answer, so `tests/storylet_test.js` also plays it: each officer visited ten times on every route and command band, asserting no immediate repeat, no id inside the no-repeat window, and at least five distinct lines in ten visits.

## 9. Risks, honestly

**Voice drift.** Across a few hundred lines a model slides toward a common register: warmer, wordier, more self-aware than any of these characters. Abara stops being dry; Quill starts using exclamation marks and contractions. Mitigation: per-speaker `would_never` and `never_words` patterns, sentence and exclamation limits, the contraction rule, and the character card and POV sheet at the top of every pack. Residual risk: the checks catch letter-of-the-law drift, not tone. A human reading the page by character is the only real check, which is why the page is grouped by character, and why a rejection becomes a negative example in the next pack.

**Canon leaks.** The failure that matters most. A line that lets Quill name something she could not know yet, or a banter that quietly confirms a mystery the player should discover in Act 2. Mitigation: the knowledge ledger (`knowledge.csv`) and the validator's who-knows-what rules, gated terms, the rule that ambient kinds cannot reveal, and that `echoes` need a seen-gate. Residual risk: the ledger is only as complete as canon. A hint that is not a listed fact is invisible to the checker. For that reason ambient lines are written as colour, and the review page lists `mentions` and `echoes` on every storylet so a reviewer can see at a glance what a line touches. Where canon had a gap I wrote a question, not an answer (the questions at the top of the review page).

**Bland output.** The default of a language model is the average line. Symptoms: lines that any officer could say, advice-column feelings, a joke shape repeated. Mitigations: "would another officer say this?" in the pack, concrete-detail instruction, the specificity rule in the picker (narrow-state lines are favoured), the dimension and depth matrices (which push the writer to make lines react to state rather than add more universals), and the repetition detector. Residual risk: the validator cannot tell bland from good. A line can be unique, in voice and still dull. Review catches that; approval is cheap to withhold.

**State coupling.** Content references state names that engine code may rename or never write. Mitigation: every name is checked against `state.json`; two derived variables I added (`command.band`, `pell.nick`) are marked PROPOSED and are open questions; coverage fails if a storylet has become impossible. Residual risk: a variable that exists in `state.json` but is never written at runtime still passes. The test to add on the engine side is a check that every name read by `needs` is written somewhere.

**Combinatorial surprise.** Two storylets that are each fine can be wrong together (an officer cheerful the moment after a death). Mitigation: groups, recency, the speaker-run penalty, ambient priority tied to state. Residual risk: only a playthrough finds these, so a walk-through of each route should be part of every release.

**Scale of review.** 135 storylets is an afternoon; 1,500 is not. Mitigation: mechanical checks do the bulk, the page is plain-English, approval is per storylet, and partial approval is normal. Do not generate faster than the review can absorb.

**Provenance.** Generated text needs an owner. `meta.source` records the canon doc every idea came from and `meta.batch` which pass wrote it, so a canon change can be traced to the lines it affects.

## 10. Optional live layer (not built, kept separate)

The scripted layer is complete without it. If the game ever calls a model while running, it must satisfy these constraints so nothing above changes:

- **Cosmetic only.** The live layer may rephrase or add colour to a storylet the picker already chose. It may not choose storylets, set state, reveal facts, or write anything the player's save depends on.
- **Same gates.** Its input is the chosen storylet's text, the speaker's card and voice rules, and the facts the speaker may state at this point. Its output goes through the same checks that run at authoring time (state names, who-knows-what, gated words, clock times, stock phrases, length) in a small JS port of the lint, and anything that fails falls back to the scripted text. The fallback is the default, not an error.
- **Off by default, offline-safe.** A setting enables it. With no network, no key or a timeout, the scripted line plays. Tests and replays always run without it.
- **Not part of the deterministic core.** Live output is never stored in `state.json`, history or saves; a replay with the same seed produces the scripted game. If a line is worth keeping it is written back into a batch and goes through review.
- **A separate module.** `web/storylets_live.js`, loaded only when enabled, with its own tests against a stub model. `web/storylets.js` does not import it.
- **Cost and latency.** Requests are made ahead of time (when the captain heads toward a room, not when they arrive) so the line is ready or the scripted one plays.

The most useful form of "live" is probably not at runtime at all: run the authoring pipeline continuously against fresh game states from playtests, so the content grows where players actually are.

## 11. File map

| path | what |
|---|---|
| `data/narrative/state.json`, `knowledge.csv`, `clues.csv`, `calls.csv`, `callbacks.csv`, `cast.json` | canon the validator checks against |
| `data/narrative/lint.json` | kinds, triggers, tokens, effect policy, gated terms, banned phrases, voice, thresholds, coverage worlds |
| `data/narrative/storylets/*.json` | the content |
| `data/narrative/review/` | `decisions.csv`, `negative_examples.json` |
| `tools/storylet_lib.py` | shared loader, condition parser and evaluator |
| `tools/storylet_check.py`, `storylet_lint.py` | validator, style lint and repetition |
| `tools/storylet_coverage.py` | coverage matrix and variety report |
| `tools/storylet_context.py` | prompt-pack builder |
| `tools/storylet_review.py` | review page, decisions, apply |
| `tools/storylet_bundle.py` | writes `web/storylets_data.js` |
| `web/storylets.js` | the picker (no DOM) |
| `tests/storylet_test.js`, `storylet_conditions_test.py`, `storylet_check_test.py`, `storylet_conditions.json` | tests |

Everything after an edit, in order:

```
python3 -I tools/storylet_check.py
python3 -I tools/storylet_coverage.py
python3 -I tools/storylet_bundle.py
node tests/storylet_test.js
python3 -I tests/storylet_conditions_test.py
python3 -I tests/storylet_check_test.py
python3 -I tools/narr_check.py
python3 -I tools/storylet_review.py
```
