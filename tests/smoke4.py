# Smoke test for the UI v2 console: keys, views, burn, guard, no pause in normal play.
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
        chk(f'{W} redline dark when stopped',pg.evaluate("$('kd-ab').classList.contains('dis')"))
        pg.evaluate("E.setRoute(S,[{x:S.player.x+200,y:S.player.y}])"); pg.wait_for_timeout(300)
        chk(f'{W} redline backlit when moving',pg.evaluate("$('kd-ab').classList.contains('bl')"))
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
        for v,kid in (('str','#dkf-helm'),('tac','#dkf-conn')):   # the station keys (F5 helm = the strategic map, F1 conn = tactical)
            pg.click(kid); pg.wait_for_timeout(300)
            chk(f'{W} view {v}',pg.evaluate("view")==v)
        # strategic zones visible only in str
        pg.click('#dkf-helm'); pg.wait_for_timeout(200)
        chk(f'{W} map visible in str',pg.evaluate("!document.querySelector('[data-z^=MAP]').hidden"))
        pg.click('#dkf-conn'); pg.wait_for_timeout(200)
        chk(f'{W} map hidden in tac',pg.evaluate("document.querySelector('[data-z^=MAP]').hidden"))
        # no pause in normal play (decided: pausing is tutorial-only); the key opens the crew settings instead
        pg.click('#k-pause'); pg.wait_for_timeout(300); pg.keyboard.press('p'); pg.wait_for_timeout(150)
        chk(f'{W} no pause in a normal hunt',pg.evaluate("!paused && !$('stage').classList.contains('paused')"))
        chk(f'{W} the key opens the crew settings',pg.evaluate("!$('dk-drawer').hidden"))
        pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
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
