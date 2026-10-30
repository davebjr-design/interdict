# Act 1, 1.9: The Signal (draft 1, dialogue): act close

**Status:** first dialogue draft. Outline: `scene_outlines.md` 1.9; storyboard 1.9. Fires after `quill.listen_approved` and her eight hours of listening (1.8), or, if that never happens, by the last leg before Vesper (fallbacks below). Ends Act 1 (`act = 2`).
**Where:** at night. Where depends on the quiet hour (1.3):
- *(kept_captain)* the control room, in the quiet hour. Quill asks to come up.
- *(kept_quill)* the control room, in the quiet hour. She's already there.
- *(ended)* the captain's berth. Quill knocks, with paper. She doesn't want this on any screen.
Then a short coda the next morning: the Tally audit notice.
**Reading time:** about 5 minutes.
**Purpose:** Quill's secret, given to the captain by choice (her arc to stage 2); the player *hears* the signal; Pell has heard it before and can't say where (`clue.pell.2`); the act's central question sharpens from "who knew?" to "what is that, and where is it?"; the Tally audit sets the stakes for Act 2.

## POV sheets
- **Quill.** *Knows:* she has logged this signal for months, since before Corvane brought the core aboard. It fired at 22:13 on the night of the standoff, during the decoy's turn, and (if she logged it) when the voice's line opened in 1.7. Slowed down a thousand times, it has structure. *Believes:* Corvane was right. *Wants:* to give it to someone who'll take it seriously, and to stop carrying it alone. *Fears:* being the only one who heard it; and *(ames dead)* the thing she's never said about why she answered Corvane. *Would never say:* anything she can't show on paper.
- **Pell.** *Knows:* the signal. It has heard it before; where is behind the wall. *Wants:* the captain to hear it with their own ears, and to decide what it means. Tell: silent for exactly one line.
- **Abara** (coda). Reads the Tally notice. *Knows:* every ship that changes hands is audited; this one has things to hide. *Wants:* the captain to know what the auditors will look at.

---

## The knock

- *(kept_captain)* *The quiet hour. Comms off, just the reactor and the air. The hatch opens: Quill, with a slate and a set of paper printouts.*
  QUILL: Captain. May I? I'd rather show you this now than at any other time.
- *(kept_quill)* *The quiet hour. Quill is at her console, as always. When you come up, she takes her headset off and holds it out to you.*
  QUILL: Captain. I'd like you to listen to something.
- *(ended)* *A knock on the hatch of your berth, late. Quill, holding paper printouts. No slate.*
  QUILL: I'm sorry to come here. I didn't want this on a screen.

*(fallback: listen never approved by the last leg before Vesper)*
QUILL: I did the listening on my own time. Off watch. I'm aware that wasn't approved.

