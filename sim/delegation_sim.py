"""Delegation check model. Run: python3 -I sim/delegation_sim.py [runs]
score = rating*1.5 + modifiers + Normal(0, spread) - difficulty
margin >= +3 great (fixed, with extra info); 0..3 fixed; -5..0 unchanged; < -5 worse."""
import random, sys, collections
OFFICERS = {  # name: (temperament, spread, ratings by field)
 'Pike':      ('bold',    2.6, {'engineering':4,'sensors':1}),
 'Quill':     ('careful', 1.5, {'engineering':2,'sensors':3}),
 'Abara':     ('steady',  2.0, {'engineering':3,'sensors':3}),   # ratings hidden from captain
 'Castellan': ('exact',   1.8, {'engineering':2,'sensors':5}),
 'Dace':      ('anxious', 2.0, {'engineering':2,'sensors':3}),
}
CALLS = {  # name: (field, difficulty)
 'Call 1 heat sink fault':   ('engineering', 4.0),
 'Call 2 heat crisis':       ('engineering', 5.5),
 'Call 3 ghost contact':     ('sensors',     5.5),
}
def band(m):
    return 'great' if m>=3 else 'fixed' if m>=0 else 'unchanged' if m>=-5 else 'worse'
def run(officer, call, rng, stress=0.3, heat=60, trust=0):
    temp, spread, rat = OFFICERS[officer]; field, diff = CALLS[call]
    mod = trust                                  # wary -1, steady 0, devoted +1
    if heat>=85: mod -= 1
    if temp=='anxious': mod -= 3*stress; spread += stress
    else: mod -= 1.5*stress
    if temp=='exact' and field=='sensors': mod += 0.5     # extra information bonus
    return band(rat[field]*1.5 + mod + rng.gauss(0,spread) - diff)
if __name__=='__main__':
    N=int(sys.argv[1]) if len(sys.argv)>1 else 20000
    cats=['great','fixed','unchanged','worse']
    for call in CALLS:
        heat = 90 if 'crisis' in call else 60
        print('\n'+call, '(heat %d)'%heat); print('%-10s %-8s'%('officer','temper'),' '.join('%9s'%c for c in cats))
        for o,(t,_,_) in OFFICERS.items():
            rng=random.Random(7); c=collections.Counter(run(o,call,rng,heat=heat) for _ in range(N))
            print('%-10s %-8s'%(o,t),' '.join('%8.1f%%'%(100*c[k]/N) for k in cats))
