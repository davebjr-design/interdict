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