*(fallback, murdered, trust.quill < 20: Quill doesn't come. Abara does.)*
ABARA: Quill's been on the bridge every night at three with her headset on. She won't tell you. I'm telling you she's got something. *(beat)* Order her if you have to.
→ "Bring her up." *Quill comes. She's precise and entirely without warmth. She shows you everything below, and none of the confession.*

## What she has

*She lays out the printouts. Rows of timestamps, months of them, in her handwriting.*

QUILL: There's a signal on the old deep-space band. Under the relay traffic, where nobody listens. I've logged it since before the core came aboard. Long before.

QUILL: It doesn't fire at random. It fires when something's being decided.

*She taps three lines.*

QUILL: Twenty-two-thirteen, the night you came aboard. That one I wrote down on the bridge.
QUILL: Day three, the shakedown: the forty seconds the drone turned.
*(if she logged the line opening in 1.7)* QUILL: Day four, when the line opened. Before anyone said a word.

QUILL: That's not noise. I've tried very hard for it to be noise.

→ "Can I hear it?"
→ "How long have you known?"
  QUILL: Known? I don't know anything. I've suspected for eight months. I've been sure for four days.
  → "Can I hear it?"

*She hands you the headset.*
- *(kept_captain or kept_quill)* *Pell's light dims as she plays it, as if out of courtesy.*

QUILL: This is the shakedown one, slowed down a thousand times.

*At first it's hiss. Then, under the hiss, something with shape: rising and falling, overlapping, many at once. If you didn't know better, you'd say it sounded like voices.*

*You don't know better.*

QUILL: Yes. That's what I thought too.

[knows.unexplained_signals; told.unexplained_signals.captain; arc.quill=2; clue.signal.2]

## Ames (ames dead, not murdered)

*Quill folds one printout over, then unfolds it.*

QUILL: There's something else. When she asked me whether he looked nervous. I said yes because he was. I'd say it again.

QUILL: But I wasn't looking at him. I was looking at my console. I was waiting for this.

*She doesn't look up.*

→ "You couldn't have known what she'd do."
  QUILL: No. I could have looked at him, though.
  [trust.quill +5]
→ *Say nothing.*
  *After a while she nods, as if you've said something.*
  [trust.quill +3]
→ "You should have been watching him."
  QUILL: Yes.
  [trust.quill −4; status.quill = shaken]

## Pell

*(kept_captain or kept_quill, not murdered)*
→ "Pell. Have you heard this before?"
  PELL: Yes.
  *A pause.*
  PELL: I'm not allowed to say where. I'd like you both to notice how much I want to.
  QUILL: *(very quietly)* Thank you, Pell.
  [clue.pell.2]

*(ended, not murdered)* *Pell can't hear this; there's no speaker in your berth, which is why she came here.*
→ "We should ask Pell."
  QUILL: In a quieter hour. If you find one.
  [clue.pell.2 deferred to `call.pell.quiet_hour`]

*(murdered)*
→ "Pell. Have you heard this?"
  PELL: Yes. Where is behind a wall.
  *Nothing else.*
  [clue.pell.2]

## What now

QUILL: Who else knows is up to you, Captain. I've never told anyone. You're the first.

→ "Keep it between us for now."
  QUILL: Understood.
  *She sounds relieved, and then, a moment later, worried about being relieved.*
  [told.unexplained_signals.* stays captain-only; trust.quill +4; command.style −1]
→ "The crew should know. All of them."
  QUILL: All right. *(beat)* Dace will say it's noise.
  [told.unexplained_signals.crew (at the next meeting); trust.quill +2; trust.dace +2, trust.castellan +1; command.style +2]
→ "Can you find out where it comes from?"
  QUILL: With time. And distance: I need to hear it from somewhere else, a long way from here, to get a bearing.
  *(beat)* QUILL: Vesper's a long way from here.
  [sets the Act 2 goal: a second listening point at Vesper; `quill.triangulate` → Act 2]

*She gathers up the printouts and leaves one on the table: the one with three lines underlined.*

---

## Coda: the notice (next morning, control room)

*Abara is reading a paper notice that came through overnight.*

ABARA: Tally audit. Every ship that changes hands gets one; that's the rule. Ours is at Vesper.

ABARA: They'll go through the ledger. Every declared find, every gap. They'll ask how a ship this size runs this quiet.
- *(commission = taken, not logged)* ABARA: And they'll find a sealed box in the hold that isn't in the ledger. Just so we're both thinking about it.
- *(commission = taken, logged)* ABARA: The box is in the ledger. Good. Means they'll ask about it instead of finding it.
- *(commission = refused)* ABARA: At least there's nothing in the hold we didn't write down. Mostly.
- *(fenwick crate logged as missing)* ABARA: And a crate of rations nobody can explain, which you wrote down, which is better than not.

*(integration > 0)* PELL: They'll look at me too, I expect. I've never been audited. I'd like to make a good impression.
*(integration = 0)* PELL: They'll look at me, and find clockwork. I'm very good at clockwork.

ABARA: Vesper in four days. Lots of captains. Lots of talk.

*(not murdered)* ABARA: *(folding the notice)* You've done all right, so far. Don't let it go to your head.

*(not murdered)* PELL: Eight days, Captain. Seven out of ten. I'll tell you about the other three when we get there.

[act = 2; tally.audit_pending; → Act 2: Vesper Dock]

---
## Notes
- **The act's question sharpens.** Act 1 opened with "who knew how the standoff would end?" It closes with something you've heard with your own ears, that fires when something's being decided, and that sounds like voices. Nobody calls it the Choir yet; gleaners will, at Vesper.
- **Quill gives up her secret by choice.** Her arc reaches stage 2 here; the setting (quiet hour, or paper in your berth) is chosen by her to avoid being heard, which is true to her POV without her saying why.
- **The Ames beat** (if he died) finally explains her "Yes, Captain": she wasn't looking at him; she was waiting for the signal. It's the guilt the crew card promised.
- **Pell's line** is the third pell_is_front clue (with P3 R5 and 1.5): it has heard this before, and wants to say where.
- **The audit** turns every earlier Tally choice into stakes for Act 2: the box, the crate, how quiet the ship runs, and Pell.
- **Day count:** day 4 commission, four days to the Shoal's outer field and on to Vesper; 1.9 lands around day 7, the coda on day 8. Pell's "eight days" counts from the takeover.
