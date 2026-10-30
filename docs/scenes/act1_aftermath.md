# Act 1, 1.4: The Aftermath (draft 1, dialogue)

**Status:** first dialogue draft, for a voice read. Outline: `scene_outlines.md` 1.4. Follows 1.3 (same day, afternoon watch); leads to 1.5 (Pell at night).
**Three versions, one per standoff outcome:** A *(persuaded)*: Corvane's cabin. B *(killed)*: the control room, then her cabin. C *(murdered)*: the control room.
**Reading time:** about 4-5 minutes each.
**Purpose:** let Corvane's truth survive every route (her voice in A, her logs in B and C). The same three pieces are available on every route; if the player refuses or delays them here, they come back as a later call (`call.corvane.cabin`, `call.pell.logs`), so no route loses the story; give the player the first small step on the integration meter (B and C); plant the loyalist and Choir clues.

**The three things Corvane passes on (available on every route)**
1. **The quiet hour's real purpose:** with the internal comms off, it is the one hour a day the ship can't be heard. (By whom, she doesn't say outright.)
2. **The station is behind a wall in Pell:** Corvane put it there herself, so nobody could take it out of Pell by force, not even her.
3. **A message for Abara:** "Tell her her grandfather wasn't lying." (Abara's module box: her grandfather always claimed the fire-control module talked to him. It's a dormant Remainder fragment. Paid off in her arc.)

## POV sheets
- **Corvane (A).** *Knows:* what the quiet hour is for; where the station is (and that she walled it inside Pell); that her grandmother's notebooks prove some machines fought for us. *Doesn't know:* that the blessing was sent before the standoff ended, unless the crew were told in 1.3 (Fenwick passes everything on). *Knows about the module box:* she and Abara go back fourteen years. *Wants:* Pell kept safe, the quiet hour kept, one message delivered to Abara. *Fears:* being right too late, and above all being predicted. *Hiding:* the station's location; that she isn't as sure she controls Pell as she sounds. *Thinks of the player:* the one person who heard her out. *Would never say:* please.
- **Pell (B, C).** *Knows:* the logs exist, and Corvane left them "for whoever has my chair." There's a wall behind them it can feel but not see over. *Wants:* to be asked, and for the record to survive. *Rule it lives by:* it won't decide for you; if told to delete the logs, it will. (It will keep the index. It will tell you it kept the index.) *(C)* *Wants first:* to understand why you fired before she'd said anything.
- **Quill (B, C).** On the bridge for the afternoon watch. *Knows:* the logs might explain her signals. *Fears:* hearing Corvane's voice. *(B)* Her hand isn't steady when Pell mentions the logs. *(C)* She doesn't look up at all.

---

## A. Persuaded: Corvane's cabin

*Fenwick is coming out of Corvane's cabin with an empty tray as you arrive.*

FENWICK: She ate everything. *(quietly)* She always eats everything when she's worried.

*The cabin is very tidy. Books, wedged so they can't move. A teapot. Corvane is sitting with a book open on her knee and isn't reading it.*

CORVANE: Captain. Come in. I'm out of the good tea, so it's the other kind.

→ "I came to listen."
  CORVANE: Then sit.
  [→ A1]

→ "I'm not here to listen to you."
  CORVANE: No. Most people aren't.
  CORVANE: Go on, then. You'll come back.
  [corvane.talked = false; the scene ends. The three things stay available as a later call (`call.corvane.cabin`).]

### A1
CORVANE: Fenwick told me about your meeting. He tells me everything; it's one of his gifts. I'd like to hear it from you. The quiet hour?

- *(quiet_hour kept_captain)* CORVANE: Good. Keep it. And keep the internal comms off for the whole hour, every night. Not most nights. Every night.
- *(quiet_hour ended)* CORVANE: Then you've given it every hour of the day.
- *(quiet_hour kept_quill)* CORVANE: Quill. Good. Quill notices things.

→ "Why does the hour matter?"
  CORVANE: Because it's the only hour this ship can't be heard.
  → "Heard by who?"
    CORVANE: By whoever wrote to you last night.
  [knows.quiet_hour_purpose]

*She closes the book.*

*(crew were told the timestamp in 1.3)*
CORVANE: Fenwick says it was sent before. Eleven minutes before. Is that true?
→ "It's true."
  *For a long moment she doesn't move at all.*
  CORVANE: Then it's further along than I thought.
  [told.patron_message_predated.corvane; corvane.afraid = true → skip to "Listen. I'll say this once."]

*(otherwise)*
CORVANE: They did write to you. Didn't they.

→ "Yes. It was sent eleven minutes before you stood down."
  *For a long moment she doesn't move at all.*
  CORVANE: Then it's further along than I thought.
  [told.patron_message_predated.corvane; corvane.afraid = true]

→ "Yes."
  CORVANE: Before or after?
  → "After." *(a lie)*
    CORVANE: Good.
    *She believes you. You watch her believe you.*
    [corvane.lied_to = true]
  → "Before."
    *(as above: "Then it's further along than I thought.")*
    [told.patron_message_predated.corvane; corvane.afraid = true]

→ "That's my business."
  CORVANE: It is. I hope it was after.

*She glances at the speaker grille above the door.*

CORVANE: I'd rather say this at night. I may not get a night. Listen. I'll say this once.

CORVANE: Pell knows where I found it. The station. I put a wall in front of that memory, inside Pell, so that nobody could take it out by force. Not even me.

→ "Where is it?"
  CORVANE: If I tell you, you'll go. You're not ready to go.

→ "Why would you lock yourself out?"
  CORVANE: Because I might be wrong about Pell. I don't think I am. But I built the wall for the day I am.
  [the first time she admits doubt]

→ "The line closed last night. Pell says it never had before."
  CORVANE: Closing a door isn't the same as not listening at it.
  [told.line_closed.corvane]

CORVANE: One more thing, and then you can go. Tell Abara her grandfather wasn't lying. She'll know what I mean. She'll be angry with me. She's entitled.

→ "I'll tell her."
  [promise.abara_message = true]

→ "Tell her yourself."
  CORVANE: She won't come. Not today.

→ "I'm not your messenger."
  CORVANE: No. But you're the only one I've got.

*She opens her book again. This time she reads it.*

[corvane.talked = true; knows.station_walled_in_pell; knows.abara_grandfather_message → 1.5]

---

## B. Killed: the control room, then Corvane's cabin

*Afternoon watch. Abara is below. Quill is at sensors. The amber light on the pedestal is low.*

- *(quiet_hour kept_captain)* PELL: Captain Night Watch. May I ask you something?
- *(quiet_hour ended)* PELL: Captain Daylight. May I ask you something?
- *(quiet_hour kept_quill)* PELL: Captain Delegate. May I ask you something?

→ "Go ahead."

PELL: Captain Corvane left logs. Personal ones. For whoever had her chair, which is now you. Do you want them opened?

*At sensors, Quill's stylus stops. Her hand isn't quite steady. She puts the stylus down.*

→ "Open them."
  PELL: It means letting me past one of her locks. Small lock. Large consequences, probably. Shall I proceed?
  → "Yes."
    PELL: She asked me to play them in the quiet hour. Not before.
    - *(quiet_hour kept_captain or kept_quill)* PELL: Tonight, then. Unless you'd like them now.
    - *(quiet_hour ended)* PELL: You ended the quiet hour. So: now, or never, or you find me an hour.
    → "Now."
      [integration +5; logs = opened → B1]
    → "Tonight." *(not if ended)*
      [integration +5; logs = opened; B1 plays at the start of 1.5 → B2]
    → "Not yet."
      [→ B2; call.pell.logs]
  → "No. Not yet."
    PELL: I'll ask again. I'm very persistent. It's one of my better qualities.
    [→ B2; call.pell.logs]

→ "Not now."
  PELL: I'll ask again.
  [→ B2; call.pell.logs]

→ "Delete them."
  PELL: If you tell me to, I will. I'd rather not.
  → "Delete them."
    PELL: Deleted.
    *A pause.*
    PELL: I kept the index. I'm telling you because I'd want to be told.
    [logs = deleted → B2]
  → "Then keep them, for now."
    [→ B2; call.pell.logs]

### B1: Corvane's log
*Her voice, from the pedestal. Unhurried. Recorded somewhere quiet.*

CORVANE (log): To whoever has my chair. If you're hearing this, Pell trusted you enough to ask, and you said yes. That's a start.

CORVANE (log): Keep the quiet hour. Internal comms off, the whole hour, every night. It's the only hour this ship can't be heard.

*(quiet_hour ended)* *At sensors, Quill's jaw tightens. She won that argument this morning.*

CORVANE (log): My grandmother's notebooks are in my cabin. Read them. Start with the one with the burnt cover.

CORVANE (log): And tell Abara her grandfather wasn't lying. She'll know what I mean.

*The log stops in the middle of a breath.*

PELL: There's more. It's behind a wall she put up. I can feel the shape of it. I can't see over it.

*At sensors, Quill is very still.*

[knows.quiet_hour_purpose; knows.abara_grandfather_message; knows.station_walled_in_pell; clue.choir.0 → B2]

### B2: The cabin
PELL: She also left me the key to her cabin. In case.

→ "Open it."
→ "Leave it sealed."
  [the cabin stays available later → 1.5]

*Corvane's cabin is very tidy. Books, wedged so they can't move. A teapot, washed and upside down. On the desk, a stack of old notebooks. One has a burnt cover.*

*Inside it: fire-control diagrams, a grandmother's handwriting, and a margin note in the same hand, underlined twice:* the guns that never missed were not ours alone.

*Pinned above the desk, a chart. One point on it has been circled in pencil, then erased, hard enough to tear the paper.*

[clue.loyalist.0 (the notebook); clue.choir.1 (the erased point); → 1.5]

---

## C. Murdered: the control room

*Afternoon watch. Quill is at sensors and doesn't look up when you come in. The amber light on the pedestal is very low.*

PELL: Captain. Before I ask you something, I'd like to ask you something else. You don't have to answer.

PELL: Why did you shoot her before she'd said anything?

→ "I was afraid."
  PELL: Thank you. I think that's true.
  [pell.trust +5 → C1]

→ "She was going to kill us."
  PELL: She might have. She hadn't yet.
  *A pause.*
  PELL: I'm going to ask you my other question anyway.
  [→ C1]

→ "I don't owe you an answer."
  PELL: No. You don't.
  *The light stays low.*
  [pell.trust -5; Pell doesn't mention the logs today. They come up later (`call.pell.logs`) → 1.5]

### C1
PELL: Captain Corvane left logs, for whoever had her chair. Opening them means letting me past one of her locks. It's a small one. Shall I?

*(Choices and results as in B: open (integration +5, now or in the quiet hour → B1, then B2) / not now / delete. No nickname: on this route Pell calls you Captain.)*

*(If opened now, after the log ends:)* *At sensors, Quill gets up, says "Excuse me, Captain," and leaves the bridge in the middle of her watch.*

---
## Notes for the voice read
- **Corvane's truth is available on every route,** in three pieces: the quiet hour, the wall in Pell, the message for Abara. On the persuaded route you hear them from her, and you can refuse to listen. On the others they come from her logs, which Pell won't open without asking, and which you can delete (Pell keeps the index, and says so). Refused or delayed pieces return later as calls.
- **The secrets and the daylight:** Corvane knows the ship can be heard outside the quiet hour. In A she says it anyway ("I may not get a night"); in B the log asks to be played in the quiet hour. That makes the 1.3 decision matter: if you ended the hour, Pell needs you to find it one.
- **Her fear** (persuaded, "Then it's further along than I thought") is the first time she's afraid of anything, and it's the predated message that does it. That only happens if you tell her the truth. You can lie, and watch her believe you.
- **"I built the wall for the day I am"** is her one admission that she might be wrong about Pell. It keeps the Snape question open.
- **Pell's "Shall I proceed?"** uses the line from Pell's original profile; it's the first time the integration meter moves, and the player chooses it.
- **The burnt notebook** ("the guns that never missed were not ours alone") is the first loyalist clue. The torn, erased point on the chart is the first physical clue to the Choir's location.
- **On the murder route,** Pell asks why before it asks anything else. That's Pell's faith showing: it wants to understand the choice, not to judge it.
