const E=require('/home/claude/interdict/web/hunt_rt_engine.js');const P=E.P;
const s=E.newHunt({seed:5});const log=[];
const chk=(m,c)=>{console.log(c?'ok  ':'FAIL',m)};
E.setSpeed(s,'v2');E.setRoute(s,[{x:s.player.x+200,y:s.player.y}]);
E.redlineBurn(s);chk('lvl1 ab',s.speed==='ab'&&s.burn.level===1&&s.burn.prev==='v2');
E.tick(s,13/P.secPerMin);chk('still ab at 13s',s.speed==='ab');
E.tick(s,3/P.secPerMin);chk('expired at 16s -> v2',s.speed==='v2'&&!s.burn);
E.redlineBurn(s);E.redlineBurn(s);chk('lvl2',s.burn.level===2);
E.tick(s,28/P.secPerMin);chk('ab at 28s',s.speed==='ab');
E.tick(s,4/P.secPerMin);chk('expired at 32s',s.speed==='v2');
E.redlineBurn(s);E.redlineBurn(s);E.redlineBurn(s);chk('latched',s.burn.level===3&&s.burn.until==null);
E.tick(s,600/P.secPerMin);chk('latched stays (or over)',s.over||s.speed==='ab');
if(!s.over){E.redlineBurn(s);chk('4th press off',s.speed==='v2'&&!s.burn);}
const t=E.newHunt({seed:6});E.redlineBurn(t);E.setSpeed(t,'v4');chk('other speed cancels',!t.burn&&t.speed==='v4');
E.tick(t,10);chk('no revert after cancel',t.speed==='v4');
{const u=E.newHunt(7,{});E.setOrder(u,'still',null);chk('refuses when still',E.redlineBurn(u)===false&&!u.burn&&u.speed!=='ab');
 E.setRoute(u,[{x:u.player.x+200,y:u.player.y}]);E.redlineBurn(u);chk('burn when moving',!!u.burn);
 E.setOrder(u,'still',null);E.tick(u,0.1);chk('stopping cancels burn',!u.burn&&u.speed!=='ab');
 const w=E.newHunt(8,{});E.setRoute(w,[{x:w.player.x+200,y:w.player.y}]);E.redlineBurn(w);E.redlineBurn(w);E.redlineBurn(w);E.redlineBurn(w);chk('4th press off',!w.burn&&w.speed!=='ab');}
