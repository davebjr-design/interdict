# Answerbacks: the officer's follow-up question (Dave, 2026-11-24)

After an order, the officer in charge may ask the captain one short question that decides how the order is carried out.
"Fins are out. Pull them in at a quarter, or drain her all the way?" It is the first of the "crew answerback questions" Dave wants to grow into hundreds of routine conversation points. Today there are five; the mechanic is built so more are a table row each.

## The mechanic
| Part | Rule |
|---|---|
| Trigger | A reportable order just ran (the verb names are the `crew_reports.js` verbs: vent, fire, ping, route, classify, ...). Orders from the captain only (by `co` or `player`), and only if the order itself worked. |
| Condition | `when(x)` reads the live state and returns the question's data, or null to stay quiet. A question is never asked when there is nothing to decide. |
| Question | One line in the officer's own voice, at most one "Captain", two options (three at most later). It follows the officer's four-part report, so the order is acknowledged first. |
| Default | If the captain ignores it, the call expires to its default option after `to` seconds. The default is always the drilled, no-surprise answer, with its cost written in the row (`cost`). Wait is always allowed (the usual call rules). |
| Answer | Each option is a verb. It either acts now (bleed the tubes, go quiet) or sets a **standing order** that `tick` carries out later (pull the fins in when the sink reaches a quarter). Standing orders speak when they fire. |
| Limits | `once: 'hunt'` or `'contact'`, so a question never nags. Answerbacks are priority 2, `open` (Auto stations still ask) and outside the urgent-call attention budget. |

An answerback is an ordinary call in `station_model.js` ROWS (AB1..AB5), so the call deck, the timer, Wait, hands-on routing, stun and the TTS catalog all work unchanged.

## The five
| Row | Officer | After | Asks | Options (default second) | Effect |
|---|---|---|---|---|---|
| AB1 | Dace | vent, sink over 30% | Pull the fins in at a quarter, or drain fully? | Pull in at a quarter / Drain fully | Standing order: the fins retract when the sink falls to 25%, and Dace says so. Drain leaves the engine's own rule (retract at empty). |
| AB2 | Abara | fire, a tube still hot | Bleed the charged tubes, or hold for a follow-up? | Bleed them / Keep them hot | Bleed stands every tube down (EM falls). Keep leaves them charged (EM stays up). |
| AB3 | Quill | ping | Go quiet to let the glow settle, or stay loud and work the fix? | Go quiet / Stay loud | Go quiet runs the ordinary quiet order. |
| AB4 | Abara | route peaking over the 2 g strain line | Brace the crew on their own before each flip, or will you call each one? | Brace on their own / I will call them | Sets the brace doctrine (auto or ask). |
| AB5 | Quill | classify, a probable (60-90%) but not firm reading | Rescan for a firm call, or work with what we have? | Rescan / Work with it | Rescan is the ordinary rescan order. Asked once per contact. |

## Code
`web/answerbacks.js` (table `DEFS`, `create()` -> `check`, `run`, `tick`), registered into `Stations.ROWS`. `station_adapter.js` calls `A.ab.check` after each executed order (out event `{type:'answerback', row, call}`), routes `ab_*` verbs through `A.ab.run`, and ticks standing orders each update (their lines arrive as `report` events). Mirrored in `web/ship3d_babylon/hunt/`. Test: `tests/answerbacks_test.js`.

## How to add one
Append an entry to `DEFS`: `id` (next AB number), `st` (station), `after` (report verbs), `once`, `to`, `when`, `line`, `opts` (label + verb), `def`, `cost`, `run` (a handler per option verb; a verb the adapter already runs, like `rescan`, needs none), and a `tick` if the answer is a standing order.

## Elaboration later (not built)
- **Volume**: hundreds of routine questions (Dave's plan), with 4-5 phrasings per officer per question, picked at random like the reports, and an Opus naturalness pass. Generate from a table (trigger, state, officer, options, effects), then check voices.
- **Conversation chains**: an answer can open a follow-up (the standing order reports back; "Quarter in the sink, pull in now?").
- **Officer and trait colour**: traits, trust and relationships may add a third option or change the officer's default (Bethesda-style).
- **Answerbacks from the crew side**: unprompted questions when idle or under strain, not only after an order.
- **Persisted standing orders**: "always bleed after a salvo" as a trim set from the after-action report (the same shape as the trims).
- **Voice clips**: lines carry live numbers, so they use text to speech until fixed phrasings are recorded.
- **Not yet covered**: Castellan, Fenwick and Pell have no answerbacks yet.

## Also fixed on the way
Route reports quoted the previous flight plan (the live plan is rebuilt on the next tick). The report and AB4 now read a fresh `E.previewRoute`, which also returns `firstFlipT`.
