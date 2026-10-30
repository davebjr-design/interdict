# The plot so far: Act 0 and Act 1, with branches (2026-10-30)

Scene files: `docs/scenes/`. State names: `data/narrative/state.json`. This is the reader's summary; the scenes are canon.

## The spine in one paragraph
A probationary hand on a poor gleaner ship joins a hunt for Captain Ilsa Corvane, the best captain her hunters ever served under, who has broken the oldest rule: she's *running* an AI. The hand boards her ship, ends the standoff, and inherits her ship, her crew and her AI, Pell, with the blessing of an unseen patron, the Steward. The blessing was sent eleven minutes before the standoff ended. Over a week aboard, the new captain earns (or fails to earn) a grieving crew's trust, learns Corvane's three secrets, and hears, with their own ears, a signal under the relay traffic that turns up whenever something is being decided. Act 1 ends on the way to Vesper Dock and a Tally audit, carrying a sealed box that weighs what an AI core weighs.

## Act 0: the takeover (night of day 0)
**P1 The briefing** (*Tern*, Captain Ostrow). The rule: you can touch the AI, you can't wake it. Ostrow admires Corvane and won't board ("She'd talk me round"). Dunne survived Corvane's last ship. Ames asks what to do when your hands shake.
- *Sets:* `ames.bond` (0-2), `knows.patron_exists`, `knows.pell_name`, and whether you asked "What if she's right?" (Corvane quotes it back in P3).

**P2 The tutorial hunt** (scripted, art-gated). Corvane's ship found.

