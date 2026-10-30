# Act 1, 1.3: The First Crew Meeting (draft 1, dialogue)

**Status:** first dialogue draft, for a voice read. Outline: `scene_outlines.md` 1.3. Follows 1.2; leads to 1.4 (the aftermath) and 1.5 (Pell at night).
**Where:** the mess hall, after breakfast. Everyone is here; Pell is on the speaker. **Reading time:** about 4 minutes.
**Purpose:** show the crew as a group under strain, with an argument that was already old before the player arrived; use the decision grammar (one proposer, one or two objectors, the captain decides); hand the player their first group choice.
**Variant tags:** as in the first-morning file (*(killed)* = shot in R2-R5, not murdered; *(murdered)* = shot in R1).

## The thing they argue about: the quiet hour [P]
Every night, for one hour, Corvane sent everyone off the bridge and switched off the internal comms. She has done it for years; nobody knows what she did in it. Six weeks ago, when Pell came aboard, it became an hour alone with Pell, and the argument got worse.
- **What actually happened in it:** Corvane and Pell talking, and Pell thinking unobserved, where the Steward's open line couldn't hear. (Paid off later.)
- **Castellan** also used the hour: it's the only time he could work on the second panel without anyone seeing.

## POV sheets: the meeting
- **Dace (proposer):** wants to keep the quiet hour. *Why, in his world:* routine keeps a frightened crew steady; he's seen it in wards. And he admired Corvane and likes that she trusted the AI. *Wants:* to be the one who speaks first and sounds like a leader. *Fears:* Abara thinking he's naive.
- **Quill (objector):** wants it ended. *Why:* it's the one hour of the day she can't log, and some of her signals fall inside it. She objected to Corvane when it was just Corvane, and again when it became Corvane and Pell, and lost both times. *Wants:* the captain to hear that someone said it. *Would never say:* why the timing bothers her.
- **Castellan (sides with Dace):** wants it kept. *Why:* the panel. He also really does think the crew needs a rest from each other. Both reasons are true, which makes it easier to say. *Fears:* that Quill is about to say something that makes the captain look at the reactor.
- **Fenwick (peacemaker):** doesn't care about the hour; cares that they're all at one table. *Wants:* the argument to end before someone leaves the room.
- **Abara (last word):** knows Corvane was talking to Pell in that hour, or suspects it. Has never said so. *Wants:* the captain to decide, so she doesn't have to.
- **Pell:** is the subject of the argument and knows it. Says almost nothing; this is its tell (silent when it touches the agenda).

---

*Fenwick has cleared the bowls and put the coffee pot in the middle of the table, like a peace offering. There are six places set. The one at the head of the table is Corvane's. Nobody is in it.*

→ *Sit at the head of the table.*
  *Nobody says anything. Castellan looks at the table. Fenwick pours your coffee first.*
  [trust.abara -2, trust.castellan +1; seen.meeting.head]

→ *Sit with them, on the bench.*
  *Fenwick shuffles up to make room, pleased. Abara watches you do it.*
  [trust.fenwick +3, trust.abara +2]

→ *Stay standing.*
  ABARA: You'll want to sit. This takes a while.
  [trust.abara +0]

*Abara is by the door. Dace is across from Quill, which looks like a habit. Castellan is next to Fenwick, close enough to steal his toast.*

- *(murdered)* *Fenwick sits next to you. Nobody else does.*

FENWICK: Right! Captain's first meeting. Very exciting. I've made coffee, which means it's official.

ABARA: Somebody say it, then.

*A pause. Dace says it.*

DACE: The quiet hour. We should talk about the quiet hour.

*(to you)* DACE: Every night, she sent us all off the bridge for an hour. Comms down, doors shut. Since Pell came aboard, it's been just her and Pell. I think we should keep it.

→ "Why?"
  DACE: Because routine is the only thing keeping this crew in one piece, Captain. You can see it in any ward. Take away the thing people do every night, and they stop sleeping. And she had reasons. She always did.

→ "What did she do in that hour?"
  DACE: Nobody knows. That's sort of the point. She trusted Pell, and she trusted us to leave her to it.

*Quill doesn't look up from her coffee.*

QUILL: We should end it.

DACE: Here we go.

QUILL: It's an hour a day when nobody on this ship knows what's happening on its bridge. I've said so before.

DACE: To her. And she said no.

QUILL: And now she isn't here to say it.

*Nobody says anything. Dace looks at his hands.*

