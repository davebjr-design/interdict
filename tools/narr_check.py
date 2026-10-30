"""Validate data/narrative: every name used in calls.csv exists in state.json / knowledge.csv; every reveal has >=3 independent clues.
Run: python3 -I tools/narr_check.py"""
import csv, json, os, re, sys
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'narrative')
st = json.load(open(os.path.join(D, 'state.json'))); cast = json.load(open(os.path.join(D, 'cast.json')))
rows = lambda n: list(csv.DictReader(open(os.path.join(D, n))))
facts = {r['fact'] for r in rows('knowledge.csv')}
crew = set(cast['crew']); errs = []
known = set(st['vars'])
def name_ok(n):
    n = n.strip()
    if n in known: return True
    m = re.fullmatch(r'knows\.(\w+)', n)
    if m: return m.group(1) in facts
    m = re.fullmatch(r'told\.(\w+)\.(\w+)', n)
    if m: return m.group(1) in facts and (m.group(2) in crew or m.group(2) in cast.get('others', {}))
    m = re.fullmatch(r'seen\.([\w.]+)', n)
    return bool(m)
ids = set()
for r in rows('calls.csv'):
    ids.add(r['id'])
    if r['speaker'] not in crew | {'pell', 'corvane', 'patron'}: errs.append('%s: unknown speaker %s' % (r['id'], r['speaker']))
    for fld in ('needs', 'effects'):
        for tok in re.findall(r'(?:not\s+)?([A-Za-z_][\w.]*)\s*(?:==|>=|<=|>|<|=)?', r[fld] or ''):
            if tok in ('not', 'and', 'or') or tok.isdigit(): continue
            if '.' in tok or tok in known:
                if not name_ok(tok): errs.append('%s: unknown state name %s (%s)' % (r['id'], tok, fld))
reveals = {}
for r in rows('clues.csv'): reveals.setdefault(r['reveal'], []).append(r)
for k, v in reveals.items():
    if len(v) < 3: errs.append('reveal %s has only %d clues (rule: at least 3 independent)' % (k, len(v)))
for r in rows('callbacks.csv'):
    if r['status'] == 'planted' and not r['payoff_in']: errs.append('callback %s planted with no payoff' % r['callback_id'])
print('calls %d, facts %d, reveals %d' % (len(ids), len(facts), len(reveals)))
if errs: print('\n'.join(errs)); sys.exit(1)
print('OK')
