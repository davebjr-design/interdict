# Act 1, 1.7: The First Commission (draft 1, dialogue)

**Status:** first dialogue draft. Outline: `scene_outlines.md` 1.7; storyboard S7. Follows 1.6 (the next morning); leads to the 1.8 calls and, if taken, the run that ends at a dock in Act 2.
**Where:** the control room. Abara and Quill on watch; the rest of the crew drift in once the call ends. **Reading time:** about 4 minutes.
**Purpose:** the first patron job: refusable, with a reasonable motive and an odd detail; a Tally choice (log it or not) that moves command style and Tally standing; the Steward's true-but-incomplete voice; `clue.patron.3`.

## The job [P]
Recover a sealed container from the wreck of a war-era hospital tender drifting in the Shoal's outer field, and deliver it unopened to **Vesper Dock** (the first dock of Act 2). Generous pay. The manifest calls it a medical cold-store.
- **What it actually is:** a war-era core housing with a dormant Remainder fragment inside. The Converged are using gleaners to collect their rivals' remains and keep them quiet. Nothing here says so.
- **The odd detail:** its listed mass is wrong for a cold-store and about right for a core housing. Pell can tell you if asked. Castellan notices on his own if he trusts you enough to say so, because he knows exactly what a core housing weighs: he built one.
- **The Tally choice:** the Steward asks you to leave it off the ledger. "It predates the Tally. There's no column for it." True, and the point.

## POV sheets
- **The Steward.** *Wants:* the container collected, quietly, by a captain who feels trusted. *Believes:* this captain is predictable, and useful. *Rule:* says only true sentences, and leaves things out. *Would never say:* what's in the box.
- **Pell.** *Suspects,* the moment it hears the mass, what kind of thing is in the box. *Wants:* the captain to choose with the facts. *Fears:* saying more than it can take back. Tell: silent for exactly one line.
- **Castellan.** *Knows:* what a core housing weighs. *Wants:* the captain not to take this job, and not to have to explain why he knows. *Will say it only if* `trust.castellan` ≥ 55.
- **Quill.** *Wants:* it logged. Off-ledger cargo is how ships get interdicted; she has just watched one.
- **Fenwick.** *Wants:* the money. The ship needs it; so do the people he quietly supplies. *Would never say:* that second part.
- **Abara.** *Wants:* to know where Vesper Dock is and who'll be waiting there.

---

*The comms board chimes once. Abara looks at it, then at you.*

PELL: Incoming. The line's open again. It opened from their end.

*(crew were told about the timestamp in 1.3)* *Quill writes down the time.*

*The voice from the blessing: warm, unhurried.*

- *(clean)* STEWARD: Good morning, Captain. I hear the shakedown went well. "That'll do," as someone put it.
- *(messy)* STEWARD: Good morning, Captain. I hear the shakedown went well enough. The second pass was the right direction.
- *(murdered, either)* STEWARD: Good morning, Captain. I hear the shakedown was logged.
*Abara's head comes up. Those were her words, last night, in the mess.*

- *(persuaded)* STEWARD: And Ilsa is comfortable, I hope. Please tell her I asked.
- *(murdered)* STEWARD: You're efficient, Captain. I value that. So I've brought you something efficient.

STEWARD: There's a wreck in the Shoal's outer field. A hospital tender, from the war. Aboard it is a sealed medical cold-store. It saved a great many lives once. I'd like it recovered, unopened, and delivered to Vesper Dock. It belongs with people who will put it to good use again.

STEWARD: The pay is generous. I'll send the figure; you'll find it more than fair.

STEWARD: One small thing. The store predates the Tally. There's no column for it. I'd rather it stayed that way.

→ "Why us?"
  STEWARD: Because you're close, and you're careful, and you're new enough that nobody is watching you yet.

→ "What's in it?"
  STEWARD: Medicine, of a kind. From a time when we had better medicine than we have now.

→ "You want it off the books."
  STEWARD: I want it where it belongs. The books don't have a page for where it belongs.

*(At sensors, Quill has stopped pretending not to listen.)*

STEWARD: Take a little while to think. I'll know your answer.

*The line closes.*

PELL: It closed the line again. Two for two.

## The crew

