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
            if len(set(ch)) != len(ch) or sum(l['slots'] for l in combo) > card['slots']: continue
            if any(rq not in ch for rq in card.get('required', [])): continue
            if card.get('required_any') and not any(c in ch for c in card['required_any']): continue
            plans.append(combo)
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
    if t == 'O' and not backed: return -1   # being overruled alone is flavor, not a penalty
    return 0
def card_trust(rx, names):
    # one frown per decision: at most one officer loses a step, and only the most opposed one
    ups = sum(1 for n in names if trust(rx[n]) > 0); downs = [n for n in names if trust(rx[n]) < 0]
    return ups - (1 if downs else 0)
def sym(r):
    t, b, o = r; return t + ('+' if b else '') + ('!' if o else '')

def fun_report(DATA, N):
    """Fun checks: no-win cards, pacing, and whether pleasing officers (min/max) beats playing the situation."""
    names = [n for n in OFF if n != 'Captain']
    print('\n#### FUN CHECKS ####')
    print('%-24s %-9s %5s %7s %9s %9s %9s' % ('card', 'tone', 'plans', 'nowin?', 'peaceful', 'trustbest', 'scoregap'))
    tones = collections.Counter(); chain = []
    for cname, card in DATA['cards'].items():
        plans = legal_plans(card); rng = random.Random(5); rows = []
        for p in plans:
            sc = sum(score(card, resolve(p, rng, card)[0]) for _ in range(N // 4)) / (N // 4) if card['weights'] else 0.0
            rx = reactions(card, p); harmed = {n for n in names if rx[n][0] == 'O'}
            rows.append((sc, p, harmed, card_trust(rx, names)))
        best = max(r[0] for r in rows); worst = min(r[0] for r in rows); span = (best - worst) or 1
        good = [r for r in rows if r[0] >= best - 0.25 * span]   # plans giving an acceptable outcome
        peaceful = [r for r in good if len(r[2]) <= 1]           # acceptable AND at most one officer unhappy
        nowin = not peaceful
        tb = max(rows, key=lambda r: (r[3], r[0])); gap = (best - tb[0]) / span
        tones[card.get('tone', '?')] += 1; chain.append(card.get('tone', '?')[0].upper())
        print('%-24s %-9s %5d %7s %9d %9s %8.0f%%' % (cname[:24], card.get('tone', '?'), len(plans), 'NO-WIN' if nowin else 'ok', len(peaceful), ' + '.join(l['id'] for l in tb[1])[:9], gap * 100))
    print('  PEACE COST: best plan with nobody opposed vs best plan overall (rule: exists, and costs more on pressure than breather)')
    for cname, card in DATA['cards'].items():
        if not card['weights']: continue
        plans = legal_plans(card); rng = random.Random(5); rows = []
        for p in plans:
            sc = sum(score(card, resolve(p, rng, card)[0]) for _ in range(N // 4)) / (N // 4); rx = reactions(card, p)
            rows.append((sc, ' + '.join(l['id'] for l in p), [n for n in names if rx[n][0] == 'O']))
        best = max(rows); span = (best[0] - min(r[0] for r in rows)) or 1
        calm = [r for r in rows if not r[2]]
        if calm:
            c = max(calm); print('    %-22s %-9s calm plan: %-30s costs %3.0f%% of range' % (cname[:22], card['tone'], c[1][:30], 100 * (best[0] - c[0]) / span))
        else: print('    %-22s %-9s NO CALM PLAN (best leaves %s opposed)' % (cname[:22], card['tone'], min(rows, key=lambda r: len(r[2]))[2]))
    print('  pacing (P pressure, S story, V values, B breather): ' + ' '.join(chain))
    print('  tone mix: ' + ', '.join('%s %d' % kv for kv in tones.items()))
    print('  scoregap = outcome given up by the plan that best pleases officers vs the best outcome; peaceful = acceptable-outcome plans with at most one officer unhappy')
    print('  min/max test: average outcome rank of plans where each officer is aligned (50% = no edge for appeasing them)')
    for n in names:
        ranks = []
        for cname, card in DATA['cards'].items():
            if not card['weights']: continue
            plans = legal_plans(card); rng = random.Random(7)
            sc = [sum(score(card, resolve(p, rng, card)[0]) for _ in range(N // 8)) / (N // 8) for p in plans]
            order = sorted(range(len(plans)), key=lambda i: sc[i])
            for i, p in enumerate(plans):
                if reactions(card, p)[n][0] == 'A': ranks.append(order.index(i) / max(1, len(plans) - 1))
        print('    %-10s %3.0f%% over %d aligned plans' % (n, 100 * sum(ranks) / max(1, len(ranks)), len(ranks)))

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
            tr = card_trust(rx, names)
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
            def harm(rx): return {n for n in names if rx[n][0] == 'O'}
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
    fun_report(DATA, N)
    print('\n==== all cards combined: %d plans; officer is aligned / opposed / backed / overruled ====' % allplans)
    for n, c in allcover.items(): print('    %-10s %3d %3d %3d %3d' % ((n,) + tuple(c)))
