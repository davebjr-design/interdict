"""Ship stats from salvaged parts. Run: python3 -I sim/ship_model.py
Rules: set bonus for parts sharing a maker; friction for mixing makers/origins (cuts engine efficiency,
adds parasitic heat); power draw over the ship's base supply adds overload heat."""
import json, os, itertools, collections
HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, '..', 'data', 'ship_parts.json')))
P, R = D['parts'], D['rules']
SLOTS = ['drive', 'sink', 'sensor', 'weapon']
def stats(ids):
    parts = [P[i] for i in ids]
    makers = collections.Counter(p['maker'] for p in parts); origins = {p['origin'] for p in parts}
    n = max(makers.values()); setb = R['set_bonus'].get(str(n), 0.0) if n >= 2 else 0.0
    fr = R['friction']['per_extra_maker'] * (len(makers) - 1) + R['friction']['per_extra_origin'] * (len(origins) - 1)
    draw = sum(p['draw'] for p in parts); over = max(0, draw - D['base_power']) * R['overload_heat_per_power']
    d = next(p for p in parts if p['slot'] == 'drive'); s = next(p for p in parts if p['slot'] == 'sink')
    n_ = next(p for p in parts if p['slot'] == 'sensor'); w = next(p for p in parts if p['slot'] == 'weapon')
    return dict(set=setb, friction=fr, draw=draw, overload=over,
        engine_eff=d['eff'] * (1 + setb) * (1 - fr), heat_mgmt=s['cap'] * (1 + setb) / (1 + fr + over),
        thrust=d['thrust'], noise=d['noise'], track=n_['track'] * (1 + setb), kill=w['kill'] * (1 + setb),
        w_exp=w['exposure'], base_heat=47 + R['baseline_heat_per_friction'] * (fr + over))
def utility(st):
    """Best tactic value on the firing card: fire now, or close k steps then fire. Higher is better."""
    best = -999; plans = []
    for k in range(0, 4):
        rng = max(0, 41 - st['thrust'] * k)
        kill = 58 + 14 + st['track'] - 6 + 8 + st['kill'] - 9 * rng / 41 - (3 + k)  # unaware, aging data
        kill = max(2, min(98, kill))
        exp = 20 + st['w_exp'] + 3 / st['engine_eff'] * k * st['noise']
        heat = st['base_heat'] + 5 / st['heat_mgmt'] + 2.5 / st['engine_eff'] / st['heat_mgmt'] * k
        notice = 12 * k
        u = kill - 0.8 * exp - 1.0 * max(0, heat - 60) - 0.5 * notice
        plans.append((u, k, kill, exp, heat, notice)); best = max(best, u)
    return max(plans)
def all_loadouts():
    by = {s: [i for i, p in P.items() if p['slot'] == s] for s in SLOTS}
    for combo in itertools.product(*[by[s] for s in SLOTS]): yield combo
if __name__ == '__main__':
    rows = []
    for c in all_loadouts():
        st = stats(c); u = utility(st); rows.append((u[0], c, st, u))
    rows.sort(key=lambda r: -r[0])
    print('loadouts:', len(rows), ' utility range %.1f to %.1f' % (rows[-1][0], rows[0][0]))
    print('\nTOP 12 loadouts')
    for u, c, st, p in rows[:12]:
        print('  %5.1f  %-34s set%+.0f%% fr %.2f draw %2d  eff %.2f hm %.2f  best: close %d  kill %2.0f exp %2.0f heat %2.0f' % (u, ' '.join(c), st['set'] * 100, st['friction'], st['draw'], st['engine_eff'], st['heat_mgmt'], p[1], p[2], p[3], p[4]))
    print('\nPURE-MAKER loadouts (same maker where possible)')
    for mk in ('Orrin', 'Vask', 'Halden'):
        pure = [r for r in rows if all(P[i]['maker'] == mk for i in r[1])]
        for u, c, st, p in pure[:2]: print('  rank %3d  %5.1f  %-34s %s' % (rows.index((u, c, st, p)) + 1, u, ' '.join(c), mk))
    use = collections.Counter(i for r in rows[:25] for i in r[1])
    print('\nParts in the top 25 loadouts:', dict(use.most_common()))
    print('Parts never in top 25:', [i for i in P if i not in use])
    mix = [r for r in rows[:25] if len({P[i]['maker'] for i in r[1]}) >= 3]
    print('Top-25 loadouts mixing 3+ makers:', len(mix), '| 1 maker:', len([r for r in rows[:25] if len({P[i]['maker'] for i in r[1]}) == 1]))
    import statistics
    print('Median utility %.1f; top loadout beats median by %.1f' % (statistics.median(r[0] for r in rows), rows[0][0] - statistics.median(r[0] for r in rows)))
    print('Friction effect: avg utility of loadouts by makers used:', {k: round(statistics.mean(r[0] for r in rows if len({P[i]["maker"] for i in r[1]}) == k), 1) for k in (1, 2, 3)})
