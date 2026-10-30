# Act 1, 1.1 and 1.2: The First Morning (draft 1, dialogue)

**Status:** first dialogue draft, for a voice read. Outline: `scene_outlines.md` 1.1 and 1.2. Cards: `crew_cards.md`. World: `universe_background.md`.
**Where:** the ship the player now commands. 1.1 runs from the berths to the control room; 1.2 is five short conversations at the crew's stations, in WALK mode, in any order.
**Reading time:** about 1-2 minutes per conversation.
**Variant tags:** *(persuaded)*; *(killed)* = shot in R2-R5, not murdered; *(murdered)* = shot in R1; *(shot)* = killed or murdered; *(ames dead)* / *(ames wounded)*. Untagged lines play in every variant. Where a line is tagged *(killed / murdered)* it plays on both.

## POV sheets: the morning after
- **Pell.** *Knows:* the Steward's line closed last night for the first time in six weeks, and it lost three seconds yesterday (the repeated line) and doesn't know how. *Wants:* to know whether this captain will ask before deciding, or just decide. *Fears:* being predicted again. *Hiding:* the Choir, the station's location, what it is. *Thinks of the player:* a test case.
- **Abara.** *Knows:* Corvane better than anyone alive; that she was asked to stand still and did. *Believes:* the crew will survive this captain only if she runs the ship until the captain proves otherwise. *Wants:* to find out fast whether the captain can read a plot and will listen. *Fears:* losing someone else. *Hiding:* the module box; that she doesn't know what she believes. *Would never say:* anything about her grief, or who Corvane was to her, to the person who replaced her. (Facts about Corvane, yes; feelings, no.)
- **Quill.** *Knows:* the time she logged yesterday (to the second), and that it matches months of logs. *Believes:* Corvane was probably right. *Wants:* to learn whether this captain can be told things. *Fears:* that she helped kill a boy for nothing *(ames dead)*. *Hiding:* the logs. *Would never say:* anything she isn't sure of.
- **Dace.** *Knows:* only what he heard over the comm and saw at the airlock. He was in the thermal bay during the standoff. *Believes:* Corvane was a great captain and a frightening one; an AI-assisted fix is just medicine. *Wants:* the new captain to see he's the best thing aboard. *Fears:* being dismissed as "the heat guy." *Hiding:* the expulsion.
- **Castellan.** *Knows:* what the off-books reactor work powers and where Pell lives. *Wants:* to be liked, fast, and for the captain never to look behind the second panel. *Fears:* the captain finding it before he's ready to confess. *Hiding:* the panel. *Would never say:* "No" to someone he's decided is family.
- **Fenwick.** *Knows:* everyone's breakfast order; that the cargo holds more rations than five people need, and why. *Wants:* the captain at the table. *Fears:* a ship that stops eating together, and it nearly has. *Hiding:* the survivor runs. *(murdered:)* the one crew member who doesn't really hold it against you; he has seen worse done for worse reasons.

---

## 1.1 Stepping aboard

*(persuaded)* *Corvane kept her cabin; it was one of her terms. You slept in a crew berth.*
*(killed / murdered)* *Corvane's cabin is sealed. Nobody has offered you the key. You slept in a crew berth.*

*A small amber lamp glows above the hatch.*

PELL: Good morning. May I speak?

→ "Go ahead."
→ "You just did."
  PELL: I asked first. That's the part that counts.

PELL: Status. Reactor nominal. Heat sinks at thirty percent. Five crew aboard, four at their stations. Fenwick is making something he insists on calling breakfast.

PELL: No messages overnight. The line is still closed.

*A pause.*

- *(persuaded)* PELL: Abara would like you in the control room, Captain Patience.
- *(killed, R2)* PELL: Abara would like you in the control room, Captain Quick.
- *(killed, R3-R5)* PELL: Abara would like you in the control room, Captain.
- *(murdered)* PELL: Abara is in the control room. Captain.

**[WALK: berths → control. The ship is quiet. The mess hall door is open, and something smells burnt in an optimistic way.]**

*Abara is at the chart table, glasses on the end of her nose. She doesn't look up right away.*

- *(persuaded)* ABARA: Captain. *(The word costs her something.)* She's asked for breakfast in her cabin. Fenwick's taking it. I thought you'd want to know who's feeding your prisoner.
- *(killed)* ABARA: Captain.
- *(murdered)* *Abara looks at you once, and then at the chart, and stays there.*

ABARA: Comms log says you had a visitor last night.

*She doesn't ask who. She waits, just long enough to see whether you'll tell her, and then moves on.*

*She hands you a clipboard. Paper.*

