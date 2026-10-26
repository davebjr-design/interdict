# Smoke test for the UI v2 console: keys, views, burn, guard, pause.
from playwright.sync_api import sync_playwright
bad=[]
def chk(m,c):
    print('ok  ' if c else 'FAIL',m)
    if not c: bad.append(m)
with sync_playwright() as p:
    b=p.chromium.launch()
    for W,H in [(1366,768),(1920,1080)]:
        pg=b.new_page(viewport={'width':W,'height':H}); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.on('console',lambda m: errs.append(m.text[:200]) if m.type=='error' and 'TUNNEL' not in m.text and 'ERR_' not in m.text else None)
        pg.goto('file:///home/claude/interdict/web/hunt_rt.html'); pg.wait_for_timeout(400)
        pg.click('#begin'); pg.evaluate("setTime(2)"); pg.wait_for_timeout(1500)
        chk(f'{W} stage present',pg.evaluate("!!$('stage') && $('stage').children.length>10"))
        # burn escalation
        for lvl in (1,2,3):
            pg.click('#kd-ab'); pg.wait_for_timeout(150)
            chk(f'{W} burn level {lvl}',pg.evaluate("S.burn&&S.burn.level")==lvl)
        chk(f'{W} latched label','LATCHED' in pg.inner_text('#kd-ab'))
        pg.click('#kd-ab'); pg.wait_for_timeout(150)
        chk(f'{W} 4th press off',pg.evaluate("!S.burn && S.speed!=='ab'"))
        pg.click('#kd-ab'); pg.click('#kd-v2'); pg.wait_for_timeout(150)
        chk(f'{W} other speed cancels burn',pg.evaluate("!S.burn && S.speed==='v2'"))
        # orders via keyboard
        pg.click('#sl3'); pg.keyboard.press('i'); pg.wait_for_timeout(250)
        chk(f'{W} investigate order',pg.evaluate("S.posture==='close'||S.analysts.some(a=>a.task!=null)"))
        # views
        for v,kid in (('str','#kv-str'),('tac','#kv-tac')):
            pg.click(kid); pg.wait_for_timeout(300)
            chk(f'{W} view {v}',pg.evaluate("view")==v)
        # strategic zones visible only in str
        pg.click('#kv-str'); pg.wait_for_timeout(200)
        chk(f'{W} map visible in str',pg.evaluate("!document.querySelector('[data-z^=MAP]').hidden"))
        pg.click('#kv-tac'); pg.wait_for_timeout(200)
        chk(f'{W} map hidden in tac',pg.evaluate("document.querySelector('[data-z^=MAP]').hidden"))
        # pause
        pg.click('#k-pause'); pg.wait_for_timeout(300)
        chk(f'{W} pause blanks',pg.evaluate("$('stage').classList.contains('paused')"))
        pg.click('#resume'); pg.wait_for_timeout(300)
        chk(f'{W} unpause',pg.evaluate("!$('stage').classList.contains('paused')"))
        # target + guard
        pg.evaluate("(()=>{const a=S.an.find(x=>x.kind==='real');E.lockContact(S,a.id);selId=a.id;})()"); pg.wait_for_timeout(1200)
        pg.evaluate('setView("tgt")')
        for i in range(10):
            pg.evaluate("(()=>{const a=S.an.find(x=>x.state==='locked');if(a){a.stale=false;a.solve=1;if(a.anchor)a.anchor.t=S.t;}})()"); pg.wait_for_timeout(500)
        chk(f'{W} guard shut when ready',pg.evaluate("$('k-fire').classList.contains('gd')"))
        v0=pg.evaluate("S.volleys.length"); pg.click('#k-fire'); pg.wait_for_timeout(300)
        chk(f'{W} first click only lifts',pg.evaluate("S.volleys.length")==v0 and pg.evaluate("$('k-fire').classList.contains('armed')"))
        pg.click('#k-fire'); pg.wait_for_timeout(300)
        chk(f'{W} second click fires',pg.evaluate("S.volleys.length")==v0+1)
        chk(f'{W} no JS errors',not errs); 
        if errs: print(errs[:3])
        pg.close()
    b.close()
print('FAILED' if bad else 'ALL OK')
