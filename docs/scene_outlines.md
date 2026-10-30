# Scene outlines (no dialogue yet)

Each line says what an exchange must accomplish. Dialogue is written only after Dave approves the outline. Status: DRAFT 2026-10-29. Characters and rules: `storyboard.md`, `crew_bible.md`, `pell_voice.md`.

---
## P1: The briefing (host ship, briefing room)
**Cast:** Captain Ostrow (host captain), Dunne (first mate), Ames (boarding hand), player. **Mode:** TEXT, portrait + choices. **Length:** ~3-4 minutes of reading.
**Goals of the scene:** teach the rules among thieves; make the player care about Ames; plant that Ostrow admires Corvane and knows more than she says; give the player a first taste of agency with no failure state; set up the boarding party (player, Dunne, Ames).

1. **Open on the room.** Ostrow already mid-briefing; the player is the probationary hand brought in late. One line of scene setting: low-rated ship, tired crew, a chart showing Corvane's last known track. Establish tone: practical, a little rueful.
2. **The rule.** Ostrow states the code: you may touch the old AI, you may not wake it recklessly, and gleaners police their own. Corvane broke it, and has done it on purpose, which is why they are hunting her instead of avoiding her. Dunne adds the practical version in one line.
3. **Corvane as a person.** Ostrow says she was the best captain she ever sailed under. Sets up the persuasion route: the player should feel the pull of that. Dunne is less sentimental.
4. **First player choice (free question):** the player can ask any of: *Who ordered this?* (Ostrow deflects: "the patron's office"; sets `knows.patron_exists`), *What is she waking?* (Ostrow: "ask her"), *How good is her crew?* (Dunne: loyal, dangerous, and they carry something called Pell), *Why me?* (Ostrow: probation, and "you do what you're told and you're told why"). Player can ask up to three, none costs anything. The room advances after the third or on "That's enough."
5. **Ames.** Ames, nervous, asks the player something small and personal ("What do you do when your hands shake?"). The player's answer (reassure / practical / deflect) sets a flag read in P3 (`ames.bond` 0-2). This is the whole point of the scene's last third: make Ames a person.
6. **The boarding plan.** Dunne lays it out in two sentences: three go aboard, rest hold the lock. Ostrow gives the player a sidearm. Quiet beat: Ostrow tells the player to "hear her out, Captain. Then do what you have to". (Sets up that talking is a legitimate option and so is the other.)
7. **Close.** Ostrow dismisses them. Ames walks next to the player to the lock. One line of foreshadowing: his holster flap is unfastened, he fastens it, unfastens it again.
**State written:** `knows.patron_exists`, `ames.bond`, `told.briefing.host` (host-crew trust flags, not main crew). **Seeds:** Ostrow knows who ordered this (clue.patron.0); the briefing says "the patron's office" without a name.
**Tests of the outline:** can a player finish without learning anything? (yes, nothing is gated). Does Ames come across in under 30 seconds of reading? Is there at least one line that makes Corvane sympathetic?

---
## P3: The standoff (Corvane's bridge)
**Cast:** Corvane, Pell (voice, amber glow on a pedestal), Abara and Quill (standing at stations, silent), Dunne, Ames, player. **Mode:** TEXT with a visible round counter hidden from the player (rounds are internal; no meter). **Length:** ~8-10 minutes, branching.
**Goals:** make the player nervous; give agency (keep talking or shoot); show Corvane's charm and violence; let Pell be wrong in a way that unsettles; show the crew we will inherit without making them speak; deliver the trade-offs (storyboard table); set up the first clue.
**Throughline:** Corvane is courteous and exact. She never raises her voice. She treats Pell as a colleague. The player is never told what a choice will cost, but the room tells them (tells escalate each round).

