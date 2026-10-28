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

## Oct 22 (night) - sensors/stealth/comms rundown; reference doc
- All rundowns (weapons, defenses, propulsion, sensors, stealth, comms/EMCON, culture) are now in docs/star_wolf_rundowns.md as design reference (unverified vs the novels).
- Second critic launched with all rundowns to stress-test mechanics against these specifics and to differentiate the game from comparable titles.

## Oct 22 (night) - critic 2 report (differentiation + mechanics vs rundowns)
- Heat is the whole game: 21 of 46 levers touch heat, weighted in 7 of 11 cards; exposure derives from heat. Split pressure into heat, signature, ammo, comms burst budget, crew strain, relay stages.
- Information is perfectly known on the odds screen (every term of 58+... printed); the data-age penalty (~1 pt/min) is 3-5x gentler than a cone model (single-missile hit 0.72/0.51/0.34/0.24 at 1/3/6/10 min).
- Best mechanic found: cone volleys. Spread vs stack flips on whether the target has point defense (no PD, n=4, age 3: spaced 0.99 vs stacked 0.51; vs 2-channel PD: stacked 0.59 vs spread 0.36). Only fun if PD is inferred from passive clues and the UI never shows the optimal spacing.
- Relay exposure as a hidden number is unlearnable and exploitable (ignore it and burn urgent sorties: 1102-1176 vs 625 cautious). Needs 3-5 VISIBLE stages with real consequences. Triangulation deferred.
- Dominants still open: card 6 fire+ping (now fixed in data: ping priced +15 exposure, +4% relay; calm plan hold now costs only 1%, retune pending); close_in dead outside the slice screen; stakeout always picks hold 12; offense exercised by 1 of 11 cards.
- Differentiation: hook = hunted ship commanded through officers and a lying AI reading the same minutes-old picture. Protect: cone volleys, lever-grammar cards with the peace cost, Pell + patron as a comms/signature problem. Samey: set bonuses and friction, rating+noise checks, trust bars, hold/close/fire loop, relay % bar. Comparables recalled from memory only (research returned little): FTL, Silent Hunter, Duskers, Highfleet, Darkest Dungeon, Reigns, Papers Please, Sunless Sea.
- Biggest risk: simulation before game. Eleven sim rounds, nothing playable; ~33 h of card content plus UI.
- Core Mechanics: Sequences doc created (Docs): scanning, movement, combat, being targeted, Hyperstate, comms, return. First-slice scope and deferrals in it.

## Oct 22 (night) - decisions: keep kits, invent terms
- Dave: do NOT defer the salvage set bonuses / friction / parasitic heat; they are how the class system works for ships and will drive gameplay variety. Invent new terms but stay true to the mechanics so there is one operating rule set.
- docs/glossary.md and the Core Mechanics: Sequences doc now carry the glossary and the ship classes (Needle, Hammer, Anchor, Hauler, Patchwork). Slice scope in the doc updated: the full kit system ships with the slice.
- Critic 2's recommendation to cut parts to 2 makers / 8 parts was overruled by Dave. Mitigation: keep the 16-part, 3-maker table but build the kit rules once, data-driven.

## Oct 22 (night) - Operating Rules v0.1
- sim/rules.py: concrete numbers for afterlight/Fan, volleys, cold running/sump/bloom, movement (rotation time by mass), breach (plot time, error, knell, relay stages), comms (3 snaps per sortie). Doc: "Operating Rules v0.1".
- Checked: Fan model reproduces the critic's single-missile curve (0.72/0.50/0.34/0.24 at 1/3/6/10 min).
- Volley spacing flip needed a mechanism: spread volleys arrive staggered, giving the scatter grid up to two windows; stacked volleys arrive together. Result (n=4, age 3): no grid 0.49 stacked / 0.85 medium / 0.99 spread; 2 ch @0.8: 0.50/0.58/0.20; 3 ch @0.8: 0.51/0.31/0.03. A spectrum with a real flip. A stacked volley is immune to grid strength as long as n exceeds the grid's kills.
- Open: how the player infers the target's grid from passive clues; whether the knell can be dampened; ammo counts and reloading.

