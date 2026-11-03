# Load the hunt pages, start a plain hunt, run 60 game minutes, and check the tutorial: paused start, contact 3 unnamed until the
# readings identify it, every highlight on a visible control, reaches surrender, tutorial-only solve tuning.
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
        # the hunt starts paused on step 1 (start the clock); contact 3 is not called a ship, Corvane or 'her' before any readings
        z=pg.evaluate("""(()=>{const C=S.an[__tut.corvane], sl=document.getElementById('sl'+C.id); return {paused, id:__tut.id, t:S.t, nread:['thermal','reactor','occlusion'].reduce((m,ch)=>m+(C.read[ch]?.den||0),0),
            slip:(sl?sl.textContent+' '+(sl.dataset.tip||''):''), box:__tut.text}})()""")
        print('   ',{k:z[k] for k in ('paused','id','t','nread')})
        chk(page+' tutorial starts paused on step 1 (start the clock)', z['paused'] and z['id']=='clock' and z['t']==0)
        import re
        chk(page+' contact 3 unnamed before readings (slip and Ostrow)', z['nread']==0 and not re.search(r'WARSHIP|ship|Corvane', z['slip'], re.I) and not re.search(r'\b(Corvane|her|she)\b', z['box']))
        # play the tutorial like a player through the engine: do what each step asks, press Understood on every box, check every highlight
        got=False; hib=[]; seen=set(); named=[]
        for i in range(1200):
            st=pg.evaluate("""(()=>{const C=S.an[__tut.corvane], id=__tut.id, k=__tut.kind, X=__tut.x!=null?S.an[__tut.x]:null, on=a=>S.analysts.some(w=>w.task===a.id), all=a=>S.analysts.every(w=>w.task===a.id);
              const tg=__tut.hiTargets(), vis=tg.flatMap(q=>[...document.querySelectorAll(q)]).filter(__tut.visible), lit=document.querySelectorAll('.tut-hi').length;
              const nm=!__tut.identified && /\b(Corvane|her|she)\b/.test(__tut.text);
              const b=document.getElementById('tutnext'); if(b) b.click(); else {
                if(id==='clock'&&paused) togglePause(); else if(k==='read'&&X.state==='open'&&!all(X)) E.investigate(S,X.id); else if(k==='rule') E.dismissContact(S,X.id);
                else if(k==='check') { if(X.state==='open'&&!on(X)) E.investigate(S,X.id); else if(!on(C)) E.assign(S,X._keep==='occlusion'?'quill':'castellan',C.id); }
                else if(id==='lock') E.lockContact(S,C.id); else if(id==='course') E.setRoute(S,[{x:S.player.x+12,y:S.player.y+20,speed:'v2'}]); else if(id==='evade') E.setOrder(S,'evade',null);
                else if(id==='still') E.setOrder(S,'still',null); else if((id==='fire'||id==='again')&&C.solve>=1) E.fire(S,C.id,null,6); else if(id==='vent') E.startVent(S); }
              return {t:S.t, hp:C.hp, hpMax:C.hpMax, hull:S.hull, done:!!document.getElementById('tutdone'), shots:S.shots, over:S.over, step:__tut.step, id, ntg:tg.length, nvis:vis.length, lit, nm, order:__tut.readOrder.slice(), hits:C.tutHits||0}})()""")
            if st['ntg'] and (st['nvis']==0 or st['lit']==0): hib.append((st['id'],st['nvis'],st['lit']))
            if st['nm']: named.append(st['id'])
            seen.add(st['step'])
            if st['done']: got=True; break
            pg.evaluate("E.tick(S,0.1)"); pg.wait_for_timeout(15)
        print('   ',st,'steps seen',sorted(seen))
        chk(page+' Ostrow names Corvane only after the readings identify her', not named)
        chk(page+' every highlight is on a visible control', not hib)
        if hib: print('   ',hib[:5])
        chk(page+' tutorial reaches the surrender screen',got)
        chk(page+' Corvane alive at surrender', st['hp']>0)
        chk(page+' both volleys hit her, hull left in the surrender band (38-42%%): %.0f%%' % (100*st['hp']/st['hpMax']), st['hits']==2 and 0.37<=st['hp']/st['hpMax']<=0.43)
        chk(page+' her answer landed, our hull well above 45: %.0f' % st['hull'], 80<=st['hull']<100)
        chk(page+' contacts read in order 1, 2, 3, 4: %s' % st['order'], st['order']==[0,1,2,3])
        chk(page+' tutorial writes nothing to localStorage', pg.evaluate("localStorage.getItem('interdict_integration')")=='35')
        chk(page+' tutorial no page errors',not errs)
        if errs: print(errs[:3])
        pg.close()
    # Target view highlight: with a ready solution the FIRE SALVO key itself is outlined
    pg=b.new_page(viewport={'width':1366,'height':768}); pg.goto('file://'+R+'design/hunt.html?tutorial=tern&return=proto_iso.html'); pg.wait_for_timeout(1200)
    for i in range(600):   # Skip step (and Understood on the notes) up to the fire step; readings and the solve still take game time
        r=pg.evaluate("""(()=>{ if(__tut.id==='fire') return __tut.id; const n=document.getElementById('tutnext'), k=document.getElementById('tutskip'); if(k && window.__sk!==__tut.step){window.__sk=__tut.step; k.click();} else if(n) n.click(); E.tick(S,0.1); return __tut.id})()""")
        if r=='fire': break
    r=pg.evaluate("""(()=>{const C=S.an[__tut.corvane]; C.solve=1; openTarget(C.id); E.tick(S,0.01); for(let i=0;i<5&&__tut.beat;i++){document.getElementById('tutnext').click();} __tut.hiTargets(); return new Promise(res=>setTimeout(()=>res({id:__tut.id, reading:__tut.reading, hi:[...document.querySelectorAll('.tut-hi')].map(e=>e.id)}),300))})()""")
    print('   ',r); chk('tutorial fire step outlines FIRE SALVO in the Target view', r['id']=='fire' and 'k-fire' in r['hi'])
    pg.close()
    # tutorial-only engine tuning: with an analyst on her the solution never bleeds or goes stale, and finishes in about 35 s at 1x
    pg=b.new_page(viewport={'width':1366,'height':768}); pg.goto('file://'+R+'web/hunt_rt.html?tutorial=tern&return=index.html'); pg.wait_for_timeout(1200)
    r=pg.evaluate("""(()=>{const C=S.an[__tut.corvane]; E.lockContact(S,C.id); E.assign(S,'dace',C.id); let t=0, min=1, prev=0, drop=0; while(C.solve<1&&t<10){__tut.rawTick(S,0.05); t+=0.05; if(C.solve<prev-1e-9)drop++; prev=C.solve;}
      const tReady=t; for(let i=0;i<200;i++){__tut.rawTick(S,0.05); if(C.solve<1)drop++;} return {sec:tReady*P.secPerMin, drop, stale:!!C.stale, keep:!!S.tut&&S.tut.keep}})()""")
    print('   ',r); chk('tutorial solution ready in 25-50 s at 1x and never bleeds or goes stale', 25<=r['sec']<=50 and r['drop']==0 and not r['stale'])

    pg.close()
    b.close()
print('FAILED' if bad else 'ALL OK'); sys.exit(1 if bad else 0)
