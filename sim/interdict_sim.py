"""Interdict slice: heat + ladder race Monte Carlo. Units: game-minutes (gm). Stdlib only.
Honest limits: one enemy, no officer/crew psychology, no real story value; 'win' = outcome categories, not fun."""
import random, statistics, collections, sys
DT=0.25
P=dict(
 sink_fill_base=100/60.0,   # %/gm silent, AI low
 ai_heat={0:1.0,1:1.25,2:1.6}, ai_speed={0:1.0,1:1.2,2:1.4}, ai_enemy={0:1.0,1:1.12,2:1.3},
 passive=[6,10,10,8], active=[1.5,2.5,2.5,2.0],
 enemy_known=[0,4,5,5], enemy_blind=[40,40,40,40],  # gm per rung
 bearing_hold=8.0, tof=8.0, vent_rate=8.0, bloom=6.0, ping_heat=1.0, launch_heat=5.0,
 window=(40,60), start_heat=(12,28), cook_after=6.0,
 # --- v2 rules (all off in OLD ruleset)
 leak_rate=0.0,        # passive detect chance per gm per heat-% above leak_floor
 leak_floor=40.0, vent_exposure=6.0, miss_escalates=False, loyalty_event=False,
 stale_after=99.0, relay_detect=0.0, miss_dmg=0.5)
NEW=dict(leak_rate=0.002, vent_exposure=20.0, miss_escalates=True, loyalty_event=True,
         stale_after=3.0, relay_detect=0.35, miss_dmg=0.3,
         sink_fill_base=100/52.0, bearing_hold=12.0)
def run(policy, rng):
    ai=policy.get('ai',0); skill=rng.uniform(.3,.9)
    noise=lambda: rng.uniform(.75,1.3)
    dp=[d*noise() for d in P['passive']]; da=[d*noise() for d in P['active']]
    de=[d*noise() for d in P['enemy_known']]
    W=rng.uniform(*P['window']); H=rng.uniform(*P['start_heat'])
    # calls: heat sink fault at dog-leg (resolved before t=0)
    cap=1.0
    mode=policy.get('calls','delegate')
    if mode=='ignore': cap=0.85
    elif mode=='delegate': cap*= rng.choices([0.9,1.0,1.0],[.2,.3,.5])[0] if rng.random()<.6*skill+.1 else 1.0
    else: pass
    # delegate: 60%-ish ok; worse 20%: cap .85
    if mode=='delegate' and rng.random()<.2: cap=.85
    t=0; rung=0; prog=0.0; erung=0; eprog=0.0
    active=False; venting=False; bearing_until=-1; peak=H; hot=0; fired=None; enemy_fired=None
    margin_low=0; steps=0; last_active=-99.0; loyalty_done=False; leaked=False; broke=False; used_active=False; vented=False; cooked=False; ping_ticks=0
    policy_vent=policy.get('vent'); active_rule=policy.get('active')
    while True:
        t+=DT; steps+=1
        if P['leak_rate'] and not active and not venting and H>P['leak_floor'] and rng.random()<P['leak_rate']*(H-P['leak_floor'])*DT:
            bearing_until=max(bearing_until,t+P['bearing_hold']); leaked=True
        known = t<=bearing_until
        # --- policy decisions
        if active_rule=='always': active=True
        elif active_rule=='never': active=False
        elif active_rule=='smart':
            need_passive=sum(dp[rung:])-prog*dp[min(rung,3)] if rung<4 else 0
            # go active if passive can't finish before window or heat gets near 70
            active = (need_passive > (W-t)*0.9) or H>65
            if rung>=2 and not known and need_passive<(W-t)*.6 and H<55: active=False
        if active: used_active=True
        if policy_vent=='constant': venting = H>45
        elif policy_vent=='crisis': venting = H>=85 or (venting and H>40)
        else: venting=False
        if venting: vented=True
        # --- heat
        fill=P['sink_fill_base']*P['ai_heat'][ai]/cap
        dH=fill*DT
        if active: dH+=P['ping_heat']*DT
        if venting: dH=-P['vent_rate']*DT
        H=max(0,min(100,H+dH)); peak=max(peak,H)
        crew=1.0 if H<85 else (0.8 if H<100 else 0.5)
        if H>=100: hot+=DT
        else: hot=max(0,hot-DT)
        if hot>=P['cook_after']: cooked=True; break
        if venting or active: bearing_until=t+(P['vent_exposure'] if venting else P['bearing_hold'])
        if active: last_active=t
        known = t<=bearing_until
        # --- our ladder
        if rung<4:
            d=(da[rung] if active else dp[rung])/(P['ai_speed'][ai]*crew)
            prog+=DT/d
            if prog>=1:
                rung+=1; prog=0
                if P['loyalty_event'] and ai==2 and rung==3 and not loyalty_done:
                    loyalty_done=True
                    if rng.random()<0.5: dp[3]+=3.0; da[3]+=1.0
        # --- enemy ladder (3 rungs after detect)
        if erung<4:
            if known:
                if erung==0: erung=1; eprog=0
                d=max(de[erung] if erung<4 else 1,0.3)/(P['ai_enemy'][ai]) if erung>0 else 1
            else:
                d=P['enemy_blind'][min(erung,3)]/P['ai_enemy'][ai]
            if erung>=1 and erung<4:
                eprog+=DT/d
                if eprog>=1: erung+=1; eprog=0
            if erung==4 and enemy_fired is None: enemy_fired=t
        # margins for tension proxy
        ours=sum(dp[rung:])*(0.3 if active else 1)
        heat_gm=(100-H)/max(fill,.1)
        enemy_gm=(sum(de[erung:]) if known and erung<4 else 99)
        if min(W-t,heat_gm,enemy_gm)<8: margin_low+=DT
        # --- fire decision
        if rung==4 and fired is None:
            if policy.get('fire','yes')=='yes': fired=t
            elif policy['fire']=='never': pass
        if policy.get('breakoff') and rung>=policy['breakoff'] and not broke and fired is None:
            broke=True; break
        if fired is not None and t>=fired+P['tof']: break
        if enemy_fired is not None and t>=enemy_fired+P['tof']: break
        if t>=W and fired is None: break
        if t>=W+25: break
    # --- outcome
    if cooked: return 'COOKED',peak,margin_low*1.0,t
    if broke: return 'BROKE_OFF',peak,margin_low,t
    if fired is None:
        if enemy_fired is not None: 
            hit = rng.random()<0.6
            return ('AMBUSHED' if hit else 'SLIPPED_EXPOSED'),peak,margin_low,t
        return ('SLIPPED_EXPOSED' if bearing_until>0 and used_active or vented else 'SLIPPED_CLEAN'),peak,margin_low,t
    # our shot
    since=fired-last_active
    conf = 0.95 if (used_active and since<=P['stale_after']) else (0.82 if used_active else 0.72)
    age = 0 if (used_active and since<=P['stale_after']) else 4
    p = 0.30+0.30*conf+0.12*skill+0.10-0.012*age-(0.1 if H>=85 else 0)+0.04*ai
    p=max(.05,min(.95,p)); hit=rng.random()<p
    theirs = enemy_fired is not None and enemy_fired<fired+P['tof']
    dmg = theirs and rng.random()<0.6
    if hit: return ('DAMAGED_KILL' if dmg else 'CLEAN_KILL'),peak,margin_low,t
    if P['miss_escalates'] and rng.random()<P['miss_dmg']: dmg=True
    return ('AMBUSHED' if dmg else 'MISS_EXPOSED'),peak,margin_low,t