## Listening Board prototypes (passive detection)
- `sim/listening_model.py`: 16 bearing bins, three passive channels (infrared, reactor, occlusion). Combining channels beats any single one (cold target, 2 min: IR 0.59, IR+reactor 0.90, all three 0.98). Lures fool infrared and reactor but not occlusion (cold + lure, 4 min: IR+reactor 0.63, all three 0.95). Occlusion needs a star or ring behind the target, so position matters.
- `sim/grid_clues.py`: a powered scatter grid adds flutter to the reactor channel. Class read accuracy at 4 min is 0.76; decoys and a quietly run grid cap it near 0.5.
- FINDING: with a binary stack/spread choice, always-spread (0.58) beats acting on the read (0.55), because misreading a heavy grid as light is catastrophic (spread kill 0.03). Fix candidates: a hedge spacing that is never terrible, a displayed confidence band so the player hedges when unsure, and a heavy-grid read that is clearer (it radiates the most).
- Open: choose the scanning mini game (see message to Dave); update Operating Rules doc once picked.

## 2D two-sided hunt (sim/hunt2d.py)
- Postures still/evade/close x probe habit never/blind/often, round robin, 40-minute cap. Win rates sit in a flat band (0.20-0.28) for eight of nine policies: no dominant posture. Pinging constantly while sitting still is clearly worst (0.12), as intended.
- 53% of matches time out with no shot: hunts are too slow or too quiet. Tune: raise emission baseline, shrink the arena, or add a pressure clock (patron/escort arrives).
- Next: arrival-choice card (stay still / evasion pattern / close on a point), cone density and probe radius as the dials, then the playable 2D text hunt.

## Hunt pacing (sim/hunt_pacing.py)
- Clock length barely matters: with clocks of 8-30 min, P(shot) is 0.65-0.75 and the hunt averages only 1.8-3.4 beats (about one beat every 3 minutes). Longest quiet run 2.4-3.1 min.
- Diagnosis: the problem is beat density, not duration. A hunt resolves in a few events, so there is no arc. Target (to playtest): first beat by minute 3, no quiet run over 3 min, 8-15 beats, 12-20 minutes.
- Fixes to try: make each ladder rung a beat (anomaly, classify, track, solve); first hit disables rather than ends the fight; decoys, vents and escort stages as scheduled beats; patron snap mid-hunt.

## Stage 1: anomaly investigation (sim/anomalies.py) + art pipeline draft
- Pool of 6 anomalies, slots 1-3, confidence dial T 1-5, assist (speed / extra slot with a lying Pell), enemy tempo 0.7/1.0/1.5.
- First result: T=1 wins in every configuration (confidence dial is not a real choice); beats per hunt 0.5-3.5 (target 8-15). Sent to the critic. Do not tune until the critic returns.
- `docs/art_pipeline.md` drafted: manifest of named slots, placeholders first, radar as a shader, controls as components, style bible before final assets.

## Stage 1 critic result -> anomalies_v2.py
- Critic (subagent) diagnosed T=1 dominance: false rule-in was nearly free (chase skipped hazard), memoryless hazard, weak lures. v2: 3-stage visible approach clock, chase at 2.5x hazard with 50% bait, 8 anomalies / 2 real, 2-minute engagement beat, lure strength per hunt, sharpening beat.
- Result: beats 8-11 per hunt, 12-20 minutes, first beat ~1.5 min, longest quiet ~3 min, T1 never wins, T4-5 never win; T2 best in most contexts (T3 for strong lure + slow enemy). Curves flat (T2 vs T3 gap 3-8 points) so collapse the dial to Quick/Standard/Thorough and show lure-likeness and enemy tempo in the UI.
- Still open: more slots never worse (steepen sensor draw to ~0.05/slot); Pell's lies must be detectable later; add chase-or-ignore decision.

## Stage 2a: cone density (sim/cone_density.py)
- Best cone width tracks the Fan width (sigma 1: s 0-1; sigma 2.5: s 2; sigma 5: s 3; sigma 9: s 5). Heavy grid forces a tight cone (s<=1) at every Fan size. Light grid shifts the optimum only slightly.
- Weakness: heavy grid is a cliff (spread volleys score 0.00). Soften with windows = 1 + min(1, s/4).

