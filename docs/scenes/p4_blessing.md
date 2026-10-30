# P4: The Blessing (draft 1, dialogue)

**Status:** first dialogue draft, for a voice read. Outline: `scene_outlines.md` P4. **POV sheets:** Pell (`pov_sheets.md`); the Steward below.
**Where:** Corvane's bridge, now yours, about an hour after the standoff (the standoff ends around 22:13 ship time). **Reading time:** about 3 minutes.
**Purpose:** give the player the authority to command, and hand them the opening's central mystery in concrete form: the blessing was sent *before* the choice it congratulates. Pell notices and gets chatty (its tell when scared).

**The Steward (patron) POV sheet [P name]**
- **Knows:** how the standoff ended (and, in some sense, how it would end). Everything Ostrow reported. A great deal about this ship.
- **Wants in P4:** the new captain grateful, settled and incurious. The ship quiet.
- **Believes:** the player is useful, and more useful if they feel chosen.
- **Hiding:** everything that matters. Speaks only in true sentences that leave things out.
- **Voice:** warm, patient, unhurried. Gives instructions as if offering help. Never a threat, never a raised voice, never a face.
- **Would never say:** anything it could be quoted on.

---

*The bridge is quiet now.*
- *(killed / murdered)* *Corvane's body has been taken below. Someone has cleared away the tea.*
- *(persuaded)* *Corvane has been escorted to her cabin. She left her cup on the table, half full.*

*Dunne has gone back to the* Tern*.*
- *(ames wounded)* *He took Ames with him, swearing the whole way.*
- *(ames dead)* *He took Ames with him.*
- *(murdered)* *He didn't say goodbye.*

*The crew have been sent to their quarters. It's you and the amber light on the pedestal.*

PELL: There's a message for you. It's addressed to "the captain of this vessel", which I suppose is you now. Shall I play it?

→ "Play it."
→ "Who's it from?"
  PELL: It doesn't say. That's usually how you can tell.

*A voice fills the bridge: warm, unhurried, like someone settling into a chair across from you.*

- *(killed)*
  VOICE: Captain. I'm sorry it came to that. Ilsa was a gifted officer, and she would not be turned. You did what was asked of you, and you did it well.
- *(persuaded)*
  VOICE: Captain. She listened to you. That's rare; she never listened to anyone. I'd have preferred her brought to us, but I won't quarrel with a result.
- *(murdered)*
  VOICE: Captain. Quick, and clean. That's a quality I value more than people think.

VOICE: The ship is yours, by the usual arrangements. Her crew will be difficult. They loved her, in their way. Give them time, and give them work. I'd like this ship to be quiet, and I'd like whatever she was waking to stay asleep. I'll see to it you have what you need. We'll speak again.

*The message ends.*

*A pause, slightly too long.*

PELL: Captain. Can I mention something? It isn't important. It's probably not important.

PELL: That message was sent at twenty-two-oh-two, ship time.
- *(shot)* You fired at twenty-two-thirteen.
- *(persuaded)* She stood down at twenty-two-thirteen.

PELL: So it was sent eleven minutes before. Which is fine. People prepare. I prepare. I had two funeral logs ready. I'm talking quite a lot. I'll stop.

→ "Maybe they wrote one for every outcome."
  PELL: That's what I'd do. It's what I did do. But there's only one message in the relay log. Not three. One.
  PELL: I'm going to stop talking now.
  [patron.suspicion +10]

→ "Can you reply to it?"
  PELL: There's a return line. It's open.
  PELL: It's been open for six weeks. Since about the time she brought the core aboard.
  [patron.suspicion +10; clue.patron.5]

→ "Don't mention this to anyone."
  PELL: Mention what?
  PELL: (That was a joke. I won't.)
  [told.patron_message_predated.* stays false; pell.trust +5]

*A small light comes on at the communications station.*

VOICE: Captain. You'll have questions. Ask one or two.

**[Live call: the player may ask up to two.]**

→ "Who are you?"
  VOICE: Someone who would like today to be the last time anyone has to do what you just did. If you need to call me something, the Steward will do.
  *(From here on, the script labels this voice STEWARD.)*
  [seen.p4.who_are_you]

→ "How did you know how it would end?"
  VOICE: I didn't. I hoped. Hope is most of what I do, Captain.
  PELL: ...
  [patron.suspicion +10]

→ "What happens to her crew?"
  VOICE: That's yours to decide. I'd only ask that you decide soon.

→ "Thank you."
  VOICE: Don't thank me yet. But I'm glad you said it.
  [patron.standing +5]

VOICE: Rest, Captain. The ship will look different in the morning.

*The light goes out.*

PELL: It closed the line.

*A pause.*

PELL: It's never closed it before.

**[→ 1.1: Stepping aboard (the next morning)]**

---
## Notes for the voice read
- **The hook** is a fact, not a mood: a message congratulating you on an outcome, sent eleven minutes before you chose it, and the only one in the log. The player can explain it away. Pell can't, and its chattiness tells the player it's frightened.
- **The Steward** never lies in this scene. Every line is true and incomplete ("I didn't. I hoped."). That's the rule for the patron throughout.
- **The murder variant** is the only one where the Steward sounds pleased. That's a clue for an attentive player, and a cost.
- **"It's never closed it before"** tells the player the line has been open, listening, the whole time Corvane had the core.
- **Name:** "the Steward" (confirmed by Dave). The script labels the speaker VOICE until it names itself, because the player doesn't know the name yet. If the player never asks "Who are you?", they learn the name later.
