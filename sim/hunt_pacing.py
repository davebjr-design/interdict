"""Pacing of the 2D hunt. Run: python3 -I sim/hunt_pacing.py
A beat = a minute where anything notable happens to the player (side A): a new fix on the enemy, an enemy ping or vent heard, a shot either way.
Reports, per pressure-clock length (minutes until the escort arrives and the hunt ends), P(shot lands), beats/min, longest quiet run, first beat.
Fun targets (hypothesis to playtest): first beat inside 3 min; no quiet run over 3 min; 8-15 beats total; most hunts resolve before the clock."""
import os, sys, random, statistics
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hunt2d as H
def run(pa, pb, rng, clock):
    A = H.Side((rng.uniform(0, 40), rng.uniform(0, 40)), *pa); B = H.Side((rng.uniform(0, 40), rng.uniform(0, 40)), *pb)
    while H.dist(A.pos, B.pos) < 18: B.pos = [rng.uniform(0, 40), rng.uniform(0, 40)]
    beats = []; quiet = 0; longest = 0; first = None
    for t in range(1, clock + 1):
        prev = A.sig
        H.step(A, B, rng, t); H.step(B, A, rng, t); H.observe(A, B, rng); H.observe(B, A, rng)
        fa, fb = H.fire(A, B, rng), H.fire(B, A, rng)
        beat = A.sig < prev - 1.0 or B.emit >= 5 or fa or fb
        if beat:
            beats.append(t); first = first or t; longest = max(longest, quiet); quiet = 0
        else: quiet += 1
        if fa or fb: return ('hit', t, len(beats), max(longest, quiet), first or clock)
    return ('clock', clock, len(beats), max(longest, quiet), first or clock)
if __name__ == '__main__':
    pols = [('still', 'blind'), ('evade', 'blind'), ('close', 'blind'), ('close', 'never'), ('still', 'never')]
    print('clock | P(shot) | beats | beats/min | longest quiet | first beat (min)')
    for clock in (8, 12, 16, 20, 30):
        rng = random.Random(21); R = []
        for a in pols:
            for b in pols:
                for _ in range(80): R.append(run(a, b, rng, clock))
        ph = sum(r[0] == 'hit' for r in R) / len(R)
        beats = statistics.mean(r[2] for r in R); mins = statistics.mean(r[1] for r in R)
        print('%5d | %.2f    | %5.1f | %.2f      | %.1f           | %.1f' % (clock, ph, beats, beats / mins, statistics.mean(r[3] for r in R), statistics.mean(r[4] for r in R)))
