# Firing solutions and g-load (design, 2026-11-20)

Decisions from Dave, with the proposed mechanics. Not built yet unless marked.

## 1. Drive pegged to gravity
- Normal drive is 1 g. Transit is accelerate, flip at the halfway point, decelerate at 1 g. Combat manoeuvring is separate and uses higher loads.
- Proposed values (to confirm): redline about 3 g for about 30 s; emergency about 6 g for a few seconds; flip time open (currently about 150 s).
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
- Sometimes the officer has a hunch (for example "I think they'll break left"). It arrives as a call card with options: take the hunch, stay on the numbers, or wait (Wait is always available).
- The hunch is drawn from the target's real hidden state, with accuracy set by the officer's skill. Good officers are right more often than not, but never always.
- A wrong hunch costs the shot; the result feeds the officer's standing with the captain.
