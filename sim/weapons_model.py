"""Weapon families vs situations (not vs each other). Run: python3 -I sim/weapons_model.py
Idea: no weapon 'counters' another by type. Each weapon stresses a different resource (time, signature, power/heat, ammo),
and defenses are states the enemy is in (aware, point defense up, screened), so the best weapon changes with the situation."""
import math
W = {  # range_max km, flight speed km/min (0 = instant), kill power, exposure, heat, ammo, needs_track (0..1 sensitivity to track quality), salvage_damage
 'kinetic': dict(rng=45, speed=14, power=0.52, guide=0.0, exp=3,  heat=2, ammo=6, track=0.2, dmg=0.50),
 'missile': dict(rng=60, speed=30, power=0.80, guide=0.65, exp=12, heat=3, ammo=2, track=0.7, dmg=0.80),
 'lance':   dict(rng=18, speed=0,  power=0.90, guide=0.0, exp=20, heat=10, ammo=99, track=0.1, dmg=0.60),
}
S = {  # situation: range, aware (dodges), pd (point defense up), screen (escorts raise relay/notice), want_intact (salvage value), track quality 0..1
 'unaware patrol':        dict(r=40, aware=0, pd=0, screen=0, intact=0.2, track=0.7),
 'aware, hunting us':     dict(r=30, aware=1, pd=1, screen=0, intact=0.0, track=0.8),
 'screened convoy':       dict(r=35, aware=0, pd=1, screen=1, intact=0.1, track=0.5),
 'cold hulk, salvage':    dict(r=15, aware=0, pd=0, screen=0, intact=1.0, track=0.9),
 'aware, PD cycling':     dict(r=28, aware=1, pd=0, screen=0, intact=0.0, track=0.8),
 'ambush at 12 km':       dict(r=12, aware=0, pd=0, screen=0, intact=0.1, track=0.8),
 'closed on aware foe':   dict(r=14, aware=1, pd=1, screen=0, intact=0.0, track=0.8),
}
def evaluate(w, s, pd_mult=0.4, armor=0.0):
    if s['r'] > w['rng']: return None
    flight = 0 if w['speed'] == 0 else s['r'] / w['speed']
    dodge = math.exp(-0.40 * flight * (1 - w['guide'])) if s['aware'] else 1.0
    pdm = pd_mult if (s['pd'] and w['speed'] > 20) else 1.0           # point defense only catches fast guided rounds
    pdm2 = 0.8 if (s['pd'] and 0 < w['speed'] <= 20) else pdm          # slow rounds get partly intercepted too
    trackq = 1 - w['track'] * (1 - s['track'])
    hit = w['power'] * dodge * pdm2 * trackq
    noticed = (w['exp'] / 100.0) * (1.8 if s['screen'] else 1.0)
    intact_pen = s['intact'] * w['dmg'] * 30
    u = 100 * hit - 1.2 * w['exp'] - 1.5 * w['heat'] - intact_pen - 40 * noticed * (1 if s['screen'] else 0.3)
    return u, hit, flight
if __name__ == '__main__':
    print('%-22s' % 'situation' + ''.join('%-24s' % k for k in W))
    wins = {k: 0 for k in W}
    for sn, s in S.items():
        row = {k: evaluate(w, s) for k, w in W.items()}
        best = max((k for k in row if row[k]), key=lambda k: row[k][0]); wins[best] += 1
        print('%-22s' % sn + ''.join(('%5.1f (hit %2.0f%% %3.1fm)  ' % (v[0], v[1] * 100, v[2]) if v else '%-24s' % 'out of range') for v in row.values()) + '  best: ' + best)
    print('best-weapon counts:', wins)
