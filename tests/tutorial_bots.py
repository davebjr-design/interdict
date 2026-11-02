# Tutorial hunt (P2) played through the real UI by four scripted players, in Playwright (Chromium):
#   literal  does exactly what the highlighted control says (1x game speed, real time)
#   idle     presses only 'Understood' when it is offered and otherwise waits for Ostrow to do each step (run at 4x)
#   skipper  presses 'Skip step' on every step as soon as it shows (1x)
#   wander   random legal clicks: console keys, slips, channel cells, scope right-click menus, view keys (4x, seeded)
# Every player must reach the surrender screen with Corvane alive; the solution bar must be seen rising; every highlight must be on a
# visible control; the order box must never overflow or cover a live control. The literal player's solution must go from lock to
# ready within 90 real seconds at 1x. Run: python3 tests/tutorial_bots.py [literal|idle|skipper|wander ...]
import sys, time, random
from playwright.sync_api import sync_playwright
R = '/home/claude/interdict/'; bad = []
def chk(m, c):
    print('ok  ' if c else 'FAIL', m)
    if not c: bad.append(m)

WATCH = """(() => { if (window.__m) return; const m = window.__m = { r0: performance.now(), lockR: null, lockT: null, readyR: null, readyT: null, bars: [], hiBad: [], over: [], cover: [], steps: [] };
  const boxR = () => { const b = document.getElementById('tutbox'); return b && !__tut.done ? b.getBoundingClientRect() : null; };
  setInterval(() => { if (!S || __tut.done) return; const C = S.an[__tut.corvane], now = performance.now();
    if (C.state === 'locked' && m.lockR == null) { m.lockR = now; m.lockT = S.t; }
    if (C.state === 'locked' && (C.solve || 0) >= 1 && m.readyR == null) { m.readyR = now; m.readyT = S.t; }
    const b = document.getElementById('tutsolb'); if (b) { const w = parseFloat(b.style.width); if (!m.bars.length || m.bars[m.bars.length - 1] !== w) m.bars.push(w); }
    if (m.steps[m.steps.length - 1] !== __tut.id) m.steps.push(__tut.id);
    const tg = __tut.hiTargets(), vis = tg.flatMap(q => [...document.querySelectorAll(q)]).filter(__tut.visible);
    if (tg.length && (!vis.length || !document.querySelector('.tut-hi'))) m.hiBad.push(__tut.id + ':' + tg.join(','));
    const bx = document.getElementById('tutbox'); if (bx.scrollHeight > bx.clientHeight + 2) m.over.push(__tut.id);
    const r = boxR(); if (r) document.querySelectorAll('#stage [data-act]').forEach(e => { if (!__tut.visible(e)) return; const q = e.getBoundingClientRect(), ix = Math.min(r.right, q.right) - Math.max(r.left, q.left), iy = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top); if (ix > 4 && iy > 4) m.cover.push((e.id || e.dataset.act) + '@' + __tut.id); });
  }, 250); })()"""
ST = "(() => { const C = S.an[__tut.corvane]; return { id: __tut.id, step: __tut.step, t: S.t, done: __tut.done, hp: C.hp, hpMax: C.hpMax, cstate: C.state, solve: C.solve || 0, hull: S.hull, view, vols: __tut.vols, nxt: !!document.getElementById('tutnext'), hi: __tut.hiTargets() }; })()"

def try_click(pg, sel, button='left', timeout=1200):
    try:
        loc = pg.locator(sel).filter(visible=True).first
        loc.click(button=button, timeout=timeout); return True
    except Exception:
        return False

def go_here(pg, rnd=None, pick_any=False):
    # right-click open space on the scope (or map) and pick a 'Go here' entry
    host = '#cv' if pg.evaluate("view") != 'str' else '#map'
    bb = pg.locator(host).bounding_box()
    if not bb: return False
    pts = [(0.5, 0.82), (0.25, 0.75), (0.75, 0.25), (0.2, 0.2), (0.8, 0.8)]
    if rnd: pts = [(rnd.uniform(0.1, 0.9), rnd.uniform(0.1, 0.9))]
    for fx, fy in pts:
        pg.mouse.click(bb['x'] + bb['width'] * fx, bb['y'] + bb['height'] * fy, button='right'); pg.wait_for_timeout(250)
        btns = pg.locator('#cmenu:not([hidden]) button:not([disabled])')
        n = btns.count()
        if n:
            if pick_any:
                btns.nth(rnd.randrange(n)).click(timeout=1000); return True
            go = pg.locator('#cmenu:not([hidden]) button[data-k=go]:not([disabled])')
            if go.count():
                go.nth(min(1, go.count() - 1)).click(timeout=1000); return True
        pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
    return False

def literal(pg, st, mem):
    hi = st['hi']; vis = pg.evaluate("tg => tg.filter(q => [...document.querySelectorAll(q)].some(__tut.visible))", hi)
    acted = False
    for q in vis:
        if q in ('#an0', '#an1', '#an2', '#ct .cslip'): continue          # pointing at a display: read it
        if q in ('#cv', '#map'): acted = go_here(pg) or acted; continue
        if q == '#k-fire':
            if try_click(pg, '#k-fire'): pg.wait_for_timeout(350); try_click(pg, '#k-fire'); acted = True
            continue
        if q == '#kv-tgt' and st['view'] == 'tgt': continue
        acted = try_click(pg, q) or acted; pg.wait_for_timeout(300)
    if st['nxt'] and (not vis or all(q in ('#an0', '#an1', '#an2', '#ct .cslip') for q in vis) or st['id'] == 'track'):
        if mem.get('nx') != st['step']: mem['nx'] = st['step']; pg.wait_for_timeout(1500); try_click(pg, '#tutnext')

