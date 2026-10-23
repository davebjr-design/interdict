"""Anomaly investigation v2 (critic-tuned). Run: python3 -I sim/anomalies_v2.py
Changes vs v1: 3-stage visible enemy approach clock (each stage a beat); chasing a false positive costs time at 2.5x hazard and lures may be bait (advances the clock);
8 anomalies with 2 real ships (win needs both, 2-minute engagement beat each); lure strength varies per hunt; half-threshold sharpening beat. Settings Quick/Standard/Thorough = T 1/2/3.
Original critic script by subagent; ported verbatim then parameterized below."""
import random, statistics, itertools, sys
def hunt(slots,T,P,rng,assist='none'):
    N=P['N']; kinds=['real']*P['nreal']+['lure']*P['nlure']+['ghost']*(N-P['nreal']-P['nlure']); rng.shuffle(kinds)
    ev=[0.0]*N; st=['open']*N; t=0.0; beats=0; quiet=0; longest=0; first=None; stage=0; rin=0
    k=slots+(1 if assist=='slot' else 0); sp=1.25 if assist=='speed' else 1.0
    def beat():
        nonlocal beats,quiet,longest,first
        beats+=1; longest=max(longest,quiet); quiet=0
        if first is None: first=t
    while t<P['clock']:
        op=[i for i in range(N) if st[i]=='open']
        if not op:
            if any(kinds[i]=='real' and st[i]=='out' for i in range(N)):
                t+=P['rescan']; ev=[0.0]*N; st=['open' if st[i]!='in' else 'in' for i in range(N)]; beat(); continue
            return ('none',t,beats,longest,first)
        act=min(k,len(op))
        t+=1; quiet+=1
        if rng.random()<P['base']*P['tempo']+P['draw']*act:
            stage+=1; beat()
            if stage>=P['stages']: return ('found',t,beats,longest,first)
        order=sorted(op,key=lambda i:-ev[i])[:k]
        for i in order:
            m=P['D']*P['q']*sp*(1 if kinds[i]=='real' else (P['lure'] if kinds[i]=='lure' else -1))
            if assist=='slot' and i==order[-1] and rng.random()<0.10: m=-m
            old=ev[i]; ev[i]+=rng.gauss(m,1)
            if ev[i]>=T:
                st[i]='in'; beat()
                if kinds[i]=='real':
                    rin+=1; t+=P['engage']; beat()
                    if rin>=P['need']: return ('win',t,beats,longest,first)
                    continue
                # chase: costs time at elevated hazard, bait risk
                for _ in range(P['chase']):
                    t+=1; quiet+=1
                    if rng.random()<(P['base']*P['tempo'])*P['chasemult']:
                        stage+=1; beat()
                        if stage>=P['stages']: return ('found',t,beats,longest,first)
                if kinds[i]=='lure' and rng.random()<P['bait']:
                    stage+=P['baitstage']; beat()
                    if stage>=P['stages']: return ('found',t,beats,longest,first)
                st[i]='out'; beat()
            elif ev[i]<=-T: st[i]='out'; beat()
            elif abs(ev[i])>=T/2 and abs(old)<T/2 and T>=2: beat()   # partial-evidence milestone
    return ('clock',t,beats,longest,first)
def run(P,M=1200,assist='none',seed=1):
    out={}
    for s in (1,2,3):
        for T in (1,2,3,4,5):
            rng=random.Random(seed*1000+s*10+T); R=[hunt(s,T,P,rng,assist) for _ in range(M)]
            out[(s,T)]=(statistics.mean(r[0]=='win' for r in R),statistics.mean(r[0]=='found' for r in R),statistics.mean(r[2] for r in R),statistics.mean(r[1] for r in R),statistics.mean(r[3] for r in R),statistics.mean((r[4] or 99) for r in R))
    return out
def show(name,P,assist='none'):
    o=run(P,assist=assist); print('\n==',name,assist)
    print('slots T: win/found/beats/mins/quiet/first')
    for s in (1,2,3): print(' s%d '%s+'  '.join('T%d %2.0f/%2.0f/%4.1f/%4.1f/%3.1f/%3.1f'%((T,)+tuple([100*o[(s,T)][0],100*o[(s,T)][1]]+list(o[(s,T)][2:]))) for T in (1,2,3,4,5)))
    return o
V2=dict(N=8,nreal=2,nlure=3,clock=40,rescan=5,base=0.08,draw=0.02,D=0.7,q=1.0,tempo=1.0,lure=-0.4,chase=4,chasemult=2.5,bait=0.5,baitstage=1,stages=3,engage=2,need=2)
CONTEXTS={'weak lure, slow enemy':dict(lure=-0.8,tempo=0.7),'weak lure, fast enemy':dict(lure=-0.8,tempo=1.5),'strong lure, slow enemy':dict(lure=-0.1,tempo=0.7),'strong lure, fast enemy':dict(lure=-0.1,tempo=1.5),'mid':dict()}
if __name__=='__main__':
    for name,ov in CONTEXTS.items():
        P=dict(V2); P.update(ov); show(name,P)
