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

**R1: calm.** Arrival; Corvane offers tea. She names the player and Ostrow's ship. Tells: quick-draw holster worn low and unclasped; Ames's hand drifts to his holster. Pell speaks first from its pedestal: greets the boarders by name, counts their heartbeats aloud, offers Corvane "a quieter rate". Corvane thanks Pell fondly. *Player choices:* answer politely / ask her to stand down / go for the weapon (possible but flagged as murder: Dunne notices; this is a legal route and a bad one). Default path continues to R2.
**R2: tension (early-shot window).** Corvane begins her case in one sentence ("something worse is already awake"). Pell says something stranger (e.g. that the funeral log is already open "in either order"). Tells: Ames's hand on the gun butt, shaking; Corvane's eyes flick to him; Dunne glances at the player. *Player choices:* keep talking / shoot Corvane now. **Shoot:** she draws on Ames and winges him as the player fires (`ames=wounded`, `p3.round_shot=2`); Corvane dies with almost nothing said; Abara watches the player closely; Quill writes something down. Skip to RESOLUTION: SHOT-EARLY.
**R3: Ames.** If still talking: Ames breaks. He raises his weapon or says the wrong thing; Corvane, mid-sentence, has him shot (by herself or by a crew member at a station; choose in the draft) and finishes the sentence. Pell apologises to Ames before it happens and does not say for what. *Player choices:* shoot Corvane (now; `ames=dead`, `p3.round_shot=3`) / keep talking / kneel to Ames (small agency beat, no state change but flavour lines).
**R4: case in pieces.** Corvane tells a third of her case: a ship she scuttled when its crew refused her; the Tally's long inaction; what she thinks is already awake. Charming, reasoned, disturbing. Pell adds the nuts-but-precise fact (e.g. thanks Corvane for "the new window", says the ship's old name was a bad name). *Player choices:* ask a question / challenge her / shoot.
**R5: the mirror.** Corvane turns the question: would the player do what she did in her place? She is almost kind about it. This round is the persuasion's emotional pivot. *Player choices:* answer honestly (sets a flag read later: `told.corvane.honesty`) / refuse to answer / shoot.
**R6: decision.** If the player has not shot: she stands down on her terms, gives up her codes, asks to be left her cabin and her crew. Abara's face shows grief and anger at once. `corvane=persuaded`.

**RESOLUTIONS (all lead to command of the ship):**
- **SHOT-EARLY (R2):** Ames wounded, lives; Corvane dead; Dunne respects the speed; Abara cold. Pell is silent for a beat, then says it is "preserving continuity". Quill writes something down. Seed `clue.signals.1`.
- **SHOT-LATE (R3+):** Ames dead; Corvane dead; Dunne's grim respect; Abara colder; Pell logs everything.
- **PERSUADED (R6):** Ames dead; Corvane alive; most truth; Abara conflicted.
**State written:** `corvane`, `ames`, `p3.round_shot`, `trust.*` deltas per the storyboard, `ames.bond` read here (high bond = Ames's death hits harder in later lines; low = flatter).
**Pell content pool (pick per draft):** counts heartbeats; offers quieter rates; already opened a funeral log; thanks for the new window; says the old name was a bad name; apologises without saying for what; calls Corvane the one who keeps the light on. All delivered in Pell's calm, precise voice.
**Tests of the outline:** does the player always know a choice point is coming (tells)? Is each round's choice meaningfully different? Can a player get through without ever shooting? Is there a reason to shoot in R2 (Ames) AND a reason not to (truth)? Does Pell stay ambiguous in all paths?

---
## Next outlines (after these are approved)
P4 patron blessing; 1.1 stepping aboard; 1.2 the five first conversations; 1.3 first crew meeting; 1.4 Corvane aftermath (two variants); 1.5 Pell's first conversation; 1.7 first commission; 1.9 act close.