CASTELLAN: Now hang on. *(gently)* Quill, honey, nobody's hiding anything. The crew needs an hour off from each other, that's all. Five people in a can this size, you need somewhere to put your elbows. I'm with Dace.

*Quill looks at him for a long second. She doesn't say anything. Castellan finds something interesting in his toast.*

FENWICK: I'll say this and then I'll stop. Whatever we decide, we decide it at this table, and then we all eat dinner together tonight. Yes? Yes. Good.

PELL: *(from the speaker)* I'd like it noted that I'm in the room.

*Nobody answers it.*

*Everyone looks at you.*

→ "We keep it. I'll take her place."
  *A beat. Dace looks pleased. Castellan looks relieved, then hides it. Quill writes something down.*
  ABARA: Every night?
  → "Every night."
  [quiet_hour = kept_captain; trust.dace +5, trust.castellan +5, trust.quill -5; → 1.5 happens in the first quiet hour]

→ "We end it. The bridge stays manned."
  *Quill looks up, surprised to have won. Dace sits back. Castellan says "Huh," to nobody, and doesn't touch his coffee again.*
  [quiet_hour = ended; trust.quill +8, trust.dace -3, trust.castellan -5; Castellan must find another time for the panel (clue.castellan.1 sooner); → 1.5 happens on an ordinary night watch]

→ "We keep it, with Quill on the bridge."
  DACE: That's not the quiet hour, that's just an hour.
  QUILL: I'll take it.
  CASTELLAN: *(too quickly)* Fine by me.
  [quiet_hour = kept_quill; trust.quill +5, trust.dace -2, trust.castellan -2]

*Fenwick tops up the coffee, because somebody has to do something.*

ABARA: There's something else. What did they say to you? Last night. The patron's office.

*Everyone goes quiet in a different way.*

→ *Tell them everything, including the timestamp.*
  *You tell them about the message. Then you tell them it was sent eleven minutes before it should have been.*
  *Quill puts her cup down very carefully.*
  DACE: That's... that can't be right. Pell?
  PELL: It's right.
  CASTELLAN: Well, hell.
  FENWICK: Somebody's very well organized.
  *Abara says nothing at all, which is somehow worse.*
  [told.patron_blessing.* and told.patron_message_predated.* = true; trust.quill +8, trust.abara +5; patron.suspicion +5; the crew now shares the mystery]

→ *Tell them the job: the ship is ours, keep it quiet, keep whatever she was waking asleep.*
  ABARA: Keep it asleep. Right.
  DACE: That's it?
  → "That's it."
  [told.patron_blessing.* = true; trust.dace -2; Quill watches you for the rest of the meeting]

→ "That stays with me for now."
  *Fenwick opens his mouth and closes it again.*
  QUILL: Understood, Captain.
  *She says it the way she says everything. You still hear it.*
  [trust.quill -5, trust.abara -3; told.* stays false. If they find out later that you hid it, trust drops again]

*Abara gets up. She stops at the door.*

- *(persuaded)* ABARA: She ran us for fourteen years. She never once asked us what we thought. Don't know if that makes you better than her. We'll find out.
- *(killed)* ABARA: She ran us for fourteen years, and she never once asked us what we thought. You did. Remember you did that.
- *(murdered)* ABARA: Watch starts in ten minutes. Captain.

*She goes. One by one, the others follow, except Fenwick, who starts clearing the cups.*

FENWICK: That went well. *(beat)* That went fine. Nobody threw anything. You should have seen some of hers.

**[→ 1.4: the aftermath]**

---
## Notes for the voice read
- **The quiet hour** gives the dissent something to argue about that was already there before the player: Quill lost this argument with Corvane, and now she gets to have it again. "And now she isn't here to say it" is the line where the crew's grief turns into politics.
- **Everyone's position comes from their own reasons.** Dace from ward routine and admiration, Quill from the hour she can't log, Castellan from his secret (and a real belief that the crew needs a break), Fenwick from the table.
- **Castellan's "Quill, honey"** is the Tucker-Reed pairing showing: he calls her that, she lets him.
- **Pell's one line**, "I'd like it noted that I'm in the room," is the only thing it says in a conversation that's about it.
- **The quiet hour feeds 1.5.** If the player keeps it and takes Corvane's place, Pell's first real conversation happens in that hour, in the dark, with the comms off, and Pell can say things it won't say when anyone else is listening.
- **The second question is the first time the player can share the mystery.** Telling them about the timestamp costs nothing now and makes the crew investigators with you; hiding it is the start of the "you hid it" trust rule.