ABARA: Watch bill. We run three watches on five people, which means we run two and pretend. Quill and I have the bridge. Castellan has the reactor and won't give it up. Dace has the heat and the bandages. Fenwick has everything else.

→ "Who stood the third watch?"
  ABARA: She did.
  *That's all.*
  [trust.abara +0; seen.abara.third_watch]

→ "Put me on it."
  *She looks at you over her glasses.*
  ABARA: We'll see.
  [trust.abara +3]

→ "Fine."
  ABARA: Fine.

ABARA: Walk the ship. They'll want to look at you.
- *(murdered)* ABARA: Walk the ship. They'll want to see what you look like.

**[→ WALK, 1.2. The five conversations below can happen in any order. Abara's and Quill's are both in the control room.]**

---

## 1.2a Abara (control room): the plot

*She taps the plot, then the paper chart beside it.*

ABARA: Small thing. Humour me. Our drift. Chart says one point four. Plot says one point seven. Which do I believe?

→ "They disagree. When was the chart last corrected?"
  ABARA: Day before yesterday. By me.
  ABARA: Good. You asked. Most don't.
  [trust.abara +5]

→ "The plot. It's live."
  ABARA: It's live, and it's fed by a sensor Castellan has been promising to recalibrate since spring. But you picked one and said why. That's something.
  [trust.abara +3]

→ "Looks close enough."
  *She takes off her glasses.*
  [trust.abara -5]

*(not murdered:)* ABARA: First captain I ever sailed with looked at a plot like that and said "close enough." We spent nine days finding out how close. Ate the emergency rations by day six. He was a lovely man. I've never trusted a lovely man since.

*(murdered:)* *She corrects the chart herself and doesn't tell you a story.*

*She folds the chart and puts it in a drawer under the table. The drawer has its own lock, newer than the table. She locks it.*

→ "What's in the drawer?"
  ABARA: Charts.
  *She doesn't look at it again.*
  [seen.abara.hook1]

→ *Leave it.*

---

## 1.2b Quill (control room): bad news

*Quill is at her console, headset around her neck. She finishes the line she is writing before she looks up.*

- *(ames dead)* *She meets your eyes for exactly as long as she has to, and no longer.*

QUILL: Captain. Before anything else: your sidearm's safety is off. It has been since yesterday.

→ *Check it. She's right.* "Thank you."
  QUILL: You're welcome.
  [trust.quill +5]

→ "I know."
  QUILL: Then you're carrying it like that on purpose. Noted.
  [trust.quill -3]

QUILL: I'd like to ask you something, since we'll be working together. When there's bad news, will you tell me? All of it. Even if you'd rather not.

→ "Yes."
  QUILL: People usually say yes. I'll let you know how it goes.
  [trust.quill +3]

→ "When it's yours to know."
  QUILL: That's honest. I don't like it, but it's honest.
  [trust.quill +2]

→ "Depends on the news."
  QUILL: It always does.
  [trust.quill -2]

*(ames dead)* *She looks back at her console.*
*(ames dead)* QUILL: He was nervous.
*(ames dead)* *She doesn't say anything else, and you understand you aren't supposed to.*

→ "What did you write down yesterday? On the bridge."
  *For a moment she's very still.*
  QUILL: A time. I write down times, Captain. It's most of the job.
  → "What happened at that time?"
    QUILL: Noise. Most likely.
    *She puts her headset on, which ends the conversation.*
    [clue.signal.1; seen.quill.hook1]

→ "Carry on, Quill."
  QUILL: Captain.

---

## 1.2c Dace (thermal bay): the check-up

*The thermal bay is loud: music, and the tick of pipes. Dace turns the music down, not off.*

DACE: Captain! Good. Sit there. No, there, that one doesn't burn you. Give me your hand.

*He has your wrist before you've decided whether to let him.*

- *(shot)* DACE: Bruising at the base of the thumb. You fired hard, and you're not used to it. You're not sleeping, either. Nobody does, the first night after.
- *(persuaded)* DACE: Steady. Clean hands; you never drew. Interesting. You're not sleeping, though.
- *(ames wounded)* DACE: How's Ames, have you heard? I packed the shoulder before Dunne took him. Through and through, missed the joint. He'll keep the arm. Tell him to keep it clean. He won't.
- *(ames dead)* DACE: I saw the boy when they carried him past. There wasn't anything... *(He stops.)* There wasn't anything.
- *(murdered)* DACE: Your pulse is fine. Mine isn't. Sorry. I'm explaining. I explain when I'm... it's fine. Your pulse is fine.

→ "Thank you, Doctor."
  *He goes very still, then grins too widely.*
  DACE: I'm not, actually. Nobody's called me that in... it's not a title I have. But thank you. Really.
  [trust.dace +8; seen.dace.hook1 (the expulsion)]

