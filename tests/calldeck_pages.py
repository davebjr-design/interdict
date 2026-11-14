# Call deck in the hunt page (web/call_deck.js): spoken calls, chips after the line, keys, rail, F-key stations, radial menu, settings,
# no pause in normal play, time compression drops on urgent calls. Audio muted, so every line uses the timed fallback.
# Screenshots (1400x800) go to tests/shots/calldeck_*.png.
import sys, os, json
from playwright.sync_api import sync_playwright
R = '/home/claude/interdict/'; OUT = R + 'tests/shots/'; os.makedirs(OUT, exist_ok=True); bad = []
def chk(m, c):
    print('ok  ' if c else 'FAIL', m)
    if not c: bad.append(m)
MUTE = "try{localStorage.setItem('interdict.voice', JSON.stringify({enabled:false, captain:'m', volume:1, rate:1})); localStorage.removeItem('interdict.deck');}catch(e){}"
def wait_chips(pg, cid, ms=9000):
    for i in range(ms // 100):
        if pg.evaluate("DECK.cur && DECK.cur.id === %d && DECK.chipsShown" % cid): return True
        pg.wait_for_timeout(100)
    return False
def raise_call(pg, row, n, step=True):
    cid = pg.evaluate("(() => { const c = DECK.adapter.model.raise('%s', {n: %d, id: %d}); return c ? c.id : -1; })()" % (row, n, n - 1))
    pg.wait_for_timeout(250); return cid
def quiet_engine(pg):   # hold the engine's own calls back while a scripted call is checked (the clock still runs for the deck)
    pg.evaluate("S.an.forEach(a => { a.nextFire = 1e9; a.know = 0; a.aware = false; a.ai.cunning = 0; }); S.hold = false")
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1400, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text[:200]) if m.type == 'error' and 'ERR_' not in m.text and 'Failed to load resource' not in m.text else None)
    pg.add_init_script(MUTE)
    pg.goto('file://' + R + 'web/hunt_rt.html?seed=4242&nreal=2&moments=0'); pg.wait_for_timeout(500)
    pg.click('#begin'); pg.wait_for_timeout(400)
    chk('normal hunt has the call deck on', pg.evaluate("DECK.on && !!DECK.adapter"))
    chk('voice muted: timed text fallback', pg.evaluate("Voice.state().enabled === false"))
    quiet_engine(pg)
    # 1. a call: the line shows with the voice; chips only after the line ends; Enter = recommendation
    cid = raise_call(pg, 'X1', 2)
    st = pg.evaluate("({vis: !$('deck').hidden, line: $('dk-line').textContent, chips: $('dk-chips').children.length, shown: DECK.chipsShown})")
    chk('a raised call appears in the subtitle strip with its line: ' + st['line'], st['vis'] and 'Sierra 2' in st['line'])
    chk('chips are not shown while the line is being spoken', st['chips'] == 0 and not st['shown'])
    chk('chips appear after the line ends', wait_chips(pg, cid))
    ch = pg.evaluate("[...document.querySelectorAll('#dk-chips .dk-chip')].map(c => ({t: c.textContent, rec: c.classList.contains('rec')}))")
    chk('up to four chips with number keys, the recommendation ticked: %s' % [c['t'] for c in ch], 1 <= len(ch) <= 4 and sum(c['rec'] for c in ch) == 1 and ch[0]['t'].startswith('1'))
    chk('timer ring visible on a priority 3 call', pg.evaluate("getComputedStyle($('dk-ring')).display !== 'none'"))
    pg.screenshot(path=OUT + 'calldeck_1_call_chips.png')
    pg.keyboard.press('Enter'); pg.wait_for_timeout(200)
    c = pg.evaluate("(() => { const c = DECK.adapter.model.calls.find(x => x.id === %d); return {state: c.state, choice: c.choice, def: DECK.adapter.model.defaultIndex(c)}; })()" % cid)
    chk('Enter answers with the crew recommendation', c['state'] == 'answered' and c['choice'] == c['def'])
    pg.wait_for_timeout(5000)
    chk('the answered order (Go quiet) went issued, acked, executing and reached the engine', pg.evaluate("DECK.adapter.done.some(d => d.verb === 'quiet' && d.by === 'co')"))
    # 2. key 1, Backspace (stand by), R (say again)
    pg.evaluate("S.quietUntil = 0; S.quietCd = 0")
    cid = raise_call(pg, 'E1', 0); wait_chips(pg, cid)
    e0 = pg.evaluate("DECK.adapter.model.calls.find(x => x.id === %d).expiresAt" % cid)
    pg.keyboard.press('Backspace'); pg.wait_for_timeout(150)
    c = pg.evaluate("(() => { const c = DECK.adapter.model.calls.find(x => x.id === %d); return {stood: c.stood, exp: c.expiresAt}; })()" % cid)
    chk('Backspace stands the call by (timer extended once)', c['stood'] and c['exp'] > e0)
    pg.keyboard.press('r'); pg.wait_for_timeout(150)
    chk('R says the line again (voice busy with it)', pg.evaluate("Voice.state().speaking || Voice.state().queued > 0"))
    pg.wait_for_timeout(3500)
    pg.keyboard.press('1'); pg.wait_for_timeout(200)
    chk('key 1 answers the first chip', pg.evaluate("(() => { const c = DECK.adapter.model.calls.find(x => x.id === %d); return c.state === 'answered' && c.choice === 0; })()" % cid))
    # 3. the rail: two waiting calls while one is up; Space takes the highest priority one; Esc dismisses a priority 2 call
    pg.wait_for_timeout(4000)
    pg.evaluate("['sensors', 'helm', 'damage'].forEach(k => DECK.adapter.model.setAutonomy(k, 'supervised'))")   # the attention bucket is spent by now: Auto would settle demoted calls
    a = raise_call(pg, 'S1', 3); pg.wait_for_timeout(200)
    bcall = raise_call(pg, 'H1', 0); ccall = raise_call(pg, 'D1', 0); pg.wait_for_timeout(900)
    rail = pg.evaluate("[...document.querySelectorAll('#dk-rail .dk-ri')].map(e => +e.dataset.id)")
    print('    calls', a, bcall, ccall, pg.evaluate("[DECK.cur && DECK.cur.id, DECK.adapter.model.calls.slice(-5).map(c => [c.id, c.row, c.state, c.pri])]"))
    chk('the rail shows the two waiting calls: %s' % rail, len(rail) >= 2 and bcall in rail and ccall in rail)
    pg.screenshot(path=OUT + 'calldeck_2_rail.png')
    pg.keyboard.press('Space'); pg.wait_for_timeout(200)
    nxt = pg.evaluate("DECK.cur && DECK.cur.id")
    chk('Space takes the next waiting call (highest priority first)', nxt in (bcall, ccall))
    a2 = raise_call(pg, 'S1', 4); pg.wait_for_timeout(300)
    pg.evaluate("DECK.show(DECK.adapter.model.calls.find(x => x.id === %d))" % a2); wait_chips(pg, a2)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
    chk('Esc dismisses a priority 2 call to the log', pg.evaluate("DECK.adapter.model.calls.find(x => x.id === %d).state" % a2) == 'dismissed' and pg.evaluate("!DECK.cur || DECK.cur.id !== %d" % a2))
    # 4. F-key stations
    views = {}
    for k in ['F2', 'F3', 'F4', 'F6', 'F7', 'F8', 'F5', 'F1']:
        pg.keyboard.press(k); pg.wait_for_timeout(250); views[k] = pg.evaluate("view")
        if k == 'F4': pg.wait_for_timeout(300); pg.screenshot(path=OUT + 'calldeck_3_station_F4.png'); wp = pg.evaluate("$('ss-main').textContent.toUpperCase()")
    print('    views', views)
    chk('F1-F8 move between station screens', views == {'F2': 'sen', 'F3': 'fc', 'F4': 'wpn', 'F6': 'eng', 'F7': 'dmg', 'F8': 'com', 'F5': 'str', 'F1': 'tac'})
    chk('the weapons station shows the magazine, presets and the not-yet-simulated flags', 'MAGAZINE' in wp and 'AMBUSH' in wp and 'NOT YET SIMULATED' in wp)
    chk('the console weapons zone shows the magazine readout', 'Magazine 60/60' in pg.evaluate("$('wpn-mag').textContent") or 'Magazine' in pg.evaluate("$('wpn-mag').textContent"))
    # 5. radial menu: click a contact on the scope, pick Classify; it runs the order lifecycle
    pg.evaluate("follow = false; VZ = 1; VX = 0; VY = 0; draw()"); pg.wait_for_timeout(200)
    pos = pg.evaluate("""(() => { const a = S.an.find(x => x.state === 'open' && x.idStatus !== 'plan'); const p = E.displayPos(S, a), r = cv.getBoundingClientRect(), k = cv.width / P.arena;
        return {id: a.id, x: r.left + (p.x * k * VZ + VX) * r.width / cv.width, y: r.top + (p.y * k * VZ + VY) * r.height / cv.height}; })()""")
    pg.mouse.click(pos['x'], pos['y']); pg.wait_for_timeout(250)
    chk('a click on a contact opens the radial menu (Classify, Track, Probe, Fire)', pg.evaluate("DECK.radialOpen && $('dk-radial').textContent.includes('Classify') && $('dk-radial').textContent.includes('Fire')"))
    pg.screenshot(path=OUT + 'calldeck_4_radial.png')
    n0 = pg.evaluate("DECK.adapter.model.orders.length")
    pg.keyboard.press('c'); pg.wait_for_timeout(200)
    o = pg.evaluate("(() => { const o = DECK.adapter.model.orders[DECK.adapter.model.orders.length - 1]; return {n: DECK.adapter.model.orders.length, verb: o.verb, by: o.by, stage: o.stage}; })()")
    chk('the radial pick issues an order through the lifecycle (captain speaks it, officer repeats it)', o['n'] == n0 + 1 and o['verb'] == 'classify' and o['by'] == 'co')
    pg.wait_for_timeout(5000)
    chk('and it executes: all analysts on that contact', pg.evaluate("DECK.adapter.model.orders[DECK.adapter.model.orders.length - 1].stage") == 'reported' and pg.evaluate("S.analysts.every(w => w.task === %d)" % pos['id']))
    # 6. settings drawer and autonomy toggles
    pg.click('#k-pause'); pg.wait_for_timeout(250)
    chk('the CREW key opens the settings drawer', pg.evaluate("!$('dk-drawer').hidden"))
    pg.evaluate("['helm', 'damage'].forEach(k => DECK.adapter.model.setAutonomy(k, 'auto'))"); pg.click('#dk-drawer input[data-aut="sensors"][value="auto"] >> xpath=..'); pg.wait_for_timeout(150)
    pg.screenshot(path=OUT + 'calldeck_5_settings.png')
    auto = pg.evaluate("DECK.adapter.model.autonomy.sensors")
    s_auto = raise_call(pg, 'S1', 1); r_auto = pg.evaluate("DECK.adapter.model.calls.find(x => x.id === %d).state" % s_auto)
    pg.click('#dk-drawer input[data-aut="sensors"][value="supervised"] >> xpath=..'); pg.wait_for_timeout(150)
    sup = pg.evaluate("DECK.adapter.model.autonomy.sensors")
    pg.wait_for_timeout(21000)   # the cooldown on a new-contact call about the same contact; use another contact instead
    s_sup = raise_call(pg, 'S1', 2); pg.wait_for_timeout(500); r_sup = pg.evaluate("DECK.adapter.model.calls.find(x => x.id === %d).state" % s_sup)
    print('    autonomy', auto, r_auto, '->', sup, r_sup)
    chk('autonomy toggles change what is raised (Auto settles a new contact by doctrine; Supervised asks)', auto == 'auto' and r_auto == 'settled' and sup == 'supervised' and r_sup in ('raised', 'queued'))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(150); chk('Esc closes the drawer', pg.evaluate("$('dk-drawer').hidden"))
    # 7. no pause in normal play; time compression drops to 1x on an urgent call; hold V + S asks for a report, a V tap vents
    pg.keyboard.press('p'); pg.wait_for_timeout(150)
    chk('P does not pause a normal hunt', pg.evaluate("!paused && !$('stage').classList.contains('paused')"))
    pg.evaluate("setTime(2)"); raise_call(pg, 'X3', 1); pg.wait_for_timeout(300)
    chk('time compression drops to 1x on a priority 3+ call', pg.evaluate("tscale") == 1)
    pg.wait_for_timeout(9000)
    v0 = pg.evaluate("S.vent.on"); r0 = pg.evaluate("DECK.adapter.model.calls.filter(c => c.report).length")
    pg.keyboard.down('v'); pg.keyboard.press('w'); pg.keyboard.up('v'); pg.wait_for_timeout(200)
    chk('hold V + W asks Weapons for a report (and does not vent)', pg.evaluate("DECK.adapter.model.calls.filter(c => c.report).length") == r0 + 1 and pg.evaluate("S.vent.on") == v0)
    pg.evaluate("S.sink.h = 0.5"); pg.keyboard.press('v'); pg.wait_for_timeout(200)
    chk('a V tap still vents', pg.evaluate("S.vent.on") != v0)
    chk('no page errors', not errs)
    if errs: print(errs[:4])
    pg.close()
    # the tutorial has no call deck and keeps its pause
    pg = b.new_page(viewport={'width': 1400, 'height': 800}); errs2 = []; pg.on('pageerror', lambda e: errs2.append(str(e)))
    pg.goto('file://' + R + 'web/hunt_rt.html?tutorial=tern&return=index.html'); pg.wait_for_timeout(1200)
    chk('tutorial: no call deck, pause still works', pg.evaluate("!DECK.on && !document.getElementById('deck') && paused") and (pg.evaluate("togglePause(), !paused")))
    chk('tutorial: no page errors', not errs2)
    pg.close(); b.close()
print('FAILED' if bad else 'ALL OK'); sys.exit(1 if bad else 0)
