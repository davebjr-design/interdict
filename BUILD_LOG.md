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

## Oct 22 (evening) - ratings read, pacing fixed
- Week 0 delegation test: Dave rated 30 outcomes: 27 Fair, 3 Confusing (#8 "said nothing", #10 Quill declining, #14 "what is complaining?"). Passes (>=25). Reworded all three lines in the doc. Note: the dropdown defaults to Fair, so untouched rows count as Fair.
- Pacing: card 5 retagged pressure -> story (the civilian-or-military question is a moral beat). Story order is now S B P S P B P S V S B, longest pressure run 1. Model now checks the run length against data `order`.
- Abara appeasement stays at 35%. Tried giving his stances to more levers; it broke the calm-plan cost on cards 4, 5, 9, so reverted. Decision: accept it. Abara-aligned plans will earn hidden-thread payoffs (not in the outcome score), so the low score is the price of secrets.

## Oct 22 (night) - Pell lines
- Drafted "Pell's Voice: Lines Across One Sortie" (Docs): 11 beats x 3 trust registers, aftermath lines, tells, running gags. Awaiting Dave's tone notes.
- Concept doc: added fixed-prologue-crew / roster matrix / character cards / seats-not-names rule.

## Oct 22 (late) - odds screen with dials
- Dave: drop the hide-the-screen test mechanic (interface will be redesigned anyway); judge whether the info is right and what dials exist (learned attack patterns, equipment with active/passive buffs).
- web/odds_screen.html: firing screen + dials (attack pattern skills, passive gear, limited-use active gear, ping, wait). Fixed an arithmetic error from the glance-test page (rows summed to 65, not 68; base is now 58).
- web/odds_glance_test.html kept in the repo but superseded.

## Oct 22 (late) - Hold vs Close in
- Dave: hold and close are different. Hold = stay inconspicuous and wait for an event; Close = better accuracy but more chance of being noticed.
- odds_screen.html: separate Hold (data ages, heat creeps, small notice chance per minute) and Close in (8 km steps: +3 kill, +3 exposure, +12% noticed, +2.5 heat each); new "Noticed first" cost and a Close in action box.
- decision_cards.json card 6: new lever close_in (channel position, Abara, speed, synergy with fire); hold relabeled "Hold quiet and wait for the moment". Model: 12 plans, calm plan (hold) costs 15%, close_in competes at 5.9 vs hold 5.7.

## Oct 22 (late) - closing numbers derive from ship stats
- Dave: closing numbers should follow engine efficiency and heat management, with base rates modified by equipment and crew competence.
- odds_screen.html: new Ship and crew panel (engine efficiency, heat management, navigator skill) plus two refit items (Efficient drive coil, Heat pipes). Per closing step: heat = 2.5 / engine / heat mgmt, exposure = 3 / engine, noticed = 12 x (1.3 - 0.1 x nav skill). Hold heat creep = 1.5 / heat mgmt.
- decision_cards.json: top-level `ship` base rates; levers may carry `scale` (stat list that divides a delta). close_in scales heat and exposure by the ship stats.
- Model: SHIP SENSITIVITY report. At 0.7 efficiency, fire + close_in ranks 7 of 12 (3.4); at 1.0 rank 2 (5.8); at 1.3 it is 7.0, near the best plan (7.9). A weak ship makes closing a bad idea, a good one makes it attractive.
- Loose end: relay_risk scale references nav_skill_inv, which is not defined yet; the model ignores it (treated as 1).

## Oct 22 (night) - salvaged parts model, critic launched
- Dave's equipment idea: everything is salvaged; same-maker parts get set bonuses; parts from recon ships / battleships / stations / freighters have distinct profiles (recon light and weak, battleship strong but heat- and power-hungry); mixing causes friction and parasitic heat.
- data/ship_parts.json + sim/ship_model.py: 16 parts in 4 slots (drive, sink, sensor, weapon), 3 makers (Orrin recon, Vask battleship, Halden station/freighter). Set bonus 5/10/15% for 2/3/4 same-maker parts; friction 0.05 per extra maker + 0.03 per extra origin cuts engine efficiency and adds parasitic heat; power draw above 10 adds overload heat.
- First run (v0 metric): battleship fire director + lance dominate, recon parts never in the top 25, friction nearly irrelevant, closing never chosen. Likely a bad metric (ignores stealth) plus real tuning gaps. Sent to a game-theory critic agent before retuning.

## Oct 22 (night) - weapons without rock-paper-scissors (first pass)
- Dave: iterate on balance, find interesting mechanics, base weapons on the Star Wolf books (kinetic field, missiles, point defense, armor), avoid rock-paper-scissors.
- Could not find the books' weapon details online (only the premise: Liberty ship LS-1187, Morthan Solidarity). Need Dave's terms.
- sim/weapons_model.py: three families (kinetic slug, guided missile, lance) tested against SITUATIONS (unaware, aware, point defense up, screened, cold hulk, ambush, closed on aware foe), not against each other. Each wins somewhere: kinetic 3, missile 3, lance 1 of 7. Defenses are states of the target (aware, PD up, screened), not type counters.
- Principles: weapons differ on resource shape (time of flight, signature, heat/power, ammo, damage to salvage); defenses are tempo windows; shared counterplay verbs (hide, decoy, close, break line).

## Oct 22 (night) - critic report adopted; Star Wolf weapons/defense rundowns
- Critic (game theory) findings: v0 utility ignored stealth, friction barely mattered, closing never won; kill chance saturates so waiting cannot pay in kill%; delegation 'worse' band tiny; 8 of 10 scored cards solved on sight; card 6 (ping +2 exposure) contradicted the odds screen (ping +15); degenerate optimum on screen (Lurk + Mk II + baffles).
- Adopted: data/ship_parts.json is now v5 (old one kept as ship_parts_v0.json); sim/hunt_mc.py + sim/hunt_contexts.py (hunt Monte Carlo with hidden escort clock, opportunity window, per-minute detection hazard; three contexts ambush/brawl/stakeout). Verified: Orrin recon kit wins ambush, Vask battleship kit wins brawl, Halden-led mix wins stakeout. Set bonus 10/20/30%, friction 0.07/0.04, silent-running cold threshold makes sinks matter.
- Not yet done (priority list): hold must pay in non-kill currency (visible opportunity window, loot x2, retaliation x0.5, sensor `warn` sets visibility); fix card 6 vs screen (ping exposure, charge 'noticed' in the kill number, give Lurk a cost, 5-10% failure tail for expert officers); fit roll at install (20% lucky / 55% normal / 25% rough x1.5); rotate cards across sorties.
- Dave pasted Star Wolf rundowns (not verified against the novels; used as design input): missiles in volleys fired into probability cones, super-chilled coast, kinetic point-defense flak, ECM ghosts and decoys, active ping as a weapon, close-range energy weapons as last resort; defenses as layers: thermal stealth (EMCON), decoys, point defense, stasis fields with a hard saturation limit, compartmentalization.
- sim/defense_layers.py: each layer is a capacity that a big enough volley saturates. Full stack (decoys + PD + stasis) is nearly immune below ~8 missiles, so layers 2-4 must be loud (PD radiates, decoys are consumable, stasis draws power and needs recharge) or stacking dominates. The real tension: the heavily defended ship is the one that already lost its stealth.

## Oct 22 (night) - propulsion rundown (Dave, from the Star Wolf books; not verified against the novels)
- Sublight: Newtonian only. To change vector the hull must rotate and the main drive must ignite; ignition is a huge thermal bloom that ends silent running. Ships coast on momentum most of the time.
- FTL (Hyperstate): engaging or dropping out creates a violent gravitational shockwave heard by every passive and active sensor in the system. Strategic only; stealth FTL insertion is impossible.
- Navigation: astrogators do relativistic math; c-lag means they navigate the past and must predict where things will be at arrival.
- Dog-legs and origin masking: ships drop out in deep space and travel sublight for days/weeks; departing ships fly standardized vectors for days before jumping so enemies cannot triangulate the dock from jump shockwaves.
- Design implications logged (not yet built): (1) closing in splits into COAST in (free, slow, committed vector, can't change) and BURN in (fast, thermal bloom); (2) the 'quantum drive' becomes a Hyperstate drive: escape is guaranteed but LOUD (thunderclap reveals position to everyone and, if repeated from the same vector, the relay); (3) relay exposure becomes a campaign-level hidden track fed by jump discipline; (4) turning takes hull rotation time (heavy ships slower) before a burn; (5) the navigator's skill is relativistic prediction (astrogation), which fits the cone/light-lag accuracy model.

## Oct 22 (night) - culture rundown (Dave, Star Wolf books; not verified against the novels)
- Life aboard: crushing boredom punctuated by mathematical terror; cramped corridors built around the heat sinks; no privacy; dark gallows humor, insular fatalism; friendships fierce but guarded; casualty rates high.
- Command staff: Captain (decides on delayed data), XO (administration, discipline, ship-wide damage control in combat), department heads (Tactical, Engineering, Astrogation, Medical), Chief Petty Officer (bridge between officers and enlisted; discipline, morale, grimy work).
- CIC stations: Tactical (passive sensors, ECM, weapons, point defense, predictive cones), Astrogation (sublight vectors, Hyperstate math), COMM (electronic signature, burst transmissions, tight-beam lasers, enemy signal analysis), Engineering (reactors, hyperstate generators, heat sinks; reports thermal capacity), Damage Control (bulkheads, fires, rerouting power).
- Implications logged (not built): our cast splits Tactical into Weapons (Quill) and Sensors (Castellan); no XO, COMM or Chief yet. COMM fits the patron/relay plot (burst transmissions, signature). Candidate: a Chief (morale/discipline voice and the face of unnamed crew losses) and the XO's damage-control job as a delegable call. No privacy means secrets leak aboard (crew overhears; the hidden agenda is hard to keep). Gallows humor sets the tone for Pell and crew lines, with fatalism balanced by the fun rules.
