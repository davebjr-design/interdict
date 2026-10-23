"""Layered defense vs missile volleys. Run: python3 -I sim/defense_layers.py
Design source: Dave's Star Wolf rundown (stealth, ECM decoys, kinetic point defense, stasis field with a saturation limit,
compartmentalization). Anti-rock-paper-scissors idea: every layer is a capacity that a big enough volley saturates, so the
question is volume versus capacity (plus information), never 'type A beats type B'."""
import random, statistics
def volley(n, accuracy, staggered, d, fidelity, k, pk, S, rng):
    """Returns (ship_destroyed, stasis_used, intercepted)."""
    # cone: each missile must first fly the right corridor (prediction error, light lag)
    on_target = [m for m in range(n) if rng.random() < accuracy]
    # decoys split the volley by fidelity weight; real ship has weight 1
    real = [m for m in on_target if rng.random() < 1.0 / (1.0 + d * fidelity)]
    windows = 2 if staggered else 1
    engaged = min(len(real), k * windows)
    killed = sum(1 for _ in range(engaged) if rng.random() < pk)
    leakers = len(real) - killed
    return leakers > S, min(leakers, S), killed
def p_destroyed(n, acc, stag, d, fid, k, pk, S, N=6000, seed=1):
    rng = random.Random(seed); return sum(volley(n, acc, stag, d, fid, k, pk, S, rng)[0] for _ in range(N)) / N
PKG = {  # name: (decoys, fidelity, pd channels, pd kill, stasis capacity) and a rough upkeep cost label
 'stealth only':          (0, 0.0, 0, 0.0, 0),
 '+2 decoys':             (2, 0.7, 0, 0.0, 0),
 '+PD (2 channels)':      (0, 0.0, 2, 0.7, 0),
 '+stasis (cap 2)':       (0, 0.0, 0, 0.0, 2),
 'decoys + PD':           (2, 0.7, 2, 0.7, 0),
 'PD + stasis':           (0, 0.0, 2, 0.7, 2),
 'decoys+PD+stasis':      (2, 0.7, 2, 0.7, 2),
}
if __name__ == '__main__':
    for acc, label in ((0.9, 'good firing solution (fresh track)'), (0.45, 'poor solution (old data, probability cone)')):
        print('\nP(ship destroyed) by volley size n; %s; simultaneous arrival' % label)
        print('%-20s' % 'defense' + ''.join('n=%-5d' % n for n in (1, 2, 3, 4, 6, 8)))
        for name, (d, f, k, pk, S) in PKG.items():
            print('%-20s' % name + ''.join('%-7.2f' % p_destroyed(n, acc, False, d, f, k, pk, S) for n in (1, 2, 3, 4, 6, 8)))
    print('\nStaggered arrival (two PD windows), good solution:')
    for name in ('+PD (2 channels)', 'decoys + PD', 'PD + stasis'):
        d, f, k, pk, S = PKG[name]
        print('%-20s' % name + ''.join('%-7.2f' % p_destroyed(n, 0.9, True, d, f, k, pk, S) for n in (1, 2, 3, 4, 6, 8)))
    print('\nAttacker view: missiles needed for a 60% kill against each package (good solution), ammo is the real cost')
    for name, (d, f, k, pk, S) in PKG.items():
        need = next((n for n in range(1, 16) if p_destroyed(n, 0.9, False, d, f, k, pk, S) >= 0.6), '>15')
        need_poor = next((n for n in range(1, 16) if p_destroyed(n, 0.45, False, d, f, k, pk, S) >= 0.6), '>15')
        print('  %-20s good solution %-4s  poor solution %s' % (name, need, need_poor))
