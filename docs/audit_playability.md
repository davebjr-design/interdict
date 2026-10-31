# Audit: playability and narrative coherence of what is built (2026-10-31)

Independent review of the walk demo (`design/proto_iso.html`), the hunt console and P2 tutorial (`design/hunt.html`, built from `web/hunt_rt_template.html` + `web/tutorial.js` + `web/trims.js`), and the narrative track (`docs/`, `docs/scenes/`, `data/narrative/`, `data/decision_cards.json`, `data/mini_missions.json`). No game code or other docs were changed.

**How it was tested.** The demo was played end to end with Playwright (Chromium) from a local static server: Tern control → Ostrow → tutorial hunt → surrender → back on the Tern → junction/Ames → airlock → boarding → Corvane's control → "Any ideas for the ship?" pitches → "Run a hunt with these trims" → "Restart at the Tern" → a second tutorial. Then targeted probes (break contact during the tutorial, integration carried in localStorage, highlight targets, firing through the real Target view). Scripts and the run log are in the scratchpad: `/tmp/claude-0/-home-claude/dbd627fa-e303-5272-aa05-75a59f64ae3e/scratchpad/audit/flow_full.js`, `.../audit/flow_full.log`, `.../audit/probe2.js`, `.../audit/probe_fire.js`, `.../audit/probe_hunt.js`. Screenshots: `/tmp/claude-0/-home-claude/dbd627fa-e303-5272-aa05-75a59f64ae3e/scratchpad/audit/shots/` (cited below by file name, e.g. `H04_step5_fire.png`). `tools/narr_check.py` passes (`calls 5, facts 27, reveals 7 OK`); `tests/check_ship.js` passes; the built `web/hunt_rt.html` and `design/hunt.html` match their sources. No page errors or console errors in any run (Google Fonts fail offline in the sandbox; ignored).

## Summary verdict

**The flow is completable end to end with no crashes, dead links or hard softlocks, and the narrative canon is in unusually good shape** (the scene docs agree with `state.json`, the ledgers and each other on timeline, names and who-knows-what, with a handful of exceptions listed below). **The tutorial does not yet teach**: none of Ostrow's highlights are visible (they point at the hidden legacy DOM), the Fire instruction doesn't mention the Target view or the guard, and Corvane's ship's names and Pell's meter leak into the Tern. Around it, the walk demo has three state leaks (trims and integration carried into the tutorial via localStorage, and a reset that doesn't reset them) and a short walk-demo briefing that skips the two P1 choices P3 calls back to. On the design side, the newest doc (`decision_moments.md`) replaces the officer-pitch trims the demo just shipped, and it contradicts `command_model.md` on what "tight" and "loose" do to classification speed and the firing cone.

One blocker, seventeen should-fix, nine polish. Fix order suggestion: 1, 2, 3, 4, 5, 6, then the narrative should-fixes (12-19) before the dialogue runner (C.1 in `act1_completion_plan.md`) locks them into Ink.

---

## Findings

### Playability: tutorial hunt (P2)

