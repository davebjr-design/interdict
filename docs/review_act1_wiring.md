# Continuity review: 1.6b The Wiring (`docs/scenes/act1_wiring.md`, draft 1)

Reviewer: a fresh continuity reviewer who didn't see the drafting (style guide §8). Date 2026-11-02.
Read against: plot_so_far, command_model, universe_background, writing_style_guide, pov_sheets, crew_cards, narrative_architecture, scenes P3, P4, 1.1-1.9, `data/narrative/*` (state, cast, knowledge, clues, callbacks, calls), `data/mini_missions.json`, `data/pell_voice.md`, `docs/ship_inventory_and_art_plan.md` (hull layout), `docs/act1_completion_plan.md` (11-02 decisions), `web/hunt_rt_engine.js` (time scale).
`python3 tools/narr_check.py` passes on the current data (`calls 5, facts 27, reveals 7 / OK`). That's expected: the checker reads only `calls.csv` and the ledgers, and the scene's ledger rows haven't been added yet. On a scratch copy with the proposed rows added, it fails: `call.pell.wiring_answer: unknown state name tally.trace` and `call.castellan.wiring_again: unknown state name last_hunt.hull`. `hunts_since_wiring` and "captain asks" pass silently, which is a validator gap (see 27).

Severity: **must-fix** = contradicts canon or breaks a rule or state; **should-fix** = a POV, voice or bookkeeping problem a player or the next writer will trip on; **nit** = polish.

---

## A. Canon and timeline

**1. Castellan can't know about Vesper or the audit on night 3.** *Must-fix.*
> CASTELLAN: 'Cause an auditor with a torch'll find it at Vesper whether I show you or not.

Vesper first comes up as a destination in 1.7 (day 4: "deliver it unopened to Vesper Dock"; Pell, "Four days out"). The audit notice arrives in the 1.9 coda (day 7: "Tally audit. Ours is at Vesper."). Writer's note `wiring_audit` has the same problem.
**Fix:** "'Cause an auditor with a torch'll find it at the next dock that checks us, whether I show you or not." (Crews audit each other at docks, per universe_background, so "next dock" is something he can know.)

**2. Corvane isn't "two decks up".** *Must-fix.*
> *(persuaded)* CASTELLAN: It's why she's under arrest two decks up, eating Fenwick's soup.

The hull has two decks. The CO's stateroom, which Corvane kept as one of her terms, is a side room "off the aft end of control" on the upper deck (`ship_inventory_and_art_plan.md` §20). From the control room she is one hatch away, on the same deck. "Under arrest" is fine on this route, and it's the only route that uses it.
**Fix:** "It's why she's under arrest through that hatch, eating Fenwick's soup." *(He keeps his voice down.)* This also gives "don't go asking her" a physical reason.

**3. The sensors and ECM runs were "live". So what is behind the plate now, and why is the trace 0?** *Must-fix (internal contradiction).*
- [P] says the low-level link is "**one finished sensor run**". Two lines later and in dialogue it's "**half-terminated**" / "it's half done".
- "Sensors. ECM. Those were live" plus "Can't unseat it after. Not really." means Corvane's sensor and ECM runs are still seated in the walls tonight. Then (a) an auditor's torch already finds them, so `tally.trace` can't default to 0; (b) the player wonders why Pell needs a new half-done classifier run when a finished sensor run is already there; (c) the scene ties integration to copper, while canon ties it to consent ("Pell's access works by consent… clamps itself back to clockwork", universe_background).

**Fix (pick one and say it on the page):** (i) The live runs went through the trunk, and Pell's consent clamp made them dead the night of the takeover. The trunk is the deep install and stays Castellan's secret; the CLASS. BUS run is a separate stub that never reached the trunk, so it can be seated on its own. Say "half done" consistently and drop "finished". (ii) Give `tally.trace` a starting value for Corvane's existing installs (for example 10: "what was already in the walls when you took command"), so an auditor finds *something* on every route. That keeps the stakes in finding 1 honest. Either way, write one line of [P] that says which runs physically exist and which are only switched off.

**4. The drop explanation competes with the central mystery (22:13).** *Must-fix.*
> CASTELLAN: A link through a half-done run can drop. Second or three. … Then she'd come back, and not know she'd gone.
> *(knows.pell_lost_time)* PELL: Three seconds. / CASTELLAN: About that, yeah.

