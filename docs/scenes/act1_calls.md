# Act 1, 1.8: First Crew Calls (draft 1, five storylets)

**Status:** first dialogue draft. Outline: `scene_outlines.md` 1.8; storyboard 1.8. These are **storylets**: each fires on its own leg (legs 2-6 after the commission), picked by priority from the pool, at most one per leg and never the same officer twice in a row (`narrative_architecture.md` 2.3). Order varies by play.
**Each call:** one officer, their stage-1 hook, a choice, and an arc step. Short: 1-2 minutes each.
**Variant tags:** as before. Header fields match `data/narrative/calls.csv`.

---

## call.dace.burn_1: "Hold still. No, really."
```
speaker: dace   seat: thermal   needs: act>=1, leg>=2   priority: 70   once
summary: Castellan's hurt; Dace wants Pell's help to treat him.
effects: arc.dace=1, integration (+3 if allowed), trust.dace, trust.castellan
```
**POV.** *Dace:* has a real patient for the first time aboard, and a better tool he isn't supposed to use. *Wants:* permission, not forgiveness, this time. *Castellan:* hurts, jokes, and doesn't want "the machine" anywhere near him (an Instrumentalist with a secret about machines). *Pell:* will only help if asked, and only through a channel a human opens.

*The thermal bay. Castellan is sitting on a crate with his hand wrapped in a wet towel, making jokes nobody laughs at.*
- *(manifold patched in 1.2d)* *He burned it welding the manifold.*
- *(manifold left)* *A coolant line let go next to the crack he's been watching.*

DACE: Second-degree, palm and two fingers. I can treat it. I can treat it *better* if Pell models the tissue response and tells me how to dress it. It's a channel to the medical bay. You'd have to open it.
CASTELLAN: Doc, I like you fine, but I don't want the box doing arithmetic on my hand.
DACE: The box is better at this arithmetic than I am. *(beat)* I don't love saying that.
PELL: I'd be glad to help. I'd also be glad not to. It's your hand, Castellan, and your call, Captain.

