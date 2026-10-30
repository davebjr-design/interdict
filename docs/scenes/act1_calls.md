# Act 1, 1.8: First Crew Calls (draft 2, five storylets)

**Status:** second draft (continuity pass applied). Outline: `scene_outlines.md` 1.8. These are **storylets**: each fires on its own leg after the commission (Day 4 on), picked by priority from the pool, at most one per leg, never the same officer twice in a row, and never the Dace and Castellan calls on back-to-back legs (Castellan is the patient in one and the welder in the other). Order varies by play (`narrative_architecture.md` 2.3).
**Rule:** each call *offers* its officer's stage-1 arc step; some branches withhold it (noted per call). Header fields match `data/narrative/calls.csv`.
**Variant tags:** as before. *(murdered)* lines follow the register of earlier scenes: Abara terse, Pell clipped.

---

## call.dace.burn_1: "Hold still. No, really."
```
speaker: dace   seat: thermal   needs: act>=1, leg>=2   priority: 70   cooldown: 0   once
summary: Castellan's hurt; Dace wants Pell's help to treat him.
effects: arc.dace=1, integration +3 (if allowed), trust.dace, trust.castellan, command.style (+2 option 3)
callbacks: call.castellan.manifold_1 (one-handed variant)
```
**POV.** *Dace:* the first real patient under this captain (he packed Ames's shoulder at the airlock, if Ames lived, but that was Ostrow's man), and a better tool he isn't supposed to use. *Wants:* permission, not forgiveness, this time. *Castellan:* hurts, jokes, and doesn't want "the machine" near him (an Instrumentalist with a secret about machines). *Pell:* will help only if asked, and only through a line a human runs.

*The thermal bay. Castellan is sitting on a crate with his right hand wrapped in a wet towel, making jokes nobody laughs at.*
- *(seen.castellan.manifold_patched)* *He burned it welding the manifold patch. Right across the old scar on his palm.*
- *(otherwise)* *A coolant line let go next to the crack he's been watching. Right across the old scar on his palm.*

DACE: Second-degree, palm and two fingers. I can treat it. I can treat it *better* if Pell models the tissue and tells me how to dress it. I'd need to run a line from the sickbay panel to Pell. On your word.
CASTELLAN: Doc, I like you fine, but I don't want the box doing arithmetic on my hand.
DACE: The box is better at this arithmetic than I am. *(beat)* I don't love saying that.
- *(not murdered)* PELL: I can halve the healing time. I can also stay out of it. Your hand, Castellan. Your call, Captain.
- *(murdered)* PELL: Available if asked.

→ "Run the line. Help him, Pell."
  *Dace runs the line himself, fast, before anyone can change their mind.*
  DACE: Thank you. You've no idea. Well, you might.
  CASTELLAN: *(watching his hand being dressed)* ...Huh. That's better. Don't tell anybody.
  [integration +3; arc.dace=1; trust.dace +8; trust.castellan −1; hand heals before the next hunt]
