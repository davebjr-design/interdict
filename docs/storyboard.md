# Storyboard (working draft, 2026-10-29)

Plain-text beat sheet. This is the document we argue over; Ink scenes are written from it and never the other way round. Status tags: **[D]** decided by Dave, **[P]** Claude's proposal (change freely), **[?]** open. Mode: TEXT (dialogue scene, portrait + choices), WALK (iso ship), HUNT (hunt engine), CARD (decision card).

How a beat is written: `id | mode | where | who | what happens | choices → state effects | clue/seed`.

## Process (how we work, in order)
1. **This sheet** (beats, order, who is in the room, what changes). Dave marks it up.
2. **Scene outline** per beat: 5-10 lines saying what each line of dialogue must accomplish. Dave approves.
3. **Ink draft** from the outline. Claude writes it; Dave reads it in the prototype player with the state panel.
4. **Revise** by reading aloud for voice (`pell_voice.md`, crew bible), then lock and log new variables/clues/callbacks in `data/narrative/`.

## Whole-campaign spine (12 beats)  [P unless tagged]
| # | Beat | Mode | Act | One line |
|---|---|---|---|---|
| S1 | Joining the host ship | TEXT | 0 | You are on probation aboard another gleaner ship that has been told to hunt Corvane. [D] |
| S2 | Tutorial hunt | HUNT (scripted) | 0 | Fixed outcome, teaches the modes. Deferred (needs interior art). [D] |
| S3 | The standoff | TEXT/scripted | 0 | Board Corvane's ship. Persuade or kill; both work. [D] |
| S4 | The blessing | TEXT | 0 | The patron's voice approves you as captain. A little too convenient. [D] |
| S5 | Inheritance | WALK/TEXT | 1 | Aboard as captain over Corvane's crew. Tense. [D] |
| S6 | Shakedown | HUNT | 1 | First real hunt, decoy, full control. [D] |
| S7 | First commission | TEXT/CARD | 1 | Patron job, refusable. First clue. |
| S8 | The audit | TEXT | 2 | Tally inspection. What you declared and hid starts to matter. |
| S9 | The job that goes wrong (midpoint) | HUNT/TEXT | 2 | Patron gains leverage; survivor pockets surface. |
| S10 | Interdicted | TEXT/HUNT | 3 | The Tally turns on you. Corvane returns (alive, freed, or in Pell's logs). |
| S11 | The patron's work | TEXT | 4 | What the patron is really facilitating; who the Believers are. |
| S12 | Verdict | TEXT | 4 | Finish the job, expose the patron, keep the tech, or walk. |

## ACT 0: probation and the takeover (text-writable now; playable later)

**P1 | TEXT | host ship bridge | Host captain (new, name TBD), host first mate [P] | The brief.** Host captain explains the rules among thieves: nobody reactivates AI recklessly, and Corvane has. You are probationary; you watch, you do what you are told, you are told why. Corvane is described as the best captain they ever hunted with. *Choices:* ask about Corvane (sets `knows.corvane_was_csra`) / keep quiet. Seed: the host captain knows more than she says about who ordered this.

**P2 | HUNT scripted | tutorial | Host captain gives orders ("do X") | Teaches hunt mode.** Fixed outcome: Corvane's ship found. Each beat is a button highlight with one line of why. (Hunt scripting is already specified in `opening_sequence.md`.)

**P3 | TEXT/scripted | Corvane's bridge | Corvane, Abara, Quill, Pell (voice) [P] | The standoff.** You go aboard alone or with one host officer. Corvane is calm, amused, courteous. Her crew stand at stations and say nothing. Pell's glow is on a pedestal. Two routes:
- **Persuade** (needs a hook found during P1-P2, otherwise it costs trust): she tells part of her case ("something worse is already awake") and stands down. *Effects:* `corvane=persuaded`, `trust.abara +10`, `trust.quill +5`, `trust.castellan -5`. She is confined, not freed.
- **Violence** (always available): fast and clean; she dies calmly, finishing a sentence. *Effects:* `corvane=killed`, `trust.abara -15`, `trust.dace -10`, `trust.castellan +5` (he feels relieved and ashamed), Pell trust starts lower. Pell logs everything.
- Both: Abara is the one who looks at Corvane last. Quill says nothing and writes something down. Seed `clue.signals.1`.

**P4 | TEXT | any private place | the Patron (voice) | The blessing.** A warm, patient voice approves you as captain "by the usual arrangements". It says it wants this ship quiet and the AI stopped. It tells you the crew will be difficult and that it will "see to it" you have what you need. *Seeds:* the call arrives faster than it should (`clue.patron.1`); it does not ask what happened (`clue.patron.2`). *Choice:* thank it / ask who it is (it deflects).

## ACT 1: inheritance (the part we can write and test first)

**1.1 | TEXT | airlock, then control | Pell, Abara | Stepping aboard.** Deck plan unfamiliar, crew absent from the airlock. Pell speaks first and asks permission to speak. Abara meets you at control, not hostile, not welcoming. Variant lines by `corvane`. *Ends* with: "Walk the ship, Captain. They will want to look at you." (Hands control to WALK.)

**1.2 | WALK + TEXT | whole ship | each officer | First morning aboard.** One first conversation per station. Each person tests you with a small job or a small truth, and each hides what they hide.
- **Abara (control):** a small job (e.g. check the plot against her chart). Test of competence. Tells a short story that ends in a warning. Hook: the module box (seen as a locked drawer).
- **Quill (control):** formal, checking you against a checklist; asks whether you will tell her bad news. Hook: she mentions "noise" and changes the subject.
- **Dace (thermal):** over-eager; checks your pulse "as a courtesy"; proves himself with a diagnosis you did not ask for. Hook: the stethoscope for pipes, an old crest mug.
- **Castellan (engineering):** treats you like family within a minute; talks to the reactor. Hook: the coupling manifold (the placeholder job already in the demo).
- **Fenwick (mess):** feeds you. Hook: the mess seats thirty, the crew are five, and the cargo manifest has more ration packs than that.
*Each gets* `trust.<id>` +/- from how you answer (competence for Abara, honesty for Quill, respect for Dace, warmth for Castellan, kindness for Fenwick). One variant per Corvane outcome.

**1.3 | TEXT | mess | all | First crew meeting (the tense one).** Who sits where. One proposer, one or two objectors (seats not people, per the decision grammar). Dace speaks first, Abara last. Topic: do we keep the old routines? Do you tell them what the patron said? *Choice:* tell all / tell the job / say nothing → feeds `told.patron_blessing.*` and trust.

**1.4 | TEXT | brig or Corvane's cabin | Corvane or Pell | The aftermath.**
- If **persuaded**: she asks to see you once; courteous; tells you what the patron cannot know; asks you to tell Abara something. You can refuse to hear it. She is the first big "believe her or not" choice.
- If **killed**: her cabin is sealed. Pell offers her logs and asks whether to open them (the first small step on the integration meter, but only if you say yes). Quill's hands shake slightly the first time you mention her.

**1.5 | TEXT | control room, night | Pell | Pell's first conversation.** Pell is clamped (integration 0): honest, helpful, stops one step short and says so. Asks one question about you. Offers the first firewall trade: a faster detection overlay for the shakedown if you allow one more of its channels. *Choice:* accept (`integration +10`, hunt bonus) / decline (no change). First test that both routes are viable.

**1.6 | HUNT | shakedown | Abara/Quill/Castellan as voices on cards | Shakedown against a decoy.** Fully in your control. Two or three decision cards (`card3_route`, `card4_detection`, `card5_classification`) with the recast cast speaking. Aftermath: who did well, who was overruled.

**1.7 | TEXT | control | the Patron | First commission.** A job, refusable, with a reasonable motive and an unusual detail (coordinates that do not fit). *Choice:* take / refuse / take and ask Pell to check (seed `clue.patron.3`). The patron's reaction to refusal is gracious and slightly colder.

**1.8 | CALLS | one per officer, spread over legs 2-6 | Their hook, stage 1.** Quill: the signals. Dace: a crew injury and an AI-assisted fix on the table. Castellan: the manifold crack grows. Abara: she asks whether you will honor an old promise of Corvane's. Fenwick: the cargo count is off by one crate. Each is a storylet (`calls.csv`) with trust gates.

**1.9 | TEXT | any | Pell, Quill | Act close.** Quill brings you one signal she cannot explain, and Pell, asked, says it has seen it before and is not allowed to say where. First on-record link between Pell, the signals and Corvane's warning. Tally notice arrives: audit in two legs. (`act = 2`)

## Act 2-4 (one line each; detail after Act 1 is playable)
- **Act 2 Contracts:** commissions, dock cycles, captains' bar rumours, crew arcs to stage 2-3, the audit (S8), the midpoint job (S9). Reveals: survivor pockets, CSRA not neutral.
- **Act 3 Interdicted:** Tally turns on you; arcs hit stage 4; integration tier at 75 unlocks Pell's biggest truth; Corvane returns in the form your outcome allows (S10).
- **Act 4 Verdict:** patron's real work; Believers shown; finish, expose, keep or walk (S11-S12).

## Variants matrix: Corvane outcome vs crew (first impressions)
| | Persuaded | Killed |
|---|---|---|
| Abara | Wary respect, grateful but watching | Cold, formal, still does the job |
| Dace | Relieved, talks too much | Shaken, over-explains his competence |
| Castellan | Guilty, avoids you | Warm too fast, ashamed |
| Quill | Silent, takes notes | Cold, double-checks everything you say |
| Fenwick | Cooks bigger | Cooks smaller, then bigger |
| Pell | Careful | Quiet, logs stay locked until you ask |

## Open questions for Dave
1. Host ship crew: do we want a named host captain (a foil or a future patron-side figure) or keep it minimal?
2. Standoff: does the persuade route need a prior "hook" or is it always available with a cost?
3. Does Pell speak in the standoff, or only after you take command?
4. How much of Act 1 is player-authored choice vs fixed? (Proposal: fixed order, free responses, no skippable character introductions.)
5. Where does the player first meet the captains' bar and dock cycle: Act 2 as above, or earlier?
