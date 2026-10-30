# Act 1, 1.6: The Shakedown (draft 2, dialogue)

**Status:** second draft (continuity pass applied). Outline: `scene_outlines.md` 1.6; storyboard S6. Follows 1.5 (two days later); leads to 1.7 (the first commission).
**Mode:** TEXT briefing → HUNT (player in full control, cards 3, 4 and 5 with new-cast lines in `data/decision_cards.json`) → one scripted oddity mid-hunt → TEXT debrief.
**Reading time:** briefing 2 minutes, debrief 3 minutes, plus the hunt.
**Variant tags:** as before; also *(overlay)* = the player accepted Pell's detection overlay in 1.5 (`seen.pell_night.overlay`); *(clean)* / *(messy)* = hunt result; quiet_hour values from 1.3.
**Purpose:** the first real hunt; the crew working for the new captain; Abara's competence test resolved; one concrete oddity that can't be true; a command-style choice in the debrief.

## The decoy [P]
Corvane's tradition: every new officer gets a decoy hunt. Abara keeps it going for the new captain. She and Castellan towed an old drone hull out to a debris field the crew calls **the Shoal**, about a hundred and twenty kilometres off, and gave it a clockwork program: a fixed patrol loop, a fixed heat signature, nothing it can decide. To track it, Abara fitted a cheap **relay transponder**, and to bring it home afterwards she **tied the transponder into the drone's guidance with her own hands**.
- **What actually happens:** for about forty seconds, while the transponder is talking to the relays, the drone breaks its loop and turns toward the ship. Then it goes back. Its own log says it never turned. The cable rule holds: the only reason anything could steer it through the relays is that a human wired the relay box into its guidance. Abara did, so the drone could come home. (The Converged mind using a link a human made. Never explained here.)

## POV sheets
- **Abara.** *Knows:* she wrote the program and wired the transponder into the guidance herself. *Wants:* to see whether the captain can run a hunt, and whether the crew will work for them. *Believes:* clockwork doesn't improvise. *Fears (after the turn):* that she made the hole it came through. *Would never say:* "I don't know" in front of the crew, until she has to.
- **Quill.** *Knows:* sensors can be fooled, but the turn was on her passive plot as well as on the transponder feed. *Wants:* it logged. *Fears:* that it's connected to the signals she's hiding.
- **Castellan.** *Wants:* a clean hunt and a happy reactor. *After the turn:* calls it a ghost, because ghosts are explainable.
- **Dace.** Runs heat like a showman. *Wants:* to be useful in a hunt with no patients in it.
- **Fenwick.** Runs a betting pool on the new captain's time. *Wants:* everyone laughing at dinner.
- **Pell.** *(overlay)* sees the turn first; it can see the drone isn't flying a loop, though it hasn't read Abara's code. *Fears:* what it's looking at. Tell: silent for exactly one line. *(murdered)* clipped throughout.
- **Corvane** *(persuaded)*: confined to her cabin; she knows the tradition and will want to hear. She had nothing to do with the turn.

---

## Briefing (control room, morning)

*The whole crew is on the bridge, which is a first. Even Fenwick, with a slate he's trying to hide.*

- *(kept_captain)* PELL: Morning, Captain Night Watch.
- *(kept_quill)* PELL: Morning, Captain Delegate.
- *(ended)* PELL: Morning, Captain Daylight.
- *(murdered)* PELL: Captain.

ABARA: Tradition. Every new officer on this ship gets a decoy. Captain Corvane started it. I'm keeping it.
- *(persuaded)* ABARA: She'll ask how you did. Don't tell her.
- *(murdered)* ABARA: It's not a welcome. It's an audit.

ABARA: There's a drone hull out in the Shoal, about a hundred and twenty kilometres off. Castellan and I towed it out yesterday. It's running a patrol I wrote: fixed loop, fixed heat, nothing clever. Find it, classify it, put a firing solution on it. Training tag, not warheads, so nobody gets hurt but your pride.

CASTELLAN: She'll be warm, darlin'. I made sure. You'll see her if you look.

DACE: And if you don't look, I'll be dumping heat for a ship that's sitting in a debris field for no reason, which is my favourite kind of afternoon.

FENWICK: *(not looking up)* An hour and ten. I've got an hour and ten. Quill's got fifty-five, which I think is flattery.

QUILL: It's arithmetic.

*(overlay, not murdered)* PELL: For the record, there's a detection overlay running. I'll let the captain say how it got there.
→ "I gave it a channel."
  *Quill looks up. Abara doesn't.*
  [trust.quill −2 (unless kept_quill: she already knew); trust.dace +1]
→ *Say nothing.*
  PELL: The captain prefers mystery. Noted.
*(overlay, murdered)* PELL: Overlay's running.

→ "Let's go hunting."
→ "What's the pool at?"
  FENWICK: Three tins of peaches and Castellan's good socks.
  CASTELLAN: They're not my *good* socks.
  [command.style +1]
→ "Quiet on the bridge. Stations."
  *They go. Fenwick takes the slate with him.*
  [command.style −1]

