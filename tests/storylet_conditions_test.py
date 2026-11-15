"""Runs the shared condition vectors against tools/storylet_lib.py. python3 -I tests/storylet_conditions_test.py"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'tools'))
import storylet_lib as L
d = json.load(open(os.path.join(HERE, 'storylet_conditions.json')))
bad = 0
for r in d['eval']:
    got = L.evaluate(L.parse(r['expr']), lambda n, s=r['state']: s.get(n))
    if got != r['expect']:
        bad += 1
        print('FAIL %r %r -> %r, expected %r' % (r['expr'], r['state'], got, r['expect']))
for e in d['errors']:
    try:
        L.parse(e)
        bad += 1
        print('FAIL %r should not parse' % e)
    except L.CondError:
        pass
print('%d condition vectors, %d failures' % (len(d['eval']) + len(d['errors']), bad))
sys.exit(1 if bad else 0)