**R1: calm.** Arrival; Corvane offers tea. She names the player and Ostrow's ship. Tells: quick-draw holster worn low and unclasped; Ames's hand drifts to his holster. Pell speaks first from its pedestal: greets the boarders by name, counts their heartbeats aloud, offers Corvane "a quieter rate". Corvane thanks Pell fondly. *Player choices:* answer politely / ask her to stand down / **shoot now (the murder route)**. Default path continues to R2.
**R1 SHOOT = MURDER [D: stronger consequences]:** Corvane dies before a word of her case; her crew do not return fire (they are ordered to stand still and do). Ames is unharmed but frightened of you. Effects: `corvane=killed`, `p3.round_shot=1`, `murdered=true`, `trust.abara -25`, `trust.quill -15`, `trust.dace -15`, `trust.castellan -10`, `trust.fenwick -10`, `pell.trust` starts at its lowest, Dunne refuses to serve with you and says why in one line, Ostrow files a report. **One officer secretly does not resent you [D]:** proposal Fenwick (leaves a plate and says nothing; his survivor-pocket worldview has seen worse) or Dace (relieved no one else was hurt); decide in the draft. Everyone else holds the line: the cabin is sealed and the direct ship members will not talk about her. Persistent: `murdered` is read by Act 2 (the bar knows), by the patron (who approves too readily, a seed for `clue.patron.2`), and by every first conversation in Act 1.2 (distinct lines). The truth survives only in Pell's logs.
**R2: tension (early-shot window).** Corvane begins her case in one sentence ("something worse is already awake"). Pell says something stranger (e.g. that the funeral log is already open "in either order"). Tells: Ames's hand on the gun butt, shaking; Corvane's eyes flick to him; Dunne glances at the player. *Player choices:* keep talking / shoot Corvane now. **Shoot:** she draws on Ames and winges him as the player fires (`ames=wounded`, `p3.round_shot=2`); Corvane dies with almost nothing said; Abara watches the player closely; Quill writes something down. Skip to RESOLUTION: SHOT-EARLY.
**R3: Ames.** If still talking: Ames breaks. He raises his weapon or says the wrong thing; Corvane turns to an officer and asks, lightly, whether Ames looks nervous. **The officer confirms, and Corvane draws and fires herself [D: so the player never has an officer who shot Ames].** She then finishes her sentence. The confirming officer is **Quill** [D]: flat, truthful, unable to lie, which stains her trust with the player for a long time and gives her a private guilt hook. Abara watches. (Swap to Abara if Dave prefers.) Pell apologises to Ames before it happens and does not say for what. *Player choices:* shoot Corvane (now; `ames=dead`, `p3.round_shot=3`) / keep talking / kneel to Ames (small agency beat, no state change but flavour lines).
**R4: case in pieces.** Corvane tells a third of her case: a ship she scuttled when its crew refused her; the Tally's long inaction; what she thinks is already awake. Charming, reasoned, disturbing. Pell adds the nuts-but-precise fact (e.g. thanks Corvane for "the new window", says the ship's old name was a bad name). *Player choices:* ask a question / challenge her / shoot.
**R5: the mirror.** Corvane turns the question: would the player do what she did in her place? She is almost kind about it. This round is the persuasion's emotional pivot. *Player choices:* answer honestly (sets a flag read later: `told.corvane.honesty`) / refuse to answer / shoot.
**R6: decision.** If the player has not shot: she stands down on her terms, gives up her codes, asks to be left her cabin and her crew. Abara's face shows grief and anger at once. `corvane=persuaded`.

