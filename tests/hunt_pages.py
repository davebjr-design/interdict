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
        # leftovers from a normal playthrough must not reach the Tern
        pg.add_init_script("try{localStorage.setItem('interdict.trims','[\"tac.judgment_lead\",\"sens.snap_classifier\"]');localStorage.setItem('interdict_integration','35');localStorage.setItem('interdict.state',JSON.stringify({pell:{wiring_seen:true,key:'live'}}));}catch(e){}")
        pg.goto('file://'+R+page); pg.wait_for_timeout(1200)
        lk=pg.evaluate("""({trims:TRIMS_ON.length, badge:!!document.getElementById('trimbadge'), integ:S.integration, readDone:S.me.readDone, pellUi:PELL_UI,
            pellVis:['k-pell','k-pellact','g-integ','ls-pell'].map(i=>getComputedStyle($(i)).visibility), breach:getComputedStyle($('k-breach')).visibility,
            names:[...document.querySelectorAll('#stage *')].filter(e=>!e.childElementCount&&getComputedStyle(e).visibility!=='hidden'&&/\\b(ABARA|Abara|Castellan|Quill|Dace|Pell|PELL|INTEGRATION)\\b/.test(e.textContent)).map(e=>e.textContent.trim().slice(0,40)),
            tauto:$('k-tauto').textContent})""")
        print('   ',lk)
        chk(page+' no trims in the tutorial', lk['trims']==0 and not lk['badge'] and lk['readDone']==8)
        chk(page+' no carried integration', lk['integ']==0)
        chk(page+' Pell controls hidden', not lk['pellUi'] and all(v=='hidden' for v in lk['pellVis']))
        chk(page+' breach key hidden', lk['breach']=='hidden')
        chk(page+' no Corvane-ship crew names or Pell on the console', not lk['names'] and 'DUNNE' in lk['tauto'])
        pg.evaluate("E.retreat(S); E.goQuiet(S)")
        chk(page+' breach and quiet do nothing', pg.evaluate("!S.spool && !(S.t < S.quietUntil)"))
        # play the tutorial like a player: task analysts on Corvane, lock, fire whenever ready; check every highlight resolves to a visible control
        got=False; hib=[]; seen=set()
        for i in range(400):
            st=pg.evaluate("""(()=>{const C=S.an.find(a=>a.kind==='real'); if(C.state==='open'){S.analysts.forEach(w=>{if(w.task!==C.id)E.assign(S,w.id,C.id)}); if(E.classify(S,C).n>=2)E.lockContact(S,C.id);}
              if(C.state==='locked'){ if(C.stale)E.refreshSolution(S,C.id); if(C.solve>=1)E.fire(S,C.id,null,6);} if(S.sink.h>0.8&&!S.vent.on)E.startVent(S); if(S.vent.on&&S.sink.h<0.3)E.stopVent(S);
              const tg=__tut.hiTargets(), vis=tg.flatMap(q=>[...document.querySelectorAll(q)]).filter(__tut.visible), lit=document.querySelectorAll('.tut-hi').length;
              const b=document.getElementById('tutnext'); if(b)b.click();
              return {t:S.t, hp:C.hp, hull:S.hull, done:!!document.getElementById('tutdone'), shots:S.shots, over:S.over, step:__tut.step, ntg:tg.length, nvis:vis.length, lit}})()""")
            if st['ntg'] and (st['nvis']==0 or st['lit']==0): hib.append((st['step'],st['nvis'],st['lit']))
            seen.add(st['step'])
            if st['done']: got=True; break
            pg.evaluate("E.tick(S,0.25)"); pg.wait_for_timeout(15)
        print('   ',st,'steps seen',sorted(seen))
        chk(page+' every highlight is on a visible control', not hib)
        if hib: print('   ',hib[:5])
        chk(page+' tutorial reaches the surrender screen',got)
        chk(page+' Corvane alive at surrender', st['hp']>0)
        chk(page+' tutorial writes nothing to localStorage', pg.evaluate("localStorage.getItem('interdict_integration')")=='35')
        chk(page+' tutorial no page errors',not errs)
        if errs: print(errs[:3])
        pg.close()
    # Target view highlight: with a ready solution the FIRE SALVO key itself is outlined
    pg=b.new_page(viewport={'width':1366,'height':768}); pg.goto('file://'+R+'design/hunt.html?tutorial=tern&return=proto_iso.html'); pg.wait_for_timeout(1200)
    r=pg.evaluate("""(()=>{const C=S.an.find(a=>a.kind==='real'); E.lockContact(S,C.id); C.solve=1; C.stale=false; for(let i=0;i<5;i++){const b=document.getElementById('tutnext')||document.getElementById('tutskip'); if(__tut.step<4) b.click();} openTarget(C.id); E.tick(S,0.01); return {step:__tut.step, hi:[...document.querySelectorAll('.tut-hi')].map(e=>e.id)}})()""")
    print('   ',r); chk('tutorial step 5 outlines FIRE SALVO in the Target view', r['step']==4 and 'k-fire' in r['hi'])
    pg.close()
    b.close()
print('FAILED' if bad else 'ALL OK'); sys.exit(1 if bad else 0)
