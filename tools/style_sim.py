"""Check command-style option gating: at very tight command style, levers tagged style=loose are hidden.
Does every card still have a legal plan, and how much outcome does hiding them cost? Run: python3 -I tools/style_sim.py"""
import os, sys, random, statistics
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'sim'))
import decision_model as M
rng = random.Random(7)
def best(card, levers, runs=300):
    c = dict(card); c['levers'] = levers; plans = M.legal_plans(c)
    if not plans: return None, None
    sc = []
    for pl in plans:
        sc.append((statistics.mean(M.score(c, M.resolve(pl, rng, c)[0]) for _ in range(runs)), pl))
    sc.sort(key=lambda x: -x[0]); return sc[0][0], ' + '.join(l['id'] for l in sc[0][1])
for cid in M.DATA['order']:
    card = M.DATA['cards'][cid]; L = card['levers']
    if not any(l.get('style') == 'loose' for l in L): continue
    a, pa = best(card, L); b, pb = best(card, [l for l in L if l.get('style') != 'loose'])
    print('%-22s all: %6.2f (%s)   very tight: %s' % (cid, a, pa, 'NO LEGAL PLAN' if b is None else '%6.2f (%s)' % (b, pb)))
