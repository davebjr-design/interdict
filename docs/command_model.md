# Command model: how the captain's choices change the ship (2026-10-29)

Dave's direction: trust isn't the only thing; how tight you run the ship matters too, and it should change the look of the ship. Same crew all game, so change comes from the officers themselves, from Pell, and from visitors. Delegated jobs stay as skill checks (rating x 1.5 + noise − difficulty, `sim/delegation_sim.py`); these dials modify them.

## 1. The four dials
| Dial | Scope | Moved by | Mostly affects |
|---|---|---|---|
| **Command style** (tight ↔ loose) | the whole ship | how you run things: rules enforced or bent, the quiet hour, Tally honesty, discipline calls, where you sit | procedure speed vs. options and judgment; how the ship looks |
| **Trust** | each officer | how you treat each person | that officer's steadiness (check noise); which of their scenes and options unlock |
| **Integration** | Pell | firewall steps (always a human act: the red switch, a cable) | raw capability, at a cost in crew trust |
| **Tally standing** | the world | what you declare or hide | inspections, the captains' bar, patron jobs (no skill effect) |

## 2. Command style: tight vs. loose
State: `command.style`, 0 (tight) to 100 (loose), starts at 50. Bands: **very tight** < 15, **tight** 15-35, **neutral** 35-65, **loose** 65-85, **very loose** > 85.

| | Tight (drilled procedure) | Loose (judgment and ideas) |
|---|---|---|
| Detection → classification | faster (×0.85 time) | slower (×1.10) |
| Firing solution time | shorter (×0.85) | longer (×1.10) |
| Delegated checks | steadier (noise −0.3) | normal |
| Drilled crises (heat crisis, damage control) | +1 to the check | normal |
| Options per decision card | normal | **+1 lever**: an officer volunteers an unorthodox option (`style: loose_only` levers) |
| Recommended lead on the firing solution | normal | more accurate (lead error ×0.7) |
| Firing cone | normal | can tighten further before a miss (minimum cone factor −0.1) |
| Novel problems (ghost contacts, unknown classification) | normal | +1 to the check |
| Inspections | easier | harder (things are where they shouldn't be) |

**The extremes cost something, so the middle is a real choice:**
- **Very tight:** the crew stops volunteering. Cards hide their `style: loose` levers (the ideas a tight crew keeps to itself).
- **Very loose:** "nobody checked." 10% of delegated checks drop one band.

(Starting numbers, to tune in the hunt sim. `tools/style_sim.py` checks that hiding loose levers never leaves a card without an acceptable plan.)

## 3. Officers have a preferred style
Style and trust pull on each other, so no single grind maxes everything. Each band step away from an officer's preference costs a little trust per leg; each step toward earns a little.
| Officer | Prefers | Why, in their world |
|---|---|---|
| Quill | tight | checklists are honesty; surprises get people killed |
| Abara | tight-ish (neutral to tight) | she's run range safety; she also knows a crew needs to breathe |
| Castellan | loose | hates paperwork; best work comes from hunches (and he needs unwatched hours) |
| Dace | loose | wants room to show what he can do |
| Fenwick | loose | a ship that laughs together eats together |
| Pell | slightly loose | human choice is sacred; it likes being asked, not drilled |
Visitors push style too: a CSRA inspector pushes tight; Corvane, aboard, pushes loose.

## 4. Where command style moves in the scenes so far
| Scene | Choice | Style |
|---|---|---|
| 1.3 | sit at the head of the table / on the bench / stand | −3 / +3 / 0 |
| 1.3 | quiet hour: keep it and take her place / end it / keep it with Quill on watch | +3 / −8 / −4 |
| 1.3 | tell the crew everything / the job / nothing | +2 / 0 / −2 |
| 1.2b | thank Quill for the safety correction / "I know" | −2 / +1 |
| 1.2e | "Will you sit with me?" | +3 |
| 1.6 | briefing: ask about the pool / "Quiet on the bridge" | +1 / −1 |
| 1.6 | the turn: "Log it. Keep hunting." | −1 |
| 1.6 | debrief: drill it again tomorrow / stand everyone a drink | −6 / +6 |
| 1.7 | open the container before delivering | +2 |
| 1.8 | Dace's call: let Castellan choose | +2 |
| 1.8 | Castellan's call: order Abara onto a shift | −3 |
| 1.8 | Fenwick's call: log the missing crate on the manifest | −3 |
| 1.7 | log the commission in the Tally / leave it off the books | −4 / +4 |
(Scene effect tags use `command.style ±n`.)

## 5. Trust, arcs and Pell as modifiers
- **Trust** changes steadiness, not size: loyal (60+) officers get noise −0.4; estranged or shaken officers get noise +0.6. Trust mostly unlocks options and scenes. This keeps "please everyone" from being the dominant strategy (the decision sim's appeasement test watches it).
- **Arc completion** gives one permanent change per officer: Castellan's confession (engineering +1 and a new option on heat cards), Dace allowed AI-assisted medicine (medical checks much better, integration +5), Quill's signals shared (sensors +1), Abara's module resolved (a fire-control option), Fenwick's network revealed (resupply anywhere).
- **Pell's tiers** add capability field by field: sensors first (the detection overlay in 1.5), then fire control, then drives. This makes the AI dial the strongest path to power, which is exactly the trade the game is about.

## 6. Visitors
Same crew all game; visitors come and go. A visitor brings a temporary bonus, a few storylets of their own, and a complication. One or two at a time (berths are limited).
| Visitor | When | Bonus | Complication |
|---|---|---|---|
| Corvane | persuaded route, released for a stretch | big tactical bonus; loose pressure | the crew is strange around her, Abara most of all |
| Ames | if he lived; Ostrow lends him for a job | small bonus, a lot of heart | Dunne's disapproval |
| A survivor-settlement elder | Act 2 | uncharted routes | Fenwick's secret is at the mess table |
| A CSRA inspector riding along | Act 2 | steadier checks; tight pressure | no hiding anything; Castellan is nervous |
| A secret Believer | Act 2-3 | brilliant with AI (integration effects stronger) | dangerous to have aboard |
State: `visitor.<id>` (aboard / gone / never).

## 7. The look of the ship: props, not regenerated rooms
Rooms keep their art. Command style swaps a small set of **overlay props** in each room:
- **Loose:** mugs, posters, a laundry line in the berths, music in the thermal bay, the dartboard, personal photos, a hand-painted name on a hatch.
- **Tight:** labels, stowed gear, coiled lines, cleared tables, a duty roster on the wall.
- About 6 props per state, shared across rooms where possible, so a few image credits cover the whole ship. Bands switch props at 35 and 65, so you see the ship change as you play.

## 8. Sim check (2026-10-29, `tools/style_sim.py`)
Levers tagged `style: loose` so far: card3 burn_coast, card4 ping, card5 go_active. Hiding them (very tight) leaves every card with a legal plan. Cost: card 3 loses its best plan (score −2.1 → −3.9; burn-and-coast is the loose crew's trick); cards 4 and 5 barely change. That's the intended shape: very tight costs you ideas, not the ability to act. Cards 3-5 also got new-cast pitch and objection lines (`line` on each lever).
