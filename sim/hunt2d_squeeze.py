"""Hunt 2D with the escort squeeze (critic-tuned). Run: python3 -I sim/hunt2d_squeeze.py
After minute 8 both ships drift 1 km/min toward the center and the shot threshold relaxes 0.3 km/min. Chosen variant: close move 4.5 grow 0.6, still e 0.4 fill 0.06, evade fill 0.10.
Baseline sim/hunt2d.py is kept unchanged."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import random, math, itertools, statistics, copy
import hunt2d as H
def run(N=400, arena=40, T=40, relax=0.0, squeeze=0.0, t0=8, seed=11, post=None, bloom=6):
    P={k:dict(v) for k,v in H.POST.items()}
    if post:
        for k,v in post.items(): P[k].update(v)
    dist=H.dist
    def step(a,b,rng,t):
        p=P[a.post]; a.emit=p['e']+a.sump; a.sump+=p['fill']
        if a.sump>=1: a.emit+=bloom; a.sump=0.4
        a.pinged=(a.ping=='often' and t%3==0) or (a.ping=='blind' and a.sig>6 and t%2==0)
        if a.pinged:a.emit+=5
        if p['move']:
            if a.post=='close':
                tgt=a.est or (arena/2,arena/2);d=dist(a.pos,tgt) or 1;k=min(p['move'],d)/d
            else:
                ang=rng.uniform(0,6.283);a.pos[0]+=p['move']*math.cos(ang);a.pos[1]+=p['move']*math.sin(ang);k=0
            if a.post=='close':
                a.pos[0]+=(tgt[0]-a.pos[0])*k;a.pos[1]+=(tgt[1]-a.pos[1])*k
        if squeeze and t>t0:   # patron/escort closes the arena: everyone drifts to centre
            c=arena/2;d=dist(a.pos,(c,c)) or 1;k=min(squeeze,d)/d
            a.pos[0]+=(c-a.pos[0])*k;a.pos[1]+=(c-a.pos[1])*k
    def observe(a,b,rng,t):
        d=dist(a.pos,b.pos);a.sig=min(30,a.sig+P[b.post]['grow'])
        S=b.emit/(1+(d/10)**2)
        if S>0.2:
            so=max(5.0/math.sqrt(S/0.2) if not b.pinged else 1.0,0.8)
            if so<a.sig:a.est=(b.pos[0]+rng.gauss(0,so),b.pos[1]+rng.gauss(0,so));a.sig=so
        if a.pinged:
            so=1.2 if d<25 else 4.0
            if so<a.sig:a.est=(b.pos[0]+rng.gauss(0,so),b.pos[1]+rng.gauss(0,so));a.sig=so
    def fire(a,b,rng,t):
        if a.reload>0:a.reload-=1;return False
        lim=3.5+relax*max(0,t-t0)
        if a.est and a.sig<=lim and dist(a.pos,a.est)<=20:
            a.reload=3;a.emit+=4;sc=max(1.0,a.sig/3.5)
            for _ in range(4):
                if math.hypot(a.est[0]+rng.gauss(0,sc)-b.pos[0],a.est[1]+rng.gauss(0,sc)-b.pos[1])<3.0:return True
        return False
    def match(pa,pb,rng):
        A=H.Side((rng.uniform(0,arena),rng.uniform(0,arena)),*pa);B=H.Side((rng.uniform(0,arena),rng.uniform(0,arena)),*pb)
        while dist(A.pos,B.pos)<min(18,arena*.45):B.pos=[rng.uniform(0,arena),rng.uniform(0,arena)]
        for t in range(1,T+1):
            step(A,B,rng,t);step(B,A,rng,t);observe(A,B,rng,t);observe(B,A,rng,t)
            fa,fb=fire(A,B,rng,t),fire(B,A,rng,t)
            if fa and fb:return 'D',t
            if fa:return 'A',t
            if fb:return 'B',t
        return 'D',T
    pols=list(itertools.product(['still','evade','close'],['never','blind','often']));names=['%s/%s'%p for p in pols]
    rng=random.Random(seed);sc={n:0 for n in names};g={n:0 for n in names};ts=[];dr=0;tot=0
    for i,pa in enumerate(pols):
        for j,pb in enumerate(pols):
            if i==j:continue
            for _ in range(N//8):
                r,t=match(pa,pb,rng);tot+=1;g[names[i]]+=1;g[names[j]]+=1
                if r=='A':sc[names[i]]+=1;ts.append(t)
                elif r=='B':sc[names[j]]+=1;ts.append(t)
                else:dr+=1
    w={n:sc[n]/g[n] for n in names}
    pw={p:statistics.mean(w[p+'/'+x] for x in('never','blind','often')) for p in('still','evade','close')}
    return dict(draw=dr/tot,t=statistics.mean(ts),pw=pw,best=max(w,key=w.get),bv=max(w.values()),worst=min(w,key=w.get),wv=min(w.values()),
        med=statistics.median(ts), late=statistics.mean(1 for x in ts if x>20)*0 + sum(x>20 for x in ts)/len(ts))
cf={'baseline':{},'arena30':dict(arena=30),
 'squeeze1 t>8':dict(squeeze=1.0),'squeeze1.5 t>8':dict(squeeze=1.5),
 'relax.3':dict(relax=0.3),'relax.3+squeeze1':dict(relax=0.3,squeeze=1.0),
 'arena30+sq1+rel.3':dict(arena=30,relax=0.3,squeeze=1.0),
 'arena30+sq1+rel.3+still e.5':dict(arena=30,relax=0.3,squeeze=1.0,post={'still':dict(e=0.5)})}
CHOSEN=dict(relax=.3,squeeze=1.0,post={'close':dict(move=4.5,grow=0.6),'still':dict(e=.4,fill=.06),'evade':dict(fill=.10)})
cf['CHOSEN']=CHOSEN
if __name__=='__main__':
    for n,c in cf.items():
        r=run(**c);print('%-28s draw %.2f t %.1f(med %.0f) late %.2f | still %.2f evade %.2f close %.2f | best %s %.2f worst %s %.2f'%(n,r['draw'],r['t'],r['med'],r['late'],r['pw']['still'],r['pw']['evade'],r['pw']['close'],r['best'],r['bv'],r['worst'],r['wv']))