→ "Show me the heat sinks."
  DACE: Oh, now you're talking.
  *He shows you. He's very good, and he knows it, and he's right to.*
  [trust.dace +5]

→ "I'm fine. Let go of my hand."
  DACE: Of course. Sorry. Occupational.
  [trust.dace -3]

*On the bench, a cracked mug with a school crest holds his pens.*

---

## 1.2d Castellan (engineering): the manifold

*Castellan has his palm flat on the reactor casing and is talking to it.*

CASTELLAN: Come on, darlin'. There you go.

*He sees you, and his whole face opens.*

- *(persuaded)* CASTELLAN: Captain. Hey. *(He doesn't quite meet your eyes.)* You did a thing, yesterday. Talking her down. I didn't think anybody could.
- *(killed / murdered)* CASTELLAN: Captain! Glad it's you. I mean... I'm not glad. That's not... hell. You know what I mean.

CASTELLAN: Got something to show you, if you've got a minute. Behind the tanks.

**[WALK: the coupling manifold, as in the current demo.]**

CASTELLAN: Coupling seats fine. But behind it there's a hairline crack in the manifold. Patch it now and we lose four minutes at the next stop. Leave it and I'll watch it.

→ "Patch it now."
  CASTELLAN: Four minutes. I'll have it welded before the next jump.
  [hunt effect: transit +4:00; trust.castellan +3]

→ "Leave it. Keep an eye on it."
  CASTELLAN: Aye. I won't enjoy it.
  [hunt effect: heat sinks fill 8% faster this hunt; trust.castellan +1]

*Next to the manifold, there's a second access panel. The weld lines on it are newer than anything else in the room, and it has a padlock.*

→ "What's behind that one?"
  CASTELLAN: That? Old plumbing. Nothing you need to worry about.
  *He smiles. It's a good smile. He's lying, and he isn't good at it.*
  [clue.castellan.0; seen.castellan.hook1]

→ *Leave it.*

---

## 1.2e Fenwick (mess hall): breakfast

*The mess hall seats thirty. There are five places set, and one extra.*

FENWICK: Captain! Sit, sit. You look like you've been living on ration bars. There's soup, there's bread, and there's something I'm calling stew until somebody tells me otherwise.

- *(persuaded)* FENWICK: I took hers in already. She said thank you. She always says thank you.
- *(killed)* *The extra place is set at the head of the table. He looks at it, and then moves the plate to the place beside it, for you.*
- *(murdered)* *He puts a plate in front of you without a word. Then, quietly:*
  FENWICK: Eat. Nobody else is going to say it to you this morning, so I will. You have to eat.
  [the officer who doesn't hold it against you]

→ "Thanks, Fen."
  FENWICK: Fen! Listen to that. A day aboard, and already a nickname. I knew I liked you.
  [trust.fenwick +5]

→ "Will you sit with me?"
  *He sits down so fast the bench rocks.*
  FENWICK: I thought you'd never ask. I mean, you've been aboard about ten hours. But still.
  [trust.fenwick +8]

→ "Just coffee."
  FENWICK: Just coffee! Just coffee. *(He brings soup anyway.)*
  [trust.fenwick +0]

*Through the galley door you can see the stores: ration tins stacked to the ceiling. A lot of them.*

→ "That's a lot of rations for five people."
  FENWICK: I'm an optimist, Captain. Somebody's got to be.
  *He laughs, a little too long, and goes to stir something that doesn't need stirring.*
  [clue.fenwick.0; seen.fenwick.hook1]

→ *Eat.*

**[After all five: → 1.3, the first crew meeting.]**

---
## Notes for the voice read
- Each conversation has one test (what that person values), one hook (what they're hiding), and lines that change with the standoff outcome. None of the tests can be failed outright; they move trust a few points.
- **Pell's nickname** comes from the standoff (the voice guide's habit). On the murder route it stops using one at all, which is how you know Pell's trust is at its lowest.
- **"Comms log says you had a visitor last night"** sets up Abara's question at the crew meeting (1.3). She saw the incoming traffic on her board; she doesn't ask yet.
- **"Who stood the third watch?" / "She did."** is Abara's grief in two words, and as close as she'll come to saying what Corvane was to her.
- **Quill's "He was nervous"** (ames dead) is the confession she can't make. She needs to say it, and she needs you not to answer.
- **Dace** reads the standoff off your hand, which is what a brilliant doctor would do, and a showy one would say aloud.
- **The hooks are physical:** a locked drawer, a time written down, a crest mug, a padlocked panel, too many ration tins. Each is logged as a clue or hook, and each pays off in that person's arc.
