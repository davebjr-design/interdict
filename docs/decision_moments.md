# Decision moments: in-the-moment tight / loose calls (2026-10-31)

Dave's direction: replace the pre-flight "pick a trim at the officer" model with **decision moments**. During a hunt (or underway) the action pauses, an officer speaks, and the captain picks a **tight** option or a **loose** option. Each option shows its stat effects; each also silently nudges `command.style` (0 tight, 100 loose; `command_model.md` §2). Constraint buys consistency at a performance cost; discretion buys performance at a consistency cost. Neither wins on average: **loose wins more often and loses harder.**

Sources: `command_model.md` (style, bands, officer preferences), `mini_missions.md` and `data/mini_missions.json` (the trims these replace), `crew_cards.md` and `writing_style_guide.md` (voices), `web/hunt_rt_engine.js` and `web/trims.js` (the `P.*` each effect drives). Shelved and not used here: *Run her hot*, *Mix the salvo*.

---

## 1. Mechanics

### 1.1 The loose mechanic for sensors: the certainty ceiling
**Call certainty** is the classifier's confidence in its best guess for a contact (`classify(s, a).p`, shown as a percentage on the contact card).

| | Full processors (tight) | Hunch call (loose) |
|---|---|---|
| When the call arrives | when two channels reach `den >= P.readDone` (8) | when **one** channel reaches `den >= 0.6 x P.readDone` (4.8): about 40% sooner |
| Read range on this contact | normal | our reads on this contact use `sensRef x 1.15` (46 instead of 40) |
| Certainty shown and usable | uncapped | **capped at 70%** (`P.hunchCap = 0.70`) |
| Noise on the guess | `classNoise x 0.85` (drilled) | `classNoise x 1.5` (more wrong best guesses) |
| Lock quality | normal | a lock taken under the cap is a **hunch lock**: position confidence (`uncertainty().conf`) is clamped to 0.70, so the track can never reach LOCK (needs 0.80), and `a.track` is capped at 1.5 (`P.hunchTrack`), which keeps heading and speed error at 0.42 / 0.32 of the raw value instead of shrinking toward 0.05 / 0.06. The fan is wider and the solution bleeds (`certBleed`) as soon as the track ages past ~1 minute. |
| Lifting the cap | n/a | run the full processors on the contact. They lose their place when Quill jumps ahead: the full call needs `den >= 1.2 x P.readDone` (9.6) on two channels (`P.hunchRestart = 1.2`). When it lands, the cap and the track cap lift and the next fix is a normal one. |

How it plays: loose gives you a usable 70% answer early and far out, which wins most hunts (you close, ping, dismiss and lock sooner). It loses harder in two ways: a wrong hunch on a lure still becomes a chase (`P.chase`, exposure x `P.chasemult`), and the full answer arrives **later** than if you had waited. Quill's ping (M02) uses the same ceiling. Other departments get the same shape: a fast option with a hard limit you can see on the popup.

| Department | Loose mechanic (the "ceiling") | Nearest engine parameter |
|---|---|---|
| Sensors (Quill) | certainty capped at 70% until full processing | `readDone`, `classNoise`, `sensRef` (new `hunchCap`, `hunchTrack`, `hunchRestart`) |
| Fire control (Abara) | a hand-tuned or reused solution has a **shelf life** and its cone can't be tightened past the default | `leadSpread`, `solveStale` |
| Thermal (Dace) | Dace holds the vent for a better moment, up to a **hard ceiling at 92% sink**, then vents wherever you are | `ventFull`, `ventAfterglow`, `forcedRetract` / `forcedStop` |
| Engineering (Castellan) | a short spool **trips** if the sink passes 85% and loses half its progress | `spool`, `spoolDog`, `spoolHeat`, `spoolVis` (new `spoolTrip`) |
| Navigation (Abara) | short legs mean the arrival briefing is **unconfirmed** and the quiet window is shorter | `darkWindow`, `darkHaz` |

