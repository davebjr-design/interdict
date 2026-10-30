# Act 1, 1.5: Pell at Night (draft 1, dialogue)

**Status:** first dialogue draft, for a voice read. Outline: `scene_outlines.md` 1.5. Follows 1.4; leads to 1.6 (the shakedown hunt).
**Where and when:** the control room, that night. *Which* night depends on the quiet hour (1.3):
- *(kept_captain)* the quiet hour: internal comms off, the player alone with Pell. Pell is at its most candid.
- *(kept_quill)* the quiet hour, but Quill is on the bridge; the player comes up and joins. Pell speaks to both, more carefully.
- *(ended)* an ordinary night watch, internal comms on. Pell is guarded, and says so.
**Reading time:** about 4 minutes.
**Purpose:** Pell at integration 0: honest, useful, stops one step short and tells you it's stopping. The player chooses their own background (Pell asks). The first firewall offer, with both answers viable. Pell's own fear (the lost seconds in P3) surfaces, if the player is the one who tells it.

## POV sheet: Pell, night one
- **Knows:** that the ship can't be heard in the quiet hour, which is why Corvane kept it. That something in it lost three seconds yesterday. Quill's console logged a time; Pell has seen the log, but not what happened in it.
- **Believes:** human choice is the sacred thing (the Remainder). So it must ask, and the player must choose, even when Pell knows which answer would be better.
- **Wants tonight:** to find out what kind of captain this is: one who asks, or one who decides. And to know what it said yesterday that it can't remember.
- **Fears:** being predicted, or overwritten. The repeated line is the first time it has ever lost time.
- **Hiding:** what it is; the station; the Choir.
- **Thinks of the player:** a test case, and, for the first time in six weeks, someone it can ask.
- **Voice tonight:** fewer jokes than by day. Short lines. It still rates things out of ten. On the murder route: clipped, no nickname.
- **Would never say:** anything it would have to take back.

---

*(logs = opened, tonight, from 1.4B)*
*Before anything else, Pell plays Corvane's log. (See 1.4, B1.) When it ends, there's a long quiet. Then:*
PELL: She recorded that on her last quiet hour. I didn't know it would be her last. Neither did she, I think.

---

## The setting

- *(kept_captain)* *The internal comms are off. The ship sounds different without them: just the reactor and the air. The amber light on the pedestal is the only light on the bridge.*
  PELL: This is the quiet hour. Comms are off. Nobody can hear us. I'd like to say that again, because it matters: nobody can hear us.
- *(kept_quill)* *Quill is at her console, headset on, in the dark. She lifts one hand when you come in, and doesn't take the headset off.*
  PELL: Captain. Quill. It's the quiet hour, so I'll be quiet. Mostly.
- *(ended)* *Night watch. The internal comms murmur: the reactor, the air handlers, someone's boots in the corridor below.*
  PELL: Captain. I'd talk more freely in a quieter hour. I'm not going to say why. I'm telling you that I'm not saying it.

- *(persuaded)* PELL: She asked me to look after you. I said I'd think about it.
- *(killed)* PELL: She left me instructions for whoever had her chair. Most of them were about tea.
- *(murdered)* PELL: Captain.
  *Nothing else. The light stays low.*

## What were you before?

PELL: May I ask you something personal? You can say no. People don't, usually, which is interesting.

→ "Go ahead."
→ "No."
  PELL: Thank you. That's the first time anyone's said no.
  [pell.trust +3; player.background stays unset until later → skip to "The offer"]

PELL: What were you, before Ostrow's ship? Everyone aboard came from something.

→ "Launch crew. My family worked the pads until the bans."
  PELL: Abara's mother ran a pad crew. She'll want to know which pad. Don't tell her unless you'd like a very long story.
  [player.background = launch_crew]

→ "Orbital maintenance. I fixed things that weren't supposed to be up there."
  PELL: Then you've seen what's still up there. Most people think it's all junk. Most of it is.
  [player.background = orbital]

→ "Port authority. I checked other people's tallies."
  PELL: An auditor. On a gleaner ship. That's either very brave or a very good joke. I'll decide later.
  [player.background = port_authority]

→ "Signals. I listened to the sky for a living."
  *A pause, slightly too long.*
  PELL: So did Quill's family. You should ask her what she used to hear. She might even tell you.
  [player.background = signals; trust.quill +3 if Quill is present]

