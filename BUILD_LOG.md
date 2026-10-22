# Build log

Read this first each session. Keep it to one page.

## Rules
1. Simulation is separate from the screen.
2. Fixed random seed; every run is replayable.
3. Content lives in `data/`, not in code.
4. Every playtest records decisions, pauses and waits.
5. Desktop browser only for the slice.
6. Numbers before art. Change numbers before scope.

## Decisions
- Heat disables officers first (station down, officer shaken); named officers never die; unnamed crew can be lost.
- Pause only at crew-raised points; "ask for options" is the escape valve.
- Odds: point estimate with a confidence band that widens as data ages.
- Heat leaks: above ~40% the enemy can detect the ship passively. Venting leaves a bloom (~15 game minutes).
- Cutter is tied to the relay.

## Status
- 2026-10-22: repository created. Next: Week 0 (extend the simulation with leak and bloom, run all play styles).
- 2026-10-22: Week 0 simulation. `sim/interdict_sim.py` (run `python3 -I sim/interdict_sim.py 10000` from another directory) compares the critic baseline with NEW rules: passive heat leak above 40%, vent exposure 20 gm, miss escalation (30% chance of retaliation), AI loyalty event at high autonomy, active data stale after 3 gm, sink full in ~52 gm, bearing hold 12 gm.
  - Result: passive-only now cooks the crew 29% of runs (was 7%) and is ambushed 17%; mixed play is best on clean kills (58%); constant venting loses (13% clean); ignoring calls cooks 70%.
  - Open: active-always still kills 75% of runs but only 33% cleanly (43% damaged); high AI + smart play kills 72%. Treat CLEAN kills as the success measure and make damage cost something visible (an injured officer).
  - One tuning round used of two allowed. Model limits: one enemy, no officer psychology, outcomes are bins, not fun.
- 2026-10-22: Delegation check model in `sim/delegation_sim.py`. score = rating x 1.5 + modifiers + Normal(0, spread) - difficulty; great >= +3, fixed 0..3, unchanged -5..0, worse < -5. Spread by temperament: bold 2.6, steady 2.0, exact 1.8, careful 1.5, anxious 2.0 plus stress. Difficulties: fault 4, crisis 5.5, ghost 5.5. Result: the right officer fixes the routine fault 73% of the time and the ghost 87% (Castellan); in the crisis even the best delegate (Pike) fixes only 36%, so going yourself should be the strong option. Wrong-field officers mostly give 'unchanged', 'worse' stays under 10% except for Pike on the ghost (41%, his under-reporting bias) and the anxious/careful officers in the crisis. Tune after Dave's ratings of the 30-row sheet.
- 2026-10-22: Decision grammar prototype. `data/decision_cards.json` holds Cards 6, 8 and 10 as levers (channel, proposer, executor, stances, check, bands, synergy) with objections; `sim/decision_model.py` enumerates every legal plan (one lever per channel, slots <= 2), resolves each lever with an officer check, derives reactions from stances, and reports coverage, lever value and dominated plans. Findings: 7/12/9 legal plans; no plan is free on scored cards; every officer both aligned and opposed across the three cards; Abara rarely opposed (add hidden objections); crew_forward needed a cost (slows the repair); ping/break_off have value only via side effects or values. Rule: every lever needs a cost beyond its slot and either standalone value, a synergy, or a 'trap' flag.

## Oct 22 - all cards in lever grammar + fun checks
- data/decision_cards.json now holds 11 cards (old cards 1+2 merged into one briefing card). Each has a tone: pressure / story / values / breather.
- decision_model.py: added `required` channels, softened trust (being overruled is flavor; only an opposed, un-backed officer loses a step; at most one officer frowns per decision), and a FUN CHECKS report (no-win, peaceful plans, trust-vs-outcome gap, appeasement edge, pacing).
- Result: no card is no-win (route card needed a rebalance). Every card has at least one acceptable-outcome plan with at most one officer unhappy.
- Appeasement test (50% = no edge): Pike 53, Quill 54, Castellan 59, Abara 35, Dace 48. Watch Castellan (slight edge) and Abara (pleasing him costs outcome).
- Pacing watch: cards 4-5-6 are three pressure cards in a row; put a breather or story beat between them.

## Oct 22 (later) - the calm plan costs something; Pell gets a personality
- Rule (from Dave): on every card a calm plan (nobody opposed) exists, and it costs outcome. Added PEACE COST report to decision_model.py. After retuning, calm plans cost: pressure 15-37%, story 16-23%, breather 0-16%. The player learns by playing that keeping everyone happy is safe but ineffective.
- Appeasement test unchanged: Pike 48, Quill 52, Castellan 58, Abara 35, Dace 50. Abara still a watch item.
- Added data/pell_voice.md: big-personality, obviously sneaky and snarky AI (Claptrap / Outer Worlds ship computer). Rules, verbal habits, sample lines.
