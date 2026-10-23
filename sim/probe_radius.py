"""Probe radius dial (critic prototype + fix). Run: python3 -I sim/probe_radius.py
Probe fixes sigma = min(Fan, max(1, r/3)) if the target is within r of the aim point, else nothing; emission proportional to radius (0.15 + 0.05 r) or flat. Best radius ~1.2 x Fan; not probing is the best net option at Fan 2.5."""
import random, math
M=20000
def hit_after(sig_post,rng,R=3.0,N=6):
    # volley no-grid, cone s=0.6*sig_post (>=0.5 cap at 5); estimate error sig_post
    s=min(5,0.6*sig_post); tx,ty=rng.gauss(0,sig_post),rng.gauss(0,sig_post)
    return any(math.hypot(rng.gauss(0,s)-tx,rng.gauss(0,s)-ty)<R for _ in range(N))
def fixsig(r): return max(1.0,r/3.0)       # r=3 ->1km, r=12 ->4km
def det(r,mode): return min(1.0,0.15+ (0.05*r if mode=='prop' else 0.35*0+0.35*(1)) ) if mode=='prop' else 0.40
def trial(sf,pol,mode,rng):
    tx,ty=rng.gauss(0,sf),rng.gauss(0,sf); d=math.hypot(tx,ty); emis=0.0; fixed=None
    seq={'small':[3],'large':[12],'mid':[6],'small>large':[3,12],'none':[]}[pol]
    for r in seq:
        emis+= (0.15+0.05*r) if mode=='prop' else 0.40
        if d<=r: fixed=min(sf,fixsig(r)); break
    sig=fixed if fixed else sf          # a miss leaves the Fan as it was
    return hit_after(sig,rng), min(1.0,emis), (1 if fixed else 0), len(seq)
for mode in('prop','fixed'):
    print('emission',mode)
    for sf in(2.5,5,9):
        rng=random.Random(3)
        for pol in('none','small','mid','large','small>large'):
            R=[trial(sf,pol,mode,rng) for _ in range(M)]
            h=sum(x[0] for x in R)/M;e=sum(x[1] for x in R)/M;f=sum(x[2] for x in R)/M
            print('  Fan %.1f %-12s fix %.2f  P(hit) %.2f  P(seen) %.2f  net(hit-0.5seen) %.2f'%(sf,pol,f,h,e,h-0.5*e))
