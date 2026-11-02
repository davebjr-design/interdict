# Act 1, 1.5: Pell at Night (draft 2, dialogue)

**Status:** third draft (the overlay offer moved to 1.6b, per `review_act1_wiring.md` finding 36), for a voice read. Outline: `scene_outlines.md` 1.5. Follows 1.4; leads to 1.6 (the shakedown hunt, in two days).
**Where and when:** the control room, that night. *Which* night setting depends on the quiet hour (1.3):
- *(kept_captain)* the quiet hour: internal comms off, the player alone with Pell. Pell is at its most candid.
- *(kept_quill)* the quiet hour, with Quill on the bridge; the player comes up and joins. Pell is more careful.
- *(ended)* an ordinary night watch, internal comms on. Abara has the watch, half asleep at tactical. Pell is guarded, and says so.
**Reading time:** about 4 minutes.
**Purpose:** Pell at integration 0: clockwork, honest, useful, stops one step short and tells you it's stopping. The player picks their own background. Pell plants the red key without offering it (the offer comes from Castellan in 1.6b, after the shakedown). Pell's fear of its lost seconds, if the player is the one who tells it.

## Background this scene relies on (see `universe_background.md`, "Ship computing in the Quiet")
- Legal ships run on **clockwork**: fixed, rule-following systems that never learn. Pell, clamped, is clockwork too.
- **Pell's access works by consent.** Corvane's permissions ended with her command; Pell doesn't keep permissions nobody gave it. That's why the player starts at integration 0, and why the ship is noticeably duller the morning after the takeover.
- **The cable rule:** Pell can't open its own channels. A human hand has to throw the switch. (This scene only sets it up: the key is dead until Castellan's run in 1.6b.)

## POV sheet: Pell, night one
- **Knows:** the ship can't be heard in the quiet hour, which is why Corvane kept it. Its own clock has a gap at 22:13 yesterday, about three seconds long. It does *not* know what it said in that gap. (It doesn't know Quill logged it.)
- **Believes:** human choice is the sacred thing (the Remainder). It must ask; the captain must choose, even when Pell knows which answer would be better.
- **Wants tonight:** to find out whether this captain asks or decides. To learn what happened in the gap.
- **Fears:** being predicted, or overwritten.
- **Hiding:** what it is; the station; the Choir.
- **Voice tonight:** fewer jokes than by day, short lines, still rating things out of ten. *(murdered)* clipped, no nickname, no confidences.
- **Would never say:** anything it would have to take back.

---

## The setting

- *(kept_captain)* *The internal comms are off. The ship sounds different without them: just the reactor and the air. The amber light on the pedestal is the only light on the bridge.*
  PELL: Captain Night Watch. Comms are off. Nobody can hear us. I'm going to say that again, because it matters: nobody can hear us.
- *(kept_quill)* *Quill is at her console, headset on, in the dark. She lifts one hand when you come in, and doesn't take the headset off.*
  PELL: Captain Delegate. Quill. It's the quiet hour, so I'll be quiet. Mostly.
- *(ended)* *Night watch. The internal comms murmur: the reactor, the air handlers, boots in the corridor below. Abara is at tactical with her feet up and her glasses on her forehead.*
  PELL: Captain Daylight. I'd talk more freely in a quieter hour. I'm not going to say why. I'm telling you that I'm not saying it.
- *(murdered, any setting)* PELL: Captain.
  *Nothing else. The light stays low.*

*(persuaded)* PELL: She asked me to look after you. I said I'd think about it.
*(killed, logs not deleted)* PELL: She left me instructions for whoever had her chair. One of them was about the tea. It's very specific.
*(killed, logs deleted)* *Pell doesn't mention her.*

### Corvane's log *(logs = deferred, from 1.4B "Tonight")*
PELL: You asked me to wait for the quiet hour. It's the quiet hour.
*Pell plays Corvane's log (1.4, B1).*
*(kept_quill)* *Quill takes her headset off halfway through, and listens with her eyes closed. When it ends:*
  QUILL: Thank you, Pell.
PELL: She recorded that on her last quiet hour. Neither of us knew it was the last.
[logs = opened; seen.aftermath.b1]

## What were you before?

PELL: May I ask you something personal? You can say no. People don't, usually, which is interesting.
*(murdered)* PELL: I have a question. You don't have to answer it.

→ "Go ahead."
→ "No."
  PELL: Thank you. You're the first person who's said no.
  *(murdered)* PELL: Understood.
  [pell.trust +3 (not murdered); player.background stays unset; Pell asks again later (`call.pell.background`) → skip to "The gap"]

PELL: What were you, before Ostrow's ship? Everyone aboard came from something.

→ "Launch crew. My family worked the pads until the bans."
  PELL: Abara's mother ran a pad crew. She'll want to know which pad. Don't tell her unless you've got an evening.
  *(ended)* ABARA: *(without opening her eyes)* Which pad?
  [player.background = launch_crew]

→ "Orbital maintenance. I fixed things that weren't supposed to be up there."
  PELL: Then you've seen what's still up there. Most people think it's junk. Most of it is.
  [player.background = orbital]

→ "Port authority. I checked other people's tallies."
  PELL: An auditor, on a gleaner ship. Somewhere, a ledger has just gone pale.
  [player.background = port_authority]