The P3 gap is thread 2 of "Something knew" (pov_sheets: "Did Pell send it, or lose those seconds to whatever did?"). Corvane's half-done wiring was in the walls at 22:13, so this exchange hands the player a cheap mechanical answer. Pell's "Three seconds" and Castellan's "About that, yeah" match them up out loud. It also breaks the style rule against explaining a clue: the scene doesn't plant 22:13, but it does explain it away.
There is also a factual clash. In 1.5 Pell *does* know its clock skipped ("My clock has a gap… about three seconds"); what it doesn't know is *what it said*. At 22:13 Pell kept talking (the repeated line). A cable drop is silence.
**Fix:** make the drop a different kind of event, and keep that difference unremarked. Castellan: "Middle of a hunt it'd just go quiet. Lamp goes dark, and it's not there." Pell (knows.pell_lost_time): "Gone is different. Gone I'd notice." *(Then nothing more. This is not a new clue, just Pell refusing the easy explanation; or cut the line.)* Change the [P] risk line and `pell_link` in knowledge.csv to match. In the hunt mechanic, Pell's lamp goes dark and Pell *knows* it dropped, so the after-action shows a gap with Pell saying "I was gone for that" rather than a mystery. Pell's request in option 1 then changes too (see 12).

**5. The fiction says three seconds; the mechanic is 11 game seconds.** *Should-fix.*
Hunt UI: "drops for 3 real seconds (about 11 game seconds)". The engine runs at `secPerMin: 16`, so the 11 is right. But the in-world clock is game time: the after-action timestamp would show an 11-second gap, while Castellan and the ledger say "about three seconds". **Fix:** either 0.8 real seconds (about 3 game seconds), which is probably too short to notice, or keep 3 real seconds and change the fiction to "ten seconds, maybe". That also helps finding 4, because it isn't three seconds any more.

**6. "Forty-one" is already Fenwick's number, and might fit this ship.** *Should-fix.*
- 1.8 `call.fenwick.crate_1`: "The manifest says forty-one crates. You count forty." Both numbers will land in the same week, and players will read the echo as a deliberate connection.
- "This ship hasn't got forty-one systems" may not be true. The hull has 24 missile tubes and 12 compartments, each with a Pell node panel (`ship_inventory_and_art_plan.md`), so 36+ ends has an obvious count.
**Fix:** use a number the hull plainly can't explain, and one that isn't 41, for example "Two hundred and some. You stop counting." Or make the oddity the *labels*: tags in Castellan's capitals for systems the ship doesn't have ("DRV 2", "ARRAY B", "TUBE 31" on a 24-tube ship). The labels are the stronger clue and need no arithmetic from the player.

**7. On the ended route the captain may hold the third watch tonight.** *Should-fix.*
1.6 debrief: *(seen.abara.asked_third_watch)* "You wanted the third watch. It's yours. Starting tonight." `watch.captain_third = true`. Then 1.6b *(ended)*: "Night watch. I'll talk Abara into her bunk." / "*Abara has her feet up at tactical.*"
**Fix:** add an *(ended, watch.captain_third)* variant. Castellan: "Your watch tonight. I'll come up." The bridge is empty and the comms murmur on. The scene loses the Abara beat and keeps everything else.

**8. The wiring is "a month back", but the ship has been quiet for six weeks.** *Nit.*
P1 Ostrow: "Six weeks ago she pulled a full core… Since then her ship's been running quieter". [P]: "In the six weeks after the core came aboard"; Castellan: "nights, a month back". The quiet should start when the sensors and ECM went live. **Fix:** "nights, the first weeks after she brought it aboard."

## B. Who knows what

**9. Castellan's disclosure ignores his trust gates.** *Should-fix.*
Plays on every route at any `trust.castellan`, including murdered (where he starts about 40). Yet 1.7's far smaller slip ("I'd know") needs `trust.castellan ≥ 55`, and 1.8's "I'll tell you. Not today" needs ≥ 55. Here he volunteers "She was getting ready to go all the way. Everything through Pell", the forty-one ends and the trunk.
**Fix:** keep the CLASS. BUS run, the key and the risk on every route, because the mechanic needs them. Gate "go all the way… like before the war" and the trunk gesture to `trust.castellan ≥ 50` (not murdered), or give a murdered/low variant where he shows only the one run: "Don't ask me what the rest is." The forty-one ends stay visible, so the clue survives.

