# Firing solutions and g-load (design, 2026-11-20)

Decisions from Dave, with the proposed mechanics. Not built yet unless marked.

## 1. Drive pegged to gravity
- Normal drive is 1 g. Transit is accelerate, flip at the halfway point, decelerate at 1 g. Combat manoeuvring is separate and uses higher loads.
- Confirmed values (Dave, 2026-11-20): normal drive 1 g; redline about 3 g for about 30 s; emergency about 6 g for a few seconds. Flip time comes from the maneuver aggressiveness in section 1a, not a fixed 150 s.
- Skyscraper decks stack along the thrust axis, so a 1 g burn gives a real floor; the flip is free fall.

## 2. Per-character g tolerance
- Each crew member has `gTol`, the g at which they black out. Trained fighter pilots manage about 9 g with a suit and straining; untrained people black out around 4-6 g, lower with sudden onset. Sources: Wikipedia High-g training, FAA acceleration brochure, NASA TM-20205008196.
- Over 2 g the crew accumulate `gFatigue`, which lowers efficiency (through `crewEff`). Recovery is slow at 1 g and full in free fall.
- Onset rate matters: a sudden jump lowers effective tolerance (about 0.1 g/s gives warning symptoms, 1 g/s or more can give G-LOC with none).
- Braced crew only get a reduced fatigue rate and cannot be thrown. Unbraced crew also risk a knockout from falling. Blackout reuses the existing knocked-out state.
- `s.gLoad` already tracks the ship's load every tick; this adds the per-character layer on top.

## 3. Firing solution
- The solution predicts the target's position at weapon arrival: tracked position and velocity plus the reachable disc of radius 0.5 * a_max * t^2, where a_max depends on the target's class and crew tolerance. Identifying or probing a target shrinks the disc.
- The player sets the run-silent distance (how far from the target the missiles go active).
  - Far out: missiles are active longer and exposed to point defense, and the target has more warning.
  - Close in: more flight time on the estimate, so the solution is more sensitive to a stale track and the shot takes longer.
- The tactical officer reports a hit-probability range (low to high), widening with track age, distance and unknown target class. Where the whole reachable disc is covered, they call a no-escape zone.
- Hit probability = seeker coverage of the uncertainty region x survival of point defense over the active time.

## 4. Officer hunch
- Hunches should be really rare (Dave, 2026-11-20; transcribed from dictation, so confirm that this is what was meant).
- Sometimes the officer has a hunch (for example "I think they'll break left"). It arrives as a call card with options: take the hunch, stay on the numbers, or wait (Wait is always available).
- The hunch is drawn from the target's real hidden state, with accuracy set by the officer's skill. Good officers are right more often than not, but never always.
- A wrong hunch costs the shot; the result feeds the officer's standing with the captain.


## 1a. Maneuver aggressiveness and flip g
- Felt g at a crew position from a flip has two parts: spin-up (angular acceleration x distance from the pivot) and centripetal (spin rate squared x distance). Both peak at the halfway point of a bang-bang flip, where the centripetal part is about pi times the spin-up part. Peak felt g = sqrt(1 + pi^2) * alpha * r, about 3.3 * alpha * r.
- A 180 degree flip takes T = 2 * sqrt(pi / alpha); peak spin rate is sqrt(pi * alpha). Flip time scales with the square root of the distance r from the pivot.
- Crew distance: assume 50-70 m for the farthest crewed deck (CIC is at the bow, about 57 m from the hull's middle). The layout stays as it is: the crew section is forward so the dangerous aft sections can be severed and jettisoned in an emergency (see the hull spec).
- Presets (peak felt g at the far deck; flip time for r = 50-70 m): normal 0.25 g, about 29-34 s; firm 1 g, about 15-17 s; combat 3 g, about 8-10 s; emergency 6 g, about 6-7 s (rare). During a flip the main engine is off; during a turn-and-burn the two loads add as vectors.
- Plotted turn points are known ahead, so the crew automatically call for brace shortly before each turn (strapping in takes about 6 s, so about 10 s ahead for combat-grade turns; none for normal ones).

## 5. Why the limits exist (design theory, 2026-11-20)
Without crew limits a firing solution is nearly worthless: as soon as a vampire is detected the target could max its engines and cover a huge distance, so any predicted position would be wrong. The crew's g tolerance bounds how hard any ship can accelerate, which bounds the reachable set (radius 0.5 * a_max * t^2) and gives the firing solution something real to compute: a hit probability, and sometimes a no-escape zone.
- Aggressive maneuvering is penalised, not forbidden. Above about 2 g the crew accumulate fatigue and station efficiency falls; above individual tolerance they black out. The evader trades safety from the missile against the health of its own crew, and the player feels that trade on their own ship.
- The same bound applies to us: our best dodge is limited by Abara's and the crew's tolerance, and braced crew (reduced fatigue, cannot be thrown) can take more than unbraced ones.
- Identifying a target tells you its class and so its limits, which shrinks the reachable disc. That gives probing, hailing and identification a direct combat payoff.
- Per-character tolerance means a ship's best evasion depends on who is aboard, and crew training or recruitment can move it.

## 6. Firing solution sequence: decisions (Dave, 2026-11-21)
- **Identification odds** (is it a warship, decoy or static) show as normal on the contact card during detection.
- **Hit probability** (a range, low to high) shows only once the solution is resolved (SOL RDY), not on lock and not on request. Resolving the solution is what buys the number.
- **Run-silent distance** defaults to a standard 3/4 of the way to the target (missiles go active for the last quarter). The player can move it; the officer's pick is marked.
- **Hunches** are rarer than first proposed: about 1 solution in 10.
- **Recall.** No general recall of missiles. The one case that matters is a premature launch where a positive identification then comes back friendly. Proposal: the officer calls "ID returned friendly" and the captain can order a command-destruct, which works only until the missiles go active at the run-silent point. The nearer to the target the run-silent point is, the longer the recall window, which ties the distance choice to this risk.
- Command-destruct is optional and low priority (Dave: "not an important mechanic, but it seems like an option"). It is a radio command, so it gives the ship away: it counts as an emission that alerts every hunter, like the launch signature does.

## 7. Decoy payload (proposed 2026-11-21, scheduled after sections 3, 4 and 6)
A fourth magazine payload launched through the probe tube. It keeps the ship's velocity when released, so it travels the old track while the ship turns away; after a chosen delay (30 s, 1 min or 2 min) it lights up with a warship's heat and reactor signature. Limited count per sortie (about four). Hunters may fire on it (the launch gives their position away) and can still identify it as a decoy with enough readings. Pairs with the stealth turn on the nav planner. Order of work: resolved hit-probability readout, run-silent slider and hunches, then decoy and command-destruct.
