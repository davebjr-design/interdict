"""Decision grammar prototype: CHOICE (levers) -> OPTIONS (proposals/objections) -> DECISION (a plan) -> REACTIONS.
Run: python3 -I sim/decision_model.py [runs]   (reads data/decision_cards.json)
Rules: a plan is a set of levers; one lever per channel; total slots <= card slots.
Each lever resolves with its own officer check (rating*1.5 + noise - difficulty): >=3 great, 0..3 fixed, -5..0 unchanged, <-5 worse.
Reactions are derived: stance overlap with each officer's likes/dislikes, plus 'backed' (own lever chosen) and 'overruled' (objected to a chosen lever)."""
import json, random, itertools, sys, os, collections
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = json.load(open(os.path.join(HERE, '..', 'data', 'decision_cards.json')))
OFF = DATA['officers']
def band(m): return 'great' if m >= 3 else 'fixed' if m >= 0 else 'unchanged' if m >= -5 else 'worse'
def check(lever, rng):
    if lever['difficulty'] <= 0: return 'fixed'
    o = OFF[lever['executor']]
    return band(o['ratings'][lever['field']] * 1.5 + rng.gauss(0, o['spread']) - lever['difficulty'])
def legal_plans(card):
    L = card['levers']; plans = []
    for r in range(1, len(L) + 1):
        for combo in itertools.combinations(L, r):
            ch = [l['channel'] for l in combo]
            if len(set(ch)) == len(ch) and sum(l['slots'] for l in combo) <= card['slots']: plans.append(combo)
    return plans
def resolve(plan, rng, card):
    st = collections.Counter(card.get('base', {})); bands = {}
    for l in plan:
        b = check(l, rng); bands[l['id']] = b
        for k, v in l['bands'][b].items(): st[k] += v
    ids = {l['id'] for l in plan}
    for l in plan:
        for s in l.get('synergy', []):
            if s['with'] in ids:
                for k, v in s['deltas'].items(): st[k] += v
    if 'shield' in st: st['crew_loss'] *= (1 - min(st['shield'], 1))
    return st, bands
def score(card, st): return sum(card['weights'].get(k, 0) * v for k, v in st.items())
def reactions(card, plan):
    stc = collections.Counter(s for l in plan for s in l['stances']); chosen = {l['id'] for l in plan}; out = {}
    for name, o in OFF.items():
        if name == 'Captain': continue
        s = sum(stc[x] for x in o['likes']) - sum(stc[x] for x in o['dislikes'])
        tone = 'A' if s >= 1 else 'O' if s <= -1 else 'n'
        backed = any(l['proposer'] == name for l in plan)
        over = any(ob['by'] == name and ob['lever'] in chosen for ob in card['objections'])
        out[name] = (tone, backed, over)
    return out
def trust(r):  # per officer: +1 if aligned and backed, -1 if opposed or overruled (not rescued by being backed+aligned)
    t, backed, over = r
    if t == 'A' and backed and not over: return 1
    if (t == 'O' or over) and not (t == 'A' and backed): return -1
    return 0
def sym(r):
    t, b, o = r; return t + ('+' if b else '') + ('!' if o else '')
if __name__ == '__main__':
    N = int(sys.argv[1]) if len(sys.argv) > 1 else 4000
    allcover = {n: [0, 0, 0, 0] for n in OFF if n != 'Captain'}; allplans = 0
    for cname, card in DATA['cards'].items():
        plans = legal_plans(card); rng = random.Random(11); rows = []
        for p in plans:
            sc = [score(card, resolve(p, rng, card)[0]) for _ in range(N)] if card['weights'] else [0]
            rows.append((sum(sc) / len(sc), p, reactions(card, p)))
        rows.sort(key=lambda r: -r[0])
        names = [n for n in OFF if n != 'Captain']
        print('\n==== %s: %d legal plans, %d slots ====' % (cname, len(plans), card['slots']))
        print('%-48s %7s  ' % ('plan', 'score') + ' '.join('%-5s' % n[:5] for n in names) + '  trust')
        for sc, p, rx in rows:
            tr = sum(trust(rx[n]) for n in names)
            print('%-48s %7.1f  ' % (' + '.join(l['id'] for l in p), sc) + ' '.join('%-5s' % sym(rx[n]) for n in names) + '  %+d' % tr)
        print('  legend: A aligned / O opposed / n neutral; + backed (own lever chosen); ! overruled (objected to a chosen lever)')
        cover = {n: [0, 0, 0, 0] for n in names}
        for sc, p, rx in rows:
            for n in names:
                t, b, o = rx[n]; cover[n][0] += t == 'A'; cover[n][1] += t == 'O'; cover[n][2] += b; cover[n][3] += o
                allcover[n][0] += t == 'A'; allcover[n][1] += t == 'O'; allcover[n][2] += b; allcover[n][3] += o
        allplans += len(plans)
        print('  coverage (plans where officer is: aligned, opposed, backed, overruled) of %d:' % len(plans))
        for n in names:
            flag = '' if cover[n][0] and (cover[n][1] or cover[n][3]) else '   <-- never aligned or never opposed'
            print('    %-10s %2d %2d %2d %2d%s' % ((n,) + tuple(cover[n]) + (flag,)))
        if card['weights']:
            def harm(rx): return {n for n in names if rx[n][0] == 'O' or rx[n][2]}
            best = rows[0]; print('  best plan by outcome: %s; officers opposed or overruled there: %s' % (' + '.join(l['id'] for l in best[1]), sorted(harm(best[2])) or 'none'))
            free = [r for r in rows if not harm(r[2]) and r[0] >= 0.9 * best[0] - 1e-9]
            print('  plans with nobody opposed and score within 10%% of best: %d' % len(free))
            print('  lever value (average score gain when added to a legal plan without it):')
            byid = {tuple(sorted(l['id'] for l in p)): r[0] for r in rows for p in [r[1]]}
            for L in card['levers']:
                gains = [byid[tuple(sorted(k + (L['id'],)))] - byid[k] for k in byid if L['id'] not in k and tuple(sorted(k + (L['id'],))) in byid]
                alone = byid.get((L['id'],))
                print('    %-14s alone %6.1f   marginal %6.1f over %d plans%s' % (L['id'], alone if alone is not None else float('nan'), (sum(gains) / len(gains)) if gains else float('nan'), len(gains), ('   (trap by design)' if L.get('trap') else '   <-- adds nothing') if gains and sum(gains) / len(gains) <= 0.05 else ''))
            dom = 0
            for i, a in enumerate(rows):
                for j, b in enumerate(rows):
                    if a is not b and b[0] >= a[0] and harm(b[2]) <= harm(a[2]) and (b[0] > a[0] or harm(b[2]) < harm(a[2])) and rows.index(b) != rows.index(a):
                        dom += 1; break
            print('  dominated plans (another plan is no worse on outcome and harms no more officers): %d of %d' % (dom, len(plans)))
    print('\n==== all cards combined: %d plans; officer is aligned / opposed / backed / overruled ====' % allplans)
    for n, c in allcover.items(): print('    %-10s %3d %3d %3d %3d' % ((n,) + tuple(c)))