### 1.2 How the popup reads
- Title: the officer's name and station. Then the spoken line. Then two buttons, **TIGHT** on the left and **LOOSE** on the right, each with a one-line label and its effects in plain words with the number ("Reads 40% sooner. Certainty capped at 70%."). Each loose button also has an **If it goes wrong:** line, so the bigger loss is visible before you choose.
- The meter nudge is **not** shown. The after-action report says, in one line, how the crew read you ("The crew noticed you let Quill run on instinct twice.").
- The hunt is paused while the popup is up (the engine already has a pause hook: `emit()` with `s.holdEvents` sets `s.hold`). No timer.

### 1.3 Meter nudges
- Normal moment: tight **-3**, loose **+3**. Big moments (M05 spool, M04 fire on old numbers): **-4 / +4**.
- Cap: moments can move `command.style` at most **8 points per hunt** in total. Underway moments count toward the leg's scene total instead.
- Scale check: one scene choice in Act 1 moves 1-8 points (`command_model.md` §4), so a full hunt of moments is worth about one strong scene choice. Moments flavour the meter; scenes still drive it.
- Standing settings (§1.6) nudge **half** (±2, rounded up) once per hunt in which the moment would have fired.
- No nudges in the P2 tutorial: the Tern is Ostrow's ship and the player isn't in command.

### 1.4 Officer preference effects (small, on purpose)
Preferences from `command_model.md` §3: Quill tight, Abara tight-ish, Castellan loose, Dace loose, Fenwick loose, Pell slightly loose.
- When the choice matches an officer's preference, that officer gets **one line** (in the catalogue below) and, if it's their own department, **+1 trust**, at most once per officer per hunt.
- When it crosses their preference, they get **a look** (a portrait beat: Quill's pen stops, Castellan's jaw sets) and no number. The per-leg band rule in `command_model.md` §3 already handles slow drift; moments don't double-count it.
- No moment ever changes trust by more than 1 or unlocks or blocks a scene.

