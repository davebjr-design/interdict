# Act 1, 1.9: The Signal (draft 2, dialogue): act close

**Status:** second draft (continuity pass applied). Outline: `scene_outlines.md` 1.9; storyboard 1.9. Night 6, after `quill.listen_approved` and her eight hours of listening (1.8), or by night 6 at the latest (fallbacks below). The coda is the morning of day 7, the day before Vesper. Ends Act 1 (`act = 2`).
**Where:** at night. Where depends on the quiet hour (1.3):
- *(kept_captain)* the control room, in the quiet hour. Quill asks to come up.
- *(kept_quill)* the control room, in the quiet hour. She's already there.
- *(ended)* the captain's berth. Quill knocks, with paper. She switches off the amber lamp above the hatch before she says anything.
**Reading time:** about 5 minutes.
**Purpose:** Quill's secret, given to the captain by choice (her arc to stage 2); the player *hears* the signal; Pell has heard it before and can't say where (`clue.pell.2`); the question sharpens from "who knew?" to "what is that, and where is it?"; the Tally audit sets the stakes for Act 2.

## POV sheets
- **Quill.** *Knows:* she has logged this signal for about eight months, long before Corvane brought the core aboard. It was there at 22:13 on the night of the standoff, during the decoy's turn on day 3, and *(if the crew were told the timestamp in 1.3, so she was watching)* when the voice's line opened on day 4. Slowed down, it has structure. *Believes:* Corvane was right. *Wants:* to give it to someone who'll take it seriously, and to stop carrying it alone. *Fears:* being the only one who heard it; *(ames dead)* what she was really doing when Corvane asked her. *Would never say:* anything she can't show on paper.
- **Pell.** *Knows:* the signal; it has heard it before; where is behind the wall. *Wants:* the captain to hear it with their own ears and decide what it means. Tell: silent for exactly one line.
- **Abara** (coda). Reads the audit notice. *Knows:* what's in the hold and what's in the ledger. *Wants:* the captain thinking about both before Vesper.

---

## The knock

- *(kept_captain)* *The quiet hour. Comms off, just the reactor and the air. The hatch opens: Quill, with a slate and a set of paper printouts.*
  QUILL: Captain. May I? I'd rather show you this now than at any other time.
- *(kept_quill)* *The quiet hour. Quill is at her console. When you come up, she takes her headset off and holds it out to you.*
  QUILL: Captain. I'd like you to listen to something.
- *(ended)* *A knock on your berth hatch, late. Quill, holding paper printouts. No slate. She reaches past you and switches off the amber lamp above the hatch.*
  QUILL: I'm sorry to come here. I didn't want this on a screen.

*(fallback: listen never approved, trust.quill ≥ 20)*
QUILL: I did the listening on my own time. Off watch. I'm aware that wasn't approved.
[arc.quill=1 first]

*(fallback: trust.quill < 20, any route)* *Quill doesn't come. Abara does.*
ABARA: Quill's been on the bridge every night at three with her headset on. She won't tell you. I'm telling you she's got something. Order her if you have to.
→ "Bring her up."
*Quill comes. She shows you everything below, precisely, and none of the warmth.*
[arc.quill=1 first; no "What now" relief beat]

## What she has

*She lays out the printouts. Rows of timestamps, months of them, in her handwriting. Three are underlined.*

QUILL: There's a signal on the old deep-space band. Under the relay traffic, where nobody listens. I've logged it for eight months. Long before the core came aboard.

*She taps the underlined lines, one at a time.*

QUILL: Twenty-two-thirteen, the night you came aboard. That one I wrote down on the bridge.
QUILL: Day three. The forty seconds the drone turned.
*(crew told the timestamp in 1.3)* QUILL: Day four. When the line opened, before anyone said a word.

QUILL: I've tried very hard for it to be noise.

→ "Can I hear it?"
→ "How long have you been sure?"
  QUILL: Three days.
  → "Can I hear it?"

*She hands you the headset.*
- *(kept_captain or kept_quill)* *Pell's light dims while she plays it, as if out of courtesy.*

QUILL: This is the one from the drone. Slowed down a thousand times.

*At first it's hiss. Then, under the hiss, something with shape: rising and falling, overlapping, many at once.*

*You take the headset off. Quill is watching your face, and nods, as if you'd said something.*

[knows.unexplained_signals; arc.quill=2; clue.signal.2]

## Ames *(ames dead, not murdered)*

*Quill folds one printout over, then unfolds it.*

QUILL: There's something else. When she asked me whether he looked nervous. I looked at him long enough to be sure. He was. I said so.

QUILL: Not long enough to think about what she'd do with it. I was watching my console. I was waiting for this.