**10. The trunk-to-padlock beat is a second new clue, and it explains itself.** *Should-fix.*
> *The trunk he didn't explain goes down through the deck, and aft. You think of a padlock in engineering. He sees you think it.* / CASTELLAN: Old plumbing.

The Writer's notes say this "reuses an existing clue". It doesn't: it adds new information (the trunk runs to the padlocked panel, so to where Pell lives) toward `pell_location` and `offbooks_reactor`. That breaks the one-new-clue rule, and the narration draws the conclusion for the player ("Never explain a clue in the scene that plants it"). plot_so_far already counts three Castellan clues by the end of Act 1.
**Fix:** cut "You think of a padlock in engineering. He sees you think it." Keep the image and the smile: *"The trunk goes down through the deck, and aft. He sees you looking at it."* CASTELLAN: "Old plumbing." The player who saw 1.2d makes the connection; nobody makes it for them. If it stays as written, log it as `clue.castellan.4` and accept two clues.

**11. The player's own knowledge isn't recorded, and the persuaded route leaks to Corvane.** *Should-fix.*
- The state table never sets `knows.corvane_wiring` or `knows.pell_link`, though every route sees the plate and hears the rundown. **Fix:** set `knows.corvane_wiring` and `knows.pell_link` on every route.
- *(kept_quill)* Quill hears the whole thing on any option, so set `told.corvane_wiring.quill` as well as `told.pell_link.quill`.
- *(persuaded, option 4)* Fenwick "tells me everything" (1.4A1), so breakfast reaches Corvane: set `told.pell_link.corvane`, and note it for her next visit.
- Option 4: say what the crew are told at breakfast. Is it only the shallow link, or that Castellan wired Corvane's ship? The crew will ask who ran the cable. If the answer includes Castellan, it's a big move in his complicity arc and needs its own effect (and probably a bigger Castellan cost than −2). Recommend "the link, not the history": `told.pell_link.*` only, with Castellan's −2 for the paperwork.
- `knowledge.csv` known_by: `pell_link` should include `corvane` (she ordered it).

## C. Consent rule and cable rule

**12. Option 1: Pell's request contradicts 1.5, and the promise has only one answer.** *Should-fix.*
> PELL: If I drop out in the middle of something, will you tell me afterwards? I might not know. → "I'll tell you."

Pell noticed its own 22:13 gap (1.5), so "I might not know" is false to the character. The single forced reply also makes `wiring_gap_promise` ("the captain tells it or doesn't") a promise the player never chose.
**Fix:** "If I drop out in the middle of something, I'll know I went. I won't know what I missed. Will you tell me?" → "I'll tell you." / → "If there's time." (The second answer gives `pell.trust` +1 instead of +3 and sets `seen.wiring.promise_hedged` for the callback.)

**13. Option 4 never asks Pell.** *Must-fix (consent rule).*
> → "Seat it. And it goes in the log. The crew hears it from me at breakfast."

[P] sets the rule: "Pell must agree, and it can refuse." Option 1's line has "Say no if you mean no", but option 4's doesn't, so Pell's "Yes." answers a question nobody asked.
**Fix:** add it to the choice: "Seat it, if Pell agrees. And it goes in the log…" Or keep the choice and have Castellan stop: "You didn't ask it." → *Ask.* PELL: "Yes." This is better, because the player learns the rule by breaking it.

**14. Option 2 resolves with Castellan nowhere in sight.** *Should-fix (cable rule).*
After "let Pell choose", Castellan "tapes the run back off". `call.pell.wiring_answer` (speaker pell, seat control) then gives "integration +10 (on yes)… the captain turns the key then". The run has to be re-seated by a human hand first.
**Fix:** on a yes, the call sets `wiring.pending_seat`, and the key turns only after a short Castellan beat (or `call.castellan.wiring_again` fires with the "Pell said yes" variant). Alternatively, Castellan leaves the run seated but switched off in option 2 ("Seated. Not keyed. It's Pell's to say."). Then only the key remains, and that is the captain's hand.

