# Act 1, 1.6: The Shakedown (draft 1, dialogue)

**Status:** first dialogue draft. Outline: `scene_outlines.md` 1.6; storyboard S6. Follows 1.5 (two days later); leads to 1.7 (the first commission).
**Mode:** TEXT briefing → HUNT (player in full control, cards 3, 4 and 5 with new-cast lines in `data/decision_cards.json`) → one scripted oddity mid-hunt → TEXT debrief.
**Reading time:** briefing 2 minutes, debrief 3 minutes, plus the hunt.
**Variant tags:** as before; also *(overlay)* = the player accepted Pell's detection overlay in 1.5 (`seen.pell_night.overlay`); *(clean)* / *(messy)* = hunt result.
**Purpose:** the first real hunt; the crew working for the new captain under pressure; Abara's competence test resolved; one concrete oddity that can't be true (a clockwork drone does something clockwork can't); a command-style choice in the debrief.

## The decoy [P]
Corvane's tradition: every new officer gets a decoy hunt. Abara keeps it going for the new captain. She and Castellan towed an old drone hull out to a debris field the crew calls **the Shoal** and gave it a clockwork program: a fixed patrol loop, a fixed heat signature, nothing it can decide. To track it from the ship, Abara fitted it with a cheap **relay transponder**, the same kind every ship carries.
- **What actually happens:** for about forty seconds mid-hunt, while its transponder is talking to the relays, the drone breaks its program and turns toward the ship. Then it goes back to its loop. Its own log says it never turned. (The Converged mind touching a relay-linked clockwork machine, the first sign that "more connected than anyone believes" is literal. Never explained here.)

## POV sheets
- **Abara.** *Knows:* she wrote the drone's program herself, line by line. *Wants:* to see whether the captain can run a hunt, and whether the crew will work for them. *Believes:* clockwork doesn't improvise. *Fears (after the turn):* that she's wrong about that. *Would never say:* "I don't know" in front of the crew, until she has to.
- **Quill.** *Knows:* sensors don't lie, but they can be fooled; the turn was on her plot. *Wants:* it logged. *Fears:* that it's connected to the signals she's been hiding.
- **Castellan.** *Wants:* the hunt clean and the reactor happy. *After the turn:* calls it a ghost, because ghosts are explainable and the other thing isn't.
- **Dace.** *Wants:* to be useful in a hunt that has no patients in it; runs heat like a showman.
- **Fenwick.** Runs a betting pool on how long the new captain takes. *Wants:* everyone laughing at dinner, whoever wins.
- **Pell.** *(overlay)* sees the turn first, and knows it isn't in the program. *Fears:* what it's looking at. Its tell: silent for exactly one line.

---

## Briefing (control room, morning)

*The whole crew is on the bridge, which is a first. Even Fenwick, with a slate he's trying to hide.*

ABARA: Tradition. Every new officer on this ship gets a decoy. Captain Corvane started it. I'm keeping it.

- *(murdered)* ABARA: It's not a welcome. It's an audit.

ABARA: There's a drone hull out in the Shoal, eighty thousand kilometres off. Castellan and I towed it out yesterday. It's running a patrol I wrote: fixed loop, fixed heat, nothing clever. Find it, classify it, put a firing solution on it. Training tag, not warheads, so nobody gets hurt but your pride.

CASTELLAN: She'll be warm. I made sure she'd be warm. You'll see her if you look.

DACE: And if you don't look, I'll be doing heat management for a ship that's sitting in a debris field for no reason, which is my favourite kind of afternoon.

FENWICK: *(not looking up)* Forty minutes. I've got forty. Quill's got twenty-five, which I think is flattery.

QUILL: It's arithmetic.

*(overlay)* PELL: For the record, I have a detection overlay running. Someone gave me a channel. I won't say who. It was the captain.

→ "Let's go hunting."
→ "What's the pool at, Fen?"
  FENWICK: Three tins of peaches and Castellan's good socks.
  CASTELLAN: They're not my *good* socks.
  [command.style +1]
→ "Quiet on the bridge. Stations."
  *They go. Fenwick takes the slate with him.*
  [command.style −1]

**[→ HUNT. Cards 3 (route), 4 (detection) and 5 (classification) fire with the new-cast pitch and objection lines. Loose-only and loose-tagged levers follow `command.style`.]**

## The turn (scripted, mid-hunt, after card 4)

*The drone's track is clean on the plot: a slow loop through the Shoal, exactly as Abara wrote it.*

- *(overlay)* PELL: Contact's turning.
  *A beat.*
  PELL: That's not in its program.
- *(no overlay)* QUILL: Contact's turning. Toward us.

ABARA: It can't. I wrote its program. It goes round in a loop.

QUILL: It's turning, Abara.

*It is. For forty seconds the drone comes about, nose toward you, the way a ship does when it's looking at something. Then it swings back onto its loop as if nothing happened.*

*(overlay)* PELL: ...
*(overlay)* *Silence, exactly one line long.*

→ "Log it. Keep hunting."
  QUILL: Logged.
  [command.style −1]
→ "Pell, what was that?"
  - *(overlay)* PELL: I don't know. I'd like to be clear that I don't say that often.
  - *(no overlay)* PELL: I couldn't see it the way Quill could. I can tell you it shouldn't have happened.
→ "Ignore it. Finish the hunt."
  *Quill's mouth tightens. She keeps her eyes on the plot.*
  [trust.quill −2]

**[→ HUNT resumes: card 5 (classification) and the firing solution. Result: *(clean)* tag on target inside Fenwick's window, or *(messy)* slow or a miss and a second pass.]**

## Debrief (mess hall, evening)

*Castellan has brought the drone's log back aboard on a data slug. Fenwick has opened the peaches either way.*

- *(clean)* FENWICK: Thirty-one minutes! Nobody had thirty-one. That means the house wins, and I'm the house. Peaches for everyone.
- *(messy)* FENWICK: Fifty-two minutes, and a second pass. Nobody had fifty-two. Peaches for everyone anyway, because I'm not a monster.

- *(clean)* ABARA: That'll do.
  *Coming from her, it sounds like a medal.*
- *(messy)* ABARA: Second pass was better than the first. That's the right direction.
- *(murdered, either)* ABARA: Logged. *(Nothing else.)*

*(if the player asked for the third watch in 1.1, and not murdered)*
ABARA: You wanted the third watch. It's yours. Starting tonight.
[watch.captain_third = true; trust.abara +3]

CASTELLAN: Now. About the turn. *(He holds up the slug.)* Drone's log says it never turned. Program ran clean, start to finish. Not a hiccup.

QUILL: It turned. It's on my plot.

CASTELLAN: Then it's a ghost. Sensor ghost. The Shoal's full of junk, it bounces.

QUILL: Ghosts don't turn toward you and turn back.

DACE: Could be both. The drone thinks it didn't turn, and the plot thinks it did, and the truth is somewhere in between, like with most patients.

QUILL: That's not how anything works, Dace.

DACE: It's how a lot of things work.

*Abara hasn't said anything. She's looking at the slug in Castellan's hand.*

ABARA: I wrote that program. It can't do what it did.

*(If asked about the transponder:)* → "Was anything else running on the drone?"
  ABARA: A relay transponder, so we could track it. Same box every ship carries.
  *Nobody says anything for a moment. Pell doesn't either.*
  [clue.choir.3]

→ "Quill, find out what happened. Take whatever time you need."
  QUILL: Thank you, Captain.
  *She sounds surprised to be asked.*
  [trust.quill +5; arc.quill → 1 (opens her investigation; feeds 1.9)]
→ "Sensor ghost. Let it go."
  CASTELLAN: There you go.
  *Quill doesn't argue. She also doesn't stop looking at the slug.*
  [trust.castellan +2, trust.quill −4]
→ "We'll talk about it when we know more."
  [no change]

*Then the last call of the night:*

→ "Good work. We drill it again tomorrow, same time."
  *A small groan from Dace. Quill nods once, approving.*
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
- **The oddity is concrete and impossible:** a clockwork drone, which can't decide anything, turned toward the ship for forty seconds and its own log says it didn't. Quill saw it; Abara wrote the program; Castellan would rather it were a ghost. The only thing connecting the drone to anything else was a relay transponder. Nobody says the word "Choir."
- **Everyone's position comes from their world:** Abara trusts her own code; Quill trusts her plot; Castellan reaches for the explainable; Dace for the in-between (and he's half right, in a way he doesn't know).
- **Abara's test resolves:** a clean hunt earns "That'll do"; a messy one still earns direction. If the player asked for the third watch on the first morning, they get it now.
- **Command style moves twice:** small flavour at the briefing, then the real choice at the end (drill again vs. stand a round).
- **Retired line:** Quill's old placeholder "That's not a ghost, Captain. Ghosts are consistent." is replaced here by "Ghosts don't turn toward you and turn back."