→ "Treat him by hand."
  - *(seen.dace.hook1: you've called him Doctor before)* DACE: By hand. Yes. Of course. *(No flicker this time; just a nod.)*
  - *(otherwise)* DACE: By hand. Yes. Of course.
  *He's good. It takes longer.*
  [arc.dace=1; trust.dace −3 (0 if command.style < 35: he expected it); trust.castellan +2; hunt effect: engineering −1 for two legs]
→ "Castellan, it's your hand. You choose."
  CASTELLAN: *(a long look at Dace)* ...Go on, then. Let the box have a go.
  [as the first choice, with trust.castellan +2 instead of −1; command.style +2]

---

## call.castellan.manifold_1: "Not today."
```
speaker: castellan   seat: engineering   needs: act>=1, leg>=3   priority: 65   cooldown: 0   once
summary: The manifold crack is growing; Castellan won't let anyone near the second panel.
effects: clue.castellan.1, trust.castellan, trust.abara, command.style, arc.castellan=1 (option 3, trust.castellan>=55 only)
callbacks: arc.castellan stage 2 (the confession)
```
**POV.** *Castellan:* the crack is real and getting worse; fixing it properly means working right next to the panel. *Wants:* to do it alone. *Fears:* anyone else's hands near those welds. His temper flares and burns out in a minute; then he's ashamed of it.

*Engineering. Abara is standing in the hatch with a welding mask. Castellan is between her and the tanks.*

- *(seen.castellan.manifold_patched)* ABARA: The patch didn't hold. Crack's run past the weld.
- *(otherwise)* ABARA: Crack's grown a centimetre.
- *(seen.call.dace.burn_1, hand not healed)* ABARA: He's been on it twelve hours. One-handed, which is why it's twelve hours. I offered to take a shift.
- *(otherwise)* ABARA: He's been on it twelve hours. I offered to take a shift.
CASTELLAN: And I said no thank you kindly, ma'am.
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
  - *(trust.castellan ≥ 55)* *For a second his face does something complicated. Then the temper goes out of him all at once.*
    CASTELLAN: I'll tell you. I swear I will. Not today.
    [arc.castellan=1; trust.castellan +2; clue.castellan.1]
  - *(lower)* CASTELLAN: Old plumbing, Captain. Told you.
    *He goes back to work. The conversation is over.*
    [trust.castellan −1; clue.castellan.1]

---

## call.abara.six_1: "Their names."
```
speaker: abara   seat: tactical_nav   needs: act>=1, leg>=2   priority: 68   cooldown: 0   once
summary: Corvane paid the families of the six every quarter. The payment is due.
effects: arc.abara=1 (2 if the message is delivered), trust.abara, ship.funds (if paying), knows.the_six, knows.corvane_scuttled_ship, told.abara_grandfather_message.abara, knows.module_box
callbacks: abara_message, arc.abara stage 2 (the box)
```
**POV.** *Abara:* has made Corvane's quarterly payments to the six families herself for three years. *Wants:* to know whether this captain will keep a promise they didn't make. *Hides:* that she sent the money with letters, under her own name. *Would never say:* that she'd keep paying out of her own share if the captain says no. (She would.)

*Night watch. Abara has a ledger open on the chart table: paper, her handwriting. She turns it so you can read it.*
- *(murdered)* *She doesn't turn it. She slides it across.*

ABARA: Six names. When she scuttled the old ship, they didn't make the boats. She paid their families every quarter after. Out of the ship's share. I sent it. Quarter's due.
- *(murdered)* ABARA: Payment's due. You decide.

→ "Keep paying."
  ABARA: All right.
  *She closes the ledger, and her hand stays on it for a moment.*
  [arc.abara=1; trust.abara +6; ship.funds −; knows.corvane_scuttled_ship]
→ "Keep paying. And tell me their names."
  *She reads them out. It takes a while, because she says something about each one. Two of them, she says, were Dunne's.*
  - *(murdered)* *She reads the names and nothing else.*
  [arc.abara=1; trust.abara +8; ship.funds −; knows.the_six; knows.corvane_scuttled_ship]
→ "We can't afford it."
  ABARA: No. I don't suppose we can.
  *She doesn't argue. She doesn't close the ledger either.*
  [arc.abara=1; trust.abara −6; knows.corvane_scuttled_ship]

*(knows.abara_grandfather_message, after any choice)*
→ "Corvane asked me to tell you something. Your grandfather wasn't lying."
  - *(not murdered)* *Abara takes off her glasses.*
    ABARA: He told everyone it talked to him. The module. They took his pension for it.
    ABARA: Fourteen years, and she never once said that to me.
    *She puts the glasses back on. Her voice is perfectly level.*
    ABARA: I'll show you the box. Not tonight.
    [told.abara_grandfather_message.abara; knows.module_box; trust.abara +5; arc.abara=2]
  - *(murdered)* *For a long moment Abara looks at you as if you've said something obscene.*
    ABARA: You don't get to carry her messages.
    *Then, quieter, not to you:*
    ABARA: He wasn't lying.
    [told.abara_grandfather_message.abara; knows.module_box; trust.abara +0; arc.abara=2 (she'll open the box later, but not for you yet)]

---

## call.fenwick.crate_1: "A counting error."
```
speaker: fenwick   seat: quartermaster   needs: act>=1, leg>=3, leg.resupply_stop   priority: 60   cooldown: 0   once
summary: After a resupply stop, the cargo count is off by one crate.
effects: clue.fenwick.1, trust.fenwick, command.style, arc.fenwick=1 (gentle press with trust.fenwick>=50 only)
callbacks: arc.fenwick stage 2 (the deliveries)
```
**POV.** *Fenwick:* dropped a crate of rations at the buoy for a settlement that will collect it next week. *Wants:* the captain not to look too hard, and to like him anyway. *Fears:* a captain who writes it down.

*The hold, after a stop at a resupply buoy. The manifest says forty-one crates. You count forty.*
- *(player.background = port_authority)* *You counted twice before you noticed you were doing it. Old habit.*

FENWICK: Counting error! Mine. I can't count past twelve before lunch. Ask anyone.

→ "Fine. Fix the manifest."
  FENWICK: Already done. You're a prince. A princess. A captain. Whichever's the compliment.
  [trust.fenwick +4; clue.fenwick.1]
→ "Fenwick. Where did it go?"
  *The cheer goes out of his face, just for a second.*
  - *(trust.fenwick ≥ 50)* FENWICK: Somewhere it was needed, Captain. Can we leave it there for now? I'll tell you. I'd like to tell you.
    [arc.fenwick=1; trust.fenwick +2; clue.fenwick.1]
  - *(lower)* FENWICK: Overboard! Joking. Joking. It'll turn up.
    [clue.fenwick.1]
→ "Log it as missing on the ship's manifest."
  FENWICK: *(quietly)* Of course. That's the rules.
  *He doesn't make a joke for the rest of the day.*
  [command.style −3; trust.fenwick −6; trust.quill +2; clue.fenwick.1]

---

## call.quill.listen_1: "For calibration."
```
speaker: quill   seat: sensors_ecm   needs: act>=1, leg>=2, trust.quill>=20   priority: 66   cooldown: 2   once (on approval)
summary: Quill asks for a long passive listen during transit, "for calibration."
effects: arc.quill=1, quill.listen_approved, trust.quill, transit (+6:00 unless kept_quill)
callbacks: 1.9 (the act close needs quill.listen_approved)
```
**POV.** *Quill:* the decoy's turn (1.6) showed up on the old deep-space band, under the relay traffic, where her signals live. *Wants:* eight unbroken hours listening there, without explaining why. *Fears:* explaining why. *Would never say:* "I think it's the same thing." *At low trust (20-39):* still asks, because she needs it, but by slate, not in person.

- *(trust.quill ≥ 40)* *Quill comes to you, which she doesn't do. She has a written request on a slate, which she does.*
- *(trust.quill 20-39)* *A slate appears in your queue from Quill. No message, just the request.*

- *(seen.shakedown.quill_assigned)* QUILL: You asked me to find out what happened with the drone. I'm finding out. I need listening time.
- *(otherwise)* QUILL: Captain. I'd like eight hours of passive listening on the next transit. For calibration.

QUILL: It adds six minutes to the leg. I've done the arithmetic.
- *(quiet_hour kept_quill)* QUILL: Or I can do most of it in the quiet hour. The ship's quietest then.

→ "Approved."
  QUILL: Thank you, Captain.
  [arc.quill=1; quill.listen_approved; trust.quill +4; hunt effect: transit +6:00 (none if kept_quill); → 1.9 can fire]

→ "Calibration of what?"
  QUILL: Noise.
  *A pause.*
  *(player.background = signals)* *You glance at her slate. She's asking for the old deep-space band, under the relay traffic, the band nobody has had a reason to use since the Quiet.*
    → "That's the old deep-space band."
      *Quill looks at you as if seeing you for the first time.*
      QUILL: Yes. It is.
      [trust.quill +5; seen.quill.band_recognised; then choose Approved / Not this leg]
  → "Approved." [as above]
  → "Not this leg." [as below]

→ "Not this leg."
  QUILL: Understood.
  *She files the slate. You have a feeling it isn't the last you'll see of it.*
  [trust.quill −2; the call returns after its two-leg cooldown]

---
## Notes
- **Each call offers its officer's arc step;** some branches withhold it. Castellan only promises to confess if he trusts you (≥ 55, the same gate as his 1.7 slip); Fenwick only admits the crate went "somewhere it was needed" if he trusts you.
- **Command style and trust pull against each other** as the command model says: ordering Abara in is tight and costs Castellan; letting Castellan choose is loose and earns him.
- **Integration moves only by a human hand:** Dace runs the line to Pell himself, on the captain's word.
- **Fenwick's crate is a manifest matter, not a Tally one** (the Tally counts AI-touched salvage).
- **The player's background pays off** twice (Port authority counts crates twice; Signals recognises Quill's band).
- **On the murder route,** Abara reads the names and nothing else, and Corvane's message from the person who shot her lands as an insult, though the truth in it still reaches her.