## Stage 2 critic result (cone, arrival, probe)
- Cone: best width ~0.6 x Fan (cap 5 km). Heavy-grid cliff was a model artifact; softened (windows = 1 + min(1, s/4), intercept cap 0.9) in sim/cone_density.py so heavy grids slope instead of dropping to 0. Grid read is worth only ~1-2 points; to make it matter, make heavy grids bite tight volleys (channel-limited kills) - TODO.
- Arrival: baseline postures flat (0.21-0.25) but 53% draws and a median 4-minute resolution. The escort squeeze (drift 1 km/min to center after minute 8, shot threshold relaxes 0.3 km/min) plus close buff cuts draws to 35%; CHOSEN variant (sim/hunt2d_squeeze.py): still 0.33 / evade 0.38 / close 0.27. Baseline sim/hunt2d.py kept. Note: my own first squeeze edit was wrong (and peeked at enemy position); replaced by the critic's.
- Probe radius (sim/probe_radius.py): best radius ~1.2 x Fan; probing pays only when Fan >= 5; small-then-large escalation loses on exposure (good trap). Fix applied: probe never degrades the fix.
- Playability asks: show ghost marks for recommended cone (0.6 x Fan) and probe radius (1.2 x Fan); expected-hit bar; give 'close' a purpose (faster re-fix after probe); forced beats (patron snap, vent warnings, probe-detected alert); minutes 1-4 of waiting while still is the boredom risk.

## Stage 3: playable 2D hunt (web/hunt_engine.js, hunt_template.html, hunt.html)
- Engine mirrors sim/anomalies_v2 + cone_density. New in the playable: tracking a locked target tightens the Fan (sigma = max(1, 9.5 - 2 x track minutes)); tracking glows (+0.07 hazard per tracked slot); misses light up the launch 50% of the time; squeeze after minute 8 (hazard +4%/min).
- Bot results (naive fixed plan, T=2): win 32-66% by context, 9-14 beats, interior optimum at ~4 tracking minutes. Confidence setting barely matters (flat), consistent with the critic. Humans have posture, probes and adaptation, so expect higher.
- Not yet in the playable: probe radius (probe is a fixed loud boost), arrival card, Pell's contradicted-lie reveal, 2D movement of the player.
- Build: ./web/build_hunt.sh inlines the engine into web/hunt.html (the published page). Placeholder UI; art per docs/art_pipeline.md.

## Stage 3 critic result -> playable v2
- Critic found: Evade strictly dead (worse on both axes); grid read cosmetic; Fan never decayed; tracking glow too weak; costs hidden in the UI; no calm exit; 0-ship breach harsh (22%).
- Fixes: postures now trade (still 0.8x hazard/1.0 rate, evade 0.5x/0.8, close 1.5x/1.4); Fan grows 0.35 km per idle minute; 4 missiles with channel-limited grid intercepts (heavy 3 channels @0.7) so heavy grids need a tighter Fan (win 22-29% vs 40%+ vs none/light at track 4-5); trackGlow 0.10; misses pip 60%; base hazard 0.045. Added Break contact (calm exit) and softer 0-ship ending. UI: tooltips for posture, probe cost, Pell's 10% lie rate, hit-chance readout beside the cone, meters scaled to the chosen setting.
- Naive bot now 29-44% (never reads the grid, never adapts). Posture 33/32/30, tracking optimum 4-5 min, cone tight best (flat 0-2), beats 12-14, 17-18 min.
- Open: cone is still mostly "do not go wide"; no hunter-activity line per minute; probe radius dial and arrival card not in the playable; Pell lie reveal rare.