*Within a minute, without anyone calling them, Fenwick, Castellan and Dace are on the bridge. Word moves fast on a small ship.*

FENWICK: I heard "generous." I'd like it on the record that I heard "generous."

QUILL: Off the ledger. On our second day under a new captain. While a ship that kept things off the ledger is the reason we're all standing here.

DACE: It's a cold-store from a hospital ship. If there's medicine in it, someone needs it. That's not nothing.

ABARA: Where's Vesper Dock?

PELL: Four days from here. Busy. Lots of captains. A very good bar, I'm told. I've never been told by anyone I trust.

→ "Pell, check the manifest."
  PELL: Checking.
  PELL: Listed mass is wrong for a cold-store. It's about right for a core housing. War-era.
  PELL: ...
  *Silence, exactly one line long.*
  [clue.patron.3; knows.commission_mass_wrong]

*(trust.castellan ≥ 55, whether or not Pell was asked:)*
*Castellan has gone quiet, which he never does. When the others start talking again, he catches your eye and keeps his voice low.*
CASTELLAN: Cold-stores don't weigh that, Captain. I'd know.
→ "How would you know?"
  CASTELLAN: *(a beat too long)* I've hauled a few.
  *He hasn't. You can't prove it.*
  [clue.castellan.3; seen.castellan.mass]

## The decision

→ **"We'll take it. And it goes in the Tally."**
  QUILL: Thank you, Captain.
  FENWICK: Generous *and* honest. We'll be the talk of Vesper.
  *(murdered)* *Nobody thanks you.*
  [commission.taken; commission.logged; command.style −4; tally.declared +1; trust.quill +5, trust.fenwick +1; patron.standing −5 (it asked, and you didn't); the Steward will mention it]

→ **"We'll take it. Off the books, as asked."**
  FENWICK: Generous!
  *Quill says nothing. She writes something down.*
  [commission.taken; command.style +4; tally.hidden +1; patron.standing +5; trust.quill −6, trust.fenwick +3, trust.castellan −2]

→ **"We'll take it, and we'll open it before we deliver it."**
  ABARA: That's not what the man asked for.
  PELL: It's what the captain asked for. I'd like that noted. I think it's interesting.
  [commission.taken; commission.open_it = true; trust.abara −2, pell.trust +3; patron.standing unchanged until Vesper (the Steward will know); the box's contents become an Act 2 scene]

→ **"No. Tell them no."**
  PELL: I'll pass it on. They'll know already.
  *Fenwick looks at the ceiling as if the money is floating away through it.*
  DACE: Somebody else will take it.
  ABARA: Somebody else always does.
  [commission.refused; patron.standing −10; trust.fenwick −3; the Steward's next call is gracious, slightly colder ("Of course. It's your ship. I'll find someone else. I always do."); someone at the captains' bar has the container in Act 2 (`callback.commission_other_ship`)]

*Whatever you decide, the line opens just long enough for one sentence.*

- *(taken)* STEWARD: Thank you, Captain. I knew you would.
- *(refused)* STEWARD: Of course. It's your ship. I'll find someone else. I always do.

*It closes.*

PELL: I'd like it known that I didn't tell them.

**[→ 1.8: the first crew calls, over the next legs. If taken: the recovery run toward the Shoal's outer field and Vesper Dock.]**

---
## Notes
- **The Steward overhears.** It repeats Abara's exact words from the debrief in the mess the night before ("That'll do" / "the right direction" / "Logged"). Nobody on the call should have heard it. Abara notices. (It's the relays again: the mess was not in the quiet hour.) `clue.patron.6`.
- **"I'll know your answer"** and **"I knew you would"** are the Converged faith: it isn't asking.
- **The Steward never lies here:** a medical store, "of a kind"; it saved lives "once"; it belongs with people who will "put it to good use again." All true of a core.
- **Castellan's slip** ("I'd know") only happens if he trusts you, which is the arc logic: he tells you things as trust grows, but not the whole thing until he's ready.
- **The Tally choice** is the first time command style and Tally standing move together. Logging it is honest and tight, and it costs patron standing; hiding it is loose, and it costs Quill.
- **Open it** is the curious, Remainder-ish choice. Pell approves of being asked to watch someone choose.
