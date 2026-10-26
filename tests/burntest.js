const E=require('/home/claude/interdict/web/hunt_rt_engine.js');const P=E.P;
const s=E.newHunt({seed:5});const log=[];
const chk=(m,c)=>{console.log(c?'ok  ':'FAIL',m)};
E.setSpeed(s,'v2');
E.redlineBurn(s);chk('lvl1 ab',s.speed==='ab'&&s.burn.level===1&&s.burn.prev==='v2');
E.tick(s,28/P.secPerMin);chk('still ab at 28s',s.speed==='ab');
E.tick(s,3/P.secPerMin);chk('expired at 31s -> v2',s.speed==='v2'&&!s.burn);
E.redlineBurn(s);E.redlineBurn(s);chk('lvl2',s.burn.level===2);
E.tick(s,100/P.secPerMin);chk('ab at 100s',s.speed==='ab');
E.tick(s,25/P.secPerMin);chk('expired at 125s',s.speed==='v2');
E.redlineBurn(s);E.redlineBurn(s);E.redlineBurn(s);chk('latched',s.burn.level===3&&s.burn.until==null);
E.tick(s,600/P.secPerMin);chk('latched stays (or over)',s.over||s.speed==='ab');
if(!s.over){E.redlineBurn(s);chk('4th press off',s.speed==='v2'&&!s.burn);}
const t=E.newHunt({seed:6});E.redlineBurn(t);E.setSpeed(t,'v4');chk('other speed cancels',!t.burn&&t.speed==='v4');
E.tick(t,10);chk('no revert after cancel',t.speed==='v4');
