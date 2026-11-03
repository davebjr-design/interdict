# Tutorial hunt (P2) played through the real UI by four scripted players, in Playwright (Chromium):
#   literal  starts the clock, reads every box (about a second) and presses Understood, then does exactly what the highlighted
#            control says (1x game speed, real time)
#   skipper  presses Skip step on every step as soon as it shows, and Understood on every note (1x)
#   wander   seeded random legal clicks (console keys including PAUSE and the speed keys, slips, channel cells, scope right-click
#            menus, view keys) and Understood about a third of the time (4x)
#   idle     never acts. The page must not crash and game time must not move: first while the start pause is up, then (after the
#            harness starts the clock for it) while Ostrow's first order waits to be read.
# Checks for every player: game time never moves while a box is being read or the clock is paused; no page errors; every highlight on
# a visible control; the order box never overflows or covers a live control; contact 3 is never called a ship, Corvane, 'her' or
# 'she' in Ostrow's box before the engine's readings identify it. literal, skipper: reach the surrender with Corvane alive and the
# solution bar seen rising to 100%. literal: the solution goes from lock to ready within 90 s of running clock at 1x, no step was done
# for it, and game time advances after each Understood. wander: Corvane alive (surrender reported, not required).
# Run: python3 tests/tutorial_bots.py [literal|skipper|wander|idle ...]
import sys, time, random, os
from playwright.sync_api import sync_playwright
R = '/home/claude/interdict/'; bad = []
def chk(m, c):
    print('ok  ' if c else 'FAIL', m)
    if not c: bad.append(m)

WATCH = r"""(() => { if (window.__m) return; const m = window.__m = { lockT: null, readyT: null, bars: [], hiBad: [], over: [], cover: [], steps: [], frozenBad: [], named: [], prev: null, runT: 0, readN: 0 };
  const boxR = () => { const b = document.getElementById('tutbox'); return b && !__tut.done ? b.getBoundingClientRect() : null; };
  setInterval(() => { if (!S || __tut.done) return; const C = S.an[__tut.corvane];
    const fr = __tut.reading || paused, key = __tut.step + ':' + __tut.beat + ':' + __tut.beatsSeen().length + ':' + paused + ':' + __tut.reading;
    if (m.prev && m.prev.fr && fr && m.prev.key === key && Math.abs(S.t - m.prev.t) > 1e-9) m.frozenBad.push(__tut.id + '@' + S.t.toFixed(3));
    if (m.prev && !m.prev.fr && !fr) m.runT += S.t - m.prev.t;
    if (fr) m.readN++;
    m.prev = { fr, key, t: S.t };
    if (C.state === 'locked' && m.lockT == null) m.lockT = S.t;
    if (C.state === 'locked' && (C.solve || 0) >= 1 && m.readyT == null) m.readyT = S.t;
    const b = document.getElementById('tutsolb'); if (b) { const w = parseFloat(b.style.width); if (!m.bars.length || m.bars[m.bars.length - 1] !== w) m.bars.push(w); }
    if (m.steps[m.steps.length - 1] !== __tut.id) m.steps.push(__tut.id);
    if (!__tut.identified && /\b(Corvane|her|she)\b|a ship/i.test(__tut.text)) m.named.push(__tut.id + ': ' + __tut.text.slice(0, 80));
    const tg = __tut.hiTargets(), vis = tg.flatMap(q => [...document.querySelectorAll(q)]).filter(__tut.visible);
    if (tg.length && (!vis.length || !document.querySelector('.tut-hi'))) m.hiBad.push(__tut.id + ':' + tg.join(','));
    const bx = document.getElementById('tutbox'); if (bx.scrollHeight > bx.clientHeight + 2) m.over.push(__tut.id + (__tut.beat ? '/' + __tut.beat : ''));
    const r = boxR(); if (r) document.querySelectorAll('#stage [data-act]').forEach(e => { if (!__tut.visible(e)) return; const q = e.getBoundingClientRect(), ix = Math.min(r.right, q.right) - Math.max(r.left, q.left), iy = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top); if (ix > 4 && iy > 4) m.cover.push((e.id || e.dataset.act) + '@' + __tut.id); });
  }, 100); })()"""
ST = "(() => { const C = S.an[__tut.corvane]; return { id: __tut.id, step: __tut.step, t: S.t, done: __tut.done, hp: C.hp, hpMax: C.hpMax, cstate: C.state, solve: C.solve || 0, hull: S.hull, view, vols: __tut.vols, reading: __tut.reading, paused, beat: __tut.beat, nxt: !!document.getElementById('tutnext'), skp: !!document.getElementById('tutskip'), hi: __tut.hiTargets() }; })()"
DISPLAY = ('#an', '#ct .cslip', '#g-', '#ls-', '#d-', '#r-clk', '#k-t')
def is_display(q): return q.startswith(DISPLAY) or ' .cod' in q or '[data-act=chan]' in q

