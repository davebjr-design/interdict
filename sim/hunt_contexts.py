import sys, json, itertools, collections, numpy as np
sys.path.insert(0,'/home/claude/interdict/sim')
import hunt_mc as mc
BASE = dict(mc.PAR, cold=0.4, dexp=1.2, winvalue=2.0, winretal=0.5, wlo=2, whi=8)
CTX = {
 'ambush':  dict(BASE, A=10, esc_mean=5, h0=0.02, hdraw=0.008, pwin=0.3, nmult=0.7, nd=2.5),
 'brawl':   dict(BASE, A=3, killpen=-40, esc_mean=10, d0=0.03, pwin=0.3),
 'stakeout':dict(BASE, A=3, pwin=0.9, wlo=4, whi=12, esc_mean=60, creep0=3.0, hdraw=0.006),
}
def mk(ids,P):
    m=collections.Counter(P[i]['maker'] for i in ids); return m.most_common(1)[0]
def kit(ids,P):
    mk_,n=mk(ids,P)
    return mk_+' kit' if n==4 else mk_+'-3' if n==3 else 'hybrid'
def evaluate(P,R,bp,Dd=300,N=2500,verbose=True,label=''):
    res={c:mc.run(P,R,bp,N,par) for c,par in CTX.items()}
    tab={c:mc.best(r,Dd) for c,r in res.items()}
    ids=list(tab['ambush'].keys())
    out={}
    if verbose: print('#####',label,'D=%d'%Dd)
    for c in CTX:
        rows=sorted(tab[c].items(),key=lambda kv:-kv[1][0])
        if verbose:
            print(' ctx %-8s'%c)
            for i,(sc,pol,v) in rows[:3]: print('    %5.1f %-34s %-12s close%d hold%d kill %.2f die %.3f'%(sc,' '.join(i),kit(i,P),pol[0],pol[1],v[0],v[1]))
            print('    pol mix top25:',collections.Counter(p[1] for i,(s,p,v) in rows[:25]).most_common(3),' kits top25:',collections.Counter(kit(i,P) for i,_ in rows[:25]).most_common(5))
            print('    unused in top25:',[p for p in P if p not in {x for i,_ in rows[:25] for x in i}])
            bykit=collections.defaultdict(float)
            for i,(sc,_,_) in rows: bykit[kit(i,P)]=max(bykit[kit(i,P)],sc)
            print('    best score per kit:',{k:round(v,1) for k,v in sorted(bykit.items(),key=lambda kv:-kv[1])})
    mean={i:np.mean([tab[c][i][0] for c in CTX]) for i in ids}
    rows=sorted(mean.items(),key=lambda kv:-kv[1])
    if verbose:
        print(' GENERALIST top3 (mean over 3 ctx, min):')
        for i,m in rows[:3]: print('    %5.1f min %5.1f %-34s %s'%(m,min(tab[c][i][0] for c in CTX),' '.join(i),kit(i,P)))
    return res,tab
if __name__=='__main__':
    D=json.load(open(sys.argv[1])); evaluate(D['parts'],D['rules'],D['base_power'],int(sys.argv[2]) if len(sys.argv)>2 else 300,label=sys.argv[1])
