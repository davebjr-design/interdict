"""Passive detection as a mechanic ("the Listening Board"). Run: python3 -I sim/listening_model.py
Three passive channels over 16 bearing bins. A real ship raises its bin on each channel it radiates in:
  infrared  (strength rises with the target's sump heat; the thermal game of chicken)
  reactor   (neutrino: constant for a running core, stronger for a big core; hard to hide, short range)
  occlusion (starlight blocked; only works when a star/ring sits behind that bearing; cannot be faked by lures)
Ghosts are random bright bins in a single channel. Lures fake infrared and reactor in a wrong bin but not occlusion.
Integrating for m minutes multiplies signal-to-noise by sqrt(m) but ages the picture (the Fan widens) and costs sump."""
import random, math
BINS = 16
def trial(m, channels, heat=0.5, core=1.0, ghosts=3, lure=False, star_behind=True, rng=None):
    rng = rng or random
    t = rng.randrange(BINS); lure_bin = rng.randrange(BINS)
    chans = {'ir': 1.0 + 2.5 * heat, 'rx': 1.2 + 0.8 * core, 'occ': 2.2 if star_behind else 0.0}
    score = [0.0] * BINS
    for c in channels:
        base = [rng.gauss(0, 1) for _ in range(BINS)]
        base[t] += chans[c] * math.sqrt(m)
        base = [b * 1.0 for b in base]
        for _ in range(ghosts):
            g = rng.randrange(BINS); base[g] += rng.gauss(1.6, 0.5) * math.sqrt(m) * 0.55   # ghosts do not integrate as cleanly
        if lure and c in ('ir', 'rx'): base[lure_bin] += chans[c] * math.sqrt(m) * 0.9
        # normalise by sqrt(m) so z-scores stay comparable
        z = [b / (math.sqrt(m) if m > 1 else 1.0) for b in base]
        for i in range(BINS): score[i] += z[i]
    pick = max(range(BINS), key=lambda i: score[i])
    return pick == t, pick == lure_bin and lure
def run(m, channels, N=4000, **kw):
    rng = random.Random(5); ok = sum(trial(m, channels, rng=rng, **kw)[0] for _ in range(N)); return ok / N
if __name__ == '__main__':
    sets = {'IR only': ['ir'], 'IR + reactor': ['ir', 'rx'], 'IR + reactor + occlusion': ['ir', 'rx', 'occ'], 'occlusion only': ['occ']}
    for label, kw in (('cold target (heat 0.3), 3 ghosts', dict(heat=0.3)), ('hot target (heat 0.8), 3 ghosts', dict(heat=0.8)), ('cold target + lure', dict(heat=0.3, lure=True)), ('no star behind, cold, 3 ghosts', dict(heat=0.3, star_behind=False))):
        print('\n%s: P(correct bearing) after m minutes of listening' % label)
        print('  %-26s' % 'channels' + ''.join('m=%-5d' % m for m in (1, 2, 4, 8)))
        for name, ch in sets.items():
            if 'occ' in ch and not kw.get('star_behind', True): continue
            print('  %-26s' % name + ''.join('%-7.2f' % run(m, ch, **kw) for m in (1, 2, 4, 8)))
