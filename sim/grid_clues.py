"""Inferring the target's scatter grid from passive clues. Run: python3 -I sim/grid_clues.py
A powered grid radiates: it adds a tracking flutter to the reactor channel (strength by class) and a warm ring to infrared.
Classes: none 0, light 1, heavy 2. Player reads flutter after m minutes (noise falls with sqrt(m)); decoys add false flutter.
Picks spacing: stack if read<=0.5 else spread. Reports P(correct class call) and the volley kill from sim/rules.py."""
import random, math, sys
import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import rules
CLASS_SIG = {0: 0.0, 1: 1.0, 2: 2.0}
def read(cls, m, rng, decoy=False, quiet_grid=False):
    sig = CLASS_SIG[cls] * (0.5 if quiet_grid else 1.0) + (0.8 if decoy else 0.0)
    return sig + rng.gauss(0, 1.1 / math.sqrt(m))
def classify(x): return 0 if x < 0.5 else (1 if x < 1.5 else 2)
def run(m, N=5000, **kw):
    rng = random.Random(3); ok = 0
    for _ in range(N):
        c = rng.choice([0, 1, 2]); ok += classify(read(c, m, rng, **kw)) == c
    return ok / N
def kill(cls, spacing):  # spacing 0 stack, 1.25 spread; sigma at age 3
    s = rules.fan_sigma(3, False, 0.5); pdc, pk = {0: (0, 0.6), 1: (1, 0.6), 2: (3, 0.8)}[cls]
    return rules.volley_hit_prob(4, s, spacing, pd_channels=pdc, pd_kill=pk, rng=random.Random(9))
if __name__ == '__main__':
    print('P(correct grid class) vs listening minutes')
    for lab, kw in (('plain', {}), ('decoy adds flutter', dict(decoy=True)), ('target runs grid quiet', dict(quiet_grid=True))):
        print('  %-24s' % lab + ''.join('m=%d: %.2f  ' % (m, run(m, **kw)) for m in (1, 2, 4, 8)))
    print('\nvolley kill by true grid class and spacing (n=4, age 3)')
    for c in (0, 1, 2): print('  grid %d: stack %.2f  spread %.2f' % (c, kill(c, 0), kill(c, 1.25)))
    print('\nexpected kill when choosing from the read (uniform classes)')
    for m in (1, 2, 4, 8):
        rng = random.Random(4); tot = 0; N = 3000
        for _ in range(N):
            c = rng.choice([0, 1, 2]); r = classify(read(c, m, rng)); sp = 0 if r == 0 else 1.25
            tot += kill(c, sp) if _ % 20 == 0 else 0
        print('  m=%d ~%.2f' % (m, tot / (N / 20)))

    print('\npolicy comparison (m=4): always stack / always spread / informed read')
    for pol in ('stack','spread','informed'):
        rng=random.Random(4); tot=0; n=0
        for c in (0,1,2):
            for _ in range(60):
                r=classify(read(c,4,rng)); sp={'stack':0,'spread':1.25,'informed':(0 if r==0 else 1.25 if r==1 else 0)}[pol]
                tot+=kill(c,sp); n+=1
        print('  %-9s %.2f'%(pol,tot/n))
