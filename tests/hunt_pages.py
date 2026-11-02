# Load the hunt pages, start a plain hunt, run 60 game minutes, and check the tutorial reaches surrender.
import sys
from playwright.sync_api import sync_playwright
R='/home/claude/interdict/'; bad=[]
def chk(m,c):
    print('ok  ' if c else 'FAIL',m)
    if not c: bad.append(m)
with sync_playwright() as p:
    b=p.chromium.launch()
    for page in ['web/hunt_rt.html','design/hunt.html','web/hunt_rt.html?difficulty=hard&trims=heat.fast_fins,sens.long_ears']:
        pg=b.new_page(viewport={'width':1366,'height':768}); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.on('console',lambda m: errs.append(m.text[:200]) if m.type=='error' and 'ERR_' not in m.text and 'Failed to load resource' not in m.text else None)
        pg.goto('file://'+R+page); pg.wait_for_timeout(500)
        pg.click('#begin'); pg.wait_for_timeout(300)
        chk(page+' hunt started',pg.evaluate("!!S && S.t>=0 && !briefing"))
        # drive 60 game minutes through the real loop's engine (tick in chunks so the UI keeps drawing)
        for i in range(60):
            pg.evaluate("E.tick(S,1)"); pg.wait_for_timeout(20)
        info=pg.evaluate("({t:S.t,over:S.over,diff:S.difficulty,trims:S.trims,ventFull:S.me.ventFull,aiVent:S.an.find(a=>a.ai).ai.ventFull})")
        print('   ',info)
        chk(page+' ran 60 game minutes (or ended)', info['t']>=59.9 or info['over'])
        pg.wait_for_timeout(600)
        chk(page+' no page errors',not errs)
        if errs: print(errs[:3])
        pg.close()
    for page in ['web/hunt_rt.html?tutorial=tern&return=index.html','design/hunt.html?tutorial=tern&return=proto_iso.html']:
        pg=b.new_page(viewport={'width':1366,'height':768}); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('file://'+R+page); pg.wait_for_timeout(1200)
        # play the tutorial like a player: task analysts on Corvane, lock, fire whenever ready
        got=False
        for i in range(400):
            st=pg.evaluate("""(()=>{const C=S.an.find(a=>a.kind==='real'); if(C.state==='open'){S.analysts.forEach(w=>{if(w.task!==C.id)E.assign(S,w.id,C.id)}); if(E.classify(S,C).n>=2)E.lockContact(S,C.id);}
              if(C.state==='locked'){ if(C.stale)E.refreshSolution(S,C.id); if(C.solve>=1)E.fire(S,C.id,null,6);} if(S.sink.h>0.8&&!S.vent.on)E.startVent(S); if(S.vent.on&&S.sink.h<0.3)E.stopVent(S);
              const b=document.getElementById('tutnext'); if(b)b.click();
              return {t:S.t, hp:C.hp, hull:S.hull, done:!!document.getElementById('tutdone'), shots:S.shots, over:S.over}})()""")
            if st['done']: got=True; break
            pg.evaluate("E.tick(S,0.25)"); pg.wait_for_timeout(15)
        print('   ',st)
        chk(page+' tutorial reaches the surrender screen',got)
        chk(page+' Corvane alive at surrender', st['hp']>0)
        chk(page+' tutorial no page errors',not errs)
        if errs: print(errs[:3])
        pg.close()
    b.close()
print('FAILED' if bad else 'ALL OK'); sys.exit(1 if bad else 0)
