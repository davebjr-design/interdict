"""Two-sided 2D hunt. Run: python3 -I sim/hunt2d.py [N]
Postures: still (silent, no move), evade (random jink, tracks you harder), close (advance on best estimate, loud).
Probe habit: never / blind (ping when blind) / often (every 3rd min). A ping lights up the pinger to the other side.
Each side hears the other: signal = emission / (1+(d/10)^2). Sump fills by posture; full sump => vent bloom.
A side fires when its estimate sigma <= 3.5 km and range <= 20 km (4 missiles, aim scatter 1 km, kill radius 3 km); reload 3 min; firing is loud."""
import random, math, sys, itertools
POST = {'still': dict(e=0.3, fill=0.04, move=0.0, grow=0.8), 'evade': dict(e=0.8, fill=0.12, move=2.0, grow=1.6), 'close': dict(e=1.4, fill=0.22, move=3.0, grow=0.8)}
class Side:
    def __init__(s, pos, post, ping): s.pos = list(pos); s.post = post; s.ping = ping; s.sump = 0.2; s.est = None; s.sig = 25.0; s.reload = 0; s.emit = 0.0; s.pinged = False
def dist(a, b): return math.hypot(a[0] - b[0], a[1] - b[1])
def step(a, b, rng, t):
    P = POST[a.post]; a.emit = P['e'] + a.sump
    a.sump += P['fill']
    if a.sump >= 1.0: a.emit += 6; a.sump = 0.4
    a.pinged = (a.ping == 'often' and t % 3 == 0) or (a.ping == 'blind' and a.sig > 6 and t % 2 == 0)
    if a.pinged: a.emit += 5
    if P['move']:
        if a.post == 'close':
            tgt = a.est or (20, 20); d = dist(a.pos, tgt) or 1; k = min(P['move'], d) / d
            a.pos[0] += (tgt[0] - a.pos[0]) * k; a.pos[1] += (tgt[1] - a.pos[1]) * k
        else:
            ang = rng.uniform(0, 6.283); a.pos[0] += P['move'] * math.cos(ang); a.pos[1] += P['move'] * math.sin(ang)
def observe(a, b, rng):
    d = dist(a.pos, b.pos); grow = POST[b.post]['grow']
    a.sig = min(30, a.sig + grow)
    S = b.emit / (1 + (d / 10) ** 2)
    if S > 0.2:
        so = 5.0 / math.sqrt(S / 0.2) if not b.pinged else 1.0
        so = max(so, 0.8)
        if so < a.sig:
            a.est = (b.pos[0] + rng.gauss(0, so), b.pos[1] + rng.gauss(0, so)); a.sig = so
    if a.pinged:
        so = 1.2 if d < 25 else 4.0
        if so < a.sig:
            a.est = (b.pos[0] + rng.gauss(0, so), b.pos[1] + rng.gauss(0, so)); a.sig = so
def fire(a, b, rng):
    if a.reload > 0: a.reload -= 1; return False
    if a.est and a.sig <= 3.5 and dist(a.pos, a.est) <= 20:
        a.reload = 3; a.emit += 4
        for _ in range(4):
            ax, ay = a.est[0] + rng.gauss(0, 1), a.est[1] + rng.gauss(0, 1)
            if math.hypot(ax - b.pos[0], ay - b.pos[1]) < 3.0: return True
    return False
def match(pa, pb, rng, T=40):
    A = Side((rng.uniform(0, 40), rng.uniform(0, 40)), *pa); B = Side((rng.uniform(0, 40), rng.uniform(0, 40)), *pb)
    while dist(A.pos, B.pos) < 18: B.pos = [rng.uniform(0, 40), rng.uniform(0, 40)]
    for t in range(1, T + 1):
        step(A, B, rng, t); step(B, A, rng, t)
        observe(A, B, rng); observe(B, A, rng)
        fa, fb = fire(A, B, rng), fire(B, A, rng)
        if fa and fb: return 'D', t
        if fa: return 'A', t
        if fb: return 'B', t
    return 'D', T
if __name__ == '__main__':
    N = int(sys.argv[1]) if len(sys.argv) > 1 else 400
    pols = list(itertools.product(['still', 'evade', 'close'], ['never', 'blind', 'often']))
    names = ['%s/%s' % p for p in pols]
    rng = random.Random(11); score = {n: 0.0 for n in names}; games = {n: 0 for n in names}; tsum = 0; tn = 0; draws = 0; total = 0
    for i, pa in enumerate(pols):
        for j, pb in enumerate(pols):
            if i == j: continue
            for _ in range(N // 8):
                r, t = match(pa, pb, rng); total += 1
                games[names[i]] += 1; games[names[j]] += 1
                if r == 'A': score[names[i]] += 1
                elif r == 'B': score[names[j]] += 1
                else: score[names[i]] += .5 * 0; draws += 1
                if r != 'D': tsum += t; tn += 1
    print('win rate by policy (draw/timeouts count as no win):')
    for n in sorted(names, key=lambda n: -score[n] / games[n]): print('  %-14s %.2f' % (n, score[n] / games[n]))
    print('draws %.0f%%; mean minutes to first hit %.1f' % (100 * draws / total, tsum / max(1, tn)))
