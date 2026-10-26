const E=require('/home/claude/interdict/web/hunt_rt_engine.js'),P=E.P;
const chk=(m,c)=>console.log(c?'ok  ':'FAIL',m);
// firing marks hostile
let found=0,vented=0,tot=0;
for(let seed=1;seed<=40;seed++){const s=E.newHunt(seed,{nreal:3});s.pell=false;
  for(let i=0;i<4000&&!s.over;i++){E.tick(s,0.05);
    for(const a of s.an){ if(a.kind==='real'&&a.lastFire!=null&&a.idStatus!=='hostile')found++; if(a.kind==='real'&&a.ventSeen&&a.vent&&a.idStatus!=='hostile')vented++; if(a.kind!=='real'&&a.idStatus==='hostile')tot++; }}
}
chk('every shooter is marked hostile (violations '+found+')',found===0);
chk('every seen vent is marked hostile (violations '+vented+')',vented===0);
chk('no non-real ever marked hostile',tot===0);
const s=E.newHunt(3,{});const a=s.an.find(x=>x.kind==='real');a.idStatus='hostile';
const c=E.classify(s,a);chk('classify 100% real',c.best==='real'&&c.p===1);
a.state='open';E.dismissContact(s,a.id);chk('cannot dismiss hostile',a.state==='open');
a.state='out';E.reanalyze&&0;
