'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const repo=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(repo,'treasure/challenge/index.html'),'utf8');
const js=fs.readFileSync(path.join(repo,'treasure/challenge/app.js'),'utf8');
const css=fs.readFileSync(path.join(repo,'treasure/challenge/style.css'),'utf8');

class FakeNode {
  constructor(id=''){
    this.id=id;this.children=[];this.events={};this.attributes={};this.textContent='';
    this.className='';this.hidden=false;this.disabled=false;this.scrollTop=0;
    this.clientHeight=280;this.title='';this.firstChild={textContent:''};
    this.classList={toggle:()=>{},add:()=>{},remove:()=>{}};
  }
  get scrollHeight(){return Math.ceil(this.children.length/6)*64;}
  addEventListener(name,fn){(this.events[name]??=[]).push(fn);}
  dispatch(name,extras={}){for(const fn of this.events[name]||[])fn({
    pointerId:1,pointerType:'touch',isPrimary:true,button:0,
    preventDefault(){},...extras
  });}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=[...nodes];}
  setAttribute(name,value){this.attributes[name]=String(value);}
}
function build(rewardTypes=['N','N','N','N','N','N']){
  const ids=['challengeOpen','challengeSkip','challengeStatus','challengeJackpot','jackpotName','jackpotPoints',
    'jackpotSkip','rankToggle','rankTotal','rankBest','dailyRemaining','challengeDate',
    'totalPoints','bestPoints','revealedCount','runPoints','runState','challengeGrid','challengeOpenLabel'];
  const map=Object.fromEntries(ids.map(id=>[id,new FakeNode(id)]));
  map.challengeJackpot.hidden=true;
  map.challengeOpen.disabled=true;
  const document=new FakeNode('document');
  document.getElementById=id=>{if(!map[id])throw Error('Missing element '+id);return map[id];};
  document.createElement=()=>new FakeNode();
  const window=new FakeNode('window');
  window.matchMedia=()=>({matches:false});
  let count=0,runId=0,active=null,startCount=0,revealCount=0;
  const mkRewards=()=>rewardTypes.map((type,i)=>({type,number:i+1,points:({N:1,R:3,SR:10,SSR:20,UR:50,A:1000,B:2500,C:100000})[type]}));
  const rewards=mkRewards();
  function snap(){
    const revealed=active?.shown||0;
    const score=rewards.slice(0,revealed).reduce((a,r)=>a+r.points,0);
    const remaining=5-count;
    return {day:'2026-10-19',dailyLimit:5,remaining,used:count,
      totals:{totalPoints:active?.completed?score:0,bestSinglePoints:active?.completed?score:0,drawCount:active?.completed?1:0},
      leaderboards:{total:[],best:[]},hasActive:!!active&&!active.completed,
      run:active?{id:active.id,revealedCount:revealed,revealedPoints:score,completed:active.completed,
        rewards:rewards.slice(0,revealed)}:null};
  }
  async function fetch(url,options={}){
    const endpoint=url.split('/').pop(),data=options.body?JSON.parse(options.body):{};
    if(endpoint==='start'){
      startCount++;if(!active||active.completed){
        count++;runId++;
        active={id:runId,shown:data.fast?rewards.length:1,completed:!!data.fast};
      }
    }else if(endpoint==='reveal'){
      revealCount++;
      if(active&&!active.completed){
        active.shown=data.fast?rewards.length:Math.min(rewards.length,active.shown+1);
        active.completed=active.shown===rewards.length;
      }
    }else if(endpoint!=='status')throw Error('Unexpected endpoint '+endpoint);
    return {ok:true,json:async()=>snap()};
  }
  vm.runInNewContext(js,{document,window,fetch,Intl,crypto:{randomUUID:()=>String(++runId).padStart(36,'0')},setTimeout,clearTimeout,console});
  return {map,window,stats:()=>({startCount,revealCount,count,runId,active})};
}
test('challenge control remains above reward list even after many rows',()=>{
  const button=html.indexOf('id="challengeOpen"');
  const grid=html.indexOf('id="challengeGrid"');
  const stats=html.indexOf('class="challenge-run-stats"');
  assert.ok(stats>=0&&stats<button&&button<grid);\n  assert.ok(html.indexOf('id=\"challengeSkip\"')<stats,'skip button should be in the heading');
  assert.match(css,/\.challenge-main \.challenge-actions\{margin:11px 0 12px\}/);
  assert.match(css,/\.challenge-grid\{--cell:65px;/);
  assert.match(css,/max-height:calc\(var\(--cell\)\*5 \+ var\(--gap\)\*4\)/);
  assert.match(css,/\.challenge-main \.challenge-skip/);
  assert.match(html,/style\.css\?v=1\.0\.2/);
  assert.match(html,/app\.js\?v=1\.0\.2/);
});
test('short taps still open exactly one reward each time',async()=>{
  const {map,stats}=build();
  await sleep(20);
  map.challengeOpen.dispatch('click');
  await sleep(20);
  assert.equal(map.challengeGrid.children.length,1);
  assert.equal(map.revealedCount.textContent,'1');
  assert.equal(stats().startCount,1);
  map.challengeOpen.dispatch('click');
  await sleep(20);
  assert.equal(map.challengeGrid.children.length,2);
  assert.equal(map.revealedCount.textContent,'2');
  assert.equal(stats().revealCount,1);
  assert.equal(stats().count,1);
});
test('long press is not a separate opening action and a tap reveals one cell',async()=>{
  const {map,window,stats}=build();
  await sleep(20);
  map.challengeOpen.dispatch('pointerdown',{pointerId:9});
  await sleep(540);
  window.dispatch('pointerup',{pointerId:9});
  assert.equal(map.challengeGrid.children.length,0);
  assert.equal(stats().startCount,0);
  map.challengeOpen.dispatch('click');
  await sleep(20);
  assert.equal(map.challengeGrid.children.length,1);
  assert.equal(stats().startCount,1);
});
test('explicit skip reveals all remaining rewards immediately, but never starts another chest',async()=>{
  const {map,stats}=build();
  await sleep(20);
  assert.equal(map.challengeSkip.disabled,true,'skip not available before a challenge begins');
  map.challengeOpen.dispatch('click');
  await sleep(20);
  assert.equal(map.challengeGrid.children.length,1);
  assert.equal(map.challengeSkip.disabled,false);
  map.challengeSkip.dispatch('click');
  await sleep(30);
  assert.equal(map.challengeGrid.children.length,6);
  assert.equal(map.revealedCount.textContent,'6');
  assert.equal(map.runPoints.textContent,'6');
  assert.equal(map.challengeOpenLabel.textContent,'開始下一箱');
  assert.equal(map.challengeSkip.disabled,true);
  assert.equal(stats().startCount,1);
  assert.equal(stats().revealCount,1);
  assert.equal(stats().count,1);
  await sleep(170);
  assert.equal(stats().startCount,1,'skipping must never automatically start the next chest');
});
test('skip still shows A-tier jackpot effect without hiding the whole-box result',async()=>{
  const {map,stats}=build(['N','A','R','N']);
  await sleep(20);
  map.challengeOpen.dispatch('click');
  await sleep(20);
  map.challengeSkip.dispatch('click');
  await sleep(35);
  assert.equal(map.challengeJackpot.hidden,false);
  assert.equal(map.jackpotName.textContent,'大獎 A');
  assert.equal(map.challengeGrid.children.length,4,'skip must reveal the complete chest immediately');
  assert.equal(map.runPoints.textContent,'1,005');
  map.jackpotSkip.dispatch('click');
  assert.equal(map.challengeJackpot.hidden,true);
  assert.equal(stats().count,1);
});