**1. Ostrow's highlights are never visible; the tutorial can't point at anything.** *Blocker (for the tutorial's purpose).*
Evidence: `web/tutorial.js` highlights `#analysts` (step 2), `#fire` (steps 5 and 7) and `#sinkc` (step 6). In the built page `#analysts` and `#sinkc` live inside `#legacy` (hidden, positioned at x ≈ -9,545 px) and `#fire` doesn't exist; the v2 console uses `k-fire`, `k-vent`, contact slips and `k-inv`. Probe output: `analysts: 175x126 at -9545,773 inLegacy=true hidden=true`, `fire: MISSING`, `sinkc: ... inLegacy=true hidden=true`; during play `hi analysts(legacy,hidden)`, then `hi none` for steps 4-7 (`flow_full.log`). Screenshots `H02_step2.png`, `H04_step5_fire.png`: no outline anywhere.
Fix: retarget to console ids: step 2 → the contact slip's H/R/V channel cells (`[data-act=chan]`) or `#k-inv`; step 4 → `#k-lock`; step 5/7 → `[data-act=target]` on the Tactical view, then `#k-fire` once the Target view is open; step 6 → `#k-vent` (or the heat-sink header). Add a smoke test that asserts every `hi` id resolves to a visible element.

**2. Step 5's instruction doesn't match how firing works.** *Should-fix.*
Evidence: "When the Fire button lights, put a volley on her." On the Tactical view there's no Fire button; the player has to open the Target view (`TARGET ▸ C3 READY` in the weapons strip) and then press FIRE SALVO twice (lift guard, then fire). Confirmed through the real UI: the first click only arms it; the second fires (`probe_fire.js`, `H04_step5_fire.png`, `H11_target_view_fire.png`).
Fix: split it into two lines: "Open the target plot (Target, or press 3)", then "Lift the guard, then fire." Highlight each control in turn (see 1).

**3. Mini-mission trims from Corvane's ship apply inside the Tern tutorial.** *Should-fix.*
Evidence: `docs/scenes/p2_tutorial_hunt.md` says "Mini-mission trims don't apply on the Tern." The hunt page reads `localStorage['interdict.trims']` for every hunt, including `?tutorial=tern`. After choosing trims on Corvane's ship and pressing "Restart at the Tern", the second tutorial ran with `TRIMS_ON ["tac.judgment_lead","sens.snap_classifier"]`, `P.readDone 6.4` (was 8), `leadSpread 0.7`, and the badge "Trims: Lead from judgment / Snap classifier" in the corner (`H07_tutorial_with_leaked_trims.png`).
Fix: in `tutorial.js`, force `TRIMS_ON = []` before `begin()` (or have `HuntTrims.active()` return `[]` when `tutorial` is set), and remove the badge.

**4. Pell's integration carries into the Tern, and the meter shows it.** *Should-fix.*
Evidence: with `localStorage.interdict_integration = 35` (left over from any normal hunt played with Pell assist), the tutorial starts with `S.integration 35` and the INTEGRATION meter reads 35% (`H10_tutorial_integration_leak.png`). The SHIP & AI header still reads "HULL · SYSTEMS · PELL · BREACH" (`H01_tutorial_start.png`). The "known gap" in the P2 doc covers only the meter's visibility, not the carried value. The tutorial's `save()` would also write the value back.
Fix: in tutorial mode set `savedInteg = 0`, skip `save()`, and hide the whole integration cell plus the "PELL" word in the header (the `hidePell()` regex only matches whole-text nodes).

**5. Corvane's crew names leak into the Tern's Target view.** *Should-fix.*
Evidence: on the Target view in the tutorial the auto-lead key reads "FOLLOW ABARA / AUTO LEAD" and the plot's aim marker is labelled "Abara" (`H11_target_view_fire.png`). `tutorial.js` renames only analysts and log lines (`NAMES`, `remap`). Several console tooltips also name Pell ("...a fresh track, and Pell...").
Fix: route display names through one lookup (`crewName('Abara')`) in `hunt_console.js`, which the tutorial overrides; or have the tutorial patch these labels.

**6. Breaking contact makes Corvane surrender.** *Should-fix.*
Evidence: pressing BREACH in the tutorial spools the drive; when the jump completes (`S.over = 'breach0'`, her hull untouched at 110/110), `director()` treats any `s.over` as the surrender cue and plays "Hold your fire, Ostrow. I'll take visitors." (`probe2.js` A; `H09_breach_then_surrender.png`). By the same rule she also surrenders if our hull drops under 45 before a single shot is fired, and "Hold your fire" then makes no sense.
Fix: in the tutorial, disable or hide `k-breach` (Ostrow wouldn't run), or have Ostrow cancel it ("We're not leaving."). For the hull < 45 path, use a variant laser line ("Enough, Ostrow. Nobody needs to die tonight. Send me the new one.").

**7. The step box is never paused and can stall at 1/7.** *Polish.*
Evidence: game time runs while the player reads step 1 (`0.10 → 0.29` game minutes in 3 s). If the player doesn't press "Understood", no later step can complete: the box stayed on "1 / 7" after a lock and a volley had already happened (`probe_fire.js` run 2), and when the player finally presses it the steps cascade one per tick. After "Skip step" on 7/7 the box keeps showing step 7 with a dead Skip button (`H08_skipped_all.png`).
Fix: pause while a step with a button is showing, or let step 1's `done` be "any order given". After the last step, collapse the box to a one-line reminder.

**8. The step box covers live controls.** *Polish.*
Evidence: at 1600×900 it sits over the NEXT beacon (`H01_tutorial_start.png`); at 1400 wide it covers the master-caution lamps; on the Target view it covers REFRESH and the LOCK/TRACK lamps (`H11_target_view_fire.png`).
Fix: dock it in the comms panel or under the top bar, or make it draggable.

### Playability: walk demo

**9. "Walk to a hatch" does nothing for the outer hatch and the locked doors; you have to click again.** *Should-fix.*
Evidence: on arrival the walk demo calls `useDoor` only if `th.to !== undefined`. The Tern's outer hatch (`action: 'board'`) and the locked Tern doors have no `to`, so the first click walks the captain there and nothing happens; a second click on the hatch is needed (`dbg_hatch.js`; `flow_full.log` "arrived at door, nothing happened"). This is the exact interaction Act 0 is meant to teach ("walk there → prompt").
Fix: `else if (th && th.rc) useDoor(th)` (any door object), or test `'to' in th || th.action || th.locked`.

**10. The airlock prompt ("Begin boarding / Look around first") is skipped on the natural path.** *Should-fix.*
Evidence: returning from the hunt reloads `proto_iso.html#after_hunt`, so `amesTalked` is false. Clicking the hatch then runs `amesBeat(true)`, whose Continue goes straight to `startBoarding()` (`flow_full.log`: `[hatch after hunt]` Ames → `[after ames at hatch]` boarding text, no prompt; `W07_hatch_after_hunt.png`, `W08_boarding.png`). `game_flow.md` and `act1_completion_plan.md` both describe the prompt as the loop Act 0 teaches.
Fix: after Ames's beat at the hatch, call `boardPrompt()` instead of `startBoarding()`.

**11. Restart doesn't restart.** *Should-fix.*
Evidence: "Restart at the Tern" resets the JS flags but not `localStorage['interdict.trims']` (the trims line still reads "Trims: Lead from judgment / Snap classifier" on the Tern: `W12_restart.png`) and not the `#after_hunt` hash, so reloading after a restart drops you back at "Report to the airlock" (`probe2.js` D).
Fix: on reset, clear `interdict.trims` and `interdict_integration` (or namespace them per playthrough) and `history.replaceState(null, '', location.pathname)`.

**12. Controls and text from Corvane's ship show on the Tern.** *Should-fix.*
Evidence: from the first frame on the Tern the strip offers "Run a hunt with these trims" and says "No trims set. Talk to an officer: 'Any ideas for the ship?'", but no Tern character has that option (`W01_tern_start.png`, `W06_after_hunt.png`). "Run a hunt with these trims" from the Tern opens a normal hunt crewed by Dace, Castellan and Quill, people the probationer hasn't met. The player's sprite is labelled "CAPTAIN" while standing next to Captain Ostrow (`W06_after_hunt.png`).
Fix: hide the trims button and line while `room.ship === 'tern'`; label the player "YOU" (or "NEW HAND") until P4.

**13. The tracker entry after boarding can never complete.** *Should-fix.*
Evidence: `toCorvane()` sets "MECHANICAL: Walk the ship, bow to stern, both decks". The only completion path is Castellan's manifold job (`afterInspect`), but `manifoldHere()` is hard-coded `false` and nothing else tracks visited rooms. The "MECHANICAL" kind label is also a leftover from the shipwalk prototype (`W09_corvane_control.png`).
Fix: track visited rooms (12 of 12 → done, kind "WALK THE SHIP"), or wire the manifold job into `eng_upper` as the doc's 1.2d beat.

**14. The narration and state labels are printed as "EFFECT:".** *Polish.*
Evidence: "Who sent you?" shows `EFFECT: She says it before you've quite finished asking.` (a stage direction); Ames shows `EFFECT: Ames: bond 1` (`flow_full.log`).
Fix: give `say()` a separate narration slot (italic) and keep EFFECT for mechanics, or hide state names outside a debug mode.

**15. Character positions contradict the lines.** *Polish.*
Evidence: after the hunt Ostrow says "Dunne and Ames are suiting up" and the hatch says "Dunne and Ames are suited and waiting", but Dunne stays seated in the control room and Ames is in the junction; then "(Ames climbs up the trunk behind you, a little out of breath)". Before the hunt, the airlock hatch answers in Dunne's voice although Dunne is two rooms away (`W05_board_before_hunt.png`).
Fix: move Dunne and Ames into `tern_airlock` in `afterHunt()` and drop the "climbs up" line, or rewrite the two lines to match where they stand.

**16. Small text mismatches in rooms and the hunt briefing.** *Polish.*
- The mess blurb says "the hatches fore and aft are not wired yet", but they are (`check_ship.js`: every compartment reachable). It also says "seats twenty-five and there are six of you"; 1.2 says "seats thirty. There are five places set, and one extra."
- The hunt's launch briefing says "you give orders from the contact menu"; in v2 that's the Orders bank (`H06_trims_hunt_brief.png`).
- `quill`'s *Snap classifier* lists Quill as its own objector, so the pitch shows no objection (`data/mini_missions.json`; `W11_quill_snap.png`).
- Navigation and quartermaster trims can be chosen and then shown in the hunt badge although they have no hunt effect (`hunt: false` in `web/trims.js`).

### Narrative: the demo against the canonical scenes

**17. "She asked for you, by name" contradicts the line the player just read.** *Should-fix.*
Evidence: the laser message is "Send me the new one" (`tutorial.js`, `p2_tutorial_hunt.md`). Ostrow then says "She asked for you, by name" (`proto_iso.html` `afterHunt`, and the P2 doc's "Back on the Tern" line). P3 R1 has Corvane greet the player by role ("Ostrow's new hand"), and the P2 doc's own rationale says she asks for "the probationer". The player never has a name anywhere in canon. `storyboard.md` (P3 R1, "Corvane greets you by name") and `scene_outlines.md` (R1, "She names the player... Pell greets the boarders by name") are older and disagree with the P3 draft.
Fix: "She asked for you. 'The new one.' I don't like that." Update the storyboard and outline rows to "greets by role".

**18. The walk-demo briefing drops the choices P3 depends on.** *Should-fix.*
Evidence: compared with `docs/scenes/p1_briefing.md`:
- Only one question can be asked: each answer's Continue calls `endBrief()` (P1: up to three).
- "What's she trying to wake?" and "How good is her crew?" are missing. The second sets `knows.pell_name`.
- "Why bring me?" gives only Dunne's half.
- The closing exchange is gone ("When you find her, she'll want to talk... Hear her out. Then do what you have to." → "What if she's right?"). P3 R5's callback and `clue.pell.0` need `seen.p1.what_if_right`, and Dunne's MURDER line ("She said hear her out") quotes it. In the demo, "Hear her out" is reachable only by talking to Ostrow again after the hunt.
- The sidearm is never handed over (P3 needs the player armed).
Fix: until the Ink runner lands, port P1 as written: a question loop with a counter, then the closing three-way choice. Record `seen.p1.what_if_right` and `ames.bond` in localStorage so later demo beats can read them.

**19. Ames's beat is moved and compressed, and P3's narration no longer fits it.** *Polish.*
Evidence: P1 places the question "in the corridor" right after the briefing, and P3 R3 narrates "An hour ago, in a corridor, he asked you...". In the demo the post-briefing dialog is modal (Begin the hunt / Skip), so the natural place is the hatch after the hunt, minutes before boarding. The bond-2 branch skips the player's "Mostly." reply and the holster-flap beat.
Fix: either ask it in the junction on the way to the hunt station (make the post-brief dialog closable and gate "Begin the hunt" on reaching a station), or change the P3 narration to "At the airlock, he asked you...". Restore "Mostly."

### Narrative: canon against the data and systems

**20. `command_model.md` and `decision_moments.md` disagree on what tight and loose do.** *Should-fix.*
Evidence:
- **Classification speed:** command model §2: tight classifies faster (×0.85), loose slower (×1.10). Decision moments M01: tight "Run the full processors" = normal time; loose "best guess now" = about 40% sooner.
- **Firing cone:** command model: loose "can tighten further before a miss (minimum cone factor −0.1)". Decision moments §1.1: under loose fire control the cone "can't be tightened past the default".
- **Thresholds:** command model bands switch at 15/35/65/85. Decision moments' volunteered options trigger at ≤ 30 and ≥ 70. Neither number is a band edge.
- **Very tight:** command model §2 and `decision_cards.json` hide `style: loose` levers. Decision moments §1.5 keeps the loose option and hides only the volunteered third one. It's fine for the two systems to differ, but nothing says which rule wins.
Fix: decide one meaning ("tight = drilled procedure: faster on the routine, capped judgment; loose = faster first answer with a visible ceiling" fits both docs' prose). Then update command model §2's table and make the band edges the thresholds (or say why moments use 30/70).

**21. Is pinging tight or loose?** *Should-fix.*
Evidence: `decision_cards.json` card4 tags `ping` (going active) as `style: loose`, and command model §8 counts it among the loose levers. Decision moments M02 makes the **full** ping the TIGHT option and the narrow ping the loose one. Abara objects to a ping in card4 ("And if it isn't the decoy?") but cheers the full ping in M02 ("Loud and certain").
Fix: in cards, "go active at all" is a judgment call; in M02, "how to ping" is procedure versus shortcut. State that distinction in `decision_moments.md` §2 (M02), or retag card4 `ping` as `any`.

**22. Pell proposes levers on the shakedown cards while canon has it clamped.** *Should-fix.*
Evidence: card3 `slow_passive` and card5 `cross_check` have proposer Pell. By 1.6 (day 3) integration is 0-10. `narrative_architecture.md` §3.2: 0-24 "Clamped: answers direct questions... stops one step short", 25 "Volunteers: offers observations", 50 "Advises: recommends calls". 1.1 has the ship "thick as a brick" because Pell went back to clockwork.
Fix: at integration < 25, make these levers answers to a question the captain asks ("Pell?" → line), or give them to Quill and Abara with Pell as a gated third option.

**23. The hunt's Pell contradicts the story's Pell.** *Should-fix (design call).*
Evidence:
- **Pronoun:** the console uses "he" for Pell ("Pell assists: he speeds the analysts...", "Rises while he assists"; engine comment "he does not want to be destroyed"). Every scene uses "it".
- **How integration rises:** the PELL ASSIST key raises integration continuously while toggled on, available from the first hunt. Command model §1: integration moves only by "firewall steps (always a human act: the red switch, a cable)". Act 1 makes the first +5 and +10 explicit scene choices (logs, the overlay).
Fix: change the console copy to "it". Decide whether the assist key exists before the 1.5 overlay. If it does, frame it as the red key ("each press is a firewall step").

**24. `cast.json` is missing the Act 0 cast and the Steward.** *Should-fix.*
Evidence: `others` has only `corvane` and `patron` (name "(unnamed)"). Ostrow, Dunne and Ames speak in P1-P4, and Riggs, Okafor and Sato speak in P2. The Steward's name is confirmed in P4. `state.json`'s `told.<fact>.<who>` pattern says `who` may be "a cast 'others' id (corvane, steward)", but `steward` doesn't exist, so `told.x.steward` or `told.x.dunne` would fail `narr_check.py`. `knowledge.csv` already lists `ostrow`, `dunne` and `steward` as knowers.
Fix: add `ostrow`, `dunne`, `ames`, `riggs`, `okafor`, `sato` and `steward` to `others` (rename `patron` → `steward`, or alias it).

**25. The validator checks less than the docs say it does.** *Polish.*
Evidence: `narr_check.py` validates only `calls.csv` (plus clue counts and callbacks). State names in the scene docs aren't checked. A scratch check of every `[bracketed]` and code-quoted name in `docs/scenes/*.md`, `plot_so_far.md` and `command_model.md` against `state.json`, `knowledge.csv` and `clues.csv` found them all valid (`.../audit/scene_names.py`). `choices.csv` is header-only.
Fix: fold `scene_names.py` into `narr_check.py` so it keeps passing once the Ink conversion starts.

**26. The standoff's clock is the same in every route.** *Polish / open question.*
Evidence: P4: "You fired at twenty-two-thirteen" (any shot) / "She stood down at twenty-two-thirteen". Quill logs 22:13 in all endings, and 1.5 and 1.9 key off it. A round-1 murder happens several minutes before a round-6 stand-down (the reading time is 6-9 minutes). If the time is meant to be fixed, that's a strong clue (something chose the moment), but no doc says so.
Fix: either state it as intended (add it to `clues.csv` as a "Something knew" clue), or compute the time from the round (22:07 + round) and keep "eleven minutes" by moving the send time.

**27. Planning docs are out of date.** *Polish.*
Evidence:
- `storyboard.md` still lists P2 as "Deferred (needs interior art)" with the outcome "Corvane's ship found".
- `narrative_architecture.md` §3.5 says `decision_cards.json` "still has the old cast (Pike...)"; the cards were recast on 10-29.
- `act1_completion_plan.md` A.2 calls the officer-pitch trims "wired" and lists the airlock prompt as part of the demo flow; it doesn't mention that `decision_moments.md` (same day) replaces the pitch model (see open question 1).
- `mini_missions.md` §4 still shows *Run her hot* and *Mix the salvo*, which are now shelved.
Fix: one pass marking superseded sections.

### Checked and consistent (no finding)
- The timeline holds:
  - Corvane: 11 years with the Tally, about 14 as a gleaner. The relay station was 3 years ago, the scuttling after it, the core 6 weeks ago.
  - Standoff ~22:13, P4 ~23:15, 1.1 the next morning.
  - The shakedown is day 3, the commission day 4 ("the morning after"), the calls days 4-6, 1.9 night 6, Vesper day 8.
  - Pell's three-second gap is "22:13 yesterday" in 1.5.
- Who knows what holds:
  - Abara and Quill stay unnamed until Corvane names Quill in R3 (persuaded and late-shot endings say "Quill"; the R2 ending correctly says "the tall woman").
  - Pell is named to the player in P1 only if asked.
  - "Steward" is used only after "Who are you?"; P4 labels the speaker VOICE until then.
  - Dunne's six dead match `the_six` and R4.
- The tutorial's surrender text matches the P2 doc word for word. Ostrow's seven steps match the doc. The feed shows only Tern names (`ALL log speakers Riggs,Okafor,Dunne,Sato`).
- In real play the post-briefing dialog is modal (Begin the hunt / Skip), so the "Ames asked twice" double beat I could force through script calls isn't reachable with the mouse. Not filed.

---

## What works well
- **End to end without errors.** No page or console errors in any of the scripted runs. The tutorial always reaches its fixed outcome, and the return to `#after_hunt` lands on the right tracker entry ("Report to the airlock").
- **The tutorial director is cleanly layered** on the real engine (wrapping `newHunt` and `tick`; fixed seed; Corvane's damage throttled to 0.35). Corvane does shoot back, once, lightly (hull 96 at surrender in the probe). The speaker remap works for the feed.
- **The console teaches itself well where it talks:** the NEXT beacon ("C3: SOLUTION READY, TARGET IT"), the hover previews on BREACH (heat rate, fill clock, seen-by-enemy), the guard text on FIRE SALVO (`H04_step5_fire.png`, `H10_tutorial_integration_leak.png`, `H11_target_view_fire.png`).
- **The walk demo's art and navigation:** reciprocal doors (`check_ship.js`), consistent character scale, a Tern deck plan that matches its three rooms, and room blurbs that teach the ship's layout (`W06_after_hunt.png`, `W09_corvane_control.png`).
- **Canon discipline:** one state model and validator, clue and callback ledgers with independence links, every reveal backed by three or more clues, consistent dates and names across 12 scene files. P3/P4's "Something knew" device (the predated blessing, the doubled line, Quill's 22:13) is well planted and never explained early.
- **Trims are honest trades** with real engine hooks, and pitches come with a named objector (all but one, finding 16).

## Open design questions (not resolved here)
1. **Trims or decision moments?** `decision_moments.md` (2026-10-31) says to replace "pick a trim at the officer" with in-hunt tight/loose popups and make trims "standing settings" earned after repeats. The demo shipped the opposite the same day. Should "Any ideas for the ship?" stay as the underway entry point for M06/M08/M10 (the deferred underway moments), or be retired?
2. **When does PELL ASSIST exist?** From the first hunt (as built), from the 1.5 overlay, or from integration 25? This decides whether the hunt is a back door around the firewall story.
3. **Is 22:13 fixed on purpose?** (finding 26) If yes, it's a fourth "Something knew" clue and should be logged.
4. **Where does the Ames question happen?** On the way to stations (P1 canon; needs a non-modal post-briefing step), or at the airlock (current demo; needs P3 R3's narration changed)?
5. **Should the tutorial let you fail?** Today every path ends in surrender, including running away and being shot to 44% hull. If running should be possible, Ostrow needs a line; if not, BREACH should be hidden.
6. **What does the probationer's label become, and when?** "Captain" over the sprite from Act 0 undercuts P4's handover. "You" until P4, then "Captain"?
7. **Command-style thresholds for moments:** use the band edges (35/65, 15/85) or the 30/70 in `decision_moments.md` §1.5?
