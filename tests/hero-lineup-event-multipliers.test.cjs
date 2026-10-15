'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const app=read('team/js/app.js');
const css=read('team/css/style.css');
const html=read('team/index.html');
const i18n=read('team/js/i18n.js');
function section(start,end){
 const a=app.indexOf(start),b=app.indexOf(end,a);
 assert.ok(a>=0&&b>a,'Function section exists: '+start);
 return app.slice(a,b);
}
const eventConstants=section('const EVENT_OPTIONS=','const calcStoreKey=');
const loadSource=section('const calcStoreKey=','function saveCalcSettings(){');
const meterSource=section('function greedCycle(value){','function eventOptionsMarkup(){');
const eventMarkupSource=section('function eventOptionsMarkup(){','function renderStats(){');
const buildSource=section('function buildCalcData(){','function showSkillRows(');
const meterFactory=new Function('pct','enc',meterSource+'return {greedCycle,greedMeter};');
const {greedCycle,greedMeter}=meterFactory(n=>String(n)+'%',s=>s);
const makeOptions=new Function('calcSettings',eventConstants+eventMarkupSource+'return eventOptionsMarkup();');
const restore=new Function('localStorage',eventConstants+loadSource+'return calcSettings;');
const calculate=new Function('calcSettings',
 'const SKILL_RATES={}; const pickedTracked=()=>[]; const ominousEffect=()=>({applied:0});'+
 'const truncToOneDecimal=n=>Math.trunc((n+1e-10)*10)/10;\n'+buildSource+'\nreturn buildCalcData();'
);
const defaults={base:3,crown:false,stone:false,ring:0,brokenCircuit:0,mysteriousCircuit:false,desireMirror:0,ominousCircuit:0,ominousDistance:30};
test('Hero Greed cycles colors for each complete 100% and restores full percentage labels',()=>{
 const values=[[0,0,0],[99,0,99],[100,1,100],[101,1,1],
  [199,1,99],[200,2,100],[225,2,25],[300,3,100],[399,3,99],[400,0,100],[450,0,50]];
 for(const [n,tone,fill] of values){
  assert.deepEqual(greedCycle(n),{color:tone,fill},'greed '+n);
  assert.match(greedMeter('英靈貪欲',n,'hero'),new RegExp('style="width:'+fill+'%"'));
  assert.match(greedMeter('英靈貪欲',n,'hero'),new RegExp('<strong>\\+'+n+'%'));
 }
 assert.match(greedMeter('回路組',125,'circuit'),/style="width:100%"/);
 const block=section(' <section class="statpanel"><h4>貪欲・寶箱加成</h4>',' <section class="statpanel"><h4>技能加成明細</h4>');
 assert.match(block,/greed-result greed-cycle-\$\{greedCycle\(d\.greedSum\)\.color\}/);
 for(const level of [0,1,2,3])assert.match(css,new RegExp('greed-result\\.greed-cycle-'+level));
 assert.match(css,/html\[data-guide-theme="light"\].*greed-result\.greed-cycle-3/);
});
test('Event choices share one radio group, with exactly one selection regardless of size',()=>{
 for(const selected of [1,1.5,2]){
  const markup=makeOptions({eventMultiplier:selected});
  assert.equal((markup.match(/type="radio"/g)||[]).length,3);
  assert.equal((markup.match(/name="eventMultiplier"/g)||[]).length,3);
  assert.equal((markup.match(/ checked/g)||[]).length,1);
  assert.ok(markup.includes('value="'+selected+'" checked'),selected);
 }
 const extra=eventConstants.replace("{factor:2,label:'×200%'}","{factor:2,label:'×200%'},{factor:2.5,label:'×250%'}");
 const extraOptions=new Function('calcSettings',extra+eventMarkupSource+'return eventOptionsMarkup();');
 const markup=extraOptions({eventMultiplier:2.5});
 assert.equal((markup.match(/type="radio"/g)||[]).length,4);
 assert.equal((markup.match(/ checked/g)||[]).length,1);
 assert.match(app,/querySelectorAll\('input\[name="eventMultiplier"\]'\)/);
 assert.doesNotMatch(app,/id="eventToggle"/);
 assert.doesNotMatch(app,/getElementById\('eventToggle'\)/);
});
test('Saved checkbox value migrates to 150%; explicit new options always win',()=>{
 const load=data=>restore({getItem:key=>key==='hero-layout-phase1-v17-calc'?JSON.stringify(data):null});
 assert.equal(load({event:true}).eventMultiplier,1.5);
 assert.equal(load({event:false}).eventMultiplier,1);
 assert.equal(load({event:true,eventMultiplier:2}).eventMultiplier,2);
 assert.equal(load({event:true,eventMultiplier:1}).eventMultiplier,1);
 assert.equal(load({eventMultiplier:999}).eventMultiplier,1);
 assert.equal(load({eventMultiplier:1.5}).eventMultiplier,1.5);
});
test('150% and 200% change only the event multiplier of the existing gatekeeper computation',()=>{
 for(const [eventMultiplier,eventFactor,total] of [[1,1,3],[1.5,1.5,4.5],[2,2,6]]){
  const d=calculate({...defaults,eventMultiplier});
  assert.equal(d.eventFactor,eventFactor);
  assert.equal(d.total,total);
  assert.equal(d.greedSum,0);
 }
 assert.equal(calculate({...defaults,event:true}).total,4.5);
 assert.match(app,/const total=beforeEventTruncated\*eventFactor/);
 assert.match(app,/const greedCombined=greedSum\+greedArtifactTotal/);
});
test('Cache versions, localized no-event text and accessible radio styles are present',()=>{
 assert.match(html,/v1\.15\.6<\/span>/);
 assert.match(html,/app\.js\?v=1\.15\.5/);
 assert.match(html,/i18n\.js\?v=1\.15\.6/);
 assert.match(html,/style\.css\?v=1\.15\.5/);
 const marker="'無活動':";
 const a=i18n.indexOf(marker);
 assert.ok(a>=0);
 const translations=i18n.slice(a+marker.length).match(/^(\[[^\n]+\]),/);
 assert.ok(translations);
 assert.equal(new Function('return '+translations[1])().length,6);
 assert.match(css,/\.hero-party-public \.event-option:focus-within/);
 assert.match(css,/\.hero-party-public \.greed-result \.greed-hero-value\{color:var\(--hero-cycle\)\}/);
});
