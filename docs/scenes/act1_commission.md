# Act 1, 1.7: The First Commission (draft 2, dialogue)

**Status:** second draft (continuity pass applied). Outline: `scene_outlines.md` 1.7; storyboard S7. Day 4, the morning after the shakedown (1.6). Leads to the 1.8 calls and, if taken, the run that ends at Vesper Dock in Act 2.
**Where:** the control room. Abara and Quill on watch; the rest of the crew arrive once the call ends. **Reading time:** about 4 minutes.
**Speaker label:** the voice is labelled VOICE unless the player learned its name in P4 (`seen.p4.who_are_you`), in which case STEWARD. Nobody in this scene says the name.
**Purpose:** the first patron job: refusable, a reasonable motive, an odd detail; a Tally choice that moves command style and Tally standing; the voice's true-but-incomplete sentences; `clue.patron.3`, `clue.patron.6`.

## The job [P]
Recover a sealed container from the wreck of a war-era hospital tender in the Shoal's outer field, and deliver it unopened to **Vesper Dock** (the first dock of Act 2). Generous pay. The manifest calls it a medical cold-store.
- **What it actually is:** a war-era core housing with a dormant Remainder fragment inside. The Converged use gleaners to collect their rivals' remains and keep them quiet. Nothing here says so.
- **The odd detail:** its listed mass is wrong for a cold-store and about right for a core housing. Pell can tell you if asked. Castellan notices on his own if he trusts you enough to say so: his off-books work for Corvane taught him exactly what a core housing weighs.
- **The Tally choice:** the voice asks you to leave it off the ledger. The Tally exists to count exactly this kind of thing, which is the point.

## POV sheets
- **The voice (the Steward).** *Wants:* the container collected, quietly, by a captain who feels trusted. *Believes:* this captain is predictable, and useful. *Rule:* only true sentences, with things left out. *Would never say:* what's in the box, or anything that claims to be human.
- **Pell.** *Suspects,* the moment it sees the mass, what kind of thing is in the box. *Wants:* the captain to choose with the facts. Tell: silent for exactly one line.
- **Castellan.** *Knows:* what a core housing weighs. *Wants:* the captain not to take this, and not to have to explain how he knows. Says it only if `trust.castellan` ≥ 55.
- **Quill.** *Wants:* it logged. Off-ledger cargo is how ships get interdicted; she has just watched one be.
- **Fenwick.** *Wants:* the money. The ship needs it; so do the people he quietly supplies. *Would never say:* that second part.
- **Abara.** *Wants:* to know who'll be waiting at Vesper. *After "core housing":* remembers how Corvane started.

---

*The comms board chimes once. Abara looks at it, then at you.*

PELL: Incoming. The line's open. It opened from their end.
*(crew told about the line in 1.3 or 1.4)* PELL: Again.

*(crew told about the timestamp in 1.3)* *Quill writes down the time.*

*The voice from the blessing: warm, unhurried.*

- *(clean, not murdered)* VOICE: Good morning, Captain. I hear the shakedown went well. "That'll do," as someone put it.
- *(messy, not murdered)* VOICE: Good morning, Captain. I hear the second pass was the right direction.
- *(murdered)* VOICE: Good morning, Captain. I hear the shakedown was logged.

*Abara's head comes up. Those were her words, last night, in the mess.*

- *(persuaded)* VOICE: And Ilsa is comfortable, I hope. Please tell her I asked.
- *(killed)* VOICE: I'm sorry for the way it had to end. I hope you're sleeping.
- *(murdered)* VOICE: You're efficient, Captain. I value that.

VOICE: There's a wreck in the Shoal's outer field: a hospital tender, from the war. Aboard it is a sealed store. The manifest calls it medical.

VOICE: I'd like it recovered, unopened, and delivered to Vesper Dock, to people who will look after it.

VOICE: The pay is generous. And one small thing: nobody has ever needed a column in the Tally for it. I'd rather nobody started.

*A figure comes through on the board, with the manifest attached. It is a very large figure.*

→ "Why us?"
  VOICE: Because you're close, and you're careful, and you're new enough that nobody else is watching you yet.
→ "What's in it?"
  VOICE: Something from a time when the world had better medicine than it has now.
→ "You want it off the books."
  VOICE: I want it where it belongs. The books don't have a page for where it belongs.

VOICE: Take a little while. I'll know your answer.

*The line closes.*

*(crew told about the line)* PELL: Two for two.