**15. "Castellan can't turn it for you" is a new rule. Say it's command, not cable.** *Nit.*
Under the cable rule any human hand works ("the captain turns a key on the pedestal, or Castellan runs a line"), and Dace runs his own line in 1.8. Pell's three rules mix a physical rule with a command one.
**Fix:** "I can't turn the key. It's your ship, so it's your hand on it. And I can say no." That keeps "fond of all three".

## D. Integration numbers, gates and assists

**16. Shallow-link assists reach tier 25 without any deep run.** *Must-fix.*
`pell.assist_classifier` costs `integration +3` per use. The [Hunt UI] says assists add integration each time one is taken. 10 + 3×5 = 25 after five hunts, which unlocks `pell.assist_lead` / `pell.assist_heat` (`needs: integration>=25`) on the shallow link alone. That contradicts the Writer's notes ("tier 25 needs deeper runs, which cost visibility") and `tally.trace` (deep runs +8 each). It also triggers the tier-25 story event (narrative_architecture §3.2) with no human act beyond clicking assists.
**Fix (pick one):** (a) the 25-gated assists also need `seen.wiring.deep_run_1` (a Castellan scene that adds +8 trace); or (b) shallow-link assists cap integration at 24 ("the run can't carry more"), with the cap shown on the gauge. (b) is simpler and visible. Write the rule in mini_missions.md §3.

**17. `mini_missions.json` doesn't carry the new gate.** *Should-fix.*
`pell_assists[*].needs` is still `integration>=10` / `>=25`. Only the `status` string mentions the wiring scene. **Fix:** `"needs": "seen.wiring.key_turned, integration>=10"` (and the same for the 25s). `docs/mini_missions.md` §3 ("Once integration passes a tier, Pell offers…") also needs a line: the classifier assist is at 10, below the first tier.

**18. With no hunt left in Act 1, options 2 and 3 can't resolve there.** *Should-fix.*
After 1.6 the only hunt-like event in Act 1 is the commission's "recovery run", and nothing says it's a hunt. Every Act 1 scene from 1.7 to the 1.9 coda is text or calls. So `call.pell.wiring_answer` ("after the next hunt"), `call.castellan.wiring_again` (`last_hunt.hull<60`), the gap promise and "the first hunt after this scene" all land in Act 2. The Vesper audit at the start of Act 2 then comes *before* any of them. That's fine, but say so, or decide the recovery run is a hunt.
**Fix:** a line in Gates: "First possible payoff: the first Act 2 hunt (after the Vesper audit), unless the 1.7 recovery run is played as a hunt." The writer of the audit scene needs to know the waiting and dead key states will be what the auditors see.

**19. Logging the link writes an interdict offence into the ship's papers.** *Must-fix (design decision for Dave).*
Canon: "*Running* one (letting it do a job aboard) is what gets a ship interdicted" (universe_background). Castellan: "You let it do a job, you're running it." Option 4 writes exactly that in the ship's log, and as costed here it is only +6 trace. Any Act 2 audit that reads the log has to interdict the ship at Vesper, which collapses Act 3 ("Interdicted") into the start of Act 2. It's also unclear whether "the log" means the ship's log or the Tally (`tally.declared` doesn't move).
**Fix:** decide one of the following and write it into the scene and `wiring_audit`: (a) the ship's log is private, the Tally isn't touched, and +6 trace means "findable in writing if they subpoena the log" (recommended; the audit reads the trace and it never decides the outcome by itself); (b) the shallow link is *declarable* the way "switching one on a little, to value it" is, so option 4 also sets `tally.declared +1` and the Act 2 audit treats a logged, bodge-sized link as a fine, not an interdict. Either way, Quill's "In the log" on kept_quill needs the same meaning.