### 1.5 Extra options at the meter's ends
Both options always show. At the ends of the meter a third option can join:
- **Loose ≥ 70:** an officer volunteers: "Captain, I've got an idea, but it's outside the box." A loose-only third lever, drawn from the moment's department (examples: M01, Castellan offers to read the reactor line by ear, faster again but certainty capped at 55%; M07, Dace offers to vent behind the nearest body, `blocked()` cover, which saves the afterglow if you're in line of cover).
- **Tight ≤ 30:** "Already running, Captain." The drilled crew starts the tight option before you choose. Picking it costs 15% less time than the normal tight option (the command model's ×0.85 procedure speed), and choosing loose instead costs nothing extra.
- Very tight (< 15) does **not** hide the loose option here (the captain can always give the order). It hides only the volunteered third option, which matches "the crew stops volunteering."

### 1.6 Standing settings (the old trims, made permanent)
- After a hunt, if the same officer has seen a moment **3 or more times across at least 2 hunts**, they ask in the after-action report whether to make it standing (lines in the catalogue).
- **Standing** = no more popups for that moment. The chosen option applies automatically every time the trigger fires, at **90% of its benefit** (they apply it by rule, not to fit the situation: the flexibility cost) and with the full cost. The half-size meter nudge applies once per hunt. The moment's third option (§1.5) no longer appears.
- **Hunt by hunt** = keep the popup.
- One standing setting per department (the old one-trim-per-department rule). A standing setting can be dropped at any after-action report or dock at no cost, so it never becomes a trap.
- Underway standing settings apply every leg until dropped; they spend no watch.

### 1.7 Frequency rules
- **At most 3 moments per hunt**, at most 1 per officer per hunt, and each moment at most once per hunt.
- **4 game minutes** of cooldown between any two moments. Nothing in the first 1.5 minutes of a hunt.
- If two triggers fire inside the cooldown, the one that protects the ship wins (M05 > M07 > M04 > M02 > M03 > M01 > M09); the other is dropped for this hunt, not queued.
- Standing settings don't count toward the 3.
- Underway: **at most 1 moment per leg**, and it uses one of the leg's ~3 free watches (`mini_missions.md` §1).
- Tutorial (P2): none of the catalogue moments fire. At most one scripted teaching moment (Sato, M01's shape, no nudge). **Narrow ping (M02) never appears in the tutorial.**

### 1.8 Anti-min/max safeguards
1. **Local effects.** Hunt moments apply to one contact, one solution, one vent or one spool, never the whole hunt. You can't stack them into a permanent buff. Only standing settings persist, at 90%.
2. **Triggers come from the situation, not the player.** Every trigger is a game state with a once-per-hunt cap. A player can't make a moment fire again by repeating an action.
3. **The nudge is fixed per option.** There's no "farm the meter" choice: loose options always cost something real, and the cap is 8 per hunt.
4. **Visible downside.** Every loose option names its failure mode on the button, so choosing loose is an informed gamble, not a trap.
5. **The preference payoff is small.** +1 trust at most, once per officer per hunt, so "always pick what Castellan likes" isn't a strategy.
6. **Sim acceptance test** (extend `tools/trim_bot.js`): for each moment, a bot that always picks loose and one that always picks tight, 240 hunts each across the three arenas. Pass if the mean result (win %, hull) is within **±2 points**, loose has the **higher win rate** (by about 2-6 points), and loose has the **worse worst decile** (hull, or losses with 2 ships). If either side wins on both mean and spread, retune that moment's numbers.

---

## 2. Catalogue (10 moments)

Hunt moments: M01-M05, M07, M09. Underway moments: M06, M08, M10.

### M01 `sens.hunch_call`: "Call it now, or call it right"
- **Officer:** Quill (Sensors and ECM). **Where:** hunt.
- **Trigger:** a contact first gets one channel to `den >= 0.6 x readDone` while at least 3 contacts are open and none is locked; t > 1.5 min. Once per hunt.
- **Line (Quill):** "Captain. Contact four is shaping into something. I could give you a call now. It would be a guess with good manners. Or I run the full processors and give you a reading."
- **TIGHT: "Run the full processors."** Call when two channels finish (normal time). Certainty uncapped. Guess noise ×0.85 (`classNoise` 0.85 on this contact).
- **LOOSE: "Give me your best guess now."** Call about 40% sooner; reads this contact at 15% more range (`sensRef` ×1.15, our reads on this contact only). Certainty **capped at 70%**; guess noise ×1.5; any lock is a hunch lock (§1.1). *If it goes wrong:* a wrong guess becomes a chase, and the full reading takes 20% longer than it would have (`readDone` ×1.2 to lift the cap).
- **Meter:** tight -3 / loose +3.
- **Reaction, tight (Quill prefers tight):** "Thank you, Captain. Ten minutes. You'll have a real one."
- **Reaction, loose (Castellan prefers loose):** "Atta girl. Gut's a sensor too."
- **After action (Quill):** "You asked me for a guess on [X] of [Y] contacts. Shall I make that standing, or would you rather I ask each time? I'd rather ask. I'll do it either way."
- **Replaces:** `sens.snap_classifier` and `sens.long_ears`.

### M02 `sens.narrow_ping`: "Half the shout"
- **Officer:** Quill. **Where:** hunt (never in the tutorial).
- **Trigger:** the player orders a ping while any real hostile already has some knowledge of us (`e.know >= 0.3`). Once per hunt.
- **Line (Quill):** "Before you ping, Captain. Something out there is already listening, I think. A full ping answers every question we have and tells them exactly where we are. I can narrow it."
- **TIGHT: "Full ping."** Standard ping: 3 read rounds on every channel (`pingRounds` 3), a full fix on a locked contact. Standard heat and alert (`pingGlow` 0.14, `pingAlert` 0.3).
- **LOOSE: "Narrow it."** Ping heat halved (`pingGlow` ×0.5), alert ×0.6 (`pingAlert` ×0.6). 2 read rounds (`pingRounds` 2). Certainty from the ping is **capped at 70%**, and a fix on a locked contact is a weaker scan (`scan(s, a, 0.6)`: about 30% wider anchor). *If it goes wrong:* you may need a second ping, and the second one is full size.
- **Meter:** tight -3 / loose +3.
- **Reaction, tight (Abara prefers tight):** "Loud and certain. I can work with certain."
- **Reaction, loose (Dace prefers loose):** "A whisper. Lovely. Less heat in my sink, too, not that anyone asked."
- **After action (Quill):** "You narrowed the ping [X] times. Do you want narrow as the standing order, or full unless you say otherwise? I'd keep full as the default. That's my opinion. You didn't ask for it."
- **Replaces:** `sens.narrow_ping`.

### M03 `tac.first_solution`: "By the book or by hand"
- **Officer:** Abara (Fire control). **Where:** hunt.
- **Trigger:** the first successful lock of the hunt (`lockContact` succeeds on a real or friendly contact). Once per hunt.
- **Line (Abara):** "Locked. Now, I can work this solution by the book, which is fast and a bit dumb. Or I hand-tune the lead, which is better until it isn't. Your ship, kid. Captain."
- **TIGHT: "By the book."** Solution time ×0.8 on this contact (`solveMin`, `solveMax` ×0.8). Lead 15% less accurate (`leadSpread` ×1.15 on this contact).
- **LOOSE: "Hand-tune the lead."** Lead error ×0.7 (`leadSpread` ×0.7). The solution has a **shelf life**: it goes stale 25% sooner (`solveStale` ×0.75: 2.25 min instead of 3). *If it goes wrong:* if the target maneuvers after the solution is built (`a.lastMan` later than the build), the hand-tuned lead overcorrects: `leadSpread` ×1.3 until refreshed.
- **Meter:** tight -3 / loose +3.
- **Reaction, tight (Quill prefers tight):** "Checked numbers, Captain. I can check them again if you like."
- **Reaction, loose (Castellan prefers loose):** "There she goes. Nobody leads like Abara when she's let off the leash."
- **After action (Abara):** "You had me work [X] solutions [by the book / by hand]. Want that standing, or do you want to tell me each time? I'll be honest, I like being told."
- **Replaces:** `tac.tight_drill` (tight side) and `tac.judgment_lead` (loose side).

### M04 `tac.stale_solution`: "Fire on the old numbers"
- **Officer:** Abara. **Where:** hunt.
- **Trigger:** a locked contact's solution goes stale (the engine's "has gone stale" event, line 359) while a tube is ready and position confidence is still ≥ 0.5. Once per hunt.
- **Line (Abara):** "Solution on three just went stale. I can rework it, two minutes give or take. Or we put a volley on the old numbers right now and hope she's kept her course. She usually has. Usually."
- **TIGHT: "Rework it."** Standard refresh (`refreshSolution`); re-solve time ×0.85 (drilled crew).
- **LOOSE: "Fire on the old numbers."** The solution stays valid 50% longer for this contact (`solveStale` ×1.5, 4.5 min), so you can fire now. The fan widens with the track's age, as the engine already does (`spreadAt` with the larger tau), and the cone **can't be tightened below its default** (minimum cone factor +0.15). *If it goes wrong:* a miss costs a tube for `P.reload` (3 min) and lights you up with the blast glow.
- **Meter:** tight -4 / loose +4.
- **Reaction, tight (Quill prefers tight):** "Good. I'll give her a fresh fix to work from."
- **Reaction, loose (Dace prefers loose):** "Oh, bold. I love it. I'm going to go stand somewhere sturdy."
- **After action (Abara):** "[X] times now you've had a choice on a stale solution. Standing order? Or keep asking me? Keep asking. Old numbers are a thing you decide, not a habit."
- **Replaces:** none (new; covers the "reuse vs recompute" case).

### M05 `eng.short_spool`: "Spool her now"
- **Officer:** Castellan (Engineering). **Where:** hunt.
- **Trigger:** the player orders the breach spool (`retreat()`) while a real hostile has `know >= 0.5` or a volley is inbound on us. Once per hunt.
- **Line (Castellan):** "Captain, I can short-spool her. Skip a couple of the warm-up stages, she'll jump a quarter sooner. She'll run hot doing it, and if the sink tops out she'll trip and we start the back half over. Your call, darlin'. I mean Captain."
- **TIGHT: "Full spool."** Standard spool (`spool` 3 min, `spoolDog` 11.25 min at a dog-leg), standard glow and heat (`spoolVis` 0.9, `spoolHeat` 0.06).
- **LOOSE: "Short-spool her."** Spool time ×0.75 (`spool`, `spoolDog` ×0.75). Louder and hotter while spooling (`spoolVis` ×1.1, `spoolHeat` ×1.3). **Trip ceiling:** if the sink passes 85% during the spool (`P.spoolTrip = 0.85`), the spool trips and loses half its progress. *If it goes wrong:* a trip under fire leaves you spooling, bright, for longer than the full spool would have.
- **Meter:** tight -4 / loose +4.
- **Reaction, tight (Abara prefers tight):** "Full spool. Good. I'd like to arrive in one piece."
- **Reaction, loose (Castellan prefers loose):** "That's my girl. Come on, darlin', hold together for me."
- **After action (Castellan):** "You had me short-spool her [X] times. Want me to just do that every time we bug out? Or you want to call it? Either way, but if it's standing I'm keeping a fire extinguisher by the coupling."
- **Replaces:** `eng.spool_tune`.

### M06 `eng.bearings` (underway): "She can whisper"
- **Officer:** Castellan. **Where:** underway, at the engineering station.
- **Trigger:** a leg whose next hunt has a briefing or captains'-bar hint of a quiet or listening target ("runs cold", "listens hard"). Once per leg.
- **Line (Castellan):** "Heard what's waiting for us. Here's a thought: I re-seat the drive bearings my way and she'll whisper. Can't redline her after, though. Not safely. Not even a little."
- **TIGHT: "Leave them stock."** No change. Redline available.
- **LOOSE: "Re-seat them your way."** For the next hunt, drive noise ×0.8 (`s.me.sig` ×0.8), top speed ×0.95 (`shipSpeed` ×0.95), **no redline** (`noRedline` = 1: the speed ceiling is full drive). *If it goes wrong:* no emergency burst when a hunter closes; you have to fight or spool. Costs 1 watch.
- **Meter:** tight -3 / loose +3.
- **Reaction, tight (Abara prefers tight):** "Thank you. I like having redline the way I like having a door."
- **Reaction, loose (Dace prefers loose):** "Quieter drive, cooler hull. I approve. Officially. Not that it's my department."
- **After action (Castellan):** "That's [X] legs I've done the bearings for you. Want them seated that way for good? Or you want to decide before each job? Standing means I stop asking, and Abara stops speaking to me."
- **Replaces:** `eng.quiet_bearings`.

### M07 `heat.vent_timing`: "Vent now or pick the moment"
- **Officer:** Dace (Thermal). **Where:** hunt.
- **Trigger:** the sink crosses 65% (`s.sink.h >= 0.65`) with no vent running and no volley inbound. Once per hunt.
- **Line (Dace):** "Sink's at sixty-five, Captain. By the book we vent now. Fins out, every sensor sees them, done in a couple of minutes. Or you let me pick the moment, somewhere nobody's looking, and I dump it fast. I'm very good at picking moments."
- **TIGHT: "Vent now, by the schedule."** Vent starts now at the standard rate (`ventFull` 4: about 2.6 min from 65%). Fins visible the whole time (`ventSig` 1).
- **LOOSE: "Pick your moment."** Dace holds until no real hostile's knowledge of us is rising, or until the **92% ceiling**, then vents with fast fins: our vent ×0.75 time (`ventFull` ×0.75, player only), 0.5 min afterglow (`ventAfterglow` 0.5). *If it goes wrong:* a spike past 100% (redline, spool, close fire) during the hold forces an emergency vent (`forcedRetract` 0.8 / `forcedStop` 0.25 rules), with hull melt if it stays full.
- **Meter:** tight -3 / loose +3.
- **Reaction, tight (Quill prefers tight):** "On schedule. Thank you. Schedules are how people stay alive."
- **Reaction, loose (Dace prefers loose):** "Oh, you won't regret this. You might. You won't."
- **After action (Dace):** "So, venting. You let me pick the moment [X] times out of [Y]. Do you want that standing? I think you do. Or do you want to decide each time, which is also fine, which is also slower."
- **Replaces:** `heat.fast_fins`.

### M08 `heat.reserve_tanks` (underway): "Borrow the reserve"
- **Officer:** Dace. **Where:** underway, at the thermal bay.
- **Trigger:** a leg before a hunt flagged long or hot (a dog-leg arena, or a briefing hint of a long stalk). Once per leg.
- **Line (Dace):** "If I plumb Castellan's reserve tanks into the sink, we get twenty percent more room before we have to vent. It takes longer to clear, obviously. Obviously to me. And he'll be furious, which is a separate benefit."
- **TIGHT: "Keep the sink as rated."** No change.
- **LOOSE: "Plumb them in."** For the next hunt, sink size ×1.2 (`s.me.sink` ×1.2), our venting ×1.2 slower (`ventFull` ×1.2, player only). **Overpressure ceiling:** above 90% the reserve loop forces the vent, and you can't pull the fins in until it falls to 25% (forced-vent rules start at 0.9 instead of 1.0). *If it goes wrong:* a forced vent at 90% leaves the fins out for a long dump at the worst moment. Costs 2 watches.
- **Meter:** tight -3 / loose +3.
- **Reaction, tight (Quill prefers tight):** "Rated is rated for a reason, Captain."
- **Reaction, loose (Castellan prefers loose, though they're his tanks):** "Those are my reserve tanks. Fine. Fine. Bring 'em back the way you found 'em."
- **After action (Dace):** "I've had the reserve plumbed in for [X] legs. Shall I leave it like that? Saves me a day of pipework each time. Or you can decide before each job. Castellan has opinions about this. I've heard them."
- **Replaces:** `heat.bigger_sink`.

### M09 `heat.analyst_load`: "Throttle the stations"
- **Officer:** Dace. **Where:** hunt.
- **Trigger:** sink ≥ 50% and rising, with 2 or more analysts tasked to contacts. Once per hunt. (Dace speaks at most once per hunt, so M07 and M09 can't both fire; the priority list in §1.7 decides.)
- **Line (Dace):** "The analyst stations are cooking us, Captain. I can throttle them, thirty percent cooler, slower reads. Or I let them run flat out and keep an eye on it. I'll be watching anyway. I'm always watching."
- **TIGHT: "Throttle them."** For the rest of the hunt, analyst heat ×0.7 (`glowFocus`, `glowTrack` ×0.7), reads 15% slower (`readDone` ×1.15).
- **LOOSE: "Let them run flat out."** Reads 10% faster (`readDone` ×0.9), analyst heat ×1.25 (`glowFocus`, `glowTrack` ×1.25). **Ceiling:** at 85% sink Dace cuts the stations for 1 minute (all analysts drop their tasks). *If it goes wrong:* the cut lands mid-read and costs you the fresh fixes you were counting on.
- **Meter:** tight -3 / loose +3.
- **Reaction, tight (Quill prefers tight):** "Slower reads. My reads. But steady ones. Acceptable."
- **Reaction, loose (Dace prefers loose):** "Flat out it is. Music's going on in the thermal bay. For morale. Mine."
- **After action (Dace):** "You had me [throttle / leave] the analysts [X] times. Should that be how we run them, every hunt? Or I keep asking. I'm happy to keep asking. I enjoy the asking."
- **Replaces:** `heat.cold_analysts`.

### M10 `nav.leg_plot` (underway): "Cold approach or short leg"
- **Officer:** Abara (Navigation). **Where:** underway, at the chart table, when the next leg is plotted.
- **Trigger:** plotting any leg that ends at a hunt or a dog-leg. Once per leg.
- **Line (Abara):** "Two ways in. Cold approach: we come in quiet and late, and Fenwick feeds everyone one more time. Or I cut the corners, we save a watch, and we arrive knowing less about who's waiting. I've done both. I've regretted both."
- **TIGHT: "Cold approach."** Arrive 15% less visible during the opening dark window (`darkHaz` ×0.85). Transit 10% longer (roughly one extra watch every three legs).
- **LOOSE: "Cut the corners."** Transit 15% shorter (gains a free watch on most legs). **Warning ceiling:** the hunt's briefing hints are marked *unconfirmed* (they may be wrong), and the quiet window before the first sweep is 30% shorter (`darkWindow` ×0.7: 4.2 min instead of 6). *If it goes wrong:* you arrive tuned for the wrong target, with less time to fix it.
- **Meter:** tight -3 / loose +3.
- **Reaction, tight (Quill prefers tight):** "A cold approach. I'll have the passive picture ready before we're in it."
- **Reaction, loose (Fenwick prefers loose):** "Faster's fine by me, as long as nobody skips lunch."
- **After action (Abara):** "[X] legs in a row you've had me plot it [cold / short]. Want that standing? Saves you a question at the chart. Or keep asking. I don't mind the question."
- **Replaces:** `nav.quiet_approach` (tight side) and `nav.short_legs` (loose side).

---

## 3. Trim mapping
Every non-shelved trim in `data/mini_missions.json`:

| Trim | Goes to | Notes |
|---|---|---|
| `eng.quiet_bearings` | M06 (loose) | underway |
| `eng.spool_tune` | M05 (loose) | adds the trip ceiling (the bot found it strictly better because it never spooled under fire) |
| `heat.bigger_sink` | M08 (loose) | underway; adds the overpressure ceiling |
| `heat.fast_fins` | M07 (loose) | fast fins happen after Dace's held vent |
| `heat.cold_analysts` | M09 (tight) | loose side is new (flat out with a cut-out) |
| `sens.long_ears` | M01 (loose) | the range boost is part of the hunch call, on that contact only |
| `sens.snap_classifier` | M01 (loose) | "more wrong calls" becomes the 70% certainty ceiling |
| `sens.narrow_ping` | M02 (loose) | never in the tutorial |
| `tac.tight_drill` | M03 (tight) | |
| `tac.judgment_lead` | M03 (loose) | adds the overcorrection after a maneuver |
| `nav.quiet_approach` | M10 (tight) | underway |
| `nav.short_legs` | M10 (loose) | underway; `arrival_warning` becomes `darkWindow` plus unconfirmed briefing hints |
| `qm.ration` | dropped | an economy and trust drain per leg with no consistency-vs-performance trade. Better as a quartermaster setting at the dock. |
| `qm.feast` | dropped | already a scene-level style choice (the 1.6 debrief "stand everyone a drink", +6). Keep it as a Fenwick storylet. |
| `qm.grey_trade` | dropped | a Tally and patron decision, not tight vs loose. Move it to the buoy and Tally storylets. |
| `pell.assist_*` (3) | unchanged | not tight/loose trims. Pell's assists stay as integration offers. A natural home later is a third option on M01, M03 and M07 once the integration tier is reached, with no meter nudge (integration and trust are its cost). |
| `eng.run_hot`, `tac.salvo_mix` | shelved | not used |