**P3 The standoff** (Corvane's bridge). Tea. Pell counts heartbeats. One visible tell per round. **The big fork:**
| Route | When you shoot | Ames | What you get | What it costs |
|---|---|---|---|---|
| **Murder** | R1, before any tension | unharmed, afraid of you | the ship, at once | crew trust crushed; Dunne refuses you; Pell at its coldest; the Steward approves too readily |
| **Shot early** | R2 | wounded, lives | Dunne's respect; Ames alive | Corvane dies saying almost nothing; her case survives only in logs |
| **Shot late** | R3-R5 | dead (Corvane shoots him after Quill says "Yes, Captain") | more of her case in her own words | you watched it happen |
| **Persuaded** | never | dead | she stands down, alive and confined; the most truth | Ames died for it |
At the decisive moment Pell says "Your tea's gone cold" twice and doesn't know it. Quill writes down 22:13.

**P4 The blessing** (same night). The Steward's message congratulates the outcome you chose, sent **eleven minutes before** you chose it. Only one message in the log. Pell gets chatty (scared). The line, open six weeks, closes for the first time. *Sets:* `patron.suspicion`, and whether you learned the name "the Steward".

## Act 1: the first week aboard (days 1-7)
**1.1 Stepping aboard** (day 1). The ship is "thick as a brick": Pell has clamped itself back to clockwork, because Corvane's permissions ended with her. Pell's nickname for you comes from the standoff. Abara: "Comms log says you had a visitor last night."
**1.2 First conversations.** Each officer tests what they value and shows what they hide: Abara's locked drawer, Quill's written time, Dace's crest mug ("Doctor"), Castellan's padlocked panel, Fenwick's too-many ration tins.
**1.3 The crew meeting.** The old argument about Corvane's **quiet hour** (comms off, alone with Pell).
- *Fork:* keep it and take her place / end it / keep it with Quill on watch. This decides where Pell can speak freely for the rest of the act.
- *Fork:* tell the crew what the Steward said (everything including the timestamp / the job / nothing). Telling them makes them fellow investigators; hiding it starts the "you hid it" trust rule.
**1.4 The aftermath.** Corvane's three things, available on every route: the quiet hour is the one hour the ship can't be heard; the station's location is walled inside Pell; "tell Abara her grandfather wasn't lying."
- *Persuaded:* from Corvane in her cabin. You can refuse to listen. If you tell her about the eleven minutes, she's afraid for the first time ("further along than I thought").
- *Killed / murdered:* from her logs, which Pell won't open without asking (first +5 integration). Her cabin: her grandmother's burnt notebook ("the guns that never missed were not ours alone") and a chart with a point erased hard enough to tear. On the murder route Pell first asks why you fired.
**1.5 Pell at night.** You choose your past (launch crew / orbital / port authority / signals). The first firewall offer: a detection overlay for one channel; you turn the red key yourself (+10 integration) or decline. In the quiet hour Pell asks about its three-second gap, admits fear, and nearly says what it was built for ("That's a wall. Not hers. Older.").
**1.6 The shakedown** (day 3). Abara's decoy drone. Mid-hunt it **turns toward the ship** for forty seconds; its log says it never did. Abara realises she wired its relay box into its guidance herself. *Sets:* `shakedown.result`, the third watch, whether Quill is assigned to find out, and the first big command-style choice (drill again / stand a round).
**1.7 The first commission** (day 4). The Steward quotes Abara's words from the mess the night before. A sealed "medical" store from a war hospital ship, to Vesper Dock, off the books. Its mass fits a core housing. Abara: "That's how she started."
- *Fork:* log it / hide it / take it and open it / refuse. Moves Tally standing, patron standing and command style together.
**1.8 Crew calls** (days 4-6, any order). Dace wants Pell's help with Castellan's burn. Castellan won't let anyone near the panel ("I'll tell you. Not today."). Abara's quarterly payments to the six families, and Corvane's message about her grandfather ("I'll show you the box. Not tonight."). Fenwick's missing crate ("Somewhere it was needed"). Quill asks to listen "for calibration".
**1.9 The signal** (night 6, coda day 7). Quill brings eight months of logs. The signal was there at 22:13, at the drone's turn, and (if she was watching) when the line opened. You hear it: under the hiss, something with shape, many at once. Pell has heard it before and can't say where. Tally audit at Vesper; Abara lists what they'll find.

## Where every thread stands at the end of Act 1
| Thread | Planted | Status |
|---|---|---|
| **Something knew** (the predated blessing) | P4, 1.7 (the Steward overhears the mess) | player knows; crew know if told |
| **The signal** (the Choir, unnamed) | P3, 1.6, 1.9 | heard; source unknown; Quill can triangulate from Vesper |
| **Pell is a front** | P3 R5, 1.5, 1.9 | three clues: it heard the briefing, it hit a wall, it has heard the signal |
| **The station** (the Choir's location) | 1.4 (wall in Pell, the erased chart) | behind Corvane's wall |
| **Loyalist machines** | 1.4 (grandmother's notebook), 1.8 (Abara's grandfather) | Abara will show the box |
| **Castellan's reactor** | 1.2, 1.7, 1.8 | three clues; confession promised if trusted |
| **Fenwick's survivors** | 1.2, 1.8 | two clues; third at the Vesper bar |
| **The box in the hold** | 1.7 | a core housing, logged, hidden, to be opened, or someone else's |
| **Ames** | P3 | alive and wounded: waits outside the Vesper bar to thank you |

## The state that most changes Act 2
- **Standoff route:** Corvane alive (and a possible visitor) or only in logs; Pell's warmth; how the crew sees you.
- **Quiet hour:** whether Pell can ever speak freely.
- **Integration:** 0, 5, 10 or 13 by now (logs, overlay, Dace's line).
- **Command style:** tight or loose, and the ship's props with it.
- **Trust per officer** and arc stages (Quill 2, Abara 1-2, others 0-1).
- **Tally and the commission:** what the audit will find.

## Act 2 opens at Vesper Dock
The audit; the captains' bar (where gleaners call the signal "the Choir"); Ames outside the door if he lived; a second listening point for Quill; the box delivered, opened, or held; and the first derelict that shows machines fought machines.