**20. Is option 1 on kept_quill really unlogged?** *Should-fix.*
Quill's POV: "*Wants:* it logged. *Would never say:* that she'd keep it secret." She is on watch and logs everything ("I see everything on my watch… That's what it's for"). If the captain picks option 1, Quill writes it in *her* watch log, so the trace should be closer to +6, and `wiring_hidden` can't fire for her.
**Fix:** *(kept_quill, option 1)* QUILL: *(writing)* "Twenty-three-forty. Run seated. Captain's hand." CASTELLAN: "Quill." QUILL: "My watch, Castellan." Set `seen.wiring.logged_by_quill` and `tally.trace +4`, and keep trust.quill −3 (she logged it, but the captain didn't ask her to).

**21. The state table and the inline tags disagree.** *Should-fix.*
- Option 4 `pell.trust`: tag "+5" (no route split); table "+5 … murdered +2".
- Option 2 murdered: the tag has no `trust.castellan +1`; the table gives +1 on every route.
- Option 2 `command.style`: the table says 0, the tag has none. Consistent, but say "0".
- Hunt UI copy: the dead key is "NOT WIRED"; the walk-demo tag is "NOT TERMINATED". Pick one ("NOT TERMINATED" is Castellan's capitals and better).
**Fix:** make the tags authoritative and regenerate the table from them.

**22. Command style bands: use the committed band.** *Nit.*
"*(band)* = `command.style` band at the moment of choosing." The 11-02 decision (act1_completion_plan) says bands have hysteresis and "volunteered options read the committed band." **Fix:** "the committed band (hysteresis per act1_completion_plan)." Also add the 1.6b rows to command_model §4: wiring turned off the log +2 / declined tight −2 / declined loose +1 / turned on the record −3.

## E. Trust reactions

**23. Abara +2 for learning the captain is running Pell.** *Should-fix.*
She is a wary Instrumentalist. The next morning (1.7) she says "That's how she started" about a hidden core, and the 1.9 coda line is "That's how ships get interdicted". Honesty earns her respect; the act itself frightens her.
**Fix:** option 4 `trust.abara +0`, with a one-line beat at breakfast or in 1.7 *(seen.wiring.logged)*: ABARA: "You told us. That's the part I'll remember. *(beat)* It's not the only part." And add a 1.7 variant so her "That's how she started" lands knowing what the captain did the night before.

**24. Pell thanks the captain for broadcasting it.** *Should-fix (Pell POV).*
> PELL: Yes. And thank you for the log. I'd rather be on the record than in the walls.

Pell knows the ship is heard outside the quiet hour (1.5: "Nobody can hear us. I'm going to say that again, because it matters"). Breakfast in the mess is heard; the Writer's notes say so, and 1.7 proves it. Pell wouldn't simply welcome that. It would warn obliquely and still not decide for the captain.
**Fix:** PELL: "Yes. Thank you for the log." *(beat)* "Breakfast is a very public meal. I mention it for no reason." (On kept_quill or ended, where the setting is already public, keep only the first sentence.)

## F. Voice and register

**25. The murder register slips in three places.** *Must-fix.*
- The control room setting: *(kept_captain)* "PELL: Captain Night Watch. We have a visitor…" carries no *not murdered* tag, so on murdered + kept_captain both it and "PELL: Captain. Castellan." play. Pell stops using nicknames on the murder route (1.1 notes). **Fix:** tag the three setting lines *(…, not murdered)* and let *(murdered)* replace Pell's line on every setting.
- Option 4's Pell lines have no murdered variant. **Fix:** *(murdered)* PELL: "Yes. Logged is better."
- Assist pitch lines ("Also it's me.") need clipped murdered variants before they ship in hunts.

**26. Castellan calls Pell "she" right after calling Corvane "she".** *Should-fix.*
> CASTELLAN: She was getting ready to go all the way. … Middle of a hunt she'd just... not be there. Then she'd come back, and not know she'd gone.

Then later: "Never thought to ask it." He calls the *ship* "she" (1.2d, 1.6), and that's in character. But "she" for Pell, three lines after "she" for Corvane, is ambiguous, inconsistent with his own "ask it", and works against the "it" rule (audit item 23). **Fix:** "Middle of a hunt it'd just… not be there. Then it'd come back." Keep "There you go, darlin'" to the *panel*.

**27. Smaller voice and format points.** *Nit.*
- "That's a seven, for a first step." Pell rates "out of ten"; 1.9's callback is "Seven out of ten". **Fix:** "Seven out of ten, for a first step."
- Pell on option 2: "Let me watch you work without me first." It just watched the shakedown without itself. **Fix:** "I watched one hunt without me. Let me watch one where something shoots back."
- "Harder, not worse" now appears in the prescribed 1.5 line *and* the 1.6b decline line, on the same path. Fine as an echo; use it once on purpose.
- "the plot sharpens, the way a picture does when somebody finally wipes the glass": borderline purple, and it appears twice (option 4: "The plot sharpens"). Keep one.
- *(ended)* "*The comms murmur on. They've been on the whole time.*" points at the consequence (style guide §3: subtext over statement). Consider cutting it; `told.pell_link.steward` doesn't need it.
- Option 4 is printed *after* the "*(after any decline)*" Pell line, so it reads like a follow-on. Move "*(after any decline…)*" below all the options.
- Option 2 murdered lacks the "*tapes the run back off*" direction.
- The Writer's-notes suggestion "*Pell tell you about the key? Course it didn't say who.*" assumes Castellan knows what Pell said in a private quiet hour. Drop it, or make it Castellan's guess ("It tell you about the key yet? Figured.").

**28. On the ended route Pell is too candid on open comms.** *Should-fix.*
1.5 (ended): "I'd talk more freely in a quieter hour… I'm telling you that I'm not saying it." 1.6 (ended): "Ask me in a quieter hour." In 1.6b (ended), Pell says "Nobody's asked me that. Not her either." and lists its three rules, all over open internal comms, and lets Castellan describe Corvane's whole install without a word.
**Fix:** *(ended, not murdered)* first Pell line: "Comms are on, Captain. I mention it because I always mention it." For option 2 *(ended)*: PELL: "Ask me in a quieter hour." Then route `call.pell.wiring_answer` through `call.pell.quiet_hour` on that route. Keep the forty-one silence; silence is safe on any channel.

**29. Purpose and clue rule: the oddity is shown to everyone, the clue only on asking.** *Nit.*
Every route counts "Forty-one", but `clue.pell.3` is set only on "→ Forty-one?". Style guide §4 says each scene *plants* one concrete oddity, and this one is planted on sight. **Fix:** set `clue.pell.3` on the count line, and keep `seen.wiring.forty_one` for the question. (Also check `reveal`: the clue reads as much like `corvane_waking` as `pell_is_front`. Pell's one-line silence is what ties it to `pell_is_front`, so keep the silence on every not-murdered route.)

## G. New state, ids, ledgers

**30. `tally.trace`: approved, but declared nowhere, and its namespace misleads.** *Should-fix.*
- `state.json` says: "Add a variable here before using it anywhere". It isn't there yet, and the scene and `calls.csv` rows already use it (narr_check fails on the scratch copy).
- `tally.*` is the ledger: `tally.declared/hidden/destroyed` count AI-touched salvage, and `tally.audit_pending` is a flag. `tally.trace` reads like a ledger column, but it is hidden physical evidence. Dave approved the name (act1_completion_plan 11-02), so this is a note, not a rename demand: if it's ever reopened, `audit.trace` or `trace.integration` is clearer.
- **Readers:** only the planned Act 2 audit (`wiring_audit`, owner TBD). **Writers:** 1.6b, `call.pell.wiring_answer`, future deep runs (unwritten). That's acceptable for a planned variable; make the audit the named owner.
- Do **not** let Abara's 1.9 coda read it (the Writer's notes suggest "`seen.wiring.key_turned` / `tally.trace`"). That breaks "never shown; read only at audits". **Fix for 1.9:** gate on `seen.wiring.key_turned` and `told.pell_link.abara`. If she doesn't know, she can't say "You'd like to not be found running". Give her the box-only lines, and give Pell *(key turned, not told abara)* a formal line, its lying tell: "They'll find clockwork. Mostly." That is the honest moment for `wiring_hidden`.
- **Declare:** `"tally.trace": {"type":"int","min":0,"max":100,"default":0 (or see 3),"hidden":true,"doc":"What a Tally audit could physically find of Pell's integration aboard. Read only at audits; never shown."}`.

**31. Undeclared call conditions.** *Must-fix before `calls.csv`.*
`hunts_since_wiring` (narr_check skips it silently because it has no dot) and `last_hunt.hull` (narr_check rejects it). `leg` counts legs, not hunts, so "or reuse leg" doesn't work. "captain asks" isn't state.
**Fix:** declare `hunts` (int, a counter the hunt layer writes) and `last_hunt.hull` (int 0-100). Write the condition as `hunts > wiring.hunt_at` (store `wiring.hunt_at` = `hunts` when 1.6b plays), and turn "captain asks" into `seen.pedestal.asked` (from the walk-demo kick plate). Separately, extend narr_check to reject undotted unknown identifiers.

**32. `told.pell_link.steward` needs the cast fix first.** *Should-fix.*
`cast.json` `others` has `corvane` and `patron` ("(unnamed)"), no `steward` (audit item 24). The Writer's notes know this; the dependency should be in the scene's Gates as a blocker. Note also that `told.*` means "what the crew have been told". The Steward *overhears*, so it fits only if `steward` is added as an `others` id. That's acceptable; just say it's the overhearing case.

**33. `seen.shakedown.debrief` doesn't exist.** *Should-fix.*
1.6 sets `shakedown.result`, `knows.decoy_turned` and `seen.shakedown.quill_assigned`, but nothing called `seen.shakedown.debrief`. **Fix:** gate 1.6b on `shakedown.result != unset`, or add `[seen.shakedown.debrief]` at the end of 1.6's debrief.

**34. Naming conventions.** *Nit.*
- `scene.act1.wiring`: no other scene has a `scene.*` id. Others are referred to by number and their `seen.<shortname>.*` (pell_night, shakedown, aftermath, meeting). `seen.wiring.*` follows that pattern, so drop `scene.act1.wiring` or adopt scene ids everywhere.
- `choice.wiring` is fine (choices.csv is header-only, so this sets the precedent; write it into the architecture doc).
- `call.castellan.wiring_again` has seat `engineering` but its content is at the control-room pedestal. That's fine if he asks in engineering and you walk up together; otherwise make the seat `control`.
- knowledge.csv rows: the `corvane_wiring` description has embedded `"for later"` quotes in an unquoted field. Python parses it, but quote the field.

**35. `call.castellan.wiring_again` against the 1.8 pacing rules.** *Nit.*
1.8 rules: "never the same officer twice in a row" and "never the Dace and Castellan calls on back-to-back legs". A third Castellan call (priority 55, not once, cooldown 2) needs the same spacing. It also needs a *(seen.call.dace.burn_1, hand not healed)* variant: he seats a run one-handed, or asks you to hold the crimp.

## H. What the prescribed 1.5 and 1.6 changes leave broken

**36. 1.5 (`act1_pell_night.md`): beyond the five listed edits, these also go stale.** *Must-fix with the edit.*
- Header **Purpose**: "The first firewall offer, with both answers viable, and the player's own hand on the switch." → "Pell plants the red key without offering it."
- Background bullet "**The cable rule:** … A human hand has to throw the switch." Keep it, but it now sets up 1.6b.
- "## The offer" heading → "## The key".
- Line 129's effects, all of them dead: `integration +10`, `seen.pell_night.overlay`, `pell.trust +3`, `trust.quill −3 (kept_quill)`, `trust.abara −2 (ended)`. Line 133: `pell.trust +2 (not murdered)` for "Not yet".
- Pell's kept_quill "So would I." (after Quill's log line) goes with the Quill line.
- *(murdered)* offer line, line 117.
- Notes bullet "**The red switch.**" (the edit covers it) and "**The murder route** gets the same choices": there are no choices now; the murdered player gets one line.
- **The prescribed replacement leaks on the ended route.** "There's a key… Somebody would have to finish what's behind it." On *(ended)*, comms are on, and Abara is there with one eye open. Pell is guarded on this route and wouldn't advertise unfinished integration wiring. It would also set up `told.pell_link.steward` a scene early. **Fix:** *(ended, not murdered)* PELL: "Business, then. Shakedown in two days. I can't help with it, and I'm not going to say why." That keeps 1.5's ended register. Give the full key hint to kept_captain only, and on kept_quill just "There's a red key on the pedestal. It doesn't do anything." (Quill's presence keeps Pell polite.)
- The replacement "I'm not going to say who. I'm telling you I'm not saying." repeats 1.5's ended-route line almost word for word. On kept_captain that works as an echo; check that no route hears both.
- The replacement murdered line "…The red key's connected to nothing. Noted." Pell says "Noted" to acknowledge *others* (P3, 1.5). Cut "Noted."

**37. 1.6 (`act1_shakedown.md`): every dead or contradictory element.** *Must-fix with the edit.*
- Line 6 variant tag *(overlay)* / `seen.pell_night.overlay`.
- Line 19 Pell POV: "*(overlay)* sees the turn first… though it hasn't read Abara's code." Replace with: "No channel: it hears Quill call the turn like everyone else. Tell: silent for exactly one line."
- Lines 47-53, the briefing overlay block, with its effects `trust.quill −2`, `trust.dace +1`, and "The captain prefers mystery. Noted."
- Lines 70-72, the turn: drop both *(overlay)* lines and make the *(no overlay)* Quill line untagged.
- Line 81 "*(overlay)* *Pell says nothing, for exactly one line.*" → *(not murdered)*. With no channel, the silence follows Quill's call, which works.
- Line 173 note "**Pell asks before outing the overlay**": delete it, or move the idea (consent even about itself) to 1.6b option 4.
- Line 64 hunt note: the 1.5 overlay hunt bonus ("1.6 detection bonus") is gone, so the shakedown is always unassisted, and hidePell must cover it (the scene says so; also `act1_completion_plan.md` line 52).
- Not dead, but it now jars: the "Pell, what was that?" *(kept_captain or kept_quill)* "I don't know. I'd like to be clear that I don't say that often." still works.

**38. Other files that disagree, beyond the scene's list.** *Should-fix.*
- `docs/scene_outlines.md` 1.5 items 2-3 (the overlay offer, "accept (`integration +10`, hunt bonus)") and `docs/storyboard.md` 1.5 ("Offers the first firewall trade: a faster detection overlay"). The scene lists these files only for *adding* 1.6b.
- `plot_so_far.md`: 1.5 line; the integration list "0, 5, 10 or 13 by now (logs, overlay, Dace's line)" (already incomplete: reachable values are 0/3/5/8/10/13/15/18); the threads table "Pell is a front | P3 R5, 1.5, 1.9" → add 1.6b; "Castellan's reactor | 1.2, 1.7, 1.8" → add 1.6b if finding 10 stays.
- `command_model.md` §4 rows (finding 22) and §5 "the detection overlay in 1.5".
- `docs/mini_missions.md` §3 (finding 17).
- `universe_background.md` open question "Whether inspectors can see a ship's integration" → answered: physically, via a hidden trace read at audits.
- 1.9 coda (finding 30); 1.7 (finding 23); 1.8 `call.dace.burn_1`. Castellan's "I don't want the box doing arithmetic on my hand" now follows a night when he championed wiring Pell in. Add a *(seen.wiring.*)* variant on every route, not only key turned. The Writer's-notes line "Box is already in the walls, Doc" tells Dace about the link: on the unlogged route that sets `told.pell_link.dace` and should trigger `wiring_hidden`. Pick a line that doesn't, for example "Box is already doing enough round here."
- `audit_playability.md` items 23 and Q2 still name "the 1.5 overlay". They're historical; add "(superseded by 1.6b)".

## I. Act 2 risks to log now

**39. What a later scene would contradict.** *Should-fix (add to callbacks or Writer's notes).*
- **Audit outcome:** see 19. Without a ruling, the first audit scene either interdicts honest players or makes the log meaningless.
- **"Half of fire control"** was wired to Pell, and Abara's module is a Remainder fragment from war-era fire control. An Act 2 scene that wakes the module (`clue.loyalist.1`) will have to say whether those half-done fire-control runs are involved. Decide now, or add "not connected" to [P].
- **Random drops against Quill's signal logs:** after 1.6b the hunt can produce gaps with no signal. If Quill (Act 2, triangulating) ever checks a hunt gap, it must show *nothing* on her band, or the drops become false positives for the Choir. Note it in `wiring_gap_promise`.
- **Tier 25's truth** (narrative_architecture §3.2, "It was not built for this ship") repeats `clue.pell.1`. That's pre-existing, but 1.6b makes reaching 25 concrete. Give the tier a new fragment.
- **CSRA inspector visitor** ("no hiding anything; Castellan is nervous"): with the kick plate, the inspector aboard should have a pedestal beat. Add it to the visitor's storylets.