→ "Open the channel. Help him, Pell."
  *Dace turns the key himself, quickly, before anyone can change their mind.*
  DACE: Thank you. You've no idea. Well, you might.
  CASTELLAN: *(watching his hand being dressed)* ...Huh. That's better. Don't tell anybody.
  [integration +3; arc.dace=1; trust.dace +8; trust.castellan −1; Castellan's hand heals before the next hunt]
→ "Treat him by hand, Doctor."
  DACE: *(a flicker at "Doctor")* By hand. Yes. Of course.
  *He's good. It takes longer.*
  [arc.dace=1; trust.dace −3 (+2 instead if command.style < 35: he expected it); trust.castellan +2; engineering −1 for two legs]
→ "Castellan, it's your hand. You choose."
  CASTELLAN: *(a long look at Dace)* ...Go on, then. Let the box have a go.
  [as the first choice, but trust.castellan +2 and command.style +2]

---

## call.castellan.manifold_1: "Not today."
```
speaker: castellan   seat: engineering   needs: act>=1, leg>=3, not seen.call.castellan.manifold_1   priority: 65   once
summary: The manifold crack is growing; Castellan won't let anyone near the second panel.
effects: arc.castellan=1, clue.castellan.1, trust.castellan, command.style
```
**POV.** *Castellan:* the crack is real and getting worse, and fixing it properly means working right next to the panel. *Wants:* to do it alone. *Fears:* anyone else's hands near those welds. His temper flares and burns out in a minute; then he's ashamed of it.

*Engineering. Abara is standing in the hatch with a welding mask. Castellan is between her and the tanks.*

ABARA: Crack's grown a centimetre. He's been on it twelve hours. I offered to take a shift.
CASTELLAN: And I said no, thank you, kindly, ma'am.
ABARA: You said something.
CASTELLAN: *(to you)* It's a one-man job, Captain. Tight space. I know her.

→ "Let Abara take a shift. That's an order."
  CASTELLAN: *(too loud)* It is *not* a two-person— *(He stops. Breathes.)* Aye. Fine. Give me ten minutes to clear my gear.
  *When Abara goes in, there's a tarp over the second panel that wasn't there an hour ago.*
  [command.style −3; trust.castellan −4; trust.abara +2; clue.castellan.1]
→ "Do it your way. Tell me if you need anyone."
  CASTELLAN: Thank you. I mean it.
  [trust.castellan +3; trust.abara −1; clue.castellan.1]
→ *(seen.castellan.hook1)* "This is about the other panel, isn't it?"
  *For a second his face does something complicated. Then the temper goes out of him all at once.*
  CASTELLAN: I'll tell you. I swear I will. Not today.
  [arc.castellan=1; trust.castellan +2; clue.castellan.1]

---

## call.abara.six_1: "Their names."
```
speaker: abara   seat: tactical_nav   needs: act>=1, leg>=2   priority: 68   once
summary: Corvane paid the families of the six every quarter. The payment is due.
effects: arc.abara=1, trust.abara, money, knows.the_six (if asked)
```
**POV.** *Abara:* has made Corvane's quarterly payments to the six families herself for two years. *Wants:* to know whether this captain will keep a promise they didn't make. *Hides:* that she sent the money with letters, under her own name. *Would never say:* that she'd keep paying out of her own share if the captain says no. (She would.)

*Night watch. Abara has a ledger open on the chart table: paper, her handwriting.*

ABARA: Something you should know about. When she scuttled the old ship, six didn't make the boats. She paid their families every quarter after. Out of the ship's share. I sent it. Quarter's due.

→ "Keep paying."
  ABARA: All right.
  *She closes the ledger, and her hand stays on it for a moment.*
  [arc.abara=1; trust.abara +6; ship funds −]
→ "Keep paying. And tell me their names."
  *She reads them out. It takes a while, because she says something about each one. Two of them, she says, were Dunne's.*
  [arc.abara=1; trust.abara +8; knows.the_six; ship funds −]
→ "We can't afford it."
  ABARA: No. I don't suppose we can.
  *She doesn't argue. She doesn't close the ledger either.*
  [arc.abara=1; trust.abara −6]

*(if knows.abara_grandfather_message, after any choice)*
→ "Corvane asked me to tell you something. Your grandfather wasn't lying."
  *Abara takes off her glasses.*
  ABARA: He told everyone it talked to him. The module. They took his pension for it in the end, said his mind had gone.
  ABARA: Fourteen years, and she never once said that to me.
  *She puts the glasses back on. Her voice is perfectly level.*
  ABARA: I'll show you the box. Not tonight.
  [promise.abara_message kept; trust.abara +5; arc.abara=2; seen.abara.module_mentioned]

---

## call.fenwick.crate_1: "A counting error."
```
speaker: fenwick   seat: quartermaster   needs: act>=1, leg>=3   priority: 60   once
summary: After a resupply stop, the cargo count is off by one crate.
effects: arc.fenwick (1 if trust.fenwick>=50 and pressed gently), clue.fenwick.1, tally, command.style
```
**POV.** *Fenwick:* dropped a crate of rations at a buoy for a settlement that will collect it next week. *Wants:* the captain to not look too hard, and to like him anyway. *Fears:* a captain who logs it.

*The hold, after a stop at a resupply buoy. The manifest says forty-one crates. You count forty.*
- *(player.background = port_authority)* *You counted twice before you noticed you were doing it. Old habit.*

FENWICK: Counting error! Mine. I can't count past twelve before lunch. Ask anyone.

→ "Fine. Fix the manifest."
  FENWICK: Already done. You're a prince. A princess. A captain. Whichever's the compliment.
  [trust.fenwick +4; clue.fenwick.1]
→ "Fen. Where did it go?"
  *The cheer goes out of his face, just for a second.*
  - *(trust.fenwick ≥ 50)* FENWICK: Somewhere it was needed, Captain. Can we leave it there for now? I'll tell you. I'd like to tell you.
    [arc.fenwick=1; trust.fenwick +2; clue.fenwick.1]
  - *(lower)* FENWICK: Overboard! Joking. Joking. It'll turn up.
    [clue.fenwick.1]
→ "Log it as missing. It goes in the Tally."
  FENWICK: *(quietly)* Of course. It's the rules.
  *He doesn't make a joke for the rest of the day.*
  [command.style −3; tally.declared +1; trust.fenwick −6; trust.quill +2]

---

## call.quill.listen_1: "For calibration."
```
speaker: quill   seat: sensors_ecm   needs: act>=1, leg>=2   priority: 66   once
summary: Quill asks for a long passive listen during transit, "for calibration."
effects: arc.quill=1, trust.quill, sets up 1.9
```
**POV.** *Quill:* the decoy's turn (1.6) happened on the same band her signals live on. *Wants:* eight unbroken hours listening on the old deep-space band, without explaining why. *Fears:* explaining why. *Would never say:* "I think it's the same thing."

*Quill comes to you, which she doesn't do. She has a written request on a slate, which she does.*

- *(seen.shakedown.quill_assigned, from "find out what happened" in 1.6)* QUILL: You asked me to find out what happened with the drone. I'm finding out. I need listening time.
- *(otherwise)* QUILL: Captain. I'd like eight hours of passive listening on the next transit. For calibration.

QUILL: It adds six minutes to the leg. I've done the arithmetic.
- *(quiet_hour kept_quill)* QUILL: Or I can do most of it in the quiet hour. Nobody's using the band then.

→ "Approved."
  QUILL: Thank you, Captain.
  [arc.quill=1; trust.quill +4; hunt effect: transit +6:00 (none if kept_quill); → 1.9 can fire]
→ "Calibration of what?"
  QUILL: Noise.
  *A pause.*
  - *(player.background = signals)* *You glance at her slate. She's asking for the old deep-space band: the one nobody has used since the Quiet.* → "That's the old deep-space band." *Quill looks at you as if seeing you for the first time.* QUILL: Yes. It is. [trust.quill +5; seen.quill.band_recognised]
  → "Approved." [as above]
  → "Not this leg." [as below]
→ "Not this leg."
  QUILL: Understood.
  *She files the slate. You have a feeling it isn't the last you'll see of it.*
  [trust.quill −2; the call returns in two legs]

---
## Notes
- **Each call moves one arc to stage 1** (two if the earlier scenes primed it: Abara's message, Quill's investigation) and logs its hook as a clue.
- **Command style and trust pull against each other** here exactly as the command model says: ordering Abara in is tight and costs Castellan; letting Castellan choose is loose and earns him.
- **Integration moves only by a human hand:** Dace turns the medical key himself.
- **The player's background pays off** twice (Port authority counts crates twice; Signals recognises Quill's band).