## Dave's wedge model (path-based Fan) -> playable v3
- Dave: the wedge should start at the contact's last-scan position and fan out along its projected path (position certain at scan time, path uncertainty grows), with shading showing likely progress over time, and the volley placed along the path.
- Engine: ships now move (real/lure 1.0-2.2 km/min, ghosts slower); locking anchors the ship (position +/-0.4 km, heading error 0.6 rad and speed error 45% at track 0, shrinking each tracking minute to 0.05 rad / 6%). Cross-path uncertainty = speed x time x heading error; along-path = speed x time x speed error. Missile speed 8 km/min, so aim leads the target; shots are judged against the ship's TRUE position at impact. Volley = 4 missiles, along-path spread 1.5x cross.
- UI: wedge drawn from the anchor with per-minute ticks, shaded by likelihood of being at that part of the path now (ring = best guess, fades as the scan ages); aim slider along the path (Abara's suggestion leads the target), cone ellipse drawn to scale, hit-chance readout from the player's own picture.
- Bot: aiming at the current position wins 1% vs 48% when leading. Tracking optimum 4 min (45-48%). Cone best ~0.5 x cross spread at every tracking level (wider only hurts), so the rule is learnable. Posture 48/48/49 with different hunt lengths (evade 21 min, close 14).
- Open: lures move like real ships so movement is not yet a tell (could become evidence); hunter side not modeled spatially; probe radius still pending; Operating Rules doc still describes the old circular Fan (update next).

## Real-time report-stream prototype (web/hunt_rt_engine.js, hunt_rt_template.html, hunt_rt.html)
- Dave: real time is critical for urgency; unlimited time between turns turns analysis into work. Pause blanks the displays (no free analysis); "slow time" is an assist option.
- Design change from Dave: Pell must NOT lie (he does not want to be destroyed by bad data). The cost of using Pell is INTEGRATION: a persistent meter that rises while he assists; thresholds at 25/50/75/100 unlock behavior and narrative (volunteers observations; recommends a call on every contact; acts on standing orders without asking; asks for a seat at the table). Pell also runs the ship's compute hot (extra glow). Integration carries across hunts (localStorage in the prototype). Old 10% lie mechanic removed.
- Engine: continuous time in game minutes (20 real seconds per game minute). Three analysts read contacts on their own schedule (Dace thermal, Castellan reactor, Quill occlusion); auto sweep is slow and noisy, focus is fast and precise but glows. Reports arrive in a feed and update per-channel bars (readings decay with a 3-minute half-life). Lures fake thermal and reactor imperfectly (0.78 / 0.68 x range) and cannot fake occlusion; about 22% of contacts have no star behind them, so occlusion is blind. The player is the confidence threshold: Lock (wrong call = 4 minute chase at 2.5x hazard, 50% bait) or Dismiss. Tracking a locked ship = focus an analyst on it. Volleys now fly in real time and resolve against the ship's true position at impact.
- Bots with reaction delay: win 31-52% depending on policy (guess blind 47%, slow human 31%, patient never guessing 31%, with Pell 52% and about 4 game minutes faster). Hunts 19-29 game minutes (about 6-10 real minutes at 20 s per game minute). Hazard retuned to base 0.032, trackGlow 0.06, focusGlow 0.015, squeeze ramp 0.08.
- Not yet: probes with origin line, warning receiver reports, standing orders, EMCON, crew reaction to integration, Pell advice acting on aim.

## Real-time critic result -> bridge v2
- Critic: load front-loaded (6-7 reports/game-min early, ~1 after minute 10), decisions peak minutes 3-9 then a lull; pips arrived metronomically with no warning; Pell mildly dominant; cone/aim dead because the UI stated the optimum; posture mostly dead (evade dominated).
- Applied: warning receiver (each hunter bump is telegraphed 0.8 game min ahead; Go quiet for 2.5 min, 10 min cooldown, cancels a sweep 60% and drops hazard to 0.2x but suspends all analyst work); wrong locks cost more (5-minute chase, 75% bait); evade analyst rate 0.9; Abara's aim suggestion under-leads by 28% and the cone hint is removed; Pell crew friction (analysts 8% slower per 25% integration above 25%); hunter base 0.04; squeeze ramp 0.12; 16 real seconds per game minute; UI: warning countdown and Quiet button, DECIDE cue on contacts with enough evidence, clamped bars, sticky engage panel.
- Bots: quiet-on-warning 57% vs 41% without; Pell +6 points within a single hunt (his real cost is the persistent integration and its crew friction, which only bites after several hunts); slow human 43%; hunts about 27 game minutes (about 7 real minutes).
- Still open: Pell has no real cost inside a single hunt (campaign-level cost by design, needs a playtest across hunts); late-hunt lull (add a patron snap or second hunter beat around minute 10-15); standing orders at 75%; refusing Pell's seat at 100%; probe with origin line; tracking optimum is short (glow is the price); evade/close are only mildly live.

## Bridge console layout (Oct 23)
Playtest feedback: information presentation unclear (contact status, channel meaning, own-ship state, no active ping). Reorganized into console zones: small radar (about 1/4 width) beside two-column contact slips with status chips and per-channel bars; bottom row of Ship status (posture, hunter pips, heat signature with contributors, power draw, hull and systems), Weapons (3 salvos, 3 min reload, in-flight volleys, engage form lives here), Crew (analysts, Pell integration), Reports. Field manual moved into an overlay. Engine: `exposure()` for display, `tubes`/`reload` limit salvos (bot win rates unchanged: 57% quiet baseline). Power draw is derived display only; hull and system health are static placeholders (no damage model yet). Active ping designed, not built.
Radar labels now evolve: bare number, then a colored pip per established channel, then type guess with odds once two channels are in (`classify()` uses only the player's readings plus rough range; calibration check over 500 hunts: top pick right 83% passive and 99.6% focused, 0.6-0.8 bucket right 82%). Stealth readout (Cold/Warm/Hot with hysteresis, Dark when quiet) added to the header and radar, with a report when we go hot and when heat comes down. Power draw stays flat, unallocated display by design.

## Friend or foe (Oct 23)
Design from the Star Wolf rundown: signature profiling dropped (salvaged ships), pre-planned vectors kept (an ally that enters the system with us is green from the start, permanent, weapons safe, ignored by analysts and Pell), tight-beam challenge kept in the engine (`challenge()`, `friendly: 'unlisted'` mode) but not exposed in the UI after playing with it: bots fratricide 51% blind, win falls to 26% if they challenge everything. Dave also asked: no deviation-from-plan mechanic. New rule: a ship that actively pings us (each hunter sweep, `pingBy()`) is flagged red HOSTILE 100% at once and, if we had ruled it out, comes back open (a recovery from wrong dismissals). Fixed: heat bar width was applied to the tick mark instead of the fill.

## Close quarters (Oct 23)
Playtest notes: (1) multiple volleys at one target were silently refused while one was in flight; removed, salvos (3, 3 min reload) are the only limit, and a volley that arrives at an already crippled ship is reported as wasted. (2) Crippled message now describes status (drive flare gone, thermal bloom collapsing, neutrino line cut, drifting) and the slip says the same. (3) The shaded wedge is our own uncertainty about where the target is, not an attack cone, but when it passes over us the aim point is near our hull: missiles now scatter onto our ship too (2 km radius, 25 hull each, volley planner shows the risk and turns the aim line red), hull is a real stat (below 60% sensors run 15% slower, zero forces an emergency breach). Detonations within 8 km of us, and a locked warship within 8 km, raise heat. New point-blank coilgun: under 6 km, instant, ignores scatter grids, no salvo used, 2 min cooldown, loud (heat spike, 50% hunter step). Bot check at 4 km: missile 70% hit with about 10% average hull loss, coilgun 87% hit. Bot win rate 60% to 54% (friendly fire and blast heat).

## Navigation, speed, launch briefing (Oct 23)
Playtest: needs navigation orders, speed/engine heat, slower start. Built: the ship now has a position (radar follows it). Click a contact (radar or slip) for a menu: Close, Separate, Evade, Active ping (directional, crisp fix, loud, 4 min cooldown, 45% chance a pinged warship answers with a hunter step), Target/Lock on. Speed Creep/Cruise/Burn (0.4/1/2 km per min; engine heat 0/0.03/0.11; burn also makes sensors 20% slower); engine heat only while moving. Stance still/evasive replaces the old four-way posture. Opening geometry: ship starts at the left edge (x 3/5/11 by arrival type), contacts spawn x 22-37 heading roughly toward us (14-33 km away); stand-still bot still wins 58%. Launch briefing before every hunt: arrival (Running dark: hazard x0.5 for 6 min but sensors x0.8 for 4; Standard; Hot arrival: starts 6 km closer, wake heat for 3 min), plan speed, pace (24/16/11 s per game minute), ally on/off, and a flight plan drawn by clicking waypoints; the navigator flies it until a contact order overrides, Resume plan continues. Bot check of arrival types (non-navigating bot): dark 58%, standard 58%, hot 53%. Note bots cannot use the plan or orders yet; no balance data for navigating play.

## Stance consistency fix (Oct 23)
Dave: standing still should be the hardest to detect. It was not: Evasive (weave in place, no net movement) had a lower hazard than Hold still, so it was strictly quieter for a small analyst slowdown. Fixed: Hold still stays the quietest (0.8x); Evasive is now 1.0x (25% louder) but 40% of sweeps that reach us miss ("lost in the weave"). Non-navigating bot: still 56% win / 40% found / 27 min; evasive 54% / 38% / 33 min, so it is a genuine safer-but-slower alternative. Open: stillness is still the default best for a bot that never moves because contacts drift toward us; needs navigating-bot and human playtests to see whether it is too strong. Concept doc updated with all of today's decisions (radar labels, friend or foe, stealth, navigation, briefing, close quarters, ping).
Revised (Dave): evade should speed analysis modestly at a modest stealth cost, because new angles help triangulation. Dodge mechanic removed. Any movement (orders, flight plan, evasive weave) gives analysts +10% (`moveRate`), burn still adds engine noise (0.8x); Evasive is 0.95 vs Hold still 0.8 (about 20% louder). Non-navigating bot (which cannot use the speed-up well): still 56% win / 40% found, evasive 53% / 43%. No explicit hide-as-debris mode: the debris effect is just low engine heat when still, left to tuning.

## Bridge screen rebuild (landscape, three views) and firing solutions

- New fixed no-scroll frame scaled from a 1440x900 design (transform scale, works at 1366x768 and up). Alert strip on top (clock, hunter pips + sweep countdown, signature + largest contributor, Go quiet / Break contact, report ticker, hull + salvo lamps, view tabs, pause/manual/new).
- Views: Tactical (1), Strategic (2: arena map with plan editing, contact ledger, timeline), Target (3: fire-solution plot, bearing/range/bow-angle/speed dials, aim lead and cone dials, hit chance, danger-close lamp, coilgun, fire). Esc = back, P = pause, Q = go quiet. Ticker hidden in Tactical (Reports panel is there).
- Evidence bars on each slip are the analyst toggles (click Heat to point Dace). Study buttons removed.
- Engine: locking starts a firing solution (`solveInfo`): time from 0.35 to 2.0 game min driven by sensor resolution (three channels), track age, clutter within 6 km, hull damage, Pell assist, paused while dark. Velocity and distance do not affect time. Fire refuses until ready. Target maneuvering is a planned factor (no maneuvering targets yet).
- Ship heading (`S.hdg`) and `relBearing`; bearings in Target view are off our bow. `setRoute`, `orbit` order (2/4/8 min), orders can have a duration.
- Design spec and Dave's decisions: docs/ui_layout.md.

## Playtest round 1 fixes
- Slower scanning (autoPeriod 0.8, focusPeriod 0.45), lower analyst/tracking heat (focus 0.010, track 0.030, base 0.02), solution tightens the track (hit chances were very low because the wedge was stale at solve time).
- Contacts reflect off the arena edges (`fold`) instead of leaving.
- Contact bubbles show uncertainty (`uncertainty`): grows as readings go stale, shrinks with evidence; displayed position jitter scales with it. Hot/cold contact behavior will hook into this later.
- Missiles in flight are drawn on the scope, Strategic map and Target plot (`missilePos`, per-volley offsets so the drawn landing spots are the real ones).
- Found-rate readout ("a sweep finds us about N% per game minute") and COLD/WARM/HOT zones on the heat bar; analyst bar tooltips state their heat cost.
- Briefing: "Pace of the hunt" renamed "Game clock speed" with a real explanation.
- Bot win rates after the tuning: about 36-40% (was 58%); reflects the slower scanning, to be judged by human playtest.

## Playtest round 2
- Removed the clock-speed toggle from the briefing (fixed 16 s per game minute). In-game speed buttons 1/2x, 1x, 2x (keys [ and ]).
- Firing solutions go stale after 3 min without a fresh scan (they reset and re-solve); Refresh button in the Target view; target maneuvering slows solutions.
- Contacts now maneuver (legs): patrol turns for everything except static, harder turns once aware, and they steer away from the edges (fold kept as a safety net). Aware warships (pinged us, felt our ping, or a volley landed within 8 km) fire back every ~4 min at where they predict we will be; incoming red missiles on scope/map with a countdown in the strip; 8% hull per missile hit; going quiet pauses their fire. Dodge by moving.
- Scope zoom/pan (wheel, drag, +/-, Fit, Follow).
- Bots after changes: about 57-62% (they do not dodge; hull loss mild).

## Detection, heat sinks, bigger field (Oct 23)
- Detection model built as proposed (docs/detection_model.md, "As built"): info-rate reads from signature x sensor x range, planets block, enemy knowledge of us with a three-step fix, aware ships hunt toward a believed position. Old hunter sweeps and the "found" loss are removed.
- Heat sinks: stored heat only rises, vent (V) is the only way down and makes us 100 percent visible; forced vent at full. Same rules for enemies, who vent on their own schedule and light up when they do.
- Six enemy loadouts, ours is the plain cutter. 80 km arena with two stars and one or two planets; speeds, ranges and weapon sizes scaled x2. Strategic map zoom/pan; dials rescaled.
- Fixed: launch briefing markup (Begin button fell outside the box at 1366x768).
- Bots (rtbot6, perfect identification, vent when safe): about 78 percent wins, mean hull 62 at the end, 0.9 vents per hunt. Humans will do worse; tune by feel.
- Bug check: engine fuzz (300 seeds, random actions, NaN/range/planet checks) and browser fuzz (3 window sizes, random keys, menus, map zoom/drag/plan edit) are clean. Fixed: end screen reappearing over the briefing and over "Look at the screen" (now shown once per hunt); crippled ships kept a venting blaze (now cleared). Concept doc rev 47 has a "Hunt prototype as built" section; sim/rules.py (Operating Rules v0.1) still describes the old Fan and is superseded by docs/detection_model.md.

## Map symbols and derelicts (Oct 23)
- Eight SVG symbols (tools/make_symbols.py): destroyer, cruiser, battleship, base, outpost, debris field, derelict, anomaly. Contacts earn a symbol at 80 percent odds, class once readings are thick; crippled ships become derelicts with a salvage value (looting rule is a proposal in docs/derelicts_and_symbols.md). Symbol key in the manual.
- Fixed: venting was counted as heat fill, so the sink never drained; the sink panel now shows the net rate. Stray literal "\n" in the manual.

## Oct 24 - 240 km map, navigation, damage, salvage
- 240 km arena; right-click navigation; 6-missile salvos with area damage (killR 20, squared falloff), Standard/EMP/Flare warheads, homing seekers vs cold missiles with target reaction; four-outcome popups (video clip hook in assets/fx); sim-tuned constants (see docs/salvo_design.md).
- Derelict salvage in after-action report (docs/salvage_and_parts.md). Fix: splash on lures no longer counts toward the win.

## Oct 25: hunt fixes from Dave's scope feedback
- One star max per arena.
- Scanner bars: bar = significance (classification); thin line underneath = collection progress, turns green with a check when the read is complete. Analysts stand down on a contact once their read is complete (no more heat), sweeps skip finished channels.
- Heat sink header cell is the vent toggle (also V). Fins can always be retracted, even a forced vent (a mistake you can make); label reads FINS OUT: click to retract.
- Ping: three read rounds, and a locked contact's solution refreshes in about 10 seconds.
- Stale Fire button now reads REFRESH SOLUTION and recalculates on click.

## Oct 25 (evening): heat rate and navigation
- Heat sink refill slowed (sinkK 0.7, burn is an afterburner at about 80 percent per real minute), vent drains faster, heat rate dial with hover previews and "full in" clock, UI time in real minutes, per-waypoint speed with shift-queue, relaxed vs alerted hunters at dog-legs. Bot: 79 percent win, 15 percent breach, 2.4 vents per hunt.
- Redline (9 km/min) overheats: pegged sink costs 3 hull and 15 percent systems per game minute, with Castellan calls. Reports panel: key reports only by default, optional all; officer voice via browser speech (off/slow/normal/fast), important calls only, each kind at most every 20 s.
- Contact menu regrouped (Scan, Navigate), Re-analyze, Investigate, analysts hold when a read or solution is complete, keep-out zones around planets and the star, drag and wheel targeting, LIVE versus PROJECTED marks.

## Oct 25 (night): UI v2 console implemented
- The hunt screen is now a fixed 1920x1080 stage (scaled to fit) of zones and widgets: rail, sensors, contacts slips, orders bank (I/G/L/D/R, Tab), 56u scope and helm, weapons, comms, heat, signature, ship. Source: `web/hunt_console.js`, `web/hunt_console.css`; `build_hunt_rt.sh` splices them into the template. Old DOM lives hidden in `#legacy` so the existing updaters still run.
- NEXT beacon names the one thing to do now. Hover over any heat-affecting key previews heat rate, fill clock and seen-by-enemy.
- Strategic: map glass plus route editor, per-leg cells; ledger and timeline cut. Target: solution strip, plot, six dials, ammo and homing keys, hit chance, guarded FIRE SALVO.
- Engine: `visIf` and `modState` for what-if previews (heat rate numbers unchanged).
- Pause blanks sensors, contacts and scope; rail and heat stay live.

## Oct 25 (night, later): guards and Redline burns
- FIRE SALVO has a flip-up guard: click lifts the cover (hazard plate, 4 second re-close), second click fires. It only appears when a solution is ready and a tube is loaded.
- Redline is a heated-seat key: 1 press = 30 s burn, 2 = 2 min, 3 = latched, 4 = off; another speed cancels. Engine `redlineBurn`, `s.burn`; expiry returns to the previous speed with a Castellan call. Display shows level dots and a countdown.
- New console smoke test `tests/smoke4.py` replaces the obsolete rtsmoke3, plus `tests/burntest.js` for the burn timers.
- Redline intervals changed to 15 s / 30 s / latch (a 2 minute burn always melted: about 40 hull and 65 percent systems). Redline key is dark when the ship is stopped and backlit under way; stopping ends a burn. FIRE SALVO guard is dark (shows SOLVING or RELOADING) until a solution is ready, then backlit and pulsing.

## Oct 26: random enemy count
- Each hunt now has 1 to 3 enemy warships (random, chosen at the briefing, hidden from the player; `brief.nreal` passed to `newHunt`). Dog-leg stopovers also roll 1 to 3. Engine default stays 2 so headless tests are unchanged. Classifier priors now use `s.nreal` instead of `P.nreal`. Debrief and win text no longer say "both". Bots: 1 enemy wins about 90 percent, 3 enemies about 61 to 78 percent.
- Convoy strikes added to the roadmap's parking list (reviewed at Stage 5).

## Oct 26: playtest fixes
- A warship that fires on us, or extends heat fins where we can see the thermal blaze, is now identified as hostile (100 percent, red slip, cannot be dismissed, analysts' advice says ship). Before, only the reports said so and the odds could still read DECOY. Engine: `markHostile`, classify and advice override. Non-real contacts are never marked. Bots win a little more often (82/85/92 percent vs 76/76/89).
- "Solving paused" now says why: SENSORS DARK (we went quiet) or TRACE TOO FAINT (too far, cold or behind a body; close the range, wait for it to vent, or clear the line of sight). Hover text explains.
- Field patch kit text: repairs hull slowly in the field (about 1 point a minute) and 8 percent faster at dock. The refit effects are still not wired into the engine (dock screens come later).

## Tracking model: lock vs. inferred position (weeks 1-2 of the tracking plan)
- Solve time now depends on target speed (+20% per unit), a lit backdrop (x0.6 faster), and recent maneuvers (within 3 game min). Measured real-seconds averages (`tests/tracktest.js`): backlit still 8, still 26, fast 78, maneuvering 89, cold far 51.
- Probabilistic fixes: a locked contact only gets a fix with probability clamp((m - 0.35)/0.4); cold or far targets go unfixed and the wedge widens (drift floor `driftK` 0.9 x t^1.5, plus a floor from the original fix error).
- Solution is gated on certainty (`certReady` 0.6); low certainty pauses solving with the reason POSITION UNCERTAIN and bleeds progress. A course change by a moving target costs 35% of progress.
- `E.trackState` gives LOCK / TRACK / LAST. UI: slip shows CERT% plus state word, Target lamps LOCK/TRACK(LAST), scope bracket solid / dashed (label TRACK xx%) / dotted ring (LAST KNOWN).
- Stage 0 log: `S.warn` records missile warning lead time per enemy launch.
- Stealth cost at 100%/Redline left as is by decision. Bot baseline win rate dipped (66% baseline, 79% with Pell) against 1-3 random enemies; watch in playtest.
- Not yet: amber/cyan blend with age ring, HEARS US band, stealth missiles.

## Throwaway prototypes (not wired to the engine)
- `design/proto_25d.html`: 2.5D depth-band scope. Rejected by decision; game stays 2D (lore idea: Pell flattens the volume into a plan view).
- `design/proto_shipwalk.html`: walkable 3D greybox of the ship (three.js r128). One deck, eight compartments, four crew plus Pell, three mini-missions (relational, mechanical, diplomatic), arrival and briefing table, minimap, T auto-walk, walked-meters counter. Purpose: judge whether walking the ship and the little jobs are fun. Mission outcomes are previewed as hunt modifiers only.
- `design/proto_iso.html` + `design/assets/engineering_room.png`: isometric underway demo built on Dave's generated Engineering room art (source GIF was animated/dithered at 640x360; frames averaged into a clean PNG, background keyed to alpha, upscaled 2x). Floor diamond fitted by hand (T 320,131; R 515,230; L 125,230 in source px), 10x10 walk grid with blocked prop cells, click-to-move BFS, Castellan and hatch interactions. Crew figures and glows are stand-ins.