POL={
 'passive_always':dict(active='never'),
 'active_always':dict(active='always'),
 'smart_mixed':dict(active='smart'),
 'passive_never_fire':dict(active='never',fire='never'),
 'passive_breakoff@classify':dict(active='never',breakoff=2),
 'ai_high_passive':dict(active='never',ai=2),
 'ai_high_smart':dict(active='smart',ai=2),
 'ai_low_smart':dict(active='smart',ai=0),
 'vent_constantly':dict(active='never',vent='constant'),
 'vent_in_crisis_only':dict(active='never',vent='crisis'),
 'ignore_calls_passive':dict(active='never',calls='ignore'),
 'delegate_always_smart':dict(active='smart',calls='delegate'),
}
def report(N,label):
    cats=['CLEAN_KILL','DAMAGED_KILL','MISS_EXPOSED','AMBUSHED','COOKED','SLIPPED_CLEAN','SLIPPED_EXPOSED','BROKE_OFF']
    print('\n== %s (%d runs per policy, seed 42) =='%(label,N))
    print('%-26s'%'policy',' '.join('%7s'%c[:7] for c in cats),'  WIN%  relayTrouble%  peakH')
    for name,pol in POL.items():
        rng=random.Random(42); c=collections.Counter(); pk=[]
        for _ in range(N):
            o,pe,m,t=run(pol,rng); c[o]+=1; pk.append(pe)
        win=c['CLEAN_KILL']+c['DAMAGED_KILL']
        alive=N-win   # cutter survives unless we kill it
        print('%-26s'%name,' '.join('%6.1f%%'%(100*c[k]/N) for k in cats),'%5.1f%% %9.1f%% %6.0f'%(100*win/N,100*alive/N*(P['relay_detect'] or 0.35),statistics.mean(pk)))
if __name__=='__main__':
    N=int(sys.argv[1]) if len(sys.argv)>1 else 20000
    old=dict(P)
    report(N,'OLD rules (critic baseline)')
    P.update(NEW)
    report(N,'NEW rules (leak, long vent exposure, miss escalation, AI loyalty event, stale active data)')