def try_click(pg, sel, button='left', timeout=1200):
    try:
        pg.locator(sel).filter(visible=True).first.click(button=button, timeout=timeout); return True
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

def understood(pg, mem, read_ms):
    # read the box with the clock stopped, check game time holds, press Understood, check it runs again
    t0 = pg.evaluate("S.t"); pg.wait_for_timeout(read_ms); t1 = pg.evaluate("S.t")
    mem['held'].append(abs(t1 - t0) < 1e-9)
    if not try_click(pg, '#tutnext'): return
    mem['boxes'] += 1
    pg.wait_for_timeout(700); st = pg.evaluate("({t: S.t, fr: __tut.reading || paused, done: __tut.done})")
    if not st['fr'] and not st['done']: mem['resumed'].append(st['t'] > t1)

def literal(pg, st, mem):
    if st['nxt']: understood(pg, mem, 1000); return
    vis = pg.evaluate("tg => tg.filter(q => [...document.querySelectorAll(q)].some(__tut.visible))", st['hi'])
    for q in vis:
        if is_display(q): continue                                   # pointing at a display: read it
        if q in ('#cv', '#map'): go_here(pg); continue
        if q == '#k-fire':
            if try_click(pg, '#k-fire'): pg.wait_for_timeout(350); try_click(pg, '#k-fire')
            continue
        if q == '#kv-tgt' and st['view'] == 'tgt': continue
        try_click(pg, q); pg.wait_for_timeout(300)

def skipper(pg, st, mem):
    if st['skp'] and mem.get('sk') != st['step']:
        mem['sk'] = st['step']; pg.wait_for_timeout(600); try_click(pg, '#tutskip')
    elif st['nxt'] and not st['skp']:
        pg.wait_for_timeout(600); try_click(pg, '#tutnext')         # a note: Understood

def wander(pg, st, mem):
    rnd = mem['rnd']; x = rnd.random()
    if st['nxt'] and x < 0.33: try_click(pg, '#tutnext', timeout=400); return
    x = rnd.random()
    if x < 0.62:
        ids = pg.evaluate("""[...document.querySelectorAll('#stage [data-act]')].filter(e => __tut.visible(e) && !e.classList.contains('dis') && !['menu'].includes(e.dataset.act)).map((e, i) => { e.dataset.wz = i; return i; })""")
        if ids: try_click(pg, '[data-wz="%d"]' % rnd.choice(ids), timeout=600)
    elif x < 0.80: go_here(pg, rnd, pick_any=True)
    elif x < 0.92: pg.keyboard.press(rnd.choice(['1', '2', '3', 'v', 'p', 'Escape']))
    else:
        try_click(pg, '#k-fire', timeout=400); pg.wait_for_timeout(200); try_click(pg, '#k-fire', timeout=400)
    pg.keyboard.press('Escape') if rnd.random() < 0.2 else None

BOTS = {'literal': (literal, 1, 600), 'skipper': (skipper, 1, 400), 'wander': (wander, 4, 300)}

def open_page(b, page, vp):
    pg = b.new_page(viewport={'width': vp[0], 'height': vp[1]}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text[:200]) if m.type == 'error' and 'ERR_' not in m.text and 'Failed to load resource' not in m.text else None)
    pg.goto('file://' + R + page); pg.wait_for_timeout(1200)
    pg.evaluate(WATCH)
    return pg, errs

def common(name, pg, errs, m):
    chk(name + ' game time frozen whenever a box is read or the clock is paused', not m['frozenBad'])
    if m['frozenBad']: print('   ', m['frozenBad'][:6])
    chk(name + ' contact 3 not called a ship / Corvane / her before the readings identify it', not m['named'])
    if m['named']: print('   ', m['named'][:3])
    chk(name + ' every highlight on a visible control', not m['hiBad'])
    if m['hiBad']: print('   ', sorted(set(m['hiBad']))[:6])
    chk(name + ' order box never overflows', not m['over'])
    if m['over']: print('   ', sorted(set(m['over'])))
    chk(name + ' order box covers no live control', not m['cover'])
    if m['cover']: print('   ', sorted(set(m['cover']))[:8])
    chk(name + ' no page errors', not errs)
    if errs: print('   ', errs[:3])