**[→ HUNT. Cards 3 (route), 4 (detection) and 5 (classification) fire with the new-cast pitch and objection lines. (Command style can't reach the very-tight or loose bands yet this early, so all levers show.)]**

## The turn (scripted, mid-hunt, after card 4)

*The drone's track is clean on the plot: a slow loop through the Shoal, exactly as Abara wrote it.*

- *(overlay, not murdered)* PELL: Contact's turning. That's not a loop.
- *(overlay, murdered)* PELL: Contact turning.
- *(no overlay)* QUILL: Contact's turning. Toward us.

ABARA: It can't. I wrote its program. It goes round in a loop.
*(if the player pinged on card 4)* ABARA: And before you ask, it's got no ears. It didn't hear your ping.

QUILL: It's turning, Abara. Passive plot and transponder both.

*It is. For forty seconds the drone comes about, nose toward you, the way a ship does when it's looking at something. Then it swings back onto its loop as if nothing happened.*

*(overlay)* *Pell says nothing, for exactly one line.*

→ "Log it. Keep hunting."
  QUILL: In the log.
  [command.style −1]
→ "Pell, what was that?"
  - *(kept_captain or kept_quill, not murdered)* PELL: I don't know. I'd like to be clear that I don't say that often.
  - *(ended, not murdered)* PELL: Ask me in a quieter hour.
  - *(murdered)* PELL: Unknown.
→ "Ignore it. Finish the hunt."
  *Quill's mouth tightens. She keeps her eyes on the plot.*
  [trust.quill −2]

[knows.decoy_turned]

**[→ HUNT resumes: card 5 (classification) and the firing solution. Result: *(clean)* tag on target first pass; *(messy)* slow, or a miss and a second pass. Sets `shakedown.result`.]**

## Debrief (mess hall, evening)

*Castellan has brought the drone's log back aboard on a data slug. Fenwick has opened the peaches either way.*

FENWICK: *(reads the hunt clock)* {minutes} minutes! Nobody had {minutes}. That means the house wins, and I'm the house. Peaches for everyone.
- *(messy)* FENWICK: And a second pass, which I'm told is very educational.

- *(clean, not murdered)* ABARA: That'll do.
  *Fenwick, without being asked, hands you the first tin of peaches.*
- *(messy, not murdered)* ABARA: Second pass was better than the first. That's the right direction.
- *(murdered)* ABARA: Logged.

*(seen.abara.asked_third_watch, not murdered)*
ABARA: You wanted the third watch. It's yours. Starting tonight.
[watch.captain_third = true; trust.abara +3]

CASTELLAN: Now. About the turn. *(He holds up the slug.)* Drone's log says it never turned. Program ran clean, start to finish. Not a hiccup.

QUILL: It turned. It's on my plot.

CASTELLAN: Then it's a ghost. Sensor ghost. The Shoal's full of junk, it bounces.

QUILL: Ghosts don't turn toward you and turn back.

DACE: Could be both. The drone thinks it didn't turn, the plot thinks it did, and the truth is somewhere in between. Like with most patients.

QUILL: That's not how anything works, Dace.

DACE: It's how a lot of things work.

*(persuaded)* CASTELLAN: Could she have got at it? From her cabin?
*(persuaded)* ABARA: Not from her cabin. Not from anywhere. It's clockwork.

*Abara hasn't said anything else. She's looking at the slug in Castellan's hand.*

ABARA: I wrote that program. It can't do what it did.

→ "Was anything else running on the drone?"
  ABARA: A relay transponder, so we could track it. Same box every ship carries.
  *A pause.*
  ABARA: I tied it into the guidance. So I could steer it home after.
  *She hears what she's just said. So does everyone else. Nobody says anything.*
  [clue.choir.3]
→ *Let it lie.*

→ "Quill, find out what happened. Take whatever time you need."
  QUILL: Thank you, Captain.
  *She sounds surprised to be asked.*
  [trust.quill +5; seen.shakedown.quill_assigned (feeds call.quill.listen_1 and 1.9)]
→ "Sensor ghost. Let it go."
  CASTELLAN: There you go.
  *Quill doesn't argue. She also doesn't stop looking at the slug.*
  [trust.castellan +2, trust.quill −4]
→ "We'll talk about it when we know more."
  [no change]

*Then the last call of the night:*

→ "Good work. We drill it again tomorrow, same time."
  *A small groan from Dace. Quill nods once.*
  [command.style −6; trust.quill +2, trust.dace −1, trust.castellan −1]
→ "Good work. First round's on me."
  FENWICK: Finally, a captain with priorities!
  *Castellan finds a bottle from somewhere. Quill has one drink, precisely.*
  [command.style +6; trust.fenwick +2, trust.castellan +2, trust.quill −1]
→ "Good work. Get some rest."
  [no change]

**[→ 1.7: the first commission]**

---
## Notes
- **The oddity is concrete and impossible,** and it now obeys the cable rule: a clockwork drone turned toward the ship for forty seconds, its own log says it didn't, and the only way anything could have steered it is the relay box Abara wired into its guidance with her own hands. She realises that in the debrief, out loud, which is a weight she'll carry.
- **Everyone's position comes from their world:** Abara trusts her code, Quill her plot, Castellan the explainable, Dace the in-between.
- **Abara's test resolves:** clean earns "That'll do", messy still earns direction, murder gets "Logged." The Steward quotes whichever one she said (1.7). If the player asked for the third watch on the first morning, they get it.
- **Pell asks before outing the overlay** ("I'll let the captain say how it got there"): consent, even about itself.
- **Fenwick reads the actual hunt time** ({minutes}); his and Quill's guesses (an hour and ten, fifty-five) bracket a normal hunt.
- **Retired line:** Quill's old placeholder "That's not a ghost, Captain. Ghosts are consistent." becomes "Ghosts don't turn toward you and turn back."
