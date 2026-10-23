import sys, json, copy, itertools, collections
import numpy as np
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
import ship_model as sm

def stats_for(ids, P, R, base_power):
    sm.P, sm.R = P, R
    sm.D = dict(base_power=base_power)
    st = sm.stats(ids)
    parts = [P[i] for i in ids]
    sen = next(p for p in parts if p['slot']=='sensor'); wp = next(p for p in parts if p['slot']=='weapon'); dr = next(p for p in parts if p['slot']=='drive')
    st['warn'] = sen.get('warn', min(0.95, sen['track']/10)); st['unaw_extra'] = wp.get('unaware', 0); st['creep'] = dr.get('creep', 1.0); st['idle'] = st['draw'] - wp['draw']; st['coldplus'] = next(p for p in parts if p['slot']=='sink').get('coldplus',0)
    return st

def sim(st, k, hmax, N, seed, par):
    rng = np.random.default_rng(seed)
    t = np.zeros(N); H = np.full(N, st['base_heat'])
    noticed = np.zeros(N, bool)
    W = np.where(rng.random(N) < par['pwin'], rng.uniform(par.get('wlo',1), par.get('whi',5), N), 1e9)
    E = rng.exponential(par['esc_mean'], N)
    def haz(H):
        base = par['h0'] + par['hdraw'] * st['idle'] * (1 + np.maximum(0, H - 45) / 30)
        thr = par.get('cold_a', 36) + par.get('cold_b', 12) * st['heat_mgmt'] + st['coldplus']
        return base * np.where(H < thr, par.get('cold', 1.0), 1.0)
    noticed |= rng.random(N) < 1 - np.exp(-par.get('A',0) * haz(H))
    for i in range(k):
        t += 1; H += 2.5 / st['engine_eff'] / st['heat_mgmt']
        p = 1 - np.exp(-(haz(H) + par['hclose'] * st['noise'] / st['engine_eff']))
        noticed |= rng.random(N) < p
    active = np.ones(N, bool); seenwin = np.zeros(N, bool)
    for m in range(hmax):
        t[active] += 1; H[active] += par.get('creep0', 1.5) * st['creep'] / st['heat_mgmt']
        p = 1 - np.exp(-haz(H))
        noticed |= active & (rng.random(N) < p)
        inwin = (W <= t) & (t <= W + 2)
        s = np.minimum(1, par['sbase'] + st['warn'] * par.get('swarn', 0.5))
        saw = active & inwin & (rng.random(N) < s)
        seenwin |= saw; active &= ~saw
    closed = np.minimum(41, st['thrust'] * k)
    rngterm = -9 * (41 - closed) / 41
    kill = par.get('killpen',0) + 58 + st['track'] + 8 + np.where(noticed, 0, 8 + st['unaw_extra']) + st['kill'] + rngterm - (3 + t) + np.where(seenwin, par['winbonus'], 0)
    kill = np.clip(kill, 2, 98) / 100 * np.where(noticed, par.get('nmult', 1.0), 1.0)
    # escort
    esc = E <= t
    warned = esc & (rng.random(N) < np.minimum(0.95, st['warn']))
    ambush = esc & ~warned
    X = 20 + st['w_exp'] + 3 * k * st['noise'] / st['engine_eff'] + par['noisefire'] * (st['noise'] - 1)
    Hf = H + 5 / st['heat_mgmt']
    pdie = par['d0'] * (X / 20) ** par.get('dexp', 2) * (1 + np.maximum(0, Hf - 55) / 20) / (st['thrust'] / 8) ** par['escp']
    pdie = pdie * np.where(noticed, par.get('nd', 1.6), 1) * np.where(ambush, 3, 1)
    pdie = pdie * np.where(seenwin, par.get('winretal', 1.0), 1.0)
    pdie = np.clip(pdie, 0, 0.95)
    killed = (rng.random(N) < kill) & ~warned & ~(ambush & (rng.random(N) < 0.5))
    died = (rng.random(N) < pdie) & ~warned
    val = (killed * np.where(seenwin, par.get('winvalue', 1.0), 1.0)).mean()
    return killed.mean(), died.mean(), warned.mean(), noticed.mean(), val

PAR = dict(pwin=0.6, esc_mean=8, h0=0.015, hdraw=0.004, hclose=0.08, sbase=0.4, sdiv=12, winbonus=12, wdiv=10, d0=0.03, escp=0.8, noisefire=0)
POL = [(k, h) for k in (0, 1, 2, 3) for h in (0, 2, 4, 7, 12)]

def run(P, R, base_power, N=3000, par=PAR, seed=1):
    by = {s: [i for i, p in P.items() if p['slot'] == s] for s in sm.SLOTS}
    res = {}
    for ids in itertools.product(*[by[s] for s in sm.SLOTS]):
        st = stats_for(ids, P, R, base_power)
        res[ids] = {pol: sim(st, pol[0], pol[1], N, seed, par) for pol in POL}
    return res

def best(res, D):
    out = {}
    for ids, d in res.items():
        sc = {pol: 100 * v[4] - D * v[1] for pol, v in d.items()}
        pol = max(sc, key=sc.get); out[ids] = (sc[pol], pol, d[pol])
    return out

def family(ids, P):
    o = collections.Counter(P[i]['origin'] for i in ids)
    return o.most_common(1)[0][0] + ('' if o.most_common(1)[0][1] >= 3 else '*')

def report(res, P, label, Ds=(100, 300, 800), top=5):
    print('=====', label)
    for D in Ds:
        b = best(res, D); rows = sorted(b.items(), key=lambda kv: -kv[1][0])
        print(' D=%d top:' % D)
        for ids, (sc, pol, v) in rows[:top]:
            print('   %6.1f %-36s fam %-11s pol close%d hold%d  kill %.2f die %.3f' % (sc, ' '.join(ids), family(ids, P), pol[0], pol[1], v[0], v[2-1+0] if False else v[1]))
        use = collections.Counter(i for ids, _ in rows[:25] for i in ids)
        print('   parts never in top25:', [i for i in P if i not in use])
        print('   pols chosen in top25:', collections.Counter(b[ids][1] for ids, _ in rows[:25]).most_common(4))
        print('   families in top25:', collections.Counter(family(ids, P) for ids, _ in rows[:25]).most_common())
        for nm in (1, 2, 3, 4):
            sel = [r[1][0] for r in rows if len({P[i]['maker'] for i in r[0]}) == nm]
            if sel: print('   makers=%d mean %.1f max %.1f n=%d' % (nm, np.mean(sel), max(sel), len(sel)))
    # winners by D
    wins = {D: max(best(res, D).items(), key=lambda kv: kv[1][0])[0] for D in Ds}
    print(' winners:', {D: ' '.join(w) for D, w in wins.items()})

if __name__ == '__main__':
    D0 = json.load(open('/home/claude/interdict/data/ship_parts.json'))
    res = run(D0['parts'], D0['rules'], D0['base_power'])
    report(res, D0['parts'], 'CURRENT PARTS')