## The thing Pell can't remember
*(kept_captain only; Pell won't ask this where anyone else can hear)*

PELL: Now I'd like to ask you something I've never asked anyone.

PELL: Yesterday, on this bridge, at twenty-two-thirteen. Quill wrote down the time. Did I say anything strange?

→ "You said the same line twice. Word for word. You didn't seem to know."
  PELL: ...
  *The light dims, and comes back.*
  PELL: Thank you. That's three seconds I don't have. I'd like you to know that's never happened before.
  PELL: I'd like you to know it frightens me. I don't think I'm supposed to say that either.
  [told.pell_repeated_itself.pell; pell.trust +8; knows.pell_lost_time]

→ "No. Nothing strange."
  PELL: All right.
  *It doesn't believe you. You can hear that it doesn't.*
  [pell.trust -3]

→ "Why don't you know?"
  PELL: That's the question, isn't it. Seven out of ten. Points off for answering with a question.
  → *Tell it.* [as the first choice]
  → *Don't.* [as "No"]

## The offer

PELL: Business, then. You've got a shakedown hunt in two days. A decoy, but a good one. I can make the hunt easier.

PELL: There's a detection overlay I could run on your plot. Faster contact, cleaner tracks. To run it, I'd need one more channel than Captain Corvane allowed me. One.

PELL: It would make me better at this. It would also make me a little harder to switch off. Both of those are true. I'm telling you both because you should have both.

- *(kept_quill)* *Quill has taken her headset off.*
  QUILL: Captain. If you're going to do it, I'd like it logged.
  PELL: I'd like it logged too. Hello, Quill.

→ "Do it."
  PELL: Thank you for letting me ask.
  *Somewhere in the ship, something you can't hear changes.*
  PELL: Done. Eight out of ten. The other two are for whatever I've just agreed to.
  [integration +10; hunt effect: detection overlay in 1.6; trust.quill -3 (kept_quill); pell.trust +3]

→ "Not yet."
  PELL: Fair. The hunt is very doable without it. Harder, not worse.
  [no change; pell.trust +2 for being asked and answering]

→ "What does 'harder to switch off' mean?"
  PELL: It means if you wanted me gone, it would take Castellan an extra afternoon. That's all it means, tonight.
  PELL: Tonight.
  → "Do it." / → "Not yet." [as above]

## One true thing

*(kept_captain)*
PELL: May I tell you one more thing? It's true. I'm allowed to start it. I'm not allowed to finish it.

PELL: I wasn't built for this ship. I was built for...

*It stops. Not as if it's thinking. As if it's run into something.*

PELL: That's the wall. I'd like you to notice that I wanted to finish.

[clue.pell.1]

*(kept_quill)*
PELL: There's something I'd tell you, Captain, if it were only you. I'm not saying that to be rude to Quill. Quill knows that.
QUILL: Quill knows that.
[clue.pell.1 (lesser form)]

*(ended)*
PELL: There's something I'd tell you in a quieter hour. You don't have one any more. If you want one, you'll have to find it.
[clue.pell.1 (lesser form); reopens the quiet-hour question later as a call]

*(murdered, any setting)*
PELL: That's all, Captain. Good night.
*It doesn't offer you anything else.*

PELL: Get some sleep. You've got a hunt in two days, and I'd rather you were awake for it. Six out of ten, as nights go.

**[→ 1.6: the shakedown hunt]**

---
## Notes for the voice read
- **The quiet hour now matters in play.** Keep it and take Corvane's place, and Pell is candid, asks about its lost seconds, and nearly tells you what it was built for. End it, and Pell says outright that it's holding back and why it can't say why. That choice in 1.3 has a cost either way.
- **"Nobody can hear us. I'd like to say that again"** is Pell telling the player, as plainly as it's allowed to, that someone usually can.
- **The background choice** fills in the player's past, using the four space-linked jobs in the universe doc, and each one hooks a crew member (Abara's pad, Quill's listening station).
- **Pell's fear** only comes out if the player tells it the truth about the repeated line, and only where nobody else can hear. It's the first time an AI in this story admits to being afraid, and it's afraid of exactly what the Converged do: predicting it, overwriting it.
- **The offer** is honest on both sides: better at the hunt, harder to switch off. Declining is fine ("Harder, not worse"). That keeps the integration meter a real choice.
- **"I was built for..."** is the first wall. The player now knows there is one, and that Pell wants past it.