def idle(pg, st, mem):
    if st['nxt'] and mem.get('nx') != st['step']: mem['nx'] = st['step']; pg.wait_for_timeout(2000); try_click(pg, '#tutnext')

def skipper(pg, st, mem):
    if mem.get('sk') != st['step']:
        mem['sk'] = st['step']; pg.wait_for_timeout(800); try_click(pg, '#tutskip')
    elif st['id'] in ('fire', 'again'): pass                     # Dunne fires when the solution is ready

def wander(pg, st, mem):
    rnd = mem['rnd']; x = rnd.random()
    if x < 0.62:
        ids = pg.evaluate("""[...document.querySelectorAll('#stage [data-act]')].filter(e => __tut.visible(e) && !e.classList.contains('dis') && !['pause','menu','speed'].includes(e.dataset.act)).map((e, i) => { e.dataset.wz = i; return i; })""")
        if ids: try_click(pg, '[data-wz="%d"]' % rnd.choice(ids), timeout=600)
    elif x < 0.80: go_here(pg, rnd, pick_any=True)
    elif x < 0.90: pg.keyboard.press(rnd.choice(['1', '2', '3', 'v', 'Escape']))
    elif x < 0.95: try_click(pg, '#tutnext', timeout=400)
    else:
        try_click(pg, '#k-fire', timeout=400); pg.wait_for_timeout(200); try_click(pg, '#k-fire', timeout=400)
    pg.keyboard.press('Escape') if rnd.random() < 0.2 else None

BOTS = {'literal': (literal, 1, 700), 'idle': (idle, 4, 500), 'skipper': (skipper, 1, 500), 'wander': (wander, 4, 350)}

def run(b, name, page='web/hunt_rt.html?tutorial=tern&return=index.html', vp=(1366, 768), limit_real=900):
    fn, speed, gap = BOTS[name]
    pg = b.new_page(viewport={'width': vp[0], 'height': vp[1]}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text[:200]) if m.type == 'error' and 'ERR_' not in m.text and 'Failed to load resource' not in m.text else None)
    pg.goto('file://' + R + page); pg.wait_for_timeout(1200)
    pg.evaluate(WATCH)
    if speed != 1: pg.evaluate("setTime(%d)" % speed)
    mem = {'rnd': random.Random(int(__import__('os').environ.get('TUT_SEED', '7')))}; t0 = time.time(); st = pg.evaluate(ST)
    while time.time() - t0 < limit_real:
        st = pg.evaluate(ST)
        if st['done']: break
        try: fn(pg, st, mem)
        except Exception as e: print('   (bot action failed: %s)' % str(e)[:120])
        pg.wait_for_timeout(gap)
    real = time.time() - t0; m = pg.evaluate("window.__m"); st = pg.evaluate(ST)
    autos = pg.evaluate("__tut.autos"); fin = pg.evaluate("!!document.getElementById('tutdone')")
    lock_ready = (m['readyR'] - m['lockR']) / 1000 if m['readyR'] and m['lockR'] else None
    lock_ready_g = (m['readyT'] - m['lockT']) * 16 if m['readyT'] is not None and m['lockT'] is not None else None
    print('   %s: %.1f real min, %.1f game min (%.1f min at 1x); steps %s; autos %s; lock->ready %s real s (%s s at 1x); bar %s; hull %d, her hp %d/%d, volleys %d' % (
        name, real / 60, st['t'], st['t'] * 16 / 60, '>'.join(m['steps']), autos, None if lock_ready is None else round(lock_ready, 1),
        None if lock_ready_g is None else round(lock_ready_g, 1), m['bars'][:4] + ['...'] + m['bars'][-2:] if len(m['bars']) > 6 else m['bars'], st['hull'], st['hp'], st['hpMax'], st['vols']))
    chk(name + ' reaches the surrender screen', fin)
    chk(name + ' Corvane alive at surrender', st['hp'] > 0 and st['cstate'] != 'disabled')
    rise = [x for i, x in enumerate(m['bars']) if i and x > m['bars'][i - 1]]
    chk(name + ' solution bar seen rising to 100%', len(rise) >= 3 and max(m['bars'] or [0]) >= 100)
    chk(name + ' every highlight on a visible control', not m['hiBad'])
    if m['hiBad']: print('   ', sorted(set(m['hiBad']))[:6])
    chk(name + ' order box never overflows', not m['over'])
    if m['over']: print('   ', sorted(set(m['over'])))
    chk(name + ' order box covers no live control', not m['cover'])
    if m['cover']: print('   ', sorted(set(m['cover']))[:8])
    chk(name + ' no page errors', not errs)
    if errs: print('   ', errs[:3])
    if name == 'literal':
        chk('literal: solution lock->ready within 90 real s at 1x', lock_ready is not None and lock_ready <= 90)
        chk('literal: no step needed Ostrow to do it', not [a for a in autos if not a.startswith('fire')])
    pg.close()

with sync_playwright() as p:
    b = p.chromium.launch()
    for name in (sys.argv[1:] or ['literal', 'skipper', 'idle', 'wander']): run(b, name)
    b.close()
print('FAILED' if bad else 'ALL OK'); sys.exit(1 if bad else 0)
