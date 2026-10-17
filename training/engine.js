/* DFCH developer hero training — APK 3.16.1 numeric reconstruction.
 * All Level operations mirror float32 where feasible. Android libm ULP differences may remain.
 * Initial L, current SP L, and inheritance L are independent channels.
 */
(() => {
 'use strict';
 const f=Math.fround,clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const RANKS=Object.freeze(['G','F','E','D','C','B','A','S','SS','SSS','GOD','GOD+']);
 const CAPS=Object.freeze({SSS:99.9,GOD:109.9,'GOD+':119.9});
 const NAMES=Object.freeze(['體力','攻擊力','移動速度','攻擊射程','攻擊範圍','攻擊速度','擊退','體重','耐力','基本費用','成長速度']);
 const ICONS=Object.freeze(['❤️','⚔️','🥾','🏹','💥','⏱️','🪓','⚖️','💛','🪙','📖']);
 function rankOf(L){return Math.max(0,Math.min(11,Math.floor(Math.max(0,L)/10)));}
 function step(initial,current){
  const i=f(initial),c=f(current),r=Math.trunc(f(c/f(10)));
  let difficulty=f(Math.max(1,Math.min(5,f(Math.pow(f(1.3),f(r))))));
  if(r>=7)difficulty=f(difficulty*f(Math.pow(f(1.7),Math.min(r,9)-6)));
  const atten=f(Math.max(1e-8,Math.min(1,f(Math.pow(2,f(f(i-c)/f(10)))))));
  return f(atten/difficulty);
 }
 function fruitDelta(initial,effects){
  const i=f(initial);let added=f(0),n=Math.max(0,Math.min(10000,Math.trunc(Number(effects)||0)));
  for(let k=0;k<n;k++)added=f(added+step(i,f(i+added)));
  return added;
 }
 function totalLevel(initial,current,fruits,cap='SSS'){
  const upper=f(CAPS[cap]??CAPS.SSS);
  return f(Math.min(upper,f(f(current)+fruitDelta(initial,fruits))));
 }
 // Replays UniqueLevelLogic.SimulateStatusReinforce() with independent fruit/SP progress.
 function simulate(initial,current,fruits,available,mode,cap='SSS'){
  const i=f(initial),upper=f(CAPS[cap]??CAPS.SSS);
  let c=f(current),t=f(Math.min(upper,f(c+fruitDelta(i,fruits))));
  const remaining=Math.max(0,Math.min(100000,Math.trunc(Number(available)||0)));
  if(mode==='RANK'&&rankOf(t)>=rankOf(upper))return {cost:0,current:c,total:t,rankUp:false,affordable:false,limit:t>=upper};
  const budget=mode==='X1'?1:mode==='X10'?10:mode==='MAX'?remaining:50000;
  let cost=0,rankUp=false;
  while(t<upper&&cost<budget){
   const inc=f(Math.min(step(i,c),f(upper-t)));
   if(!(inc>0))break;
   const next=f(t+inc);
   if(rankOf(next)>rankOf(t))rankUp=true;
   c=f(c+inc);t=next;cost++;
   if(mode==='RANK'&&rankUp)break;
  }
  return {cost,current:c,total:t,rankUp,affordable:cost>0&&cost<=remaining,limit:t>=upper};
 }
 function valueFromLevel(index,level){
  const L=f(clamp(Number(level)||0,0,119.9)),high=L>=80;
  const x=f(L-80),n=Math.floor(f(L/10)),m=Math.floor(f(x/10));
  const pow=(a,b)=>f(Math.pow(f(a),f(b)));
  if(index===10)return f(f(10.010009765625)*L);
  if(index===0)return high?f(f(63623464*pow(1.065,x))*pow(1.7,m)):f(f(30*pow(1.115,L))*pow(2.08,n));
  if(index===1)return high?f(f(4996696*pow(1.06,x))*pow(1.6,m)):f(f(4*pow(1.112,L))*f(Math.pow(2,n)));
  if(index===9)return high?f(f(1997*pow(.975,x))*pow(.8,m)):f(f(1500000*pow(.95,L))*pow(.73,n));
  const below=[null,null,[.05,.00875],[.25,.015625],[0,.00625],[7,-.08],[0,.015],[30,2.125],[30,4]];
  const above=[null,null,[.75,.0035175872035324574],[1.5,.010050253],[.5,.0025125633],[.6,-.0125628142],[1.2,.0201005004],[200,10.05025005],[350,2.5125625]];
  const terms=(high?above:below)[index];if(!terms)return NaN;
  return f(f(terms[0])+f(f(terms[1])*f(high?x:L)));
 }
 function readable(x){
  const n=Math.max(0,x);if(n<10000)return String(Math.trunc(n));
  const parts=n.toExponential(3).split('e');
  const sig=parts[0].replace('.',''),exp=Number(parts[1]),unit=Math.floor(exp/4),rem=exp%4;
  const words=['','萬','億','兆','京','垓','秭','穰'];
  if(unit<1||unit>=words.length)return Math.trunc(n).toLocaleString('zh-TW');
  if(rem===0)return sig[0]+'.'+sig[1]+words[unit];
  if(rem===1)return sig.slice(0,2)+'.'+sig[2]+words[unit];
  if(rem===2)return sig.slice(0,3)+words[unit];
  return sig.slice(0,4)+words[unit];
 }
 function show(index,value){
  if(!Number.isFinite(value))return '—';
  if(index===2)return value.toFixed(3)+' km/s';
  if(index===3||index===4||index===6)return Number(value.toFixed(3))+' km';
  if(index===5)return value.toFixed(3)+'s/回';
  if(index===7)return Number(value.toFixed(2))+'kg';
  if(index===10)return 'EXP +'+readable(value)+'%';
  return readable(value);
 }
 window.DFCHTrainingEngine=Object.freeze({RANKS,CAPS,NAMES,ICONS,step,fruitDelta,simulate,totalLevel,valueFromLevel,show,rankOf});
})();