*She doesn't look up.*

→ "You couldn't have known what she'd do."
  QUILL: No. I could have thought about it.
  [trust.quill +5]
→ *Say nothing.*
  *After a while she nods.*
  [trust.quill +3]
→ "You should have been watching him."
  QUILL: Yes.
  [trust.quill −4; status.quill = shaken]

## Pell

*(kept_captain or kept_quill, not murdered)*
→ "Pell. Have you heard this before?"
  *Pell says nothing, for exactly one line.*
  PELL: Yes. I'm not allowed to say where. I'd like you both to notice how much I want to.
  QUILL: *(very quietly)* Thank you, Pell.
  [clue.pell.2]

*(kept_captain or kept_quill, murdered)*
→ "Pell. Have you heard this?"
  PELL: Yes. Where is behind a wall.
  [clue.pell.2]

*(ended, any)* *With the lamp off, Pell can't hear this.*
→ "We should ask Pell."
  QUILL: In a quieter hour. If you find one.
  [clue.pell.2 deferred; logged on the `pell_quiet_hour_call` callback]

## What now

*(persuaded)* QUILL: She'll want to know. Corvane. She'll say she told us so.
*(persuaded)* → "Not yet." / → "She did tell us so." *(Quill almost smiles.)*

QUILL: Who else knows is up to you, Captain. I've never told anyone. You're the first.

→ "Keep it between us for now."
  QUILL: Understood.
  *She squares the printouts very neatly, twice.*
  [trust.quill +4; command.style −1]
→ "The crew should know. All of them."
  QUILL: All right. *(beat)* Dace will say it's noise.
  [told.unexplained_signals.abara, .dace, .castellan, .fenwick (at the next meeting); trust.quill +2; trust.dace +2, trust.castellan +1; command.style +2]
→ "Can you find out where it comes from?"
  QUILL: With time. And distance. I need to hear it from somewhere else, a long way from here, to get a bearing.
  QUILL: Vesper's a long way from here.
  [quill.triangulate = true (Act 2 goal: a second listening point at Vesper)]

*She gathers the printouts and leaves one on the table: the one with three lines underlined.*

---

## Coda: the notice (morning, day 7, control room)

*Abara is reading a paper notice that came through overnight.*

ABARA: Tally audit. Ours is at Vesper.
- *(commission = taken, not logged, not open_it)* ABARA: They'll go through the ledger, and they'll find a sealed box in the hold that isn't in it. Just so we're both thinking about it.
- *(commission = taken, open_it)* ABARA: You said you'd open that box. Do it before they do.
- *(commission = taken, logged)* ABARA: The box is in the ledger. Good. Means they'll ask about it instead of finding it.
- *(commission = refused)* ABARA: At least there's nothing in the hold we didn't write down. Mostly.
- *(seen.fenwick.crate_logged)* ABARA: They'll read the manifest too. A crate of rations nobody can explain, which you wrote down. Better than not.

*(integration > 0)* PELL: They'll look at me too, I expect. I've never been audited. I'd like to make a good impression.
*(integration > 0)* ABARA: You'd like to not be found running, is what you'd like. *(to you)* That's how ships get interdicted, Captain. Same as hiding a box.
*(integration = 0)* PELL: They'll look at me, and find clockwork. I'm very good at clockwork.

ABARA: Vesper tomorrow. Lots of captains. Lots of talk.

*(not murdered)* ABARA: *(folding the notice)* You've done all right, so far. Don't let it go to your head.

*(not murdered)* PELL: Seven days, Captain. Seven out of ten. I'll tell you about the other three when we get there.

[act = 2; tally.audit_pending = true; → Act 2: Vesper Dock, day 8]

---
## Notes
- **The act's question sharpens.** Act 1 opened with "who knew how the standoff would end?" It closes with something you've heard with your own ears, that turns up at three moments you lived through. The scene never says what that means; the three underlined lines do. Nobody calls it the Choir yet; gleaners will, at Vesper.
- **Quill gives up her secret by choice,** where it can't be heard: the quiet hour, or her switching off the lamp in your berth. True to her POV without her saying why.
- **The Ames beat** (if he died) is consistent with P3: she looked long enough to be sure, and he was nervous; she didn't think about what Corvane would do, because she was waiting for the signal.
- **Pell's "Yes"** is the third `pell_is_front` clue (with P3 R5 and 1.5).
- **The audit** turns every earlier Tally choice into stakes for Act 2: the box, the manifest, how quiet the ship runs, and whether Pell is running.
- **Day count:** commission day 4; Vesper is four days out, so the ship arrives day 8. Crew calls over days 4-6; this scene night 6; coda day 7; Pell's "seven days" counts from the takeover.
