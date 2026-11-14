# Station screens and the annunciator (docs/station_screens.md; web/station_screens.js, web/station_pages.js, web/annunciator.js).
# Normal hunt ?seed=3: F1-F8 each a distinct screen with the frame and the annunciator; lamps respond to induced engine conditions;
# Auto is read-only and Hands-on is live on F2 and F4; the call strip sits at the bottom of every screen; the tutorial has none of it.
# Screenshots (1400x800): tests/shots/screens_F1.png ... screens_F8.png, screens_annunciator.png (and screens_F*_1100.png at 1100x700).
import sys, os
from playwright.sync_api import sync_playwright
R = '/home/claude/interdict/'; OUT = R + 'tests/shots/'; os.makedirs(OUT, exist_ok=True); bad = []
def chk(m, c):
    print('ok  ' if c else 'FAIL', m)
    if not c: bad.append(m)
MUTE = "try{localStorage.setItem('interdict.voice', JSON.stringify({enabled:false, captain:'m', volume:1, rate:1})); localStorage.removeItem('interdict.deck');}catch(e){}"
NAMES = {'F2': 'SENSORS', 'F3': 'FIRE CONTROL', 'F4': 'WEAPONS', 'F5': 'HELM', 'F6': 'ENGINEERING', 'F7': 'DAMAGE CONTROL', 'F8': 'COMMS'}
VIEW = {'F1': 'tac', 'F2': 'sen', 'F3': 'fc', 'F4': 'wpn', 'F5': 'str', 'F6': 'eng', 'F7': 'dmg', 'F8': 'com'}
def lamp(pg, t): return pg.evaluate("$('ann-%s').className" % t)
def overflow(pg):   # elements in the main area that spill sideways out of their panel (clipped text or controls)
    return pg.evaluate("""[...document.querySelectorAll('#ss-main .sp')].flatMap(p => { const r = p.getBoundingClientRect(); return [...p.querySelectorAll('button, td, .spt b, svg')].filter(e => { const q = e.getBoundingClientRect(); return q.width && (q.right > r.right + 2 || q.left < r.left - 2); }).map(e => p.id + ':' + (e.textContent || e.tagName).trim().slice(0, 20)); }).slice(0, 6)""")