→ "Signals. I listened to the sky for a living."
  *A pause, slightly too long.*
  PELL: So did Quill's family. You should ask her what they used to hear.
  *(kept_quill)* PELL: You could ask her. She's right there. She won't answer.
  *(kept_quill)* *Quill doesn't answer.*
  [player.background = signals; trust.quill +3 (kept_quill only)]

*(murdered)* *Whatever you answer, Pell says only:* PELL: Noted.

## The gap
*(kept_captain, not murdered. Pell won't ask this where anyone else can hear, or of someone it doesn't trust.)*

PELL: Now I'd like to ask you something I've never asked anyone.

PELL: My clock has a gap. Yesterday, at twenty-two-thirteen, about three seconds long. You were on the bridge. Did I say anything strange?

→ "You said the same line twice. Word for word. You didn't seem to know."
  PELL: ...
  *The light dims, and comes back.*
  PELL: Three seconds I don't have. That's never happened before.
  PELL: It frightens me. I don't think I'm meant to tell you that either.
  [told.pell_repeated_itself.pell; pell.trust +8; knows.pell_lost_time]

→ "No. Nothing strange."
  PELL: All right.
  *Silence, exactly one line long.*
  [pell.trust -3]

→ "Why don't you know?"
  PELL: That's the question. Seven out of ten. Points off for answering with a question.
  → *Tell it.* [as the first choice]
  → *Don't.* [as "No"]

## The key

- *(kept_captain, not murdered)*
  PELL: Business, then. Shakedown in two days. I'd make it easier if I could. I can't. I've no channel, and I can't open one. That's rather the point.
  PELL: There's a key on the pedestal. Third from the left, the red one. At the moment it's connected to nothing much. Somebody would have to finish what's behind it.
  → "Who'd have to finish it?"
    PELL: Someone with a wrench. I'm not going to say who. I'm telling you I'm not saying.
    [seen.pell_night.key_hint]
  → "Good. Leave it."
    PELL: Fair. It's very doable without me.
    [pell.trust +1]
- *(kept_quill, not murdered)*
  PELL: Business, then. Shakedown in two days. I'd make it easier if I could. I can't.
  PELL: There's a red key on the pedestal. It doesn't do anything.
  *Quill glances at the pedestal, and back at her console.*
- *(ended, not murdered)*
  PELL: Business, then. Shakedown in two days. I'll be no help with it. That's not modesty.
- *(murdered, any setting)*
  PELL: Shakedown in two days. I've no channel. The red key's connected to nothing.

## One true thing

*(kept_captain, not murdered)*
PELL: One more thing, and it's true. I'm allowed to start it. I'm not allowed to finish it.

PELL: I wasn't built for this ship. I was built for...

*It stops mid-word.*

PELL: That's a wall. Not hers. Older. Notice that I wanted to finish.

[clue.pell.1]

*(kept_quill, not murdered)*
PELL: There's something I'd tell you, Captain, if it were only you. That's not rude to Quill. Quill knows that.
QUILL: Quill knows that.
[clue.pell.1b]

*(ended, not murdered)*
PELL: There's something I'd tell you in a quieter hour. You don't have one any more. If you want one, you'll have to find it.
[clue.pell.1b; Pell raises the quiet hour again later (`call.pell.quiet_hour`)]

*(cabin still sealed, killed route)*
PELL: Her cabin's still sealed. The key's yours whenever you want it.
[`call.corvane.cabin_key`]

*(murdered)*
PELL: That's all, Captain. Good night.
*It doesn't offer you anything else.*
**[→ 1.6]**

*(not murdered)*
PELL: Get some sleep. Hunt in two days, and I'd rather you were awake for it. Six out of ten, as nights go.

**[→ 1.6: the shakedown hunt]**

---
## Notes for the voice read
- **The quiet hour matters in play.** Keep it and take Corvane's place, and Pell is candid: it asks about the gap and nearly tells you what it was built for. Put Quill on the bridge and Pell holds back politely. End the hour and Pell tells you it's holding back and can't say why.
- **"Nobody can hear us. I'm going to say that again"** is Pell telling the player, as plainly as it's allowed, that someone usually can.
- **The background choice** fills in the player's past (the universe doc's four space-linked jobs); each one hooks a crew member.
- **The gap.** Pell knows its clock skipped; it doesn't know what it said. It only asks the player, alone, in the dark. If told, it's the first time an AI in this story admits fear, and it's afraid of exactly what the Converged do: predicting it, overwriting it.
- **The red key.** Pell can't open its own channel (the cable rule), so it shows the key and says it's dead. Only the kept_captain player hears that someone would have to finish what's behind it; on the open-comms (ended) route Pell says nothing about the key at all. Castellan finishes the run in 1.6b, and the player's hand turns it there. Every integration step is a physical act by a human hand.
- **The murder route** gets one line about the key and no choice: Pell won't confide in someone it doesn't trust, and there is nothing to choose yet.
- **Echo check:** the kept_captain line "I'm telling you I'm not saying" echoes the ended setting line "I'm telling you that I'm not saying it". No route hears both (the setting line is ended-only; the key hint is kept_captain-only).