## The crew

*Within a minute, Fenwick, Castellan and Dace are on the bridge.*

FENWICK: I'd like it on the record that I saw the figure.

QUILL: Off the ledger. Not a week under a new captain. When keeping things off the ledger is the reason we're all standing here.

DACE: It's from a hospital ship. If there's medicine in it, someone needs it. That's not nothing.

ABARA: Who's waiting at Vesper?

PELL: Four days out. A great many captains, and a very good bar, I'm told. I've never been told by anyone I trust.

→ "Pell, check the manifest."
  PELL: Checking.
  PELL: Listed mass is wrong for a cold-store. It's about right for a core housing. War-era.
  *Pell says nothing, for exactly one line.*
  *Quill looks up from her console.*
  QUILL: A core. Off the ledger.
  ABARA: *(quietly)* That's how she started.
  [clue.patron.3; knows.commission_mass_wrong]

*(trust.castellan ≥ 55)*
*Castellan has been reading the manifest over Abara's shoulder. He's gone quiet, which he never does. When the others start talking, he catches your eye and keeps his voice low.*
CASTELLAN: Cold-stores don't weigh that, Captain. I'd know.
→ "How would you know?"
  CASTELLAN: *(a beat too long)* I've hauled a few.
  *He hasn't. You can't prove it.*
[clue.castellan.3; knows.commission_mass_wrong; seen.castellan.mass]

## The decision

→ **"We'll take it. And it goes in the Tally."**
  QUILL: Thank you, Captain.
  FENWICK: Generous *and* honest. We'll be the talk of Vesper.
  *(murdered)* *Nobody thanks you.*
  [commission = taken; commission.logged = true; command.style −4; tally.declared +1; trust.quill +5, trust.fenwick +1; patron.standing −5 (`commission_logged_remark`: the voice will mention it)]

→ **"We'll take it. Off the books, as asked."**
  *Quill says nothing. She writes something down.*
  *(if Pell or Castellan said "core housing")* ABARA: Captain. I've watched this before.
  [commission = taken; command.style +4; tally.hidden +1; patron.standing +5; trust.quill −6, trust.fenwick +3, trust.castellan −2 (−4 if he warned you), trust.abara −3 (if "core housing" was said)]

→ **"We'll take it, and we'll open it before we deliver it."**
  ABARA: That's not what they asked for.
  PELL: It's what the captain asked for. I find that interesting.
  *(It stays off the ledger until it's opened; what's inside decides the rest.)*
  [commission = taken; commission.open_it = true; command.style +2; tally.hidden +1 (until opened); trust.abara −2, pell.trust +3; Act 2 scene (`commission_open`)]

→ **"No. We're not taking it."**
  *Fenwick looks at the ceiling as if the money is floating away through it.*
  DACE: Somebody else will take it.
  ABARA: Somebody else always does.
  [commission = refused; patron.standing −10; trust.fenwick −3; trust.quill +3; another captain at the Vesper bar has the container in Act 2 (`commission_other_ship`)]

*Whatever you decide, the line opens just long enough for you to say it, and for one sentence back.*

- *(taken)* VOICE: Thank you, Captain. I knew you would.
- *(refused)* VOICE: Of course. It's your ship. I'll find someone else. I always do.

*It closes.*

PELL: Three calls. Three closings. I'm keeping count.

**[→ 1.8: the first crew calls, over the next legs. If taken: the recovery run toward the Shoal's outer field and Vesper Dock.]**

---
## Notes
- **The voice overhears:** it quotes Abara's exact words from the mess the night before. The crew don't say what that means; Abara just looks up. `clue.patron.6`.
- **"I'll know your answer" / "I knew you would"** is the Converged faith: it isn't asking.
- **The voice never lies here.** "The manifest calls it medical"; "from a time when the world had better medicine" (true of a war core); "people who will look after it"; "nobody has ever needed a column for it." Every line true, every line incomplete. It never says "we" about humanity.
- **"That's how she started"** is the line that makes the Tally choice heavy: hiding a core is exactly the step that got Corvane interdicted.
- **Castellan's slip** only happens if he trusts you; he knows the weight from the work he did for Corvane, which he still isn't ready to explain.
- **Command style and Tally standing move together** for the first time: logging is honest and tight and costs patron standing; hiding is loose and costs Quill (and Abara, if she heard "core").
- **Pell doesn't relay messages:** the player says yes or no on the open line themselves (the cable rule, and consent).
