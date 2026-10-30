# P1: The Briefing (draft 1, dialogue)

**Status:** first dialogue draft, for a voice read. Not in Ink yet. Outline: `scene_outlines.md` P1.
**Where:** briefing room of the *Tern*, a low-rated gleaner ship. **Reading time:** about 3-4 minutes.
**POV sheets:** `pov_sheets.md` (Ostrow, Dunne, Ames).
**Format:** `NAME:` lines are spoken. *Italics* are narration. `→` is a player choice, with its effect in [brackets].

**Host-ship cast (mini cards)**
- **Captain Ostrow** (50s, woman): tired, practical, rueful. Says the hard thing plainly and then looks away. Sailed under Corvane for four years and still admires her.
- **Dunne** (40s, man, first mate): blunt, unsentimental, the one who says what everyone is thinking. Not unkind, just done pretending.
- **Ames** (early 20s, man, boarding hand): eager, polite, nervous, the youngest aboard. Easy to like in under thirty seconds.

---

*The briefing room smells of old coffee. A chart glows on the table: a single track, dotted where it goes dark. Captain Ostrow is already talking when you come in. Dunne leans on the bulkhead with his arms folded. At the far end of the table, Ames sits very straight, as if someone might grade his posture.*

OSTROW: ...which is why we don't touch the cores. No, that's not right. We touch them. We strip them, we sell them, and now and then we switch one on, a little, to see what it's worth. What we don't do is let one wake up.

*She looks up.*

OSTROW: You're late.

→ "Sorry, Captain."
  OSTROW: Don't be sorry. Be early next time. Sit.

→ "Nobody told me where the briefing room was."
  DUNNE: Second door on the left. Same as every ship ever built.
  OSTROW: Sit.

→ *Say nothing, and sit down.*
  *Ostrow watches you for a moment.*
  OSTROW: Good instinct.

OSTROW: For the new hand, then. There's a rule out here, older than any of us. The CSRA would stop us salvaging the old machines if it could, but it can't be everywhere. So we police ourselves. You can touch the AI. You can't wake it. And if one of us starts waking one, the rest of us go and stop them.

DUNNE: Before somebody with a bigger ship does it for us. And stops all of us while they're at it.

*Ostrow taps the chart. The dotted track brightens.*

OSTROW: Ilsa Corvane. Six weeks ago she pulled a full core out of a war-era hulk, and she didn't sell it. Since then her ship's been running quieter than any ship has a right to. And smarter.

OSTROW: I sailed under her for four years. Best captain I ever had. She taught me half of what I know, and I'd have followed her into a sun if she'd asked.

*A pause.*

OSTROW: So naturally, I'm the one they sent.

*Ostrow lets the silence sit, as if she's daring someone to fill it.*

**[Questions: the player may ask up to three, in any order. "That's enough" ends the questions early.]**

→ "Who sent you?"
  OSTROW: The patron's office.
  *She says it before you've quite finished asking.*
  DUNNE: That's all anyone ever says.
  OSTROW: That's all anyone ever needs to.
  [knows.patron_exists; clue.patron.0: she answers too fast]

→ "What's she trying to wake?"
  OSTROW: Ask her. I'd like to know too.
  DUNNE: Something that does her thinking for her.
  OSTROW: That's not a reason, Dunne. That's a symptom.
  [knows.corvane_waking]

→ "How good is her crew?"
  DUNNE: Small. Five, maybe. Corvane picks people nobody else would hire, and then they'd die for her.
  *A beat.*
  DUNNE: Some of them have.
  OSTROW: And there's an AI aboard now. She calls it Pell. Talks to it like it's crew.
  DUNNE: She always did want someone who'd never tell her no.
  [knows.pell_name]

→ "Why bring me?"
  OSTROW: Because you're on probation, and probation means you go where you're told. And you're told why, which is more than most people get.
  DUNNE: And because if it goes wrong, nobody's attached to you yet.
  OSTROW: Dunne.
  DUNNE: What? It's true.

→ "That's enough."

OSTROW: Here's how it goes. We find her first; that's the hunt, and you'll do what I tell you, when I tell you. Then we board. Three go across: Dunne, the new hand, and Ames.

DUNNE: Not you.

*Ostrow keeps her eyes on the chart.*

OSTROW: Not me. She'd talk me round. She always could.

*Ames looks up too quickly.*

AMES: Me, Captain?

OSTROW: You've been asking for six months.

AMES: Yes, Captain. I have.

*Ostrow slides a sidearm across the table. It stops in front of you.*

OSTROW: Probation's over for the day. Don't lose that.

OSTROW: One more thing. When you find her, she'll want to talk. She always does. Hear her out.

*She looks down at the chart, not at you.*

OSTROW: Then do what you have to.

→ "And if what I have to do is shoot her?"
  OSTROW: Then I'll hate you for a while. And I'll still buy you a drink.

→ "What if she's right?"
  *A long pause.*
  OSTROW: Then she's right. And you still bring me her ship.
  [seen.p1.what_if_right = true: Corvane's R5 mirror question references it]

→ "Understood."
  OSTROW: Good.

OSTROW: Stations.

*The room empties. In the corridor, Ames falls into step beside you. He waits until Dunne is out of earshot.*

AMES: Can I ask you something? What do you do when your hands shake?

→ "Mine shake too. You stop noticing after the first minute."
  *He laughs, once, quietly.*
  AMES: That's a lie, isn't it.
  → "Mostly."
  AMES: Thanks. Really.
  [ames.bond = 2]

→ "Keep them busy. Check your weapon. Then check it again."
  AMES: Check it again. Okay. I can do that.
  [ames.bond = 1]

→ "Ask Dunne."
  AMES: Right. Sorry.
  *He doesn't ask Dunne.*
  [ames.bond = 0]

*He unfastens the flap on his holster. Fastens it. Unfastens it again.*

AMES: Sorry. Habit.

*Up ahead, Dunne doesn't look back.*

**[→ P2: tutorial hunt]**

---
## Notes for the voice read
- Ostrow's tell: she says the hardest things while looking at the chart. She isn't boarding because she knows Corvane could talk her round (POV sheet).
- Dunne's slip ("Some of them have." / "someone who'd never tell her no") is his history leaking: he refused Corvane once and survived her scuttling. Paid off in P3 R4.
- Dunne gets the ugly truths ("nobody's attached to you yet"), so Ostrow can stay sympathetic.
- Ames gets one small, human question, asked away from the officers. Everything in P3 depends on the player having liked him.
- Every question costs nothing. The only state that matters later is `ames.bond`, `knows.patron_exists`, and whether the player asked "What if she's right?"
