#!/usr/bin/env python3
"""First-guess floor quad for a keyed compartment image.

The keyed PNG's alpha gives the room silhouette. Its LOWER boundary is exactly the
floor's two near edges: L->B running down-right, then B->R running up-right, with a
short chamfer across the bottom vertex. Fitting a line to each side and intersecting
them recovers B reliably, where extreme points do not. L and R are those lines
evaluated at the silhouette's left and right limits, and T closes the parallelogram.

Still only a first guess: every room gets checked against a rendered grid and corrected.

Usage: fit_estimate.py <name> ...
"""
import sys
import numpy as np
from PIL import Image

TARGET_PX_PER_CELL = 82


def fit_line(xs, ys):
    m, c = np.polyfit(xs, ys, 1)
    return m, c


def estimate(name, quiet=False):
    a = np.array(Image.open(f'design/assets/rooms/{name}.png').convert('RGBA'))[..., 3] > 10
    # drop stray keying specks: keep columns with a decent run of alpha
    good = np.where(a.sum(axis=0) > 12)[0]
    x0, x1 = int(good[0]), int(good[-1])
    xs = np.arange(x0, x1 + 1)
    ybot = np.array([np.where(a[:, x])[0][-1] for x in xs])
    # Columns where the silhouette runs off the bottom of the image are clipped and
    # must not be fitted: their lower boundary is the image edge, not the floor edge.
    clipped = ybot >= a.shape[0] - 2
    # The unclipped lower boundary is three segments: the floor's left near edge
    # (sloping down-right), a short chamfer across the bottom vertex, then the right
    # near edge (sloping up-right). Segment them by the sign of a smoothed slope and
    # fit a line to the longest run of each sign, which ignores the chamfer entirely.
    w = max(9, (x1 - x0) // 40)
    sm = np.convolve(ybot.astype(float), np.ones(w) / w, mode='same')
    d = np.gradient(sm)
    ok = ~clipped
    ok[:w] = ok[-w:] = False

    def longest_run(mask):
        best = cur = None
        for i, v in enumerate(mask):
            if v:
                cur = i if cur is None else cur
            elif cur is not None:
                if best is None or i - cur > best[1] - best[0]:
                    best = (cur, i)
                cur = None
        if cur is not None and (best is None or len(mask) - cur > best[1] - best[0]):
            best = (cur, len(mask))
        return best

    rl = longest_run(ok & (d > 0.12))
    rr = longest_run(ok & (d < -0.12))
    if rl is None or rr is None or rl[1] - rl[0] < 10 or rr[1] - rr[0] < 10:
        return None
    lo = np.zeros(len(xs), bool); lo[rl[0]:rl[1]] = True
    hi = np.zeros(len(xs), bool); hi[rr[0]:rr[1]] = True
    m1, c1 = fit_line(xs[lo], ybot[lo])
    m2, c2 = fit_line(xs[hi], ybot[hi])
    bx = (c2 - c1) / (m1 - m2)
    B = (round(bx), round(m1 * bx + c1))
    L = (x0, round(m1 * x0 + c1))
    R = (x1, round(m2 * x1 + c2))
    T = (L[0] + R[0] - B[0], L[1] + R[1] - B[1])
    span = R[0] - L[0]
    total = max(4, round(span / TARGET_PX_PER_CELL))
    ri, rj = max(1, R[0] - T[0]), max(1, T[0] - L[0])
    ni = max(2, round(total * ri / (ri + rj)))
    nj = max(2, total - ni)
    if not quiet:
        print(f'{name:13s} "{T}" "{R}" "{L}" "{B}" {ni} {nj}   px/cell={span/(ni+nj):.0f}')
    return T, R, L, B, ni, nj


for n in sys.argv[1:]:
    estimate(n)
