"""Stage 2a: missile cone density. Run: python3 -I sim/cone_density.py
Volley of n=6 missiles aimed at points scattered N(0,s) km around the estimate; the true target sits N(0,sigma) km from the estimate; seeker kill radius r=3 km.
Scatter grid class sets intercepts: none 0, light 1 channel @0.6, heavy 3 channels @0.8. Arrival windows = 1 + min(1, s/4) (critic-softened; per-missile intercept capped at 0.9): a wide cone arrives staggered, so the grid gets more windows.
Reports P(at least one hit) for s in cone widths, by track quality (sigma) and grid class, with the best s marked."""
import random, math
R, N = 3.0, 6
GRID = {'none': (0, 0.6), 'light': (1, 0.6), 'heavy': (3, 0.8)}
def volley(s, sigma, grid, rng):
    ch, pk = GRID[grid]; windows = 1 + min(1, s / 4.0)
    tx, ty = rng.gauss(0, sigma), rng.gauss(0, sigma)
    hits = 0
    for _ in range(N):
        ax, ay = rng.gauss(0, s) if s else 0.0, rng.gauss(0, s) if s else 0.0
        if math.hypot(ax - tx, ay - ty) < R and rng.random() >= min(0.9, ch * windows * pk / N): hits += 1
    return hits
def table(M=4000):
    widths = (0, 1, 2, 3, 5, 8)
    print('P(>=1 hit). cone width s (km):  ' + ''.join('%-7s' % w for w in widths))
    for sigma in (1.0, 2.5, 5.0, 9.0):
        for g in GRID:
            rng = random.Random(int(sigma * 10) + len(g)); vals = []
            for s in widths:
                vals.append(sum(volley(s, sigma, g, rng) > 0 for _ in range(M)) / M)
            best = vals.index(max(vals))
            print('  Fan sigma %-4.1f grid %-6s  ' % (sigma, g) + ''.join(('%.2f%s ' % (v, '*' if i == best else ' ')) for i, v in enumerate(vals)))
if __name__ == '__main__': table()