**RESOLUTIONS (all lead to command of the ship):**
- **SHOT-EARLY (R2):** Ames wounded, lives; Corvane dead; Dunne respects the speed; Abara cold. Pell is silent for a beat, then says it is "preserving continuity". Quill writes something down. Seed `clue.signal.0`.
- **SHOT-LATE (R3+):** Ames dead; Corvane dead; Dunne's grim respect; Abara colder; Pell logs everything.
- **PERSUADED (R6):** Ames dead; Corvane alive; most truth; Abara conflicted.
**State written:** `corvane`, `ames`, `p3.round_shot`, `trust.*` deltas per the storyboard, `ames.bond` read here (high bond = Ames's death hits harder in later lines; low = flatter).
**Pell content pool (pick per draft):** counts heartbeats; offers quieter rates; already opened a funeral log; thanks for the new window; says the old name was a bad name; apologises without saying for what; calls Corvane the one who keeps the light on. All delivered in Pell's calm, precise voice.
**Tests of the outline:** does the player always know a choice point is coming (tells)? Is each round's choice meaningfully different? Can a player get through without ever shooting? Is there a reason to shoot in R2 (Ames) AND a reason not to (truth)? Does Pell stay ambiguous in all paths?

---
## Next outlines (after these are approved)
P4 patron blessing; 1.1 stepping aboard; 1.2 the five first conversations; 1.3 first crew meeting; 1.4 Corvane aftermath (two variants); 1.5 Pell's first conversation; 1.7 first commission; 1.9 act close.

---
## P4: The blessing (private, any quiet place)
**Cast:** the Patron (voice only), player. **Goals:** give the patron a warm, patient, slightly too-convenient voice; deliver the authority to command; seed suspicion; make the player choose how to talk to this unseen power.
1. The call arrives on a line the player did not open. Patron already knows how the standoff ended.
2. Branches by `corvane`/`p3.round_shot`: persuaded (patron regrets she wasn't brought in; slightly disapproving), killed (patron "understands"), murdered (patron approves too readily, a flag for later).
3. Patron confirms command "by the usual arrangements", promises support, says the crew will be difficult, asks for quiet and for AI to be stopped.
4. *Player choices:* thank it / ask who it is (it deflects warmly) / ask what happens to the crew (it says "that is yours to decide", a lie by omission).
5. Close: it says it will be in touch. A detail seeds `clue.patron.1` (arrived faster than it should) and `clue.patron.2` (never asked what Corvane said).
**State:** `patron.standing`, `patron.suspicion` (only if the player asks pointed questions), `knows.patron_voice`.

## 1.1 Stepping aboard (airlock → control)
**Cast:** Pell, Abara; maybe Quill at her station. **Goals:** introduce the ship as a place; give each outcome its own tone; hand control to the player.
1. Airlock: quiet, a trace of Corvane's tea or her cabin's door sealed (variant by `corvane`).
2. Pell asks permission to speak, then says the ship is "yours as of an hour ago" and gives a very short, accurate status.
3. Abara meets the player at control. Variant lines: persuaded (cautious, braced), killed (formal), murdered (cold, speaks only to give facts).
4. Abara hands over the watch bill and says one thing the player must do first (walk the ship). Close: "Walk the ship. They will want to look at you."
**Hands off to WALK.**

## 1.2 First conversations (WALK, five stations)
Each is a short two- or three-exchange conversation. Each has a **test**, a **hook**, and **trust outcomes** by how the player answers. Variants by `corvane` and `murdered`.
- **Abara (control):** test = a small job (check the plot vs her chart). Competence earns trust. She tells a short story that ends in a warning. Hook: the locked drawer. If `murdered`, she does the job but does not tell the story.
- **Quill (control):** test = she checks the player against a checklist and asks if they will tell her bad news. Honesty earns trust. Hook: "noise". If Quill confirmed the Ames shot in R3, she says nothing about it and avoids the player's eyes; trust is slower here.
- **Dace (thermal):** test = unsolicited check-up; he diagnoses something the player did not mention. Respect earns trust. Hook: the stethoscope for pipes, crest mug. If Ames lived, Dace asks after him.
- **Castellan (engineering):** test = he asks the player to look at the coupling manifold (existing demo job). Warmth earns trust. Hook: the manifold crack. If `killed` or `murdered`: he is too warm, too fast, and visibly ashamed.
- **Fenwick (mess):** test = he feeds the player and asks whether they have eaten properly. Kindness earns trust. Hook: ration count too high for five crew. If `murdered`: cooks smaller.
**State:** `trust.<id>`, `arc.<id>` stays 0 but the hook is recorded as `seen.<id>.hook1`.

## 1.3 First crew meeting (mess)
**Cast:** all five, Pell on the speaker. **Goals:** show the crew as a group under strain; use the decision grammar (one proposer, one or two objectors); first group choice.
1. Seating: who sits where (Abara by the door, Dace opposite Quill, Castellan beside Fenwick).
2. The question: do we keep Corvane's routines? Dace proposes keeping them, Quill objects (they hide things), Castellan sides with Dace.
3. The second question: do you tell the crew what the patron said? Options: all / the job / nothing.
4. Close: Abara speaks last, quietly. Sets `told.patron_blessing.*` flags and trust deltas.

## 1.4 Corvane aftermath (two or three variants)
- **persuaded:** brig or her cabin; one conversation; she tells the player what the patron cannot know and asks them to tell Abara something. The player may refuse to hear it.
- **killed:** Pell offers her logs and asks whether to open them. The first small step on the integration meter if the player says yes. Quill's hands shake slightly at the mention.
- **murdered:** the cabin is sealed. Nobody in the crew will talk about her. Pell offers the logs more carefully, and asks why.

## 1.5 Pell's first conversation (control room, night)
**Cast:** Pell, player. **Goals:** show Pell at integration 0 (honest, stops one step short and says so); present the first firewall trade.
1. Pell asks a question about the player (what they were before).
2. It offers a faster detection overlay for the shakedown in exchange for one more channel.
3. *Choice:* accept (`integration +10`, hunt bonus) / decline (no change). Both are viable.
4. Close: Pell says one true thing it has not been allowed to say, and stops itself.

## 1.7 First commission (control)
**Cast:** the Patron. A refusable job with a reasonable motive and an odd detail (coordinates that do not fit). *Choices:* take / refuse / take and ask Pell to check (seeds `clue.patron.3`). The patron's reaction to a refusal is gracious and slightly colder.

## 1.9 Act close
**Cast:** Quill, Pell. Quill brings the signal she cannot explain. Pell, asked, says it has seen it before and is not allowed to say where. First on-record link between Pell, the signals and Corvane's warning. Tally audit notice arrives. `act = 2`.
