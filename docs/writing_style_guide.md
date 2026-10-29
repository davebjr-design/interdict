# Writing style guide (narrative and dialogue)

Applies to every scene, call and banter line. Character facts: `crew_cards.md`, `pov_sheets.md`. Pell: `data/pell_voice.md`.

## 1. Every line comes from the speaker's world, not from the plot [D]
A character never says something because the story needs it said. They say it because, given what they know, believe, want and fear **right now**, it is what they would say. If the plot needs a fact delivered, find the character who would *want* to say it, or let it slip from someone who wouldn't.

**Before writing any scene, fill a POV sheet for each speaking character** (template below, examples in `pov_sheets.md`). Then write. Then check each line: "Would this person, with only what they know, say this, in these words, to this listener?" If the honest answer is "no, but the player needs to hear it," rewrite or move the line.

POV sheet template:
- **Knows:** facts they actually have (not what the reader knows).
- **Believes:** including what they've got wrong.
- **Wants in this scene:** one concrete, immediate want. (Not their life goal.)
- **Fears in this scene.**
- **Hiding:** and from whom.
- **Thinks of the player:** right now, not eventually.
- **History in the room:** what they have with each other person present.
- **Would never say:** at least one thing, so they don't drift into exposition.

## 2. Backstory goes underneath, not into the dialogue
Write more backstory than appears on screen, so reactions have weight. The player should feel there is a reason for a pause, a joke, a look, before they learn the reason. Backstory surfaces as behaviour (who someone won't look at, what they don't ask about), not as speeches.

## 3. Subtext over statement
People rarely say the thing directly, especially under stress. Prefer the oblique line (Ostrow: "So naturally, I'm the one they sent") to the explicit one ("I'm conflicted about hunting my old captain").

## 4. Mystery rules
- Every scene in Act 0-1 plants at least one concrete, specific oddity (a number, a time, a name, a thing that cannot be true), not just mood.
- Oddities are noticed by a character whose POV makes them notice it (Quill notices timings; Castellan notices the reactor; Pell notices everything and chooses what to mention).
- Never explain a clue in the scene that plants it.
- Log every clue in `data/narrative/clues.csv`; three independent clues before any reveal.

## 5. Voice rules
- Everyone talks like a person: contractions, fragments, interruptions, unfinished thoughts.
- Each character has one rhythm. Corvane: courteous statement, then a quiet blade. Ostrow: says the hard thing to the chart. Dunne: short, true, ugly. Pell: plain fact, honest uncertainty, petty complaint.
- No one explains the world to someone who already lives in it. Exposition only goes to the player-character when they are the newcomer, and even then through a speaker who has a reason to explain.
- Violence and big moments live in the narration. Lines stay small.

## 6. Player choices
- Every choice is something the player-character could plausibly say, in a consistent (if blank) voice.
- Choices differ in intent, not just tone.
- The player always knows a decision is coming (visible tells); the cost is discoverable, not secret.

## 7. Format
Scenes are drafted as plain script (`docs/scenes/`), read for voice, then moved into Ink. Draft headers list status, location, reading time and the POV sheets used.