def run_idle(b, page='web/hunt_rt.html?tutorial=tern&return=index.html', vp=(1366, 768)):
    pg, errs = open_page(b, page, vp)
    a = pg.evaluate("({t: S.t, paused, id: __tut.id})"); pg.wait_for_timeout(12000); z = pg.evaluate("({t: S.t, paused, id: __tut.id, box: !!document.getElementById('tutbox').textContent})")
    print('   idle at the start pause:', a, '->', z)
    chk('idle: starts paused on step 1 (start the clock)', a['paused'] and a['id'] == 'clock')
    chk('idle: game time frozen while the start pause is up (12 s)', a['t'] == z['t'] == 0 and z['box'])
    pg.evaluate("togglePause()"); pg.wait_for_timeout(300)
    a = pg.evaluate("({t: S.t, reading: __tut.reading, id: __tut.id})"); pg.wait_for_timeout(10000); z = pg.evaluate("({t: S.t, reading: __tut.reading, id: __tut.id})")
    print('   idle with the first order up:', a, '->', z)
    chk('idle: game time frozen while an order box waits to be read (10 s)', a['reading'] and z['reading'] and a['t'] == z['t'] and z['id'] == a['id'])
    m = pg.evaluate("window.__m"); common('idle', pg, errs, m); pg.close()

def run(b, name, page='web/hunt_rt.html?tutorial=tern&return=index.html', vp=(1366, 768), limit_real=900):
    if name == 'idle': return run_idle(b, page, vp)
    fn, speed, gap = BOTS[name]
    pg, errs = open_page(b, page, vp)
    chk(name + ' starts paused on step 1', pg.evaluate("paused && __tut.id === 'clock' && S.t === 0"))
    if speed != 1: pg.evaluate("setTime(%d); if (!paused) togglePause()" % speed)   # the speed key also starts the clock on step 1: keep it stopped for the bot
    mem = {'rnd': random.Random(int(os.environ.get('TUT_SEED', '7'))), 'held': [], 'resumed': [], 'boxes': 0}; t0 = time.time()
    while time.time() - t0 < (limit_real if name != 'wander' else 300):
        st = pg.evaluate(ST)
        if st['done']: break
        try: fn(pg, st, mem)
        except Exception as e: print('   (bot action failed: %s)' % str(e)[:120])
        pg.wait_for_timeout(gap)
    real = time.time() - t0; m = pg.evaluate("window.__m"); st = pg.evaluate(ST)
    autos = pg.evaluate("__tut.autos"); fin = pg.evaluate("!!document.getElementById('tutdone')"); bs = pg.evaluate("__tut.beatsSeen()")
    lr = (m['readyT'] - m['lockT']) * 16 if m['readyT'] is not None and m['lockT'] is not None else None
    print('   %s: %.1f real min; game %.2f min = %.1f min of running clock at 1x; steps %s; notes %s; autos %s; lock->ready %s s of clock at 1x; bar %s; hull %d, her hp %d/%d, volleys %d; Understood %d' % (
        name, real / 60, st['t'], st['t'] * 16 / 60, '>'.join(m['steps']), bs, autos, None if lr is None else round(lr, 1),
        m['bars'][:4] + ['...'] + m['bars'][-2:] if len(m['bars']) > 6 else m['bars'], st['hull'], st['hp'], st['hpMax'], st['vols'], mem['boxes']))
    if name == 'wander':
        print('   wander reached the surrender:', fin, '(not required)')
    else:
        chk(name + ' reaches the surrender screen', fin)
        rise = [x for i, x in enumerate(m['bars']) if i and x > m['bars'][i - 1]]
        chk(name + ' solution bar seen rising to 100%', len(rise) >= 3 and max(m['bars'] or [0]) >= 100)
    chk(name + ' Corvane alive', st['hp'] > 0 and st['cstate'] != 'disabled')
    common(name, pg, errs, m)
    if name == 'literal':
        chk('literal: solution lock->ready within 90 s of running clock at 1x', lr is not None and lr <= 90)
        chk('literal: no step needed Ostrow to do it', not autos)
        chk('literal: game time held on every box while it was read (%d boxes)' % len(mem['held']), mem['held'] and all(mem['held']))
        chk('literal: game time advanced after Understood (%d checks)' % len(mem['resumed']), mem['resumed'] and all(mem['resumed']))
    pg.close()

with sync_playwright() as p:
    b = p.chromium.launch()
    for name in (sys.argv[1:] or ['literal', 'skipper', 'wander', 'idle']): run(b, name)
    b.close()
print('FAILED' if bad else 'ALL OK'); sys.exit(1 if bad else 0)
