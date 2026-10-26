const E=require('/home/claude/interdict/web/hunt_rt_engine.js');
const cnt={1:0,2:0,3:0};let bad=0;
for(let i=0;i<300;i++){const n=1+Math.floor(Math.random()*3);const s=E.newHunt(1000+i,{nreal:n});cnt[n]++;
 const real=s.an.filter(a=>a.kind==='real').length; if(real!==n||s.an.length!==E.P.N)bad++;
 // win condition: cripple all
 s.an.filter(a=>a.kind==='real').forEach((a,k)=>{a.state='disabled';s.disabled=k+1;}); }
console.log(cnt,'bad',bad);
const s=E.newHunt(5,{nreal:1});s.an.find(a=>a.kind==='real').state='locked';
console.log('classify ok', typeof E.classify(s,s.an[0]));
const p=[0,0,0,0];for(let i=0;i<500;i++)p[E.arenaPlan(Math.random,1).nreal]++;console.log('arenaPlan',p);