def under_band(pg):   # nothing interactive in the main area or the softkeys is covered by the call band
    return pg.evaluate("""(() => { const b = document.querySelector('.ss-cb').getBoundingClientRect(); return [...document.querySelectorAll('#ss-main button, #ss-sk button')].filter(e => { const q = e.getBoundingClientRect(); return q.height && q.bottom > b.top + 1; }).length; })()""")
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1400, 'height': 800}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text[:200]) if m.type == 'error' and 'ERR_' not in m.text and 'Failed to load resource' not in m.text else None)
    pg.add_init_script(MUTE)
    pg.goto('file://' + R + 'web/hunt_rt.html?seed=3&moments=0'); pg.wait_for_timeout(500)
    pg.click('#begin'); pg.wait_for_timeout(500)
    pg.evaluate("S.an.forEach(a => { a.nextFire = 1e9; a.know = 0; a.aware = false; a.ai.cunning = 0; })")   # keep the enemy from shooting during the layout checks
    chk('station screens on in a normal hunt (frame, annunciator, wide stage)', pg.evaluate("SCREENS.on && !!$('ss') && !!$('ann') && document.body.classList.contains('ss-on')"))
    chk('annunciator: about two dozen tiles, 8-character labels, fixed order', pg.evaluate("Annunciator.TILES.length >= 24 && [...document.querySelectorAll('#ann .annT')].map(e => e.dataset.t).join() === Annunciator.TILES.map(t => t.id).join() && [...document.querySelectorAll('#ann .annT')].every(e => e.textContent.length <= 8)"))
    pg.evaluate("setTime(2)"); pg.wait_for_timeout(6000); pg.evaluate("setTime(1)")
    # 1. F1-F8: distinct screens, all with the annunciator; F2-F8 with the frame
    mains = {}
    for k in ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8']:
        pg.mouse.move(3, 3); pg.keyboard.press(k); pg.wait_for_timeout(700)
        v = pg.evaluate("view"); ann = pg.evaluate("!!$('ann').offsetParent && $('ann').getBoundingClientRect().width > 50")
        if k == 'F1':
            chk('F1 keeps the existing console (scope visible, frame hidden) with the annunciator strip', v == 'tac' and pg.evaluate("!!$('cv').offsetParent && $('ss').hidden") and ann)
        else:
            hd = pg.evaluate("$('ss-hd').textContent"); mains[k] = pg.evaluate("$('ss-main').innerHTML.length + ':' + [...document.querySelectorAll('#ss-main .sp')].map(e => e.id).join()")
            fr = pg.evaluate("['ss-hd', 'ss-tabs', 'ss-ban', 'ss-main', 'ss-sk', 'ss-msg'].every(id => $(id) && $(id).getBoundingClientRect().height > 10) && document.querySelectorAll('#ss-sk > *').length === 8")
            chk('%s: %s screen with the frame (top bar, tabs, banner, panels, 8 softkeys, message line) and the annunciator' % (k, NAMES[k]), v == VIEW[k] and NAMES[k] in hd and fr and ann)
            ov = overflow(pg); chk('%s: nothing spills out of its panel %s' % (k, ov), not ov)
            chk('%s: no control is covered by the call band' % k, under_band(pg) == 0)
        pg.screenshot(path=OUT + 'screens_%s.png' % k)
    chk('F2-F8 show seven distinct screens', len(set(mains.values())) == 7)
    # 2. annunciator lamps respond to engine conditions
    pg.keyboard.press('F4'); pg.wait_for_timeout(300)
    pg.evaluate("E.evt(S, 'vampire', {n: 2, id: 1, bearing: 120, eta: 5, at: S.t + 5}); S.inc.push({foe: true, id: 1, dmg: 0, t0: S.t, at: S.t + 50, from: {x: S.player.x + 50, y: S.player.y}, aim: {x: S.player.x, y: S.player.y}, dir: 0, cone: 9, off: [], killR: 0})")
    pg.wait_for_timeout(500)
    chk('vampire: INCOMING lamp is a flashing warning, master WARNING flashing', 'warning' in lamp(pg, 'incoming') and 'fl' in lamp(pg, 'incoming') and 'fl' in pg.evaluate("$('ann-mw').className"))
    pg.screenshot(path=OUT + 'screens_annunciator.png')
    pg.keyboard.press('a'); pg.wait_for_timeout(400)
    chk('A acknowledges: the flash stops, the lamp stays lit', 'warning' in lamp(pg, 'incoming') and 'fl' not in lamp(pg, 'incoming') and 'fl' not in pg.evaluate("$('ann-mw').className"))
    pg.evaluate("S.inc.length = 0; S.warn = []; S.evts = S.evts.filter(e => e.type !== 'vampire'); DECK.adapter.model.pending().filter(c => c.row === 'W5').forEach(c => DECK.adapter.model.answer(c.id, 1)); DECK.adapter.model.calls.filter(c => c.row === 'W5' && c.state === 'queued').forEach(c => c.state = 'dismissed')"); pg.wait_for_timeout(500)
    chk('condition clears: the lamp clears', 'normal' in lamp(pg, 'incoming'))
    pg.evaluate("S.sink.h = 0.86"); pg.wait_for_timeout(400)
    chk('heat sink 86%: SINK HI caution', 'caution' in lamp(pg, 'sinkhi') and 'fl' in pg.evaluate("$('ann-mc').className"))
    pg.evaluate("S.sink.h = 0.2; S.mag.total = 8; S.mag.byKind.he = 8; S.mag.byKind.emp = 0; S.mag.byKind.flare = 0"); pg.wait_for_timeout(400)
    chk('magazine 8: MAG LOW caution', 'caution' in lamp(pg, 'maglow'))
    pg.keyboard.press('F2'); pg.wait_for_timeout(300)
    pg.click('#ann-maglow'); pg.wait_for_timeout(400)
    chk('clicking a tile acknowledges it and jumps to its station (F4)', pg.evaluate("view") == 'wpn' and 'fl' not in lamp(pg, 'maglow') and 'caution' in lamp(pg, 'maglow'))
    pg.evaluate("S.mag.total = 60; S.mag.byKind.he = 48; S.mag.byKind.emp = 6; S.mag.byKind.flare = 6; S.mag.lowSaid = false")
    cp = pg.evaluate("(() => { DECK.adapter.model.setAutonomy('thermal', 'supervised'); const c = DECK.adapter.model.raise('E1', {}); return c ? [c.id, c.pri] : [-1, 0]; })()"); pg.wait_for_timeout(700)
    chk('a thermal call (E1, priority %d after the attention budget) lights RUN HOT on the ENG/THERM row (caution at 3, advisory if demoted)' % cp[1], cp[0] > 0 and ('caution' if cp[1] == 3 else 'advisory') in lamp(pg, 'runhot'))
    # 3. the call strip sits at the bottom of the station screen, inside the call band, above nothing
    pg.wait_for_timeout(2500)
    box = pg.evaluate("(() => { const d = $('deck').getBoundingClientRect(), b = document.querySelector('.ss-cb').getBoundingClientRect(), s = $('ss-sk').getBoundingClientRect(); return {vis: !$('deck').hidden, inside: d.top >= b.top - 2 && d.bottom <= b.bottom + 2, clear: d.top >= s.bottom}; })()")
    chk('call strip (with chips) sits in the call band at the bottom of the station screen: %s' % box, box['vis'] and box['inside'] and box['clear'])
    pg.keyboard.press('Enter'); pg.wait_for_timeout(300)
    # 4. Auto = read-only, Hands-on = live (F2 and F4); Supervised shows the recommendation
    pg.keyboard.press('F2'); pg.wait_for_timeout(400)
    pg.evaluate("DECK.adapter.model.setAutonomy('sensors', 'auto'); S.pingCd = 0; S.quietUntil = 0; selId = S.an.find(a => a.state === 'open' && a.idStatus !== 'plan').id"); pg.wait_for_timeout(400)
    ro = pg.evaluate("(() => { const b = document.querySelector('#ss-main button[data-a=\"ping\"]'); return {dis: b.disabled, ro: b.classList.contains('ro'), ban: $('ss-ban').textContent}; })()")
    chk('F2 in Auto: the screen is a read-only live view (ping key disabled, banner says READ-ONLY): ' + ro['ban'][:60], ro['dis'] and ro['ro'] and 'READ-ONLY' in ro['ban'])
    pg.keyboard.press('Shift+F8'); pg.wait_for_timeout(400)
    chk('Shift+F8 cycles the station to Supervised (banner)', pg.evaluate("DECK.adapter.model.autonomy.sensors") == 'supervised' and 'SUPERVISED' in pg.evaluate("$('ss-ban').textContent"))
    pg.keyboard.press('Shift+F8'); pg.wait_for_timeout(400)
    chk('... then Hands-on: the ping key is live', pg.evaluate("DECK.adapter.model.autonomy.sensors") == 'hands-on' and pg.evaluate("!document.querySelector('#ss-main button[data-a=\"ping\"]').disabled"))
    pg.click('#ss-main button[data-a="ping"]'); pg.wait_for_timeout(300)
    chk('Hands-on: the ping key pings (the engine ping timer runs)', pg.evaluate("S.pingUntil > S.t"))
    rows = pg.evaluate("[...document.querySelectorAll('#sp-trk tr[data-sel]')].map(r => +r.dataset.sel)")
    pg.click('#sp-trk tr[data-sel="%d"]' % rows[-1]); pg.wait_for_timeout(300)
    chk('selecting a track row selects it everywhere (selId, header SEL)', pg.evaluate("selId") == rows[-1] and ('S%d' % (rows[-1] + 1)) in pg.evaluate("$('ss-hd').textContent"))
    s0 = pg.evaluate("selId"); pg.keyboard.press('Shift+F2'); pg.wait_for_timeout(300)
    chk('Shift+F2 on F2 is the NEXT TRK softkey', pg.evaluate("selId") != s0)
    pg.keyboard.press('F4'); pg.wait_for_timeout(400)
    pg.evaluate("DECK.adapter.model.setAutonomy('weapons', 'auto')"); pg.wait_for_timeout(400)
    chk('F4 in Auto: preset keys are read-only', pg.evaluate("document.querySelector('#ss-main button[data-a=\"preset\"][data-arg=\"snap\"]').disabled"))
    pg.evaluate("DECK.adapter.model.setAutonomy('weapons', 'hands-on')"); pg.wait_for_timeout(400)
    pg.click('#ss-main button[data-a="preset"][data-arg="snap"]'); pg.wait_for_timeout(300)
    chk('F4 Hands-on: a preset key sets the salvo preset', pg.evaluate("DECK.adapter.salvo.id") == 'snap')
    pg.click('#ss-main button[data-a="pd"][data-arg="off"]'); pg.wait_for_timeout(300)
    chk('F4 Hands-on: point defence control works (off)', pg.evaluate("S.pd") == 'off')
    pg.click('#ss-main button[data-a="pd"][data-arg="armed"]'); pg.wait_for_timeout(200)
    wp = pg.evaluate("$('ss-main').textContent")
    chk('F4 shows magazine, tubes, salvo planner, launch control, PD, probe sets (Orrin, Vask; stowed) and countermeasures', all(x in wp for x in ['MAGAZINE', 'TUBE 1', 'SALVO PLANNER', 'LAUNCH CONTROL', 'POINT DEFENCE', 'PROBE SETS', 'ORRIN', 'VASK', 'STOWED', 'COUNTERMEASURES']))
    chk('probe deploy/recover are disabled stubs marked not yet simulated', pg.evaluate("[...document.querySelectorAll('#sp-prb button')].every(b => b.disabled && b.classList.contains('stub'))") and 'NOT YET SIMULATED' in wp)
    # fire through the adapter: lock, force a ready solution, ARM, FIRE -> an order to Abara that reaches E.fire
    pg.evaluate("(() => { const a = S.an.find(x => x.state === 'open' && x.idStatus !== 'plan'); E.lockContact(S, a.id); a.solve = 1; a.stale = false; selId = a.id; window.__tg = a.id; })()"); pg.wait_for_timeout(400)
    sh0 = pg.evaluate("S.shots")
    pg.click('#ss-main button[data-a="arm"]'); pg.wait_for_timeout(300); pg.click('#ss-main button[data-a="fire"]'); pg.wait_for_timeout(4500)
    chk('ARM then FIRE issues a fire order that the adapter carries to E.fire', pg.evaluate("DECK.adapter.done.some(d => d.verb === 'fire' && d.by === 'co')") and pg.evaluate("S.shots") > sh0)
    # 5. F3: bearing-time history from observed bearings, solution card, baseline stub
    pg.keyboard.press('F3'); pg.wait_for_timeout(600)
    n = pg.evaluate("document.querySelectorAll('#sp-bt svg circle').length")
    chk('F3 draws a bearing-time history for the selected track (%d marks) and a solution card with a range band' % n, n >= 2 and pg.evaluate("!!document.querySelector('#sp-sol svg.rb rect')"))
    chk('F3 baseline controls are disabled not-yet-simulated stubs', pg.evaluate("[...document.querySelectorAll('#sp-bas button')].every(b => b.disabled && b.classList.contains('stub'))"))
    # 6. the settings drawer gains the annunciator sound toggle; audio never throws
    pg.click('#k-pause'); pg.wait_for_timeout(300)
    chk('settings drawer has the annunciator sound toggle', pg.evaluate("!!document.querySelector('#dk-drawer input[data-annsnd]')"))
    pg.click('#dk-drawer input[data-annsnd] >> xpath=..'); pg.wait_for_timeout(200)
    chk('the toggle turns the annunciator sound off (saved)', pg.evaluate("DECK.cfg.annSound === false && JSON.parse(localStorage.getItem('interdict.deck')).annSound === false"))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    # 7. the same screens at 1100x700
    pg.set_viewport_size({'width': 1100, 'height': 700}); pg.wait_for_timeout(400)
    for k in ['F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8']:
        pg.keyboard.press(k); pg.wait_for_timeout(500)
        ov = overflow(pg); chk('1100x700 %s: nothing spills out of its panel %s' % (k, ov), not ov)
        if k in ('F2', 'F4'): pg.screenshot(path=OUT + 'screens_%s_1100.png' % k)
    chk('no page errors', not errs)
    if errs: print(errs[:5])
    pg.close()
    # 8. the tutorial has none of this
    pg = b.new_page(viewport={'width': 1400, 'height': 800}); e2 = []; pg.on('pageerror', lambda e: e2.append(str(e)))
    pg.goto('file://' + R + 'web/hunt_rt.html?tutorial=tern&return=index.html'); pg.wait_for_timeout(1200)
    chk('tutorial: no station screens, no annunciator, normal stage width', pg.evaluate("!SCREENS.on && !$('ss') && !$('ann') && !document.body.classList.contains('ss-on')"))
    chk('tutorial: no page errors', not e2)
    pg.close(); b.close()
print('FAILED' if bad else 'ALL OK'); sys.exit(1 if bad else 0)
