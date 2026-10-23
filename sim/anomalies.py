"""Stage 1: anomaly investigation. Run: python3 -I sim/anomalies.py
A hunt has N anomalies: real ships (usually 1), lures (fake infrared/reactor), ghosts (static). Each slot works one anomaly per minute and adds evidence
e += Normal(+-d*q, 1): + for a real ship, - for junk (lures only -0.4d, since occlusion cannot be faked but lures mimic two of three channels).
Dial T (confidence): rule in at e>=T, rule out at e<=-T. A false rule-in costs a chase (CHASE minutes); if every anomaly is ruled out and the real one was missed, rescan costs RESCAN minutes and wipes evidence.
The enemy finds you with hazard h = BASE*tempo + DRAW*active_slots per minute (sensors draw power and heat). You win by correctly ruling in the real ship first.
Beats = rung changes (ruled in/out events + new strongest candidate).
Assist modes: none, speed (+25% evidence rate), slot (+1 slot, but Pell lies: 10% of his slot-minutes give inverted evidence)."""
import random, math, statistics
N_ANOM, CHASE, RESCAN, BASE, DRAW, D = 6, 4, 6, 0.035, 0.012, 0.55
def hunt(slots, T, tempo, assist, q, rng, n_real=1, clock=40):
    kinds = ['real'] * n_real + ['lure'] * 2 + ['ghost'] * (N_ANOM - n_real - 2)
    rng.shuffle(kinds)
    ev = [0.0] * N_ANOM; state = ['open'] * N_ANOM
    t = 0; beats = 0; quiet = 0; longest = 0; k = slots + (1 if assist == 'slot' else 0)
    speed = 1.25 if assist == 'speed' else 1.0
    while t < clock:
        openi = [i for i in range(N_ANOM) if state[i] == 'open']
        if not openi:
            if any(kinds[i] == 'real' and state[i] == 'out' for i in range(N_ANOM)) :
                t += RESCAN; ev = [0.0] * N_ANOM; state = ['open' if state[i] != 'in' else 'in' for i in range(N_ANOM)]; beats += 1; continue
            return ('none', t, beats, longest)
        # enemy hazard
        if rng.random() < BASE * tempo + DRAW * min(k, len(openi)): return ('found', t, beats, longest)
        t += 1; event = False
        # highest-evidence anomalies first (player works the likeliest)
        order = sorted(openi, key=lambda i: -ev[i])[:k]
        for i in order:
            mean = D * q * speed * (1 if kinds[i] == 'real' else (-0.4 if kinds[i] == 'lure' else -1))
            if assist == 'slot' and i == order[-1] and rng.random() < 0.10: mean = -mean
            ev[i] += rng.gauss(mean, 1)
            if ev[i] >= T:
                state[i] = 'in'; event = True; beats += 1
                if kinds[i] == 'real': return ('win', t, beats, longest)
                t += CHASE; state[i] = 'out'
            elif ev[i] <= -T: state[i] = 'out'; event = True; beats += 1
        if event: longest = max(longest, quiet); quiet = 0
        else: quiet += 1
    return ('clock', t, beats, longest)
def table(tempo, assist, q=1.0, M=1500):
    print('\ntempo %.1f, assist=%s, sensor q=%.1f: win%% / found%% / mean beats / longest quiet (min)' % (tempo, assist, q))
    print('  T:      ' + ''.join('%-24d' % T for T in (1, 2, 3, 4, 5)))
    for s in (1, 2, 3):
        row = []
        for T in (1, 2, 3, 4, 5):
            rng = random.Random(100 * s + T); R = [hunt(s, T, tempo, assist, q, rng) for _ in range(M)]
            w = sum(r[0] == 'win' for r in R) / M; f = sum(r[0] == 'found' for r in R) / M
            row.append('%2.0f/%2.0f/%4.1f/%3.1f          ' % (100 * w, 100 * f, statistics.mean(r[2] for r in R), statistics.mean(r[3] for r in R)))
        print('  slots %d ' % s + ''.join(c[:24].ljust(24) for c in row))
if __name__ == '__main__':
    for tempo in (0.7, 1.5): table(tempo, 'none')
    table(1.0, 'speed'); table(1.0, 'slot')
